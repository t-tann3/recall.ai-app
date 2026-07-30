/**
 * @typedef {"joining" | "in_call" | "processing" | "ready" | "failed"} WorkspaceStatus
 * @typedef {"Google Meet" | "Zoom" | "Microsoft Teams" | "Unknown"} MeetingPlatform
 *
 * @typedef {object} MeetingWorkspace
 * @property {string} id
 * @property {string} title
 * @property {string} meetingUrl
 * @property {MeetingPlatform} platform
 * @property {string} botName
 * @property {WorkspaceStatus} status
 * @property {string | null} botId
 * @property {string | null} recordingId
 * @property {string | null} transcriptId
 * @property {string | null} summary
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {MeetingWorkspace} */
export function createWorkspaceModel(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: "",
    title: "",
    meetingUrl: "",
    platform: "Unknown",
    botName: "Workspace Bot",
    status: "joining",
    botId: null,
    recordingId: null,
    transcriptId: null,
    summary: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
