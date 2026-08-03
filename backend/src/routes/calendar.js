import { Router } from "express";
import { config } from "../config.js";
import { db } from "../store/db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { handleRouteError } from "./helpers.js";
import { toPublicCalendarConnection } from "../models/calendarConnection.js";
import {
  buildAuthorizationUrl,
  createOauthState,
  exchangeAuthorizationCode,
  getProviderConfig,
  parseOauthState,
} from "../services/calendarOauth.js";
import {
  createRecallCalendar,
  deleteRecallCalendar,
} from "../services/recallCalendar.js";

const router = Router();

const PLATFORMS = new Set(["google_calendar", "microsoft_outlook"]);

function frontendSettingsRedirect(query) {
  const url = new URL("/settings", config.corsOrigin);
  for (const [key, value] of Object.entries(query)) {
    if (value != null) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Public status: which OAuth providers + Recall are configured. */
router.get("/status", requireAuth, (_req, res) => {
  res.json({
    ok: true,
    status: {
      googleConfigured: Boolean(
        config.calendar.google.clientId && config.calendar.google.clientSecret,
      ),
      microsoftConfigured: Boolean(
        config.calendar.microsoft.clientId && config.calendar.microsoft.clientSecret,
      ),
      recallConfigured: Boolean(config.recall.apiKey && config.recall.region),
      oauthRedirectUri:
        config.calendar.oauthRedirectUri ||
        `${config.baseUrl}/api/calendar/oauth/callback`,
    },
  });
});

router.get("/connections", requireAuth, (req, res) => {
  const connections = db
    .listCalendarConnections({ hiringManagerId: req.hiringManager.id })
    .filter((c) => c.status !== "disconnected" && c.orgId === req.orgId)
    .map(toPublicCalendarConnection);
  res.json({ ok: true, connections });
});

/**
 * Authenticated: return provider authorize URL for the SPA to navigate to.
 * Query: platform=google_calendar|microsoft_outlook
 */
router.get("/oauth/start", requireAuth, (req, res) => {
  try {
    const platform = String(req.query.platform || "");
    if (!PLATFORMS.has(platform)) {
      throw Object.assign(
        new Error("platform must be google_calendar or microsoft_outlook"),
        { status: 400 },
      );
    }

    const state = createOauthState({
      hiringManagerId: req.hiringManager.id,
      platform,
    });
    const url = buildAuthorizationUrl(platform, state);
    return res.json({ ok: true, url, platform });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

/**
 * OAuth provider redirects here (no JWT). State carries hiringManagerId.
 */
router.get("/oauth/callback", async (req, res) => {
  try {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      return res.redirect(
        frontendSettingsRedirect({
          calendar: "error",
          message: String(errorDescription || error),
        }),
      );
    }

    if (!code || !state) {
      return res.redirect(
        frontendSettingsRedirect({
          calendar: "error",
          message: "Missing OAuth code or state",
        }),
      );
    }

    const { hiringManagerId, platform } = parseOauthState(String(state));
    if (!db.getHiringManager(hiringManagerId)) {
      return res.redirect(
        frontendSettingsRedirect({
          calendar: "error",
          message: "Hiring manager not found — sign in again",
        }),
      );
    }

    const tokens = await exchangeAuthorizationCode(platform, String(code));
    const provider = getProviderConfig(platform);
    const membership = db.getPrimaryMembership(hiringManagerId);
    const orgId = membership?.organizationId;
    if (!orgId) {
      return res.redirect(
        frontendSettingsRedirect({
          calendar: "error",
          message: "No organization membership for this account",
        }),
      );
    }

    let recallCalendarId = null;
    let status = "connected";
    let lastError = null;

    try {
      const recallCalendar = await createRecallCalendar({
        platform,
        oauthClientId: provider.clientId,
        oauthClientSecret: provider.clientSecret,
        oauthRefreshToken: tokens.refreshToken,
        platformEmail: tokens.platformEmail,
      });
      recallCalendarId = recallCalendar.id || recallCalendar.calendar_id || null;
    } catch (err) {
      status = "error";
      lastError = err instanceof Error ? err.message : "Failed to create Recall calendar";
    }

    const existing = db.findCalendarConnection({ hiringManagerId, platform });
    if (existing) {
      if (existing.recallCalendarId && existing.recallCalendarId !== recallCalendarId) {
        try {
          await deleteRecallCalendar(existing.recallCalendarId);
        } catch {
          // best-effort cleanup
        }
      }
      db.updateCalendarConnection(existing.id, {
        platformEmail: tokens.platformEmail,
        oauthRefreshToken: tokens.refreshToken,
        recallCalendarId,
        orgId,
        status,
        lastError,
      });
    } else {
      db.addCalendarConnection({
        hiringManagerId,
        platform,
        platformEmail: tokens.platformEmail,
        oauthRefreshToken: tokens.refreshToken,
        recallCalendarId,
        orgId,
        status,
        lastError,
      });
    }

    return res.redirect(
      frontendSettingsRedirect({
        calendar: status === "connected" ? "connected" : "partial",
        platform,
        ...(lastError ? { message: lastError } : {}),
      }),
    );
  } catch (err) {
    return res.redirect(
      frontendSettingsRedirect({
        calendar: "error",
        message: err instanceof Error ? err.message : "Calendar connect failed",
      }),
    );
  }
});

router.delete("/connections/:id", requireAuth, async (req, res) => {
  try {
    const row = db.getCalendarConnection(req.params.id);
    if (!row || row.hiringManagerId !== req.hiringManager.id || row.orgId !== req.orgId) {
      return res.status(404).json({ ok: false, message: "Calendar connection not found" });
    }

    if (row.recallCalendarId) {
      try {
        await deleteRecallCalendar(row.recallCalendarId);
      } catch (err) {
        // Still disconnect locally; surface Recall error in response message.
        db.updateCalendarConnection(row.id, {
          status: "disconnected",
          oauthRefreshToken: null,
          lastError: err instanceof Error ? err.message : "Recall disconnect failed",
        });
        return res.json({
          ok: true,
          disconnected: true,
          warning: err instanceof Error ? err.message : "Recall disconnect failed",
        });
      }
    }

    db.updateCalendarConnection(row.id, {
      status: "disconnected",
      oauthRefreshToken: null,
      recallCalendarId: null,
      lastError: null,
    });

    return res.json({ ok: true, disconnected: true });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
