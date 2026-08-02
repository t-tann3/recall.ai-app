import { createHiringManager } from "../models/hiringManager.js";
import { createCandidate } from "../models/candidate.js";
import { createJobPosting } from "../models/jobPosting.js";
import { createApplication } from "../models/application.js";
import { createInterview } from "../models/interview.js";
import { createInterviewPanelist } from "../models/interviewPanelist.js";
import { createCalendarEvent } from "../models/calendarEvent.js";
import { createCalendarConnection } from "../models/calendarConnection.js";
import { createRecordingModel } from "../models/recording.js";
import { createTranscriptModel } from "../models/transcript.js";
import { createBotModel } from "../models/bot.js";
import {
  createScorecardCriteria,
  createCriterion,
  defaultCriteriaItems,
} from "../models/scorecardCriteria.js";
import { createScorecardResult } from "../models/scorecardResult.js";
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
    /** @type {Map<string, import("../models/calendarConnection.js").CalendarConnection>} */
    this.calendarConnections = new Map();
    /** @type {Map<string, import("../models/recording.js").Recording>} */
    this.recordings = new Map();
    /** @type {Map<string, import("../models/transcript.js").Transcript>} */
    this.transcripts = new Map();
    /** @type {Map<string, import("../models/bot.js").Bot>} */
    this.bots = new Map();
    /** @type {Map<string, import("../models/scorecardCriteria.js").ScorecardCriteria>} */
    this.scorecardCriteria = new Map();
    /** @type {Map<string, import("../models/scorecardResult.js").ScorecardResult>} */
    this.scorecardResults = new Map();
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
      recording: interview.recordingId
        ? this.getRecording(interview.recordingId)
        : this.getRecordingForInterview(interview.id),
      transcript: interview.transcriptId
        ? this.getTranscript(interview.transcriptId)
        : this.getTranscriptForInterview(interview.id),
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

  // --- Calendar connections (OAuth / Recall Calendar V2) ---

  listCalendarConnections(filters = {}) {
    let rows = [...this.calendarConnections.values()];
    if (filters.hiringManagerId) {
      rows = rows.filter((r) => r.hiringManagerId === filters.hiringManagerId);
    }
    if (filters.platform) {
      rows = rows.filter((r) => r.platform === filters.platform);
    }
    if (filters.status) {
      rows = rows.filter((r) => r.status === filters.status);
    }
    return rows;
  }

  getCalendarConnection(id) {
    return this.calendarConnections.get(id) || null;
  }

  findCalendarConnection({ hiringManagerId, platform }) {
    return (
      [...this.calendarConnections.values()].find(
        (r) =>
          r.hiringManagerId === hiringManagerId &&
          r.platform === platform &&
          r.status !== "disconnected",
      ) || null
    );
  }

  addCalendarConnection(input) {
    if (!input.hiringManagerId || !this.hiringManagers.has(input.hiringManagerId)) {
      throw Object.assign(
        new Error("hiringManagerId must reference an existing hiring manager"),
        { status: 400 },
      );
    }
    if (!["google_calendar", "microsoft_outlook"].includes(input.platform)) {
      throw Object.assign(new Error("platform must be google_calendar or microsoft_outlook"), {
        status: 400,
      });
    }
    const row = createCalendarConnection(input);
    this.calendarConnections.set(row.id, row);
    return row;
  }

  updateCalendarConnection(id, patch) {
    const existing = this.getCalendarConnection(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      hiringManagerId: existing.hiringManagerId,
      updatedAt: nowIso(),
    };
    this.calendarConnections.set(id, updated);
    return updated;
  }

  deleteCalendarConnection(id) {
    return this.calendarConnections.delete(id);
  }

  // --- Recordings / transcripts (Recall capture artifacts) ---

  getRecording(id) {
    return this.recordings.get(id) || null;
  }

  getRecordingForInterview(interviewId) {
    return (
      [...this.recordings.values()].find((r) => r.interviewId === interviewId) || null
    );
  }

  findInterviewByBotId(botId) {
    if (!botId) return null;
    return [...this.interviews.values()].find((i) => i.botId === botId) || null;
  }

  addBot(input) {
    if (!input.interviewId || !this.interviews.has(input.interviewId)) {
      throw Object.assign(new Error("interviewId must reference an existing interview"), {
        status: 400,
      });
    }
    const row = createBotModel(input);
    this.bots.set(row.id, row);
    return row;
  }

  getBot(id) {
    return this.bots.get(id) || null;
  }

  updateBot(id, patch) {
    const existing = this.getBot(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: nowIso(),
    };
    this.bots.set(id, updated);
    return updated;
  }

  updateRecording(id, patch) {
    const existing = this.getRecording(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: nowIso(),
    };
    this.recordings.set(id, updated);
    return updated;
  }

  updateTranscript(id, patch) {
    const existing = this.getTranscript(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: nowIso(),
    };
    this.transcripts.set(id, updated);
    return updated;
  }

  /**
   * Upsert recording for an interview (by interviewId).
   */
  upsertRecordingForInterview(interviewId, patch) {
    const existing = this.getRecordingForInterview(interviewId);
    if (existing) {
      return this.updateRecording(existing.id, patch);
    }
    return this.addRecording({ interviewId, ...patch });
  }

  /**
   * Upsert transcript for an interview (by interviewId).
   */
  upsertTranscriptForInterview(interviewId, patch) {
    const existing = this.getTranscriptForInterview(interviewId);
    if (existing) {
      return this.updateTranscript(existing.id, patch);
    }
    return this.addTranscript({ interviewId, ...patch });
  }

  addRecording(input) {
    if (!input.interviewId || !this.interviews.has(input.interviewId)) {
      throw Object.assign(new Error("interviewId must reference an existing interview"), {
        status: 400,
      });
    }
    const row = createRecordingModel(input);
    this.recordings.set(row.id, row);
    this.updateInterview(row.interviewId, { recordingId: row.id });
    return row;
  }

  getTranscript(id) {
    return this.transcripts.get(id) || null;
  }

  getTranscriptForInterview(interviewId) {
    return (
      [...this.transcripts.values()].find((t) => t.interviewId === interviewId) || null
    );
  }

  addTranscript(input) {
    if (!input.interviewId || !this.interviews.has(input.interviewId)) {
      throw Object.assign(new Error("interviewId must reference an existing interview"), {
        status: 400,
      });
    }
    const row = createTranscriptModel(input);
    this.transcripts.set(row.id, row);
    this.updateInterview(row.interviewId, { transcriptId: row.id });
    return row;
  }

  // --- Scorecard criteria / results ---

  listScorecardCriteria(filters = {}) {
    let rows = [...this.scorecardCriteria.values()];
    if (filters.hiringManagerId) {
      rows = rows.filter((r) => r.hiringManagerId === filters.hiringManagerId);
    }
    if (filters.jobPostingId !== undefined) {
      rows = rows.filter((r) => r.jobPostingId === filters.jobPostingId);
    }
    return rows;
  }

  getScorecardCriteria(id) {
    return this.scorecardCriteria.get(id) || null;
  }

  /**
   * Job-scoped rubric for a hiring manager.
   * Creates a default rubric for that job if none exists.
   */
  getOrCreateCriteriaForJob(hiringManagerId, jobPostingId) {
    if (!hiringManagerId || !this.hiringManagers.has(hiringManagerId)) {
      throw Object.assign(new Error("hiringManagerId must reference an existing hiring manager"), {
        status: 400,
      });
    }
    if (!jobPostingId || !this.jobPostings.has(jobPostingId)) {
      throw Object.assign(new Error("jobPostingId is required and must reference a job posting"), {
        status: 400,
      });
    }

    const existing = this.listScorecardCriteria({ hiringManagerId, jobPostingId })[0];
    if (existing) return existing;

    return this.addScorecardCriteria({
      hiringManagerId,
      jobPostingId,
      items: defaultCriteriaItems(),
    });
  }

  addScorecardCriteria(input) {
    if (!input.hiringManagerId || !this.hiringManagers.has(input.hiringManagerId)) {
      throw Object.assign(new Error("hiringManagerId must reference an existing hiring manager"), {
        status: 400,
      });
    }
    if (!input.jobPostingId || !this.jobPostings.has(input.jobPostingId)) {
      throw Object.assign(new Error("jobPostingId is required and must reference a job posting"), {
        status: 400,
      });
    }
    const row = createScorecardCriteria(input);
    if (row.items.length === 0) {
      throw Object.assign(new Error("At least one criterion with a label is required"), {
        status: 400,
      });
    }
    this.scorecardCriteria.set(row.id, row);
    return row;
  }

  updateScorecardCriteria(id, patch) {
    const existing = this.getScorecardCriteria(id);
    if (!existing) return null;

    const items = Array.isArray(patch.items)
      ? patch.items.map((item) => createCriterion(item)).filter((c) => c.label)
      : existing.items;

    if (items.length === 0) {
      throw Object.assign(new Error("At least one criterion with a label is required"), {
        status: 400,
      });
    }

    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      hiringManagerId: existing.hiringManagerId,
      items,
      updatedAt: nowIso(),
    };
    this.scorecardCriteria.set(id, updated);
    return updated;
  }

  getScorecardResult(interviewId, hiringManagerId) {
    return (
      [...this.scorecardResults.values()].find(
        (r) => r.interviewId === interviewId && r.hiringManagerId === hiringManagerId,
      ) || null
    );
  }

  upsertScorecardResult(input) {
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

    const existing = this.getScorecardResult(input.interviewId, input.hiringManagerId);
    if (existing) {
      const updated = {
        ...existing,
        ...input,
        id: existing.id,
        interviewId: existing.interviewId,
        hiringManagerId: existing.hiringManagerId,
        updatedAt: nowIso(),
      };
      this.scorecardResults.set(existing.id, updated);
      return updated;
    }

    const row = createScorecardResult(input);
    this.scorecardResults.set(row.id, row);
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

  db.addScorecardCriteria({
    hiringManagerId: hm.id,
    jobPostingId: job.id,
    items: [
      { label: "Technical depth", description: "Strong frontend fundamentals and system thinking.", weight: 2 },
      { label: "Product judgment", description: "Balances UX, performance, and delivery tradeoffs.", weight: 1 },
      { label: "Communication", description: "Explains decisions clearly to eng and non-eng partners.", weight: 1 },
      { label: "Collaboration", description: "Works well with design, PM, and other engineers.", weight: 1 },
    ],
  });

  db.addScorecardCriteria({
    hiringManagerId: hm.id,
    jobPostingId: csJob.id,
    items: [
      { label: "Customer empathy", description: "Shows care for guests and handles conflict calmly.", weight: 2 },
      { label: "Communication", description: "Clear, professional, and easy to understand.", weight: 1 },
      { label: "Problem solving", description: "Resolves issues with sound judgment under pressure.", weight: 1 },
      { label: "Reliability", description: "Dependable, follows process, owns follow-through.", weight: 1 },
    ],
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
  csStarts.setHours(csStarts.getHours() - 26);
  const csPhone = db.addInterview({
    candidateId: csCandidate.id,
    jobPostingId: csJob.id,
    applicationId: csApplication.id,
    type: "phone_screen",
    status: "ready",
    scheduledAt: csStarts.toISOString(),
    meetingUrl: "https://meet.google.com/maya-demo",
    botId: "bot_demo_maya_phone",
  });

  const recording = db.addRecording({
    interviewId: csPhone.id,
    botId: "bot_demo_maya_phone",
    status: "done",
    durationSeconds: 742,
    // Public sample clip for local demo playback
    mediaUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  });

  db.addTranscript({
    interviewId: csPhone.id,
    recordingId: recording.id,
    status: "done",
    lines: [
      {
        speaker: "Alex Rivera",
        text: "Thanks for joining, Maya. Tell me a bit about your customer service experience.",
        startSeconds: 12,
        endSeconds: 18,
      },
      {
        speaker: "Maya Ortiz",
        text: "I’ve worked dining hall service for two years — mostly guest issues, refunds, and coordinating with kitchen staff during rush periods.",
        startSeconds: 19,
        endSeconds: 32,
      },
      {
        speaker: "Alex Rivera",
        text: "Walk me through a time a guest was upset and how you handled it.",
        startSeconds: 34,
        endSeconds: 39,
      },
      {
        speaker: "Maya Ortiz",
        text: "A guest received the wrong meal during peak lunch. I apologized, confirmed the order, expedited a remake, and followed up with a complimentary drink. They left a positive comment afterward.",
        startSeconds: 40,
        endSeconds: 58,
      },
      {
        speaker: "Alex Rivera",
        text: "What would make this Customer Service Associate role a good fit for you?",
        startSeconds: 62,
        endSeconds: 68,
      },
      {
        speaker: "Maya Ortiz",
        text: "I like fast-paced environments and clear service standards. I’m comfortable on the phone and in person, and I’m looking for a remote role with consistent hours.",
        startSeconds: 69,
        endSeconds: 84,
      },
    ],
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
