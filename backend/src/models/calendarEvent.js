import { createId, nowIso } from "./ids.js";

/**
 * Calendar item linked to an interview (manual or synced).
 *
 * @typedef {"manual" | "google" | "outlook"} CalendarProvider
 *
 * @typedef {object} CalendarEvent
 * @property {string} id
 * @property {string} interviewId
 * @property {CalendarProvider} provider
 * @property {string | null} externalId
 * @property {string} title
 * @property {string} startsAt
 * @property {string} endsAt
 * @property {string | null} meetingUrl
 * @property {string[]} attendeeEmails
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {CalendarEvent} */
export function createCalendarEvent(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("cal"),
    interviewId: input.interviewId || "",
    provider: input.provider || "manual",
    externalId: input.externalId ?? null,
    title: input.title || "",
    startsAt: input.startsAt || now,
    endsAt: input.endsAt || now,
    meetingUrl: input.meetingUrl ?? null,
    attendeeEmails: input.attendeeEmails || [],
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}
