import { createId, nowIso } from "./ids.js";

/**
 * Local mirror of a Recall recording for an interview.
 *
 * @typedef {object} Recording
 * @property {string} id
 * @property {string} interviewId
 * @property {string | null} botId
 * @property {string | null} mediaUrl
 * @property {"pending" | "processing" | "done" | "failed"} status
 * @property {number | null} durationSeconds
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Recording} */
export function createRecordingModel(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("rec"),
    interviewId: input.interviewId || "",
    botId: input.botId ?? null,
    mediaUrl: input.mediaUrl ?? null,
    status: input.status || "pending",
    durationSeconds: input.durationSeconds ?? null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}
