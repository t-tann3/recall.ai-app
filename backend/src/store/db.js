import { createHiringManager } from "../models/hiringManager.js";
import { createCandidate } from "../models/candidate.js";
import { createJobPosting } from "../models/jobPosting.js";
import { createApplication } from "../models/application.js";
import { createInterview } from "../models/interview.js";
import { createInterviewPanelist } from "../models/interviewPanelist.js";
import { createCalendarEvent } from "../models/calendarEvent.js";
import { nowIso } from "../models/ids.js";
import bcrypt from "bcryptjs";

/**
 * In-memory store with referential checks between core HR models.
 * Swap for SQLite/Postgres later without changing route shapes.
 */
class Store {
  constructor() {
    /** @type {Map<string, import("../models/hiringManager.js").HiringManager>} */
    this.hiringManagers = new Map();
    /** @type {Map<string, import("../models/candidate.js").Candidate>} */
    this.candidates = new Map();
    /** @type {Map<string, import("../models/jobPosting.js").JobPosting>} */
    this.jobPostings = new Map();
    /** @type {Map<string, import("../models/application.js").Application>} */
    this.applications = new Map();
    /** @type {Map<string, import("../models/interview.js").Interview>} */
    this.interviews = new Map();
    /** @type {Map<string, import("../models/interviewPanelist.js").InterviewPanelist>} */
    this.interviewPanelists = new Map();
    /** @type {Map<string, import("../models/calendarEvent.js").CalendarEvent>} */
    this.calendarEvents = new Map();
  }

  // --- Hiring managers ---

  listHiringManagers() {
    return [...this.hiringManagers.values()];
  }

  getHiringManager(id) {
    return this.hiringManagers.get(id) || null;
  }

  findHiringManagerByEmail(email) {
    const normalized = (email || "").toLowerCase().trim();
    return (
      [...this.hiringManagers.values()].find((hm) => hm.email === normalized) ||
      null
    );
  }

  addHiringManager(input) {
    const row = createHiringManager(input);
    if (!row.name || !row.email) {
      throw Object.assign(new Error("name and email are required"), { status: 400 });
    }
    if (this.findHiringManagerByEmail(row.email)) {
      throw Object.assign(new Error("an account with this email already exists"), {
        status: 409,
      });
    }
    this.hiringManagers.set(row.id, row);
    return row;
  }

  // --- Candidates ---

  listCandidates() {
    return [...this.candidates.values()];
  }

  getCandidate(id) {
    return this.candidates.get(id) || null;
  }

  addCandidate(input) {
    const row = createCandidate(input);
    if (!row.name || !row.email) {
      throw Object.assign(new Error("name and email are required"), { status: 400 });
    }
    this.candidates.set(row.id, row);
    return row;
  }

  // --- Job postings ---

  listJobPostings() {
    return [...this.jobPostings.values()];
  }

  getJobPosting(id) {
    return this.jobPostings.get(id) || null;
  }

  addJobPosting(input) {
    if (!input.hiringManagerId || !this.hiringManagers.has(input.hiringManagerId)) {
      throw Object.assign(new Error("hiringManagerId must reference an existing hiring manager"), {
        status: 400,
      });
    }
    const row = createJobPosting(input);
    if (!row.title) {
      throw Object.assign(new Error("title is required"), { status: 400 });
    }
    this.jobPostings.set(row.id, row);
    return row;
  }

  // --- Applications (Candidate ↔ JobPosting) ---

  listApplications(filters = {}) {
    let rows = [...this.applications.values()];
    if (filters.candidateId) {
      rows = rows.filter((r) => r.candidateId === filters.candidateId);
    }
    if (filters.jobPostingId) {
      rows = rows.filter((r) => r.jobPostingId === filters.jobPostingId);
    }
    return rows;
  }

  getApplication(id) {
    return this.applications.get(id) || null;
  }

