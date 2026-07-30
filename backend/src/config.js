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
  webhooks: {
    recall: url("/api/webhooks/recall"),
  },
  workspaces: {
    list: url("/api/workspaces"),
    byId: (id) => url(`/api/workspaces/${id}`),
    summary: (id) => url(`/api/workspaces/${id}/summary`),
    transcript: (id) => url(`/api/workspaces/${id}/transcript`),
    insights: (id) => url(`/api/workspaces/${id}/insights`),
    actionItems: (id) => url(`/api/workspaces/${id}/action-items`),
    questions: (id) => url(`/api/workspaces/${id}/questions`),
    developer: (id) => url(`/api/workspaces/${id}/developer`),
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

/** Recall API host for the selected region. */
export const RECALL_API_BASE = RECALL_REGION
  ? `https://${RECALL_REGION}.recall.ai/api/v1`
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

export const config = {
  port: PORT,
  corsOrigin: CORS_ORIGIN,
  baseUrl: BASE_URL,
  endpoints,
  recall: {
    region: RECALL_REGION,
    apiKey: RECALL_API_KEY,
    workspaceVerificationSecret: RECALL_WORKSPACE_VERIFICATION_SECRET,
    apiBase: RECALL_API_BASE,
  },
};

/** Call when you need Recall credentials present (create bot, verify webhooks). */
export function assertRecallConfigured() {
  requireEnv("RECALL_REGION");
  requireEnv("RECALL_API_KEY");
  requireEnv("RECALL_WORKSPACE_VERIFICATION_SECRET");
  requireEnv("PUBLIC_API_BASE_URL");
}
