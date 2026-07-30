/**
 * AI-derived workspace content (product layer — not a Recall artifact).
 *
 * @typedef {object} Insight
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} text
 * @property {string} createdAt
 *
 * @typedef {object} ActionItem
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} text
 * @property {string | null} owner
 * @property {boolean} done
 * @property {string} createdAt
 *
 * @typedef {object} Question
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} text
 * @property {string} createdAt
 */

/** @returns {Insight} */
export function createInsightModel(overrides = {}) {
  return {
    id: "",
    workspaceId: "",
    text: "",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/** @returns {ActionItem} */
export function createActionItemModel(overrides = {}) {
  return {
    id: "",
    workspaceId: "",
    text: "",
    owner: null,
    done: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/** @returns {Question} */
export function createQuestionModel(overrides = {}) {
  return {
    id: "",
    workspaceId: "",
    text: "",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