  addApplication(input) {
    if (!input.candidateId || !this.candidates.has(input.candidateId)) {
      throw Object.assign(new Error("candidateId must reference an existing candidate"), {
        status: 400,
      });
    }
    if (!input.jobPostingId || !this.jobPostings.has(input.jobPostingId)) {
      throw Object.assign(new Error("jobPostingId must reference an existing job posting"), {
        status: 400,
      });
    }
    const duplicate = [...this.applications.values()].find(
      (a) =>
        a.candidateId === input.candidateId && a.jobPostingId === input.jobPostingId,
    );
    if (duplicate) {
      throw Object.assign(new Error("application already exists for this candidate and job"), {
        status: 409,
      });
    }
    const row = createApplication(input);
    this.applications.set(row.id, row);
    return row;
  }

  // --- Interviews ---

  listInterviews(filters = {}) {
    let rows = [...this.interviews.values()];
    if (filters.candidateId) {
      rows = rows.filter((r) => r.candidateId === filters.candidateId);
    }
    if (filters.jobPostingId) {
      rows = rows.filter((r) => r.jobPostingId === filters.jobPostingId);
    }
    if (filters.applicationId) {
      rows = rows.filter((r) => r.applicationId === filters.applicationId);
    }
    return rows;
  }

  getInterview(id) {
    return this.interviews.get(id) || null;
  }

  /**
   * Interview with related entities resolved for API responses.
   */
  getInterviewDetail(id) {
    const interview = this.getInterview(id);
    if (!interview) return null;

    return {
      interview,
      candidate: this.getCandidate(interview.candidateId),
      jobPosting: this.getJobPosting(interview.jobPostingId),
      application: interview.applicationId
        ? this.getApplication(interview.applicationId)
        : null,
      calendarEvent: interview.calendarEventId
        ? this.getCalendarEvent(interview.calendarEventId)
        : null,
      panelists: this.listPanelistsForInterview(id).map((p) => ({
        ...p,
        hiringManager: this.getHiringManager(p.hiringManagerId),
      })),
    };
  }

  addInterview(input) {
    if (!input.candidateId || !this.candidates.has(input.candidateId)) {
      throw Object.assign(new Error("candidateId must reference an existing candidate"), {
        status: 400,
      });
    }
    if (!input.jobPostingId || !this.jobPostings.has(input.jobPostingId)) {
      throw Object.assign(new Error("jobPostingId must reference an existing job posting"), {
        status: 400,
      });
    }
    if (input.applicationId) {
      const app = this.applications.get(input.applicationId);
      if (!app) {
        throw Object.assign(new Error("applicationId must reference an existing application"), {
          status: 400,
        });
      }
      if (
        app.candidateId !== input.candidateId ||
        app.jobPostingId !== input.jobPostingId
      ) {
        throw Object.assign(
          new Error("application must belong to the same candidate and job posting"),
          { status: 400 },
        );
      }
    }
    const row = createInterview(input);
    this.interviews.set(row.id, row);
    return row;
  }

  updateInterview(id, patch) {
    const existing = this.getInterview(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: nowIso(),
    };
    this.interviews.set(id, updated);
    return updated;
  }

  // --- Panelists ---

  listPanelistsForInterview(interviewId) {
    return [...this.interviewPanelists.values()].filter(
      (p) => p.interviewId === interviewId,
    );
  }

  addInterviewPanelist(input) {
    if (!input.interviewId || !this.interviews.has(input.interviewId)) {
      throw Object.assign(new Error("interviewId must reference an existing interview"), {
        status: 400,
      });
    }
    if (!input.hiringManagerId || !this.hiringManagers.has(input.hiringManagerId)) {
      throw Object.assign(new Error("hiringManagerId must reference an existing hiring manager"), {
        status: 400,
      });
    }
    const row = createInterviewPanelist(input);
    this.interviewPanelists.set(row.id, row);
    return row;
  }

  // --- Calendar events ---

  listCalendarEvents(filters = {}) {
    let rows = [...this.calendarEvents.values()];
    if (filters.interviewId) {
      rows = rows.filter((r) => r.interviewId === filters.interviewId);
    }
    return rows;
  }

  getCalendarEvent(id) {
    return this.calendarEvents.get(id) || null;
  }

