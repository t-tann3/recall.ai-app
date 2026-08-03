import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { db } from "../store/db.js";
import { toPublicHiringManager } from "../models/hiringManager.js";
import { toPublicOrganization } from "../models/organization.js";
import { toPublicMembership } from "../models/membership.js";

const SALT_ROUNDS = 10;
const TOKEN_TTL = "7d";

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken({ hiringManager, organization, membership }) {
  return jwt.sign(
    {
      sub: hiringManager.id,
      email: hiringManager.email,
      orgId: organization.id,
      membershipId: membership.id,
      role: membership.role,
    },
    config.auth.jwtSecret,
    { expiresIn: TOKEN_TTL },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.auth.jwtSecret);
}

function authPayload(hiringManager, organization, membership) {
  return {
    token: signToken({ hiringManager, organization, membership }),
    hiringManager: toPublicHiringManager(hiringManager),
    organization: toPublicOrganization(organization),
    membership: toPublicMembership(membership),
  };
}

export async function signupHiringManager({
  name,
  email,
  password,
  team,
  title,
  organizationName,
}) {
  if (!name?.trim() || !email?.trim() || !password) {
    throw Object.assign(new Error("name, email, and password are required"), { status: 400 });
  }
  if (password.length < 8) {
    throw Object.assign(new Error("password must be at least 8 characters"), { status: 400 });
  }
  if (db.findHiringManagerByEmail(email)) {
    throw Object.assign(new Error("an account with this email already exists"), { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const hiringManager = db.addHiringManager({
    name: name.trim(),
    email,
    passwordHash,
    team: team ?? null,
    title: title ?? null,
  });

  const { organization, membership } = db.provisionTenantForUser(hiringManager, {
    organizationName: organizationName || (team ? `${team}` : undefined),
  });

  return authPayload(hiringManager, organization, membership);
}

export async function loginHiringManager({ email, password, organizationId }) {
  if (!email?.trim() || !password) {
    throw Object.assign(new Error("email and password are required"), { status: 401 });
  }

  const hiringManager = db.findHiringManagerByEmail(email);
  if (!hiringManager?.passwordHash) {
    throw Object.assign(new Error("invalid email or password"), { status: 401 });
  }

  const valid = await verifyPassword(password, hiringManager.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("invalid email or password"), { status: 401 });
  }

  const memberships = db.listMemberships({ userId: hiringManager.id });
  if (memberships.length === 0) {
    const provisioned = db.provisionTenantForUser(hiringManager);
    return authPayload(hiringManager, provisioned.organization, provisioned.membership);
  }

  let membership = memberships[0];
  if (organizationId) {
    const match = memberships.find((m) => m.organizationId === organizationId);
    if (!match) {
      throw Object.assign(new Error("You are not a member of that organization"), {
        status: 403,
      });
    }
    membership = match;
  }

  const organization = db.getOrganization(membership.organizationId);
  if (!organization) {
    throw Object.assign(new Error("Organization not found"), { status: 401 });
  }

  return authPayload(hiringManager, organization, membership);
}

/**
 * Resolve Bearer token into tenant context on the request.
 * @returns {{ hiringManager, organization, membership, userId, orgId, role }}
 */
export function getTenantFromAuthHeader(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("missing or invalid authorization header"), { status: 401 });
  }
  const token = authHeader.slice("Bearer ".length).trim();
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw Object.assign(new Error("invalid or expired token"), { status: 401 });
  }

  const hiringManager = db.getHiringManager(payload.sub);
  if (!hiringManager) {
    throw Object.assign(new Error("account not found"), { status: 401 });
  }

  let membership =
    (payload.membershipId && db.getMembership(payload.membershipId)) ||
    (payload.orgId && db.findMembership(payload.orgId, hiringManager.id)) ||
    db.getPrimaryMembership(hiringManager.id);

  if (!membership) {
    throw Object.assign(new Error("No organization membership — sign up again"), {
      status: 401,
    });
  }

  const organization = db.getOrganization(membership.organizationId);
  if (!organization) {
    throw Object.assign(new Error("Organization not found"), { status: 401 });
  }

  return {
    hiringManager: toPublicHiringManager(hiringManager),
    organization: toPublicOrganization(organization),
    membership: toPublicMembership(membership),
    userId: hiringManager.id,
    orgId: organization.id,
    role: membership.role,
  };
}

/** @deprecated use getTenantFromAuthHeader */
export function getHiringManagerFromAuthHeader(authHeader) {
  return getTenantFromAuthHeader(authHeader).hiringManager;
}
