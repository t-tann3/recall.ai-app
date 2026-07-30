/**
 * Local mirror of a Recall recording artifact.
 * @see https://docs.recall.ai/docs/recording-webhooks
 *
 * @typedef {object} Recording
 * @property {string} id                 Recall recording id
 * @property {string} workspaceId
 * @property {string | null} botId
 * @property {string | null} mediaUrl    Playback / download URL when ready
 * @property {"pending" | "done" | "failed"} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Recording} */
export function createRecordingModel(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: "",
    workspaceId: "",
    botId: null,
    mediaUrl: null,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
