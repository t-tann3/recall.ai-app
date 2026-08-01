import { Router } from "express";
import { db } from "../store/db.js";
import { toPublicHiringManager } from "../models/hiringManager.js";
import { handleRouteError } from "./helpers.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, (_req, res) => {
  res.json({
    ok: true,
    hiringManagers: db.listHiringManagers().map(toPublicHiringManager),
  });
});

router.get("/:id", requireAuth, (req, res) => {
  const row = db.getHiringManager(req.params.id);
  if (!row) return res.status(404).json({ ok: false, message: "Hiring manager not found" });
  return res.json({ ok: true, hiringManager: toPublicHiringManager(row) });
});

router.post("/", requireAuth, (req, res) => {
  try {
    // Prefer /api/auth/signup for password accounts. This remains for admin-style creates.
    if (!req.body?.passwordHash && req.body?.password) {
      return res.status(400).json({
        ok: false,
        message: "Use POST /api/auth/signup to create hiring managers with passwords",
      });
    }
    const hiringManager = db.addHiringManager(req.body || {});
    return res.status(201).json({
      ok: true,
      hiringManager: toPublicHiringManager(hiringManager),
    });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
