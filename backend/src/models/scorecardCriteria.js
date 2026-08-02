import { createId, nowIso } from "./ids.js";

/**
 * @typedef {object} ScorecardCriterion
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {number} weight
 *
 * Rubric for one job posting, owned by a hiring manager.
 *
 * @typedef {object} ScorecardCriteria
 * @property {string} id
 * @property {string} hiringManagerId
 * @property {string} jobPostingId
 * @property {ScorecardCriterion[]} items
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {ScorecardCriterion} */
export function createCriterion(input = {}) {
  return {
    id: input.id || createId("crit"),
    label: (input.label || "").trim(),
    description: (input.description || "").trim(),
    weight: Number.isFinite(Number(input.weight)) ? Number(input.weight) : 1,
  };
}

/** @returns {ScorecardCriteria} */
export function createScorecardCriteria(input = {}) {
  const now = nowIso();
  const items = Array.isArray(input.items)
    ? input.items.map((item) => createCriterion(item)).filter((c) => c.label)
    : [];

  return {
    id: input.id || createId("rubric"),
    hiringManagerId: input.hiringManagerId || "",
    jobPostingId: input.jobPostingId ?? null,
    items,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

export function defaultCriteriaItems() {
  return [
    createCriterion({
      label: "Communication",
      description: "Clear, concise answers; listens and responds appropriately.",
      weight: 1,
    }),
    createCriterion({
      label: "Role fit",
      description: "Experience and motivation align with the role requirements.",
      weight: 1,
    }),
    createCriterion({
      label: "Problem solving",
      description: "Structures problems, reasons through tradeoffs, reaches sound conclusions.",
      weight: 1,
    }),
    createCriterion({
      label: "Customer empathy",
      description: "Shows care for the customer/user and handles conflict calmly.",
      weight: 1,
    }),
  ];
}
