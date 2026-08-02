import { createId, nowIso } from "./ids.js";

/**
 * Local mirror of a Recall bot attached to an interview.
 *
 * @typedef {object} Bot
 * @property {string} id                 Recall bot id (same as Recall's id when live)
 * @property {string} interviewId
 * @property {string} meetingUrl
 * @property {string} botName
 * @property {string | null} joinAt
 * @property {string} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Bot} */
export function createBotModel(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("bot"),
    interviewId: input.interviewId || "",
    meetingUrl: input.meetingUrl || "",
    botName: input.botName || "Shop Talk",
    joinAt: input.joinAt ?? null,
    status: input.status || "created",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}
