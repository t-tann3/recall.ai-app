import { config, recallV2Url } from "../config.js";

/**
 * Create a Recall Calendar V2 calendar from OAuth credentials.
 * @see https://docs.recall.ai/reference/calendars_create
 */
export async function createRecallCalendar({
  platform,
  oauthClientId,
  oauthClientSecret,
  oauthRefreshToken,
  platformEmail,
}) {
  if (!config.recall.apiKey || !config.recall.region) {
    throw Object.assign(
      new Error("Recall is not configured (RECALL_REGION / RECALL_API_KEY)"),
      { status: 503 },
    );
  }

  const res = await fetch(recallV2Url("/calendars/"), {
    method: "POST",
    headers: {
      Authorization: `Token ${config.recall.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      platform,
      oauth_client_id: oauthClientId,
      oauth_client_secret: oauthClientSecret,
      oauth_refresh_token: oauthRefreshToken,
      ...(platformEmail ? { platform_email: platformEmail } : {}),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.detail ||
      data?.message ||
      (typeof data === "string" ? data : null) ||
      `Recall calendar create failed (${res.status})`;
    throw Object.assign(new Error(String(message)), { status: 502, data });
  }

  return data;
}

export async function deleteRecallCalendar(recallCalendarId) {
  if (!config.recall.apiKey || !config.recall.region || !recallCalendarId) {
    return null;
  }

  const res = await fetch(recallV2Url(`/calendars/${recallCalendarId}/`), {
    method: "DELETE",
    headers: {
      Authorization: `Token ${config.recall.apiKey}`,
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(
      new Error(text || `Recall calendar delete failed (${res.status})`),
      { status: 502 },
    );
  }
  return true;
}
