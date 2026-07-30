import { Router } from "express";
import { notImplemented } from "./helpers.js";

const router = Router();

/**
 * POST /api/bots
 * Body: { meetingUrl, botName?, joinAt? }
 * Create a Recall bot and attach it to a Meeting Workspace.
 */
router.post("/", (_req, res) => notImplemented(res, "bots.create"));

/**
 * GET /api/bots/:id
 * Retrieve local bot mirror / status.
 */
router.get("/:id", (_req, res) => notImplemented(res, "bots.get"));

export default router;
