import { createId, nowIso } from "./ids.js";

/**
 * @typedef {"draft" | "open" | "paused" | "closed"} JobPostingStatus
 *
 * @typedef {object} JobPosting
 * @property {string} id
 * @property {string} title
 * @property {string | null} team
 * @property {string | null} level
 * @property {string | null} location
 * @property {string} description
 * @property {JobPostingStatus} status
 * @property {string} hiringManagerId  Owner of this role
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {JobPosting} */
export function createJobPosting(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("job"),
    title: input.title || "",
    team: input.team ?? null,
    level: input.level ?? null,
    location: input.location ?? null,
    description: input.description || "",
    status: input.status || "open",
    hiringManagerId: input.hiringManagerId || "",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}
