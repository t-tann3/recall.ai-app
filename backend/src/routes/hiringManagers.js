import { Router } from "express";
import { db } from "../store/db.js";
import { toPublicHiringManager } from "../models/hiringManager.js";
import { handleRouteError } from "./helpers.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

/** Org members only — never list users across tenants. */
router.get("/", requireAuth, (req, res) => {
  const members = db
    .listMemberships({ organizationId: req.orgId })
    .map((m) => ({
      membership: m,
      hiringManager: toPublicHiringManager(db.getHiringManager(m.userId)),
    }))
    .filter((row) => row.hiringManager);

  res.json({ ok: true, members, hiringManagers: members.map((m) => m.hiringManager) });
});

router.get("/:id", requireAuth, (req, res) => {
  const membership = db.findMembership(req.orgId, req.params.id);
  if (!membership) {
    return res.status(404).json({ ok: false, message: "Hiring manager not found" });
  }
  const row = db.getHiringManager(req.params.id);
  return res.json({ ok: true, hiringManager: toPublicHiringManager(row) });
});

router.post("/", requireAuth, (req, res) => {
  try {
    if (req.role !== "admin") {
      throw Object.assign(new Error("Only org admins can invite users this way"), {
        status: 403,
      });
    }
    if (!req.body?.passwordHash && req.body?.password) {
      return res.status(400).json({
        ok: false,
        message: "Use POST /api/auth/signup to create hiring managers with passwords",
      });
    }
    const hiringManager = db.addHiringManager(req.body || {});
    db.addMembership({
      organizationId: req.orgId,
      userId: hiringManager.id,
      role: req.body?.role || "hiring_manager",
    });
    return res.status(201).json({
      ok: true,
      hiringManager: toPublicHiringManager(hiringManager),
    });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
