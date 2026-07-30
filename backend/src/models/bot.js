/**
 * Local mirror of a Recall bot artifact.
 * @see https://docs.recall.ai/reference/bot_create
 *
 * @typedef {object} Bot
 * @property {string} id                 Recall bot id
 * @property {string} workspaceId        Local workspace this bot belongs to
 * @property {string} meetingUrl
 * @property {string} botName
 * @property {string | null} joinAt      ISO timestamp passed to Create Bot
 * @property {string} status             Last known bot status from webhooks
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Bot} */
export function createBotModel(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: "",
    workspaceId: "",
    meetingUrl: "",
    botName: "Workspace Bot",
    joinAt: null,
    status: "unknown",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
