import { config, recallUrl } from "../config.js";

function requireRecall() {
  if (!config.recall.apiKey || !config.recall.region) {
    throw Object.assign(
      new Error("Recall is not configured (RECALL_REGION / RECALL_API_KEY)"),
      { status: 503 },
    );
  }
}

async function recallFetch(path, options = {}) {
  requireRecall();
  const res = await fetch(recallUrl(path), {
    ...options,
    headers: {
      Authorization: `Token ${config.recall.apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const message =
      data?.detail ||
      data?.message ||
      (typeof data === "string" ? data : null) ||
      text ||
      `Recall request failed (${res.status})`;
    throw Object.assign(new Error(String(message)), {
      status: res.status >= 500 ? 502 : res.status,
      data,
    });
  }

  return data;
}

/**
 * Create a Recall bot for a meeting.
 * @see https://docs.recall.ai/reference/bot_create
 */
export async function createRecallBot({
  meetingUrl,
  botName = "Shop Talk",
  joinAt = null,
}) {
  const body = {
    meeting_url: meetingUrl,
    bot_name: botName,
    recording_config: {
      transcript: {
        provider: {
          recallai_streaming: {},
        },
      },
    },
  };

  if (joinAt) {
    body.join_at = joinAt;
  }

  return recallFetch("/bot/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getRecallBot(botId) {
  return recallFetch(`/bot/${botId}/`);
}

/**
 * Fetch transcript JSON from a Recall download URL (often on the webhook payload).
 */
export async function fetchTranscriptDownload(downloadUrl) {
  if (!downloadUrl) return null;
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw Object.assign(new Error(`Transcript download failed (${res.status})`), {
      status: 502,
    });
  }
  return res.json();
}

/**
 * Normalize common Recall transcript payload shapes into speaker lines.
 */
export function normalizeTranscriptLines(payload) {
  if (!payload) return [];

  // Array of { speaker, words: [{text, start_timestamp...}] } or similar
  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const speaker =
        entry.speaker ||
        entry.participant?.name ||
        entry.speaker_name ||
        "Speaker";
      if (typeof entry.text === "string" && entry.text.trim()) {
        return [
          {
            speaker,
            text: entry.text.trim(),
            startSeconds: Number(entry.start_timestamp?.relative ?? entry.start ?? 0) || 0,
            endSeconds:
              entry.end_timestamp?.relative != null
                ? Number(entry.end_timestamp.relative)
                : entry.end != null
                  ? Number(entry.end)
                  : null,
          },
        ];
      }
      if (Array.isArray(entry.words)) {
        const text = entry.words
          .map((w) => w.text || w.word || "")
          .join(" ")
          .trim();
        if (!text) return [];
        const start =
          entry.words[0]?.start_timestamp?.relative ??
          entry.words[0]?.start ??
          0;
        const last = entry.words[entry.words.length - 1];
        const end = last?.end_timestamp?.relative ?? last?.end ?? null;
        return [
          {
            speaker,
            text,
            startSeconds: Number(start) || 0,
            endSeconds: end != null ? Number(end) : null,
          },
        ];
      }
      return [];
    });
  }

  if (Array.isArray(payload.results)) {
    return normalizeTranscriptLines(payload.results);
  }
  if (Array.isArray(payload.segments)) {
    return normalizeTranscriptLines(payload.segments);
  }
  if (Array.isArray(payload.transcript)) {
    return normalizeTranscriptLines(payload.transcript);
  }

  return [];
}
