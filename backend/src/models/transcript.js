/**
 * Local mirror of a Recall transcript artifact.
 * @see https://docs.recall.ai/docs/async-transcription
 *
 * @typedef {object} TranscriptLine
 * @property {string} speaker
 * @property {string} text
 * @property {string} start
 *
 * @typedef {object} Transcript
 * @property {string} id                 Recall transcript id
 * @property {string} workspaceId
 * @property {string | null} recordingId
 * @property {"pending" | "done" | "failed"} status
 * @property {TranscriptLine[] | null} lines
 * @property {string | null} rawJson     Cached provider/download payload
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Transcript} */
export function createTranscriptModel(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: "",
    workspaceId: "",
    recordingId: null,
    status: "pending",
    lines: null,
    rawJson: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
