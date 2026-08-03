import { Router } from "express";
import bodyParser from "body-parser";
import { Webhook } from "svix";
import { config } from "../config.js";
import { processRecallWebhook } from "../services/recallWebhooks.js";
import { getPersistence } from "../store/persistenceAccess.js";

const router = Router();

/**
 * POST /api/webhooks/recall
 * @see https://docs.recall.ai/docs/testing-webhooks-locally
 *
 * Dashboard URL: {PUBLIC_API_BASE_URL}/api/webhooks/recall
 * Subscribe to: bot.*, recording.done, recording.failed, transcript.done, transcript.failed
 *
 * Must use raw body for Svix signature verification.
 * Returns 5xx on handler failure so Svix retries; dedupes via svix-id.
 */
router.post(
  "/recall",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const secret = config.recall.webhookSecret;
    if (!secret) {
      console.error("[webhooks/recall] RECALL_SVIX_WEBHOOK_SECRET is not configured");
      return res.status(503).json({ ok: false, message: "Webhook secret not configured" });
    }

    const payload = req.body;
    const headers = req.headers;
    const eventId =
      (typeof headers["svix-id"] === "string" && headers["svix-id"]) ||
      (typeof headers["webhook-id"] === "string" && headers["webhook-id"]) ||
      null;

    const persistence = getPersistence();

    if (eventId && persistence) {
      const existing = persistence.getWebhookEvent(eventId);
      if (existing?.status === "processed") {
        return res.json({ ok: true, duplicate: true });
      }
    }

    const wh = new Webhook(secret);
    let msg;
    try {
      msg = wh.verify(payload, headers);
    } catch (err) {
      console.error("[webhooks/recall] verification failed:", err.message);
      return res.status(400).json({ ok: false, message: "Invalid signature" });
    }

    const eventName = msg?.event || msg?.type || "";

    if (eventId && persistence) {
      persistence.upsertWebhookEvent({
        id: eventId,
        event: eventName,
        status: "received",
        createdAt: new Date().toISOString(),
      });
    }

    try {
      const result = await processRecallWebhook(msg);
      console.log("[webhooks/recall] handled:", result);

      if (eventId && persistence) {
        persistence.upsertWebhookEvent({
          id: eventId,
          event: eventName,
          status: "processed",
          processedAt: new Date().toISOString(),
        });
      }

      return res.json({ ok: true, ...result });
    } catch (err) {
      console.error("[webhooks/recall] handler error:", err.message);

      if (eventId && persistence) {
        persistence.upsertWebhookEvent({
          id: eventId,
          event: eventName,
          status: "failed",
          error: err.message,
          processedAt: new Date().toISOString(),
        });
      }

      // Non-2xx so Svix retries transient failures.
      return res.status(500).json({ ok: false, message: "Webhook processing failed" });
    }
  },
);

export default router;
