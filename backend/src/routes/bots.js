import { Router } from "express";
import { db } from "../store/db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { handleRouteError } from "./helpers.js";
import { createRecallBot, getRecallBot } from "../services/recallBots.js";
import { assertCanAccessInterview } from "../auth/access.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const interviewId = body.interviewId;
    if (!interviewId) {
      throw Object.assign(new Error("interviewId is required"), { status: 400 });
    }

    const interview = assertCanAccessInterview(req.tenant, interviewId);

    const meetingUrl = (body.meetingUrl || interview.meetingUrl || "").trim();
    if (!meetingUrl) {
      throw Object.assign(
        new Error("Interview needs a meetingUrl (or pass meetingUrl in the request)"),
        { status: 400 },
      );
    }

    if (interview.botId) {
      const existing = db.getBot(interview.botId);
      return res.status(200).json({
        ok: true,
        alreadyScheduled: true,
        bot: existing,
        interview: db.getInterview(interviewId),
        detail: db.getInterviewDetail(interviewId),
      });
    }

    const joinAt = body.joinAt || interview.scheduledAt || null;
    const botName = body.botName || "Shop Talk";

    const recallBot = await createRecallBot({
      meetingUrl,
      botName,
      joinAt,
    });

    const botId = recallBot.id;
    const statusFromRecall =
      recallBot.status_changes?.[recallBot.status_changes.length - 1]?.code ||
      "joining";

    const bot = db.addBot({
      id: botId,
      interviewId,
      meetingUrl,
      botName,
      joinAt,
      status: statusFromRecall,
    });

    const joinMs = joinAt ? Date.parse(joinAt) : Date.now();
    const nextStatus =
      Number.isFinite(joinMs) && joinMs - Date.now() > 10 * 60 * 1000
        ? "scheduled"
        : "joining";

    db.updateInterview(interviewId, {
      botId,
      meetingUrl,
      status: nextStatus,
    });

    return res.status(201).json({
      ok: true,
      bot,
      recall: {
        id: recallBot.id,
        join_at: recallBot.join_at ?? joinAt,
        meeting_url: recallBot.meeting_url ?? meetingUrl,
      },
      interview: db.getInterview(interviewId),
      detail: db.getInterviewDetail(interviewId),
    });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const local = db.getBot(req.params.id);
    if (local?.interviewId) {
      assertCanAccessInterview(req.tenant, local.interviewId);
    }

    let recall = null;
    try {
      recall = await getRecallBot(req.params.id);
      if (local && recall) {
        const code =
          recall.status_changes?.[recall.status_changes.length - 1]?.code ||
          local.status;
        db.updateBot(local.id, { status: code });
      }
    } catch {
      // ignore recall fetch errors
    }

    if (!local && !recall) {
      return res.status(404).json({ ok: false, message: "Bot not found" });
    }

    return res.json({
      ok: true,
      bot: local ? db.getBot(req.params.id) : null,
      recall,
      interview: local
        ? db.getInterview(local.interviewId)
        : db.findInterviewByBotId(req.params.id),
    });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
