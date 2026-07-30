import { Router } from "express";
import { config, endpoints } from "../config.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "backend",
    baseUrl: config.baseUrl,
    endpoints: {
      health: endpoints.health,
      webhooksRecall: endpoints.webhooks.recall,
      workspaces: endpoints.workspaces.list,
      botsCreate: endpoints.bots.create,
    },
  });
});

export default router;
