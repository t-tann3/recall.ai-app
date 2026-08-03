import { createId, nowIso } from "./ids.js";

/**
 * OAuth-connected calendar for a hiring manager (Recall Calendar V2).
 *
 * @typedef {"google_calendar" | "microsoft_outlook"} CalendarPlatform
 * @typedef {"connected" | "error" | "disconnected"} CalendarConnectionStatus
 *
 * @typedef {object} CalendarConnection
 * @property {string} id
 * @property {string} hiringManagerId
 * @property {CalendarPlatform} platform
 * @property {string | null} platformEmail
 * @property {string | null} recallCalendarId
 * @property {string | null} oauthRefreshToken  — never expose in API responses
 * @property {string} orgId
 * @property {CalendarConnectionStatus} status
 * @property {string | null} lastError
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {CalendarConnection} */
export function createCalendarConnection(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("calconn"),
    hiringManagerId: input.hiringManagerId || "",
    platform: input.platform || "google_calendar",
    platformEmail: input.platformEmail ?? null,
    recallCalendarId: input.recallCalendarId ?? null,
    oauthRefreshToken: input.oauthRefreshToken ?? null,
    orgId: input.orgId || "",
    status: input.status || "connected",
    lastError: input.lastError ?? null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

/** Public shape — never include oauthRefreshToken. */
export function toPublicCalendarConnection(row) {
  if (!row) return null;
  const { oauthRefreshToken: _token, ...publicRow } = row;
  return publicRow;
}
