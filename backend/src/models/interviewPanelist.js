import { createId, nowIso } from "./ids.js";

/**
 * Panel member on an interview.
 *
 * @typedef {"interviewer" | "shadow" | "coordinator"} PanelistRole
 *
 * @typedef {object} InterviewPanelist
 * @property {string} id
 * @property {string} interviewId
 * @property {string} hiringManagerId
 * @property {PanelistRole} role
 * @property {string} createdAt
 */

/** @returns {InterviewPanelist} */
export function createInterviewPanelist(input = {}) {
  return {
    id: input.id || createId("panel"),
    interviewId: input.interviewId || "",
    hiringManagerId: input.hiringManagerId || "",
    role: input.role || "interviewer",
    createdAt: input.createdAt || nowIso(),
  };
}
