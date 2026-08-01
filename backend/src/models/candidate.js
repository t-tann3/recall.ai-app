import { createId, nowIso } from "./ids.js";

/**
 * @typedef {"sourced" | "applied" | "screening" | "interviewing" | "offer" | "hired" | "rejected"} CandidateStage
 *
 * @typedef {object} Candidate
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string | null} phone
 * @property {string | null} linkedInUrl
 * @property {string | null} source
 * @property {CandidateStage} stage
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Candidate} */
export function createCandidate(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("cand"),
    name: input.name || "",
    email: input.email || "",
    phone: input.phone ?? null,
    linkedInUrl: input.linkedInUrl ?? null,
    source: input.source ?? null,
    stage: input.stage || "applied",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}
