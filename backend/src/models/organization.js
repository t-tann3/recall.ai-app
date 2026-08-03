import { createId, nowIso } from "./ids.js";

/**
 * Tenant boundary for Shop Talk.
 *
 * @typedef {object} Organization
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Organization} */
export function createOrganization(input = {}) {
  const now = nowIso();
  const name = (input.name || "").trim() || "Organization";
  const slug =
    (input.slug || "").trim() ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) ||
    createId("org");

  return {
    id: input.id || createId("org"),
    name,
    slug,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

export function toPublicOrganization(org) {
  if (!org) return null;
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  };
}
