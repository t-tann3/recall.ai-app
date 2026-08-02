import { createId, nowIso } from "./ids.js";

/**
 * AI-drafted (or saved) scorecard for one interview by one hiring manager.
 *
 * @typedef {object} CriteriaScore
 * @property {string} criteriaId
 * @property {string} label
 * @property {number} score
 * @property {string} evidence
 *
 * @typedef {object} ScorecardResult
 * @property {string} id
 * @property {string} interviewId
 * @property {string} hiringManagerId
 * @property {string} recommendation
 * @property {number | null} score
 * @property {CriteriaScore[]} criteriaScores
 * @property {string} strengths
 * @property {string} concerns
 * @property {string} notes
 * @property {"ai" | "manual"} source
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {ScorecardResult} */
export function createScorecardResult(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("score"),
    interviewId: input.interviewId || "",
    hiringManagerId: input.hiringManagerId || "",
    recommendation: input.recommendation || "",
    score: input.score ?? null,
    criteriaScores: Array.isArray(input.criteriaScores) ? input.criteriaScores : [],
    strengths: input.strengths || "",
    concerns: input.concerns || "",
    notes: input.notes || "",
    source: input.source || "ai",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}
