import { createId, nowIso } from "./ids.js";

/**
 * User membership inside an organization.
 *
 * @typedef {"admin" | "recruiter" | "hiring_manager" | "interviewer"} OrgRole
 *
 * @typedef {object} Membership
 * @property {string} id
 * @property {string} organizationId
 * @property {string} userId  hiringManager id
 * @property {OrgRole} role
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const ORG_ROLES = ["admin", "recruiter", "hiring_manager", "interviewer"];

/** Roles that see all hiring data in the org. */
export const ORG_WIDE_ROLES = new Set(["admin", "recruiter"]);

/** @returns {Membership} */
export function createMembership(input = {}) {
  const now = nowIso();
  const role = ORG_ROLES.includes(input.role) ? input.role : "hiring_manager";
  return {
    id: input.id || createId("mem"),
    organizationId: input.organizationId || "",
    userId: input.userId || input.hiringManagerId || "",
    role,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

export function toPublicMembership(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
