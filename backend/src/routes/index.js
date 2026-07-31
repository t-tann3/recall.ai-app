import { Router } from "express";
import healthRouter from "./health.js";
import botsRouter from "./bots.js";
import workspacesRouter from "./workspaces.js";
import webhooksRouter from "./webhooks.js";

/**
 * Route modules (webhooks are mounted separately in index.js
 * so they receive a raw body for Svix verification).
 */
const router = Router();

router.use("/health", healthRouter);
router.use("/api/bots", botsRouter);
router.use("/api/workspaces", workspacesRouter);
router.use("/api/webhooks", webhooksRouter);

export default router;
export { healthRouter, botsRouter, workspacesRouter, webhooksRouter };
