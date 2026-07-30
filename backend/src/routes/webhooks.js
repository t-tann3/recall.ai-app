import { Router } from "express";
import { notImplemented } from "./helpers.js";

const router = Router();

/**
 * POST /api/webhooks/recall
 * Recall dashboard webhook receiver.
 * Later: verify HMAC on raw body → enqueue → return 2xx immediately.
 *
 * Subscribe at least to:
 * bot.*, recording.done, recording.failed, transcript.done, transcript.failed
 */
router.post("/recall", (_req, res) =>
  notImplemented(res, "webhooks.recall"),
);

export default router;
