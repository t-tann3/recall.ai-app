import { db } from "../store/db.js";
import {
  fetchTranscriptDownload,
  normalizeTranscriptLines,
} from "../services/recallBots.js";

export function pick(obj, paths) {
  for (const path of paths) {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) {
        cur = undefined;
        break;
      }
      cur = cur[p];
    }
    if (cur != null && cur !== "") return cur;
  }
  return null;
}

export function resolveBotId(eventName, data) {
  return (
    pick(data, [
      "bot.id",
      "bot_id",
      "data.bot.id",
      "data.bot_id",
      "recording.bot.id",
      "data.recording.bot.id",
    ]) || null
  );
}

export function resolveRecordingId(data) {
  return (
    pick(data, [
      "recording.id",
      "recording_id",
      "data.recording.id",
      "data.recording_id",
      "data.id",
    ]) || null
  );
}

export function resolveMediaUrl(data) {
  return (
    pick(data, [
      "recording.media_shortcuts.video_mixed.mp4.data.download_url",
      "data.recording.media_shortcuts.video_mixed.mp4.data.download_url",
      "media_shortcuts.video_mixed.mp4.data.download_url",
      "video_mixed.data.download_url",
      "data.video_mixed.data.download_url",
      "download_url",
      "data.download_url",
      "media_url",
      "data.media_url",
    ]) || null
  );
}

export function resolveTranscriptDownloadUrl(data) {
  return (
    pick(data, [
      "transcript.data.download_url",
      "data.transcript.data.download_url",
      "recording.media_shortcuts.transcript.data.download_url",
      "data.recording.media_shortcuts.transcript.data.download_url",
      "download_url",
      "data.download_url",
    ]) || null
  );
}

export function mapBotStatus(code) {
  switch (code) {
    case "joining_call":
    case "in_waiting_room":
      return "joining";
    case "in_call_recording":
    case "in_call_not_recording":
      return "in_call";
    case "call_ended":
    case "done":
    case "recording_done":
      return "processing";
    case "fatal":
    case "recording_failed":
      return "failed";
    default:
      return null;
  }
}

/**
 * Process a verified Recall webhook payload.
 * @see https://docs.recall.ai/docs/bot-status-change-webhooks
 */
export async function processRecallWebhook(msg) {
  const event = msg?.event || msg?.type || "";
  const data = msg?.data || msg || {};

  console.log(`[webhooks/recall] processing ${event}`);

  const botId = resolveBotId(event, data);
  const interview = botId ? db.findInterviewByBotId(botId) : null;

  if (botId && db.getBot(botId)) {
    const code =
      pick(data, ["status.code", "data.status.code", "code"]) ||
      (typeof event === "string" && event.startsWith("bot.")
        ? event.replace(/^bot\./, "")
        : null);
    if (code) db.updateBot(botId, { status: code });
  }

  if (interview && typeof event === "string" && event.startsWith("bot.")) {
    const code = event.replace(/^bot\./, "");
    const mapped = mapBotStatus(code);
    if (mapped) {
      db.updateInterview(interview.id, { status: mapped });
    }
  }

  if (event === "recording.done" || event === "recording.failed") {
    if (!interview) {
      console.warn("[webhooks/recall] recording event with no matching interview", {
        botId,
        event,
      });
      return { ok: true, matched: false };
    }

    if (event === "recording.failed") {
      db.upsertRecordingForInterview(interview.id, {
        botId,
        status: "failed",
        mediaUrl: null,
      });
      db.updateInterview(interview.id, { status: "failed" });
      return { ok: true, matched: true, interviewId: interview.id };
    }

    const recordingId = resolveRecordingId(data) || undefined;
    const mediaUrl = resolveMediaUrl(data);
    const recording = db.upsertRecordingForInterview(interview.id, {
      ...(recordingId ? { id: recordingId } : {}),
      botId,
      status: "done",
      mediaUrl,
    });
    db.updateInterview(interview.id, {
      recordingId: recording.id,
      status: interview.transcriptId ? "ready" : "processing",
    });
    return { ok: true, matched: true, interviewId: interview.id, recordingId: recording.id };
  }

  if (event === "transcript.done" || event === "transcript.failed") {
    if (!interview) {
      console.warn("[webhooks/recall] transcript event with no matching interview", {
        botId,
        event,
      });
      return { ok: true, matched: false };
    }

    if (event === "transcript.failed") {
      db.upsertTranscriptForInterview(interview.id, {
        status: "failed",
        lines: [],
      });
      return { ok: true, matched: true, interviewId: interview.id };
    }

    let lines = [];
    const downloadUrl = resolveTranscriptDownloadUrl(data);
    if (downloadUrl) {
      try {
        const payload = await fetchTranscriptDownload(downloadUrl);
        lines = normalizeTranscriptLines(payload);
      } catch (err) {
        console.error("[webhooks/recall] transcript download failed:", err.message);
        throw err;
      }
    }

    // Some payloads embed words inline.
    if (lines.length === 0) {
      lines = normalizeTranscriptLines(
        pick(data, ["transcript", "data.transcript", "data"]) || data,
      );
    }

    const transcript = db.upsertTranscriptForInterview(interview.id, {
      recordingId: interview.recordingId,
      status: "done",
      lines,
    });

    db.updateInterview(interview.id, {
      transcriptId: transcript.id,
      status: "ready",
    });

    return {
      ok: true,
      matched: true,
      interviewId: interview.id,
      transcriptId: transcript.id,
      lineCount: lines.length,
    };
  }

  return { ok: true, matched: Boolean(interview), event };
}
