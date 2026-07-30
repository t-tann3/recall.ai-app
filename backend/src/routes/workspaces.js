import { Router } from "express";
import { notImplemented } from "./helpers.js";

const router = Router();

/**
 * GET /api/workspaces
 * List Meeting Workspaces for the dashboard sidebar.
 */
router.get("/", (_req, res) => notImplemented(res, "workspaces.list"));

/**
 * POST /api/workspaces
 * Body: { meetingUrl, title?, botName? }
 * Create a workspace (and later: schedule/create bot).
 */
router.post("/", (_req, res) => notImplemented(res, "workspaces.create"));

/**
 * GET /api/workspaces/:id
 * Full workspace payload for tabs (summary, ids, status).
 */
router.get("/:id", (_req, res) => notImplemented(res, "workspaces.get"));

/**
 * PATCH /api/workspaces/:id
 * Update title / metadata / settings tab fields.
 */
router.patch("/:id", (_req, res) => notImplemented(res, "workspaces.update"));

/**
 * DELETE /api/workspaces/:id
 */
router.delete("/:id", (_req, res) => notImplemented(res, "workspaces.delete"));

/** --- Tab-oriented reads (fill in later) --- */

router.get("/:id/summary", (_req, res) =>
  notImplemented(res, "workspaces.summary"),
);
router.get("/:id/transcript", (_req, res) =>
  notImplemented(res, "workspaces.transcript"),
);
router.get("/:id/insights", (_req, res) =>
  notImplemented(res, "workspaces.insights"),
);
router.get("/:id/action-items", (_req, res) =>
  notImplemented(res, "workspaces.actionItems"),
);
router.get("/:id/questions", (_req, res) =>
  notImplemented(res, "workspaces.questions"),
);
router.get("/:id/developer", (_req, res) =>
  notImplemented(res, "workspaces.developer"),
);

export default router;
