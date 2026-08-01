import { Router } from "express";
import { loginHiringManager, signupHiringManager } from "../auth/service.js";
import { handleRouteError } from "./helpers.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

/**
 * POST /api/auth/signup
 * Body: { name, email, password, team?, title? }
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
 * Body: { email, password }
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
 * Authorization: Bearer <token>
 */
router.get("/me", requireAuth, (req, res) => {
  return res.json({ ok: true, hiringManager: req.hiringManager });
});

export default router;
