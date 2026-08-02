import { createId, nowIso } from "./ids.js";

/**
 * Local mirror of a Recall transcript for an interview.
 *
 * @typedef {object} TranscriptLine
 * @property {string} speaker
 * @property {string} text
 * @property {number} startSeconds
 * @property {number | null} endSeconds
 *
 * @typedef {object} Transcript
 * @property {string} id
 * @property {string} interviewId
 * @property {string | null} recordingId
 * @property {"pending" | "processing" | "done" | "failed"} status
 * @property {TranscriptLine[]} lines
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Transcript} */
export function createTranscriptModel(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("tr"),
    interviewId: input.interviewId || "",
    recordingId: input.recordingId ?? null,
    status: input.status || "pending",
    lines: Array.isArray(input.lines) ? input.lines : [],
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}
