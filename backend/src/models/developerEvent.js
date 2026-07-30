/**
 * Normalized Recall webhook / lifecycle event for Developer View.
 *
 * @typedef {object} DeveloperEvent
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} type            e.g. bot.done, recording.done, transcript.done
 * @property {string} at              ISO timestamp received
 * @property {string} note
 * @property {object | null} payload  Raw verified webhook body (optional)
 */

/** @returns {DeveloperEvent} */
export function createDeveloperEventModel(overrides = {}) {
  return {
    id: "",
    workspaceId: "",
    type: "",
    at: new Date().toISOString(),
    note: "",
    payload: null,
    ...overrides,
  };
}
