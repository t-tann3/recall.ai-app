import { Router } from "express";
import bodyParser from "body-parser";
import { Webhook } from "svix";
import { config } from "../config.js";
import { processRecallWebhook } from "../services/recallWebhooks.js";

const router = Router();

/**
 * POST /api/webhooks/recall
 * @see https://docs.recall.ai/docs/testing-webhooks-locally
 *
 * Dashboard URL: {PUBLIC_API_BASE_URL}/api/webhooks/recall
 * Subscribe to: bot.*, recording.done, recording.failed, transcript.done, transcript.failed
 *
 * Must use raw body for Svix signature verification.
 */
router.post(
  "/recall",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
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

    // Acknowledge quickly; process after verify.
    try {
      const result = await processRecallWebhook(msg);
      console.log("[webhooks/recall] handled:", result);
    } catch (err) {
      console.error("[webhooks/recall] handler error:", err.message);
      // Still 200 so Svix doesn't retry forever on app bugs during local dev.
    }

    return res.json({});
  },
);

export default router;
