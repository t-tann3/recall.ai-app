import { Router } from "express";
import bodyParser from "body-parser";
import { Webhook } from "svix";
import { config } from "../config.js";

const router = Router();

/**
 * POST /api/webhooks/recall
 * @see https://docs.recall.ai/docs/testing-webhooks-locally
 *
 * Dashboard URL: {PUBLIC_API_BASE_URL}/api/webhooks/recall
 * Subscribe to: recording.done, transcript.done, transcript.failed
 * (and bot.* / recording.failed when ready)
 *
 * Must use raw body for Svix signature verification.
 */
router.post(
  "/recall",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
    const secret = config.recall.webhookSecret;
    const payload = req.body;
    const headers = req.headers;

    const wh = new Webhook(secret);
    let msg;
    try {
      msg = wh.verify(payload, headers);
    } catch (err) {
      console.error("[webhooks/recall] verification failed:", err.message);
      return res.status(400).json({});
    }

    // Placeholder — process events async later (recording.done, transcript.*, bot.*)
    console.log("[webhooks/recall] verified event:", msg?.event ?? msg);

    return res.json({});
  },
);

export default router;