  addCalendarEvent(input) {
    if (!input.interviewId || !this.interviews.has(input.interviewId)) {
      throw Object.assign(new Error("interviewId must reference an existing interview"), {
        status: 400,
      });
    }
    const row = createCalendarEvent(input);
    this.calendarEvents.set(row.id, row);

    // Bidirectional link: interview.calendarEventId ↔ calendarEvent.interviewId
    this.updateInterview(row.interviewId, {
      calendarEventId: row.id,
      scheduledAt: row.startsAt,
      meetingUrl: row.meetingUrl || this.getInterview(row.interviewId)?.meetingUrl,
    });

    return row;
  }
}

export const db = new Store();

/** Seed a small Shop Talk / hiring demo graph. */
export function seedDemoData() {
  if (db.hiringManagers.size > 0) return;

  const hm = db.addHiringManager({
    name: "Alex Rivera",
    email: "alex@shoptalk.example",
    passwordHash: bcrypt.hashSync("password123", 10),
    team: "Engineering",
    title: "Engineering Manager",
  });

  const candidate = db.addCandidate({
    name: "Jordan Lee",
    email: "jordan.lee@email.com",
    source: "referral",
    stage: "interviewing",
  });

  const csCandidate = db.addCandidate({
    name: "Maya Ortiz",
    email: "maya.ortiz@email.com",
    source: "indeed",
    stage: "interviewing",
  });

  const job = db.addJobPosting({
    title: "Senior Frontend Engineer",
    team: "Engineering",
    level: "Senior",
    location: "Remote",
    description: "Build product UI for Shop Talk’s interview insights platform.",
    status: "open",
    hiringManagerId: hm.id,
  });

  const csJob = db.addJobPosting({
    title: "Customer Service Associate",
    team: "Aramark Customer Service",
    level: "Entry",
    location: "Remote",
    description: "Help service dining halls across the country.",
    status: "open",
    hiringManagerId: hm.id,
  });

  const application = db.addApplication({
    candidateId: candidate.id,
    jobPostingId: job.id,
    stage: "onsite",
  });

  const csApplication = db.addApplication({
    candidateId: csCandidate.id,
    jobPostingId: csJob.id,
    stage: "phone_screen",
  });

  const starts = new Date();
  starts.setHours(starts.getHours() + 24);
  const ends = new Date(starts);
  ends.setHours(ends.getHours() + 1);

  const interview = db.addInterview({
    candidateId: candidate.id,
    jobPostingId: job.id,
    applicationId: application.id,
    type: "technical",
    status: "scheduled",
    scheduledAt: starts.toISOString(),
    meetingUrl: "https://meet.google.com/abc-defg-hij",
  });

  const csStarts = new Date();
  csStarts.setHours(csStarts.getHours() + 48);
  db.addInterview({
    candidateId: csCandidate.id,
    jobPostingId: csJob.id,
    applicationId: csApplication.id,
    type: "phone_screen",
    status: "scheduled",
    scheduledAt: csStarts.toISOString(),
    meetingUrl: "https://meet.google.com/maya-demo",
  });

  // Second interview so evaluation UI can show per-interview scorecards.
  const csOnsite = new Date();
  csOnsite.setHours(csOnsite.getHours() + 96);
  db.addInterview({
    candidateId: csCandidate.id,
    jobPostingId: csJob.id,
    applicationId: csApplication.id,
    type: "onsite",
    status: "scheduled",
    scheduledAt: csOnsite.toISOString(),
    meetingUrl: "https://meet.google.com/maya-onsite",
  });

  db.addInterviewPanelist({
    interviewId: interview.id,
    hiringManagerId: hm.id,
    role: "interviewer",
  });

  db.addCalendarEvent({
    interviewId: interview.id,
    provider: "manual",
    title: `${job.title} — interview with ${candidate.name}`,
    startsAt: starts.toISOString(),
    endsAt: ends.toISOString(),
    meetingUrl: interview.meetingUrl,
    attendeeEmails: [hm.email, candidate.email],
  });
}
