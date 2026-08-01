import { createId, nowIso } from "./ids.js";

/**
 * One interview conversation for a candidate on a job.
 *
 * @typedef {"scheduled" | "joining" | "in_call" | "processing" | "ready" | "cancelled" | "failed"} InterviewStatus
 * @typedef {"phone_screen" | "technical" | "behavioral" | "onsite" | "final" | "other"} InterviewType
 *
 * @typedef {object} Interview
 * @property {string} id
 * @property {string} candidateId
 * @property {string} jobPostingId
 * @property {string | null} applicationId
 * @property {InterviewType} type
 * @property {InterviewStatus} status
 * @property {string | null} scheduledAt
 * @property {string | null} meetingUrl
 * @property {string | null} calendarEventId
 * @property {string | null} botId          Recall bot (under the hood)
 * @property {string | null} recordingId
 * @property {string | null} transcriptId
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Interview} */
export function createInterview(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("int"),
    candidateId: input.candidateId || "",
    jobPostingId: input.jobPostingId || "",
    applicationId: input.applicationId ?? null,
    type: input.type || "behavioral",
    status: input.status || "scheduled",
    scheduledAt: input.scheduledAt ?? null,
    meetingUrl: input.meetingUrl ?? null,
    calendarEventId: input.calendarEventId ?? null,
    botId: input.botId ?? null,
    recordingId: input.recordingId ?? null,
    transcriptId: input.transcriptId ?? null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}
