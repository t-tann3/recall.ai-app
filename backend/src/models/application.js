import { createId, nowIso } from "./ids.js";

/**
 * Candidate applies to a job posting.
 *
 * @typedef {"applied" | "screen" | "onsite" | "offer" | "rejected" | "withdrawn"} ApplicationStage
 *
 * @typedef {object} Application
 * @property {string} id
 * @property {string} candidateId
 * @property {string} jobPostingId
 * @property {ApplicationStage} stage
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Application} */
export function createApplication(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("app"),
    candidateId: input.candidateId || "",
    jobPostingId: input.jobPostingId || "",
    stage: input.stage || "applied",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}
