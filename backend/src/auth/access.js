import { ORG_WIDE_ROLES } from "../models/membership.js";
import { db } from "../store/db.js";

/**
 * @typedef {object} TenantContext
 * @property {string} userId
 * @property {string} orgId
 * @property {string} role
 * @property {object} hiringManager  public HM
 * @property {object} organization   public org
 * @property {object} membership     public membership
 */

export function isOrgWide(role) {
  return ORG_WIDE_ROLES.has(role);
}

export function assertTenant(ctx) {
  if (!ctx?.orgId || !ctx?.userId) {
    throw Object.assign(new Error("Tenant context required"), { status: 401 });
  }
}

/** Job is visible if same org and (org-wide role, owner, or panelist on a job interview). */
export function canAccessJob(ctx, job) {
  if (!ctx || !job || job.orgId !== ctx.orgId) return false;
  if (isOrgWide(ctx.role)) return true;
  if (job.hiringManagerId === ctx.userId) return true;
  if (ctx.role === "interviewer") {
    return db.listInterviews({ jobPostingId: job.id }).some((interview) =>
      db.isPanelist(interview.id, ctx.userId),
    );
  }
  return false;
}

export function assertCanAccessJob(ctx, jobPostingId) {
  assertTenant(ctx);
  const job = db.getJobPosting(jobPostingId);
  if (!job || !canAccessJob(ctx, job)) {
    throw Object.assign(new Error("Job posting not found"), { status: 404 });
  }
  return job;
}

export function canAccessInterview(ctx, interview) {
  if (!ctx || !interview || interview.orgId !== ctx.orgId) return false;
  if (isOrgWide(ctx.role)) return true;
  const job = db.getJobPosting(interview.jobPostingId);
  if (job && job.hiringManagerId === ctx.userId) return true;
  return db.isPanelist(interview.id, ctx.userId);
}

export function assertCanAccessInterview(ctx, interviewId) {
  assertTenant(ctx);
  const interview = db.getInterview(interviewId);
  if (!interview || !canAccessInterview(ctx, interview)) {
    throw Object.assign(new Error("Interview not found"), { status: 404 });
  }
  return interview;
}

export function canAccessCandidate(ctx, candidate) {
  if (!ctx || !candidate || candidate.orgId !== ctx.orgId) return false;
  if (isOrgWide(ctx.role)) return true;

  const apps = db.listApplications({ candidateId: candidate.id });
  const interviews = db.listInterviews({ candidateId: candidate.id });

  for (const app of apps) {
    const job = db.getJobPosting(app.jobPostingId);
    if (job && canAccessJob(ctx, job)) return true;
  }
  for (const interview of interviews) {
    if (canAccessInterview(ctx, interview)) return true;
  }
  return false;
}

export function assertCanAccessCandidate(ctx, candidateId) {
  assertTenant(ctx);
  const candidate = db.getCandidate(candidateId);
  if (!candidate || !canAccessCandidate(ctx, candidate)) {
    throw Object.assign(new Error("Candidate not found"), { status: 404 });
  }
  return candidate;
}

/** Recruiter/admin/HM can manage jobs; interviewer is read-only on assigned. */
export function canManageJobs(ctx) {
  return ["admin", "recruiter", "hiring_manager"].includes(ctx?.role);
}

export function assertCanManageJobs(ctx) {
  assertTenant(ctx);
  if (!canManageJobs(ctx)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
}
