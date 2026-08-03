import "dotenv/config";

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const PORT = Number(process.env.PORT || 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

/** Public base URL for this API (static ngrok locally, DigitalOcean in prod). */
const BASE_URL = trimTrailingSlash(
  process.env.PUBLIC_API_BASE_URL || `http://localhost:${PORT}`,
);

/**
 * Build a full public URL from a path.
 * @example url("/health") → "https://….ngrok-free.dev/health"
 */
export function url(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalized}`;
}

/** App routes — use these instead of repeating BASE_URL. */
export const endpoints = {
  health: url("/health"),
  auth: {
    signup: url("/api/auth/signup"),
    login: url("/api/auth/login"),
    me: url("/api/auth/me"),
  },
  webhooks: {
    recall: url("/api/webhooks/recall"),
  },
  hiringManagers: {
    list: url("/api/hiring-managers"),
    byId: (id) => url(`/api/hiring-managers/${id}`),
  },
  candidates: {
    list: url("/api/candidates"),
    byId: (id) => url(`/api/candidates/${id}`),
  },
  jobPostings: {
    list: url("/api/job-postings"),
    byId: (id) => url(`/api/job-postings/${id}`),
  },
  applications: {
    list: url("/api/applications"),
    byId: (id) => url(`/api/applications/${id}`),
  },
  interviews: {
    list: url("/api/interviews"),
    byId: (id) => url(`/api/interviews/${id}`),
    panelists: (id) => url(`/api/interviews/${id}/panelists`),
  },
  calendarEvents: {
    list: url("/api/calendar-events"),
    byId: (id) => url(`/api/calendar-events/${id}`),
  },
  calendar: {
    connections: url("/api/calendar/connections"),
    oauthStart: url("/api/calendar/oauth/start"),
    oauthCallback: url("/api/calendar/oauth/callback"),
    status: url("/api/calendar/status"),
  },
  scorecardCriteria: {
    me: url("/api/scorecard-criteria"),
  },
  bots: {
    create: url("/api/bots"),
    byId: (id) => url(`/api/bots/${id}`),
  },
};

const RECALL_REGION = process.env.RECALL_REGION?.trim() || null;
const RECALL_API_KEY = process.env.RECALL_API_KEY?.trim() || null;
const RECALL_WORKSPACE_VERIFICATION_SECRET =
  process.env.RECALL_WORKSPACE_VERIFICATION_SECRET?.trim() || null;

/** Recall API host for the selected region (v1 bots/webhooks). */
export const RECALL_API_BASE = RECALL_REGION
  ? `https://${RECALL_REGION}.recall.ai/api/v1`
  : null;

/** Recall Calendar V2 API host. */
export const RECALL_API_V2_BASE = RECALL_REGION
  ? `https://${RECALL_REGION}.recall.ai/api/v2`
  : null;

/**
 * Build a Recall API URL from a path under /api/v1.
 * @example recallUrl("/bot/") → "https://us-west-2.recall.ai/api/v1/bot/"
 */
export function recallUrl(path = "/") {
  if (!RECALL_API_BASE) {
    throw new Error("RECALL_REGION is not set");
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${RECALL_API_BASE}${normalized}`;
}

/**
 * Build a Recall Calendar V2 URL.
 * @example recallV2Url("/calendars/") → "https://us-west-2.recall.ai/api/v2/calendars/"
 */
export function recallV2Url(path = "/") {
  if (!RECALL_API_V2_BASE) {
    throw new Error("RECALL_REGION is not set");
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${RECALL_API_V2_BASE}${normalized}`;
}

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || null;
const GOOGLE_OAUTH_CLIENT_SECRET =
  process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() || null;
const MICROSOFT_OAUTH_CLIENT_ID =
  process.env.MICROSOFT_OAUTH_CLIENT_ID?.trim() || null;
const MICROSOFT_OAUTH_CLIENT_SECRET =
  process.env.MICROSOFT_OAUTH_CLIENT_SECRET?.trim() || null;
const CALENDAR_OAUTH_REDIRECT_URI =
  process.env.CALENDAR_OAUTH_REDIRECT_URI?.trim() || null;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() || null;
const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

const DEFAULT_JWT_SECRET = "shoptalk-dev-secret-change-me";
const JWT_SECRET = process.env.JWT_SECRET?.trim() || DEFAULT_JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV?.trim() || "development";
const IS_PROD = NODE_ENV === "production";

/**
 * Dashboard endpoint signing secret (Svix).
 * Fail closed when unset — never ship a hardcoded sample secret.
 * @see https://docs.recall.ai/docs/testing-webhooks-locally
 */
const RECALL_SVIX_WEBHOOK_SECRET =
  process.env.RECALL_SVIX_WEBHOOK_SECRET?.trim() || null;

if (IS_PROD && JWT_SECRET === DEFAULT_JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}
if (IS_PROD && !RECALL_SVIX_WEBHOOK_SECRET) {
  throw new Error("RECALL_SVIX_WEBHOOK_SECRET must be set in production");
}

export const config = {
  port: PORT,
  corsOrigin: CORS_ORIGIN,
  baseUrl: BASE_URL,
  endpoints,
  nodeEnv: NODE_ENV,
  auth: {
    jwtSecret: JWT_SECRET,
    usingDefaultJwtSecret: JWT_SECRET === DEFAULT_JWT_SECRET,
  },
  recall: {
    region: RECALL_REGION,
    apiKey: RECALL_API_KEY,
    workspaceVerificationSecret: RECALL_WORKSPACE_VERIFICATION_SECRET,
    webhookSecret: RECALL_SVIX_WEBHOOK_SECRET,
    apiBase: RECALL_API_BASE,
    apiV2Base: RECALL_API_V2_BASE,
  },
  openai: {
    apiKey: OPENAI_API_KEY,
    model: OPENAI_MODEL,
  },
  calendar: {
    oauthRedirectUri: CALENDAR_OAUTH_REDIRECT_URI,
    google: {
      clientId: GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
    },
    microsoft: {
      clientId: MICROSOFT_OAUTH_CLIENT_ID,
      clientSecret: MICROSOFT_OAUTH_CLIENT_SECRET,
    },
  },
};

/** Call when you need Recall credentials present (create bot, verify webhooks). */
export function assertRecallConfigured() {
  requireEnv("RECALL_REGION");
  requireEnv("RECALL_API_KEY");
  requireEnv("PUBLIC_API_BASE_URL");
}
