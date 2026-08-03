import { createHiringManager } from "../models/hiringManager.js";
import { createCandidate } from "../models/candidate.js";
import { createJobPosting } from "../models/jobPosting.js";
import { createApplication } from "../models/application.js";
import { createInterview } from "../models/interview.js";
import { createInterviewPanelist } from "../models/interviewPanelist.js";
import { createCalendarEvent } from "../models/calendarEvent.js";
import { createCalendarConnection } from "../models/calendarConnection.js";
import { createOrganization } from "../models/organization.js";
import { createMembership } from "../models/membership.js";
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
import { SqlitePersistence } from "./persist.js";
import { setPersistence } from "./persistenceAccess.js";

/**
 * In-memory store with referential checks between core HR models.
 * Snapshotted to SQLite so restarts keep hiring + Recall capture state.
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
    /** @type {Map<string, import("../models/organization.js").Organization>} */
    this.organizations = new Map();
    /** @type {Map<string, import("../models/membership.js").Membership>} */
    this.memberships = new Map();

    /** @type {import("./persist.js").SqlitePersistence | null} */
    this._persistence = null;
    this._persistPaused = false;
  }

  attachPersistence(persistence) {
    this._persistence = persistence;
  }

  pausePersist() {
    this._persistPaused = true;
  }

  resumePersist() {
    this._persistPaused = false;
  }

  persist() {
    if (this._persistPaused || !this._persistence) return;
    try {
      this._persistence.saveFrom(this);
    } catch (err) {
      console.error("[store] persist failed:", err.message);
    }
  }

  jobIdsForOrg(orgId) {
    return new Set(
      [...this.jobPostings.values()].filter((job) => job.orgId === orgId).map((j) => j.id),
    );
  }

  jobIdsForHiringManager(hiringManagerId) {
    return new Set(
      [...this.jobPostings.values()]
        .filter((job) => job.hiringManagerId === hiringManagerId)
        .map((job) => job.id),
    );
  }

  listJobPostingsForOrg(orgId) {
    return [...this.jobPostings.values()].filter((job) => job.orgId === orgId);
  }

  listJobPostingsForHiringManager(hiringManagerId) {
    return [...this.jobPostings.values()].filter(
      (job) => job.hiringManagerId === hiringManagerId,
    );
  }

  isPanelist(interviewId, userId) {
    return this.listPanelistsForInterview(interviewId).some((p) => p.hiringManagerId === userId);
  }

  /**
   * Jobs visible to a tenant member (org-wide roles see all; HM sees owned; interviewer sees assigned).
   */
  listJobsVisibleTo({ orgId, userId, role }) {
    const jobs = this.listJobPostingsForOrg(orgId);
    if (role === "admin" || role === "recruiter") return jobs;
    if (role === "hiring_manager") {
      return jobs.filter((job) => job.hiringManagerId === userId);
    }
    // interviewer
    return jobs.filter((job) =>
      this.listInterviews({ jobPostingId: job.id }).some((i) => this.isPanelist(i.id, userId)),
    );
  }

  listCandidatesVisibleTo(ctx) {
    const visibleJobIds = new Set(this.listJobsVisibleTo(ctx).map((j) => j.id));
    return [...this.candidates.values()].filter((c) => {
      if (c.orgId !== ctx.orgId) return false;
      if (ctx.role === "admin" || ctx.role === "recruiter") return true;
      return (
        this.listApplications({ candidateId: c.id }).some((a) => visibleJobIds.has(a.jobPostingId)) ||
        this.listInterviews({ candidateId: c.id }).some(
          (i) => visibleJobIds.has(i.jobPostingId) || this.isPanelist(i.id, ctx.userId),
        )
      );
    });
  }

  listInterviewsVisibleTo(ctx, filters = {}) {
    return this.listInterviews(filters).filter((interview) => {
      if (interview.orgId !== ctx.orgId) return false;
      if (ctx.role === "admin" || ctx.role === "recruiter") return true;
      const job = this.getJobPosting(interview.jobPostingId);
      if (job?.hiringManagerId === ctx.userId) return true;
      return this.isPanelist(interview.id, ctx.userId);
    });
  }

  listApplicationsVisibleTo(ctx, filters = {}) {
    const visibleJobIds = new Set(this.listJobsVisibleTo(ctx).map((j) => j.id));
    return this.listApplications(filters).filter(
      (app) => app.orgId === ctx.orgId && visibleJobIds.has(app.jobPostingId),
    );
  }

  // legacy aliases used by older routes — prefer VisibleTo helpers
  listCandidatesForHiringManager(hiringManagerId) {
    const membership = this.getPrimaryMembership(hiringManagerId);
    if (!membership) return [];
    return this.listCandidatesVisibleTo({
      orgId: membership.organizationId,
      userId: hiringManagerId,
      role: membership.role,
    });
  }

  listInterviewsForHiringManager(hiringManagerId, filters = {}) {
    const membership = this.getPrimaryMembership(hiringManagerId);
    if (!membership) return [];
    return this.listInterviewsVisibleTo(
      {
        orgId: membership.organizationId,
        userId: hiringManagerId,
        role: membership.role,
      },
      filters,
    );
  }

  listApplicationsForHiringManager(hiringManagerId, filters = {}) {
    const membership = this.getPrimaryMembership(hiringManagerId);
    if (!membership) return [];
    return this.listApplicationsVisibleTo(
      {
        orgId: membership.organizationId,
        userId: hiringManagerId,
        role: membership.role,
      },
      filters,
    );
  }

  assertJobOwnedBy(jobPostingId, hiringManagerId) {
    const job = this.getJobPosting(jobPostingId);
    const membership = this.getPrimaryMembership(hiringManagerId);
    if (
      !job ||
      !membership ||
      job.orgId !== membership.organizationId ||
      (membership.role !== "admin" &&
        membership.role !== "recruiter" &&
        job.hiringManagerId !== hiringManagerId)
    ) {
      throw Object.assign(new Error("Job posting not found"), { status: 404 });
    }
    return job;
  }

  canAccessCandidate(candidateId, hiringManagerId) {
    const membership = this.getPrimaryMembership(hiringManagerId);
    if (!membership) return false;
    const candidate = this.getCandidate(candidateId);
    if (!candidate || candidate.orgId !== membership.organizationId) return false;
    return this.listCandidatesVisibleTo({
      orgId: membership.organizationId,
      userId: hiringManagerId,
      role: membership.role,
    }).some((c) => c.id === candidateId);
  }

  canAccessInterview(interviewId, hiringManagerId) {
    const membership = this.getPrimaryMembership(hiringManagerId);
    if (!membership) return false;
    const interview = this.getInterview(interviewId);
    if (!interview || interview.orgId !== membership.organizationId) return false;
    return this.listInterviewsVisibleTo({
      orgId: membership.organizationId,
      userId: hiringManagerId,
      role: membership.role,
    }).some((i) => i.id === interviewId);
  }

  // --- Organizations / memberships ---

  listOrganizations() {
    return [...this.organizations.values()];
  }

  getOrganization(id) {
    return this.organizations.get(id) || null;
  }

  addOrganization(input) {
    const row = createOrganization(input);
    if (!row.name) {
      throw Object.assign(new Error("organization name is required"), { status: 400 });
    }
    this.organizations.set(row.id, row);
    return row;
  }

  listMemberships(filters = {}) {
    let rows = [...this.memberships.values()];
    if (filters.organizationId) {
      rows = rows.filter((r) => r.organizationId === filters.organizationId);
    }
    if (filters.userId) {
      rows = rows.filter((r) => r.userId === filters.userId);
    }
    return rows;
  }

  getMembership(id) {
    return this.memberships.get(id) || null;
  }

  getPrimaryMembership(userId) {
    return this.listMemberships({ userId })[0] || null;
  }

  findMembership(organizationId, userId) {
    return (
      this.listMemberships({ organizationId, userId })[0] || null
    );
  }

  addMembership(input) {
    if (!input.organizationId || !this.organizations.has(input.organizationId)) {
      throw Object.assign(new Error("organizationId must reference an existing organization"), {
        status: 400,
      });
    }
    if (!input.userId || !this.hiringManagers.has(input.userId)) {
      throw Object.assign(new Error("userId must reference an existing user"), { status: 400 });
    }
    if (this.findMembership(input.organizationId, input.userId)) {
      throw Object.assign(new Error("user is already a member of this organization"), {
        status: 409,
      });
    }
    const row = createMembership(input);
    this.memberships.set(row.id, row);
    return row;
  }

  /**
   * Create org + admin membership for a new user (signup).
   */
  provisionTenantForUser(user, { organizationName } = {}) {
    const org = this.addOrganization({
      name: organizationName || `${user.name}'s Organization`,
    });
    const membership = this.addMembership({
      organizationId: org.id,
      userId: user.id,
      role: "admin",
    });
    return { organization: org, membership };
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
    if (!input.orgId || !this.organizations.has(input.orgId)) {
      throw Object.assign(new Error("orgId must reference an existing organization"), {
        status: 400,
      });
    }
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
    if (!input.orgId || !this.organizations.has(input.orgId)) {
      throw Object.assign(new Error("orgId must reference an existing organization"), {
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
    const job = this.getJobPosting(input.jobPostingId);
    const orgId = input.orgId || job.orgId;
    if (!orgId || !this.organizations.has(orgId)) {
      throw Object.assign(new Error("orgId must reference an existing organization"), {
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
    const row = createApplication({ ...input, orgId });
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
    const job = this.getJobPosting(input.jobPostingId);
    const orgId = input.orgId || job.orgId;
    if (!orgId || !this.organizations.has(orgId)) {
      throw Object.assign(new Error("orgId must reference an existing organization"), {
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
    const row = createInterview({ ...input, orgId });
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
    if (!input.orgId || !this.organizations.has(input.orgId)) {
      throw Object.assign(new Error("orgId must reference an existing organization"), {
        status: 400,
      });
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

    const job = this.getJobPosting(jobPostingId);
    const existing = this.listScorecardCriteria({ hiringManagerId, jobPostingId })[0];
    if (existing) return existing;

    return this.addScorecardCriteria({
      hiringManagerId,
      jobPostingId,
      orgId: job.orgId,
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
    const job = this.getJobPosting(input.jobPostingId);
    const orgId = input.orgId || job.orgId;
    if (!orgId || !this.organizations.has(orgId)) {
      throw Object.assign(new Error("orgId must reference an existing organization"), {
        status: 400,
      });
    }
    const row = createScorecardCriteria({ ...input, orgId });
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

const MUTATING_METHODS = [
  "addHiringManager",
  "addOrganization",
  "addMembership",
  "addCandidate",
  "addJobPosting",
  "addApplication",
  "addInterview",
  "updateInterview",
  "addInterviewPanelist",
  "addCalendarEvent",
  "addCalendarConnection",
  "updateCalendarConnection",
  "addBot",
  "updateBot",
  "updateRecording",
  "updateTranscript",
  "upsertRecordingForInterview",
  "upsertTranscriptForInterview",
  "addRecording",
  "addTranscript",
  "addScorecardCriteria",
  "updateScorecardCriteria",
  "upsertScorecardResult",
];

for (const name of MUTATING_METHODS) {
  const original = Store.prototype[name];
  Store.prototype[name] = function patched(...args) {
    const result = original.apply(this, args);
    this.persist();
    return result;
  };
}

export const db = new Store();

/** @typedef {Store} Store */

/**
 * Load SQLite snapshot (if any), migrate tenancy fields, then seed if empty.
 */
export function bootstrapStore() {
  const persistence = new SqlitePersistence();
  db.attachPersistence(persistence);
  setPersistence(persistence);
  persistence.loadInto(db);

  db.pausePersist();
  try {
    ensureTenancy();
    if (db.hiringManagers.size === 0) {
      seedDemoData();
    }
  } finally {
    db.resumePersist();
    db.persist();
  }

  console.log(
    `[store] ${db.organizations.size} org(s), ${db.hiringManagers.size} user(s) → ${persistence.dbPath}`,
  );

  return persistence;
}

/**
 * Backfill org/membership/orgId for data loaded from older snapshots.
 */
export function ensureTenancy() {
  for (const hm of db.hiringManagers.values()) {
    if (!db.getPrimaryMembership(hm.id)) {
      db.provisionTenantForUser(hm, {
        organizationName: hm.team ? `${hm.team} · ${hm.name}` : `${hm.name}'s Organization`,
      });
    }
  }

  for (const job of db.jobPostings.values()) {
    if (job.orgId && db.organizations.has(job.orgId)) continue;
    const membership = db.getPrimaryMembership(job.hiringManagerId);
    if (!membership) continue;
    db.jobPostings.set(job.id, { ...job, orgId: membership.organizationId });
  }

  for (const candidate of db.candidates.values()) {
    if (candidate.orgId && db.organizations.has(candidate.orgId)) continue;
    const viaApp = db.listApplications({ candidateId: candidate.id })[0];
    const viaInt = db.listInterviews({ candidateId: candidate.id })[0];
    const jobId = viaApp?.jobPostingId || viaInt?.jobPostingId;
    const job = jobId ? db.getJobPosting(jobId) : null;
    const membership = job
      ? db.getPrimaryMembership(job.hiringManagerId)
      : db.listMemberships()[0];
    if (!membership) continue;
    db.candidates.set(candidate.id, {
      ...candidate,
      orgId: job?.orgId || membership.organizationId,
    });
  }

  for (const app of db.applications.values()) {
    if (app.orgId && db.organizations.has(app.orgId)) continue;
    const job = db.getJobPosting(app.jobPostingId);
    if (!job?.orgId) continue;
    db.applications.set(app.id, { ...app, orgId: job.orgId });
  }

  for (const interview of db.interviews.values()) {
    if (interview.orgId && db.organizations.has(interview.orgId)) continue;
    const job = db.getJobPosting(interview.jobPostingId);
    if (!job?.orgId) continue;
    db.interviews.set(interview.id, { ...interview, orgId: job.orgId });
  }

  for (const criteria of db.scorecardCriteria.values()) {
    if (criteria.orgId && db.organizations.has(criteria.orgId)) continue;
    const job = db.getJobPosting(criteria.jobPostingId);
    if (!job?.orgId) continue;
    db.scorecardCriteria.set(criteria.id, { ...criteria, orgId: job.orgId });
  }

  for (const conn of db.calendarConnections.values()) {
    if (conn.orgId && db.organizations.has(conn.orgId)) continue;
    const membership = db.getPrimaryMembership(conn.hiringManagerId);
    if (!membership) continue;
    db.calendarConnections.set(conn.id, {
      ...conn,
      orgId: membership.organizationId,
    });
  }
}

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

  const { organization: org } = db.provisionTenantForUser(hm, {
    organizationName: "Shop Talk",
  });

  // Second member: interviewer with narrower access
  const interviewer = db.addHiringManager({
    name: "Sam Chen",
    email: "sam@shoptalk.example",
    passwordHash: bcrypt.hashSync("password123", 10),
    team: "Engineering",
    title: "Senior Engineer",
  });
  db.addMembership({
    organizationId: org.id,
    userId: interviewer.id,
    role: "interviewer",
  });

  const candidate = db.addCandidate({
    name: "Jordan Lee",
    email: "jordan.lee@email.com",
    source: "referral",
    stage: "interviewing",
    orgId: org.id,
  });

  const csCandidate = db.addCandidate({
    name: "Maya Ortiz",
    email: "maya.ortiz@email.com",
    source: "indeed",
    stage: "interviewing",
    orgId: org.id,
  });

  const job = db.addJobPosting({
    title: "Senior Frontend Engineer",
    team: "Engineering",
    level: "Senior",
    location: "Remote",
    description: "Build product UI for Shop Talk’s interview insights platform.",
    status: "open",
    hiringManagerId: hm.id,
    orgId: org.id,
  });

  const csJob = db.addJobPosting({
    title: "Customer Service Associate",
    team: "Aramark Customer Service",
    level: "Entry",
    location: "Remote",
    description: "Help service dining halls across the country.",
    status: "open",
    hiringManagerId: hm.id,
    orgId: org.id,
  });

  db.addScorecardCriteria({
    hiringManagerId: hm.id,
    jobPostingId: job.id,
    orgId: org.id,
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
    orgId: org.id,
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
    orgId: org.id,
  });

  const csApplication = db.addApplication({
    candidateId: csCandidate.id,
    jobPostingId: csJob.id,
    stage: "phone_screen",
    orgId: org.id,
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
    orgId: org.id,
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
    orgId: org.id,
  });

  const recording = db.addRecording({
    interviewId: csPhone.id,
    botId: "bot_demo_maya_phone",
    status: "done",
    durationSeconds: 742,
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
    orgId: org.id,
  });

  db.addInterviewPanelist({
    interviewId: interview.id,
    hiringManagerId: hm.id,
    role: "interviewer",
  });
  db.addInterviewPanelist({
    interviewId: interview.id,
    hiringManagerId: interviewer.id,
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
