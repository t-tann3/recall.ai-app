import { createId, nowIso } from "./ids.js";

/**
 * @typedef {object} HiringManager
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} passwordHash
 * @property {string | null} team
 * @property {string | null} title
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {HiringManager} */
export function createHiringManager(input = {}) {
  const now = nowIso();
  return {
    id: input.id || createId("hm"),
    name: input.name || "",
    email: (input.email || "").toLowerCase().trim(),
    passwordHash: input.passwordHash || "",
    team: input.team ?? null,
    title: input.title ?? null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

/** Public shape — never include passwordHash in API responses. */
export function toPublicHiringManager(manager) {
  if (!manager) return null;
  const { passwordHash: _pw, ...publicManager } = manager;
  return publicManager;
}
