import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { config } from "../config.js";

/**
 * Signed OAuth state binds the callback to a hiring manager + platform.
 * Format: base64url(json).base64url(hmac)
 */
export function createOauthState({ hiringManagerId, platform }) {
  const payload = {
    hiringManagerId,
    platform,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + 15 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", config.auth.jwtSecret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function parseOauthState(state) {
  if (!state || typeof state !== "string" || !state.includes(".")) {
    throw Object.assign(new Error("Invalid OAuth state"), { status: 400 });
  }
  const [body, sig] = state.split(".");
  const expected = createHmac("sha256", config.auth.jwtSecret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw Object.assign(new Error("Invalid OAuth state signature"), { status: 400 });
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw Object.assign(new Error("Invalid OAuth state payload"), { status: 400 });
  }
  if (!payload?.hiringManagerId || !payload?.platform) {
    throw Object.assign(new Error("OAuth state missing fields"), { status: 400 });
  }
  if (typeof payload.exp === "number" && Date.now() > payload.exp) {
    throw Object.assign(new Error("OAuth state expired — try connecting again"), {
      status: 400,
    });
  }
  return payload;
}

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const OUTLOOK_SCOPES = ["offline_access", "User.Read", "Calendars.Read"].join(" ");

export function getProviderConfig(platform) {
  const redirectUri =
    config.calendar.oauthRedirectUri ||
    `${config.baseUrl}/api/calendar/oauth/callback`;

  if (platform === "google_calendar") {
    const { clientId, clientSecret } = config.calendar.google;
    return {
      platform,
      clientId,
      clientSecret,
      redirectUri,
      configured: Boolean(clientId && clientSecret),
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: GOOGLE_SCOPES,
      buildAuthParams(state) {
        return {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
          state,
        };
      },
    };
  }

  if (platform === "microsoft_outlook") {
    const { clientId, clientSecret } = config.calendar.microsoft;
    return {
      platform,
      clientId,
      clientSecret,
      redirectUri,
      configured: Boolean(clientId && clientSecret),
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      scopes: OUTLOOK_SCOPES,
      buildAuthParams(state) {
        return {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: OUTLOOK_SCOPES,
          response_mode: "query",
          state,
        };
      },
    };
  }

  throw Object.assign(new Error(`Unsupported calendar platform: ${platform}`), {
    status: 400,
  });
}

export function buildAuthorizationUrl(platform, state) {
  const provider = getProviderConfig(platform);
  if (!provider.configured) {
    throw Object.assign(
      new Error(
        platform === "google_calendar"
          ? "Google Calendar OAuth is not configured (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET)"
          : "Outlook Calendar OAuth is not configured (MICROSOFT_OAUTH_CLIENT_ID / MICROSOFT_OAUTH_CLIENT_SECRET)",
      ),
      { status: 503 },
    );
  }
  const params = new URLSearchParams(provider.buildAuthParams(state));
  return `${provider.authUrl}?${params.toString()}`;
}

async function exchangeGoogleCode(code, provider) {
  const body = new URLSearchParams({
    code,
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    redirect_uri: provider.redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) {
    throw Object.assign(
      new Error(tokenJson.error_description || tokenJson.error || "Google token exchange failed"),
      { status: 400 },
    );
  }
  if (!tokenJson.refresh_token) {
    throw Object.assign(
      new Error(
        "Google did not return a refresh token. Revoke Shop Talk access in your Google account and try again with prompt=consent.",
      ),
      { status: 400 },
    );
  }

  const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const info = await infoRes.json().catch(() => ({}));
  if (!infoRes.ok) {
    throw Object.assign(new Error("Failed to fetch Google user email"), { status: 400 });
  }

  return {
    refreshToken: tokenJson.refresh_token,
    accessToken: tokenJson.access_token,
    platformEmail: info.email || null,
  };
}

async function exchangeOutlookCode(code, provider) {
  const body = new URLSearchParams({
    code,
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    redirect_uri: provider.redirectUri,
    grant_type: "authorization_code",
    scope: provider.scopes,
  });

  const tokenRes = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) {
    throw Object.assign(
      new Error(
        tokenJson.error_description || tokenJson.error || "Outlook token exchange failed",
      ),
      { status: 400 },
    );
  }
  if (!tokenJson.refresh_token) {
    throw Object.assign(new Error("Outlook did not return a refresh token"), { status: 400 });
  }

  const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const me = await meRes.json().catch(() => ({}));
  if (!meRes.ok) {
    throw Object.assign(new Error("Failed to fetch Outlook user profile"), { status: 400 });
  }

  return {
    refreshToken: tokenJson.refresh_token,
    accessToken: tokenJson.access_token,
    platformEmail: me.mail || me.userPrincipalName || null,
  };
}

export async function exchangeAuthorizationCode(platform, code) {
  const provider = getProviderConfig(platform);
  if (!provider.configured) {
    throw Object.assign(new Error("OAuth provider is not configured"), { status: 503 });
  }
  if (platform === "google_calendar") return exchangeGoogleCode(code, provider);
  if (platform === "microsoft_outlook") return exchangeOutlookCode(code, provider);
  throw Object.assign(new Error(`Unsupported platform: ${platform}`), { status: 400 });
}
