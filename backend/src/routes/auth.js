import { Router } from "express";
import { loginHiringManager, signupHiringManager } from "../auth/service.js";
import { handleRouteError } from "./helpers.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { db } from "../store/db.js";
import { toPublicOrganization } from "../models/organization.js";
import { toPublicMembership } from "../models/membership.js";

const router = Router();

/**
 * POST /api/auth/signup
 * Body: { name, email, password, team?, title?, organizationName? }
 * Creates a user + new organization (admin).
 */
router.post("/signup", async (req, res) => {
  try {
    const result = await signupHiringManager(req.body || {});
    return res.status(201).json({ ok: true, ...result });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password, organizationId? }
 */
router.post("/login", async (req, res) => {
  try {
    const result = await loginHiringManager(req.body || {});
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

/**
 * GET /api/auth/me
 */
router.get("/me", requireAuth, (req, res) => {
  return res.json({
    ok: true,
    hiringManager: req.hiringManager,
    organization: req.organization,
    membership: req.membership,
    role: req.role,
  });
});

/**
 * GET /api/auth/organizations — orgs the user belongs to
 */
router.get("/organizations", requireAuth, (req, res) => {
  const memberships = db.listMemberships({ userId: req.userId }).map((m) => ({
    membership: toPublicMembership(m),
    organization: toPublicOrganization(db.getOrganization(m.organizationId)),
  }));
  return res.json({ ok: true, organizations: memberships });
});

export default router;
