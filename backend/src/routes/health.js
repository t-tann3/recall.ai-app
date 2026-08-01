import { Router } from "express";
import { config, endpoints } from "../config.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "backend",
    product: "Shop Talk",
    baseUrl: config.baseUrl,
    endpoints: {
      health: endpoints.health,
      hiringManagers: endpoints.hiringManagers.list,
      candidates: endpoints.candidates.list,
      jobPostings: endpoints.jobPostings.list,
      applications: endpoints.applications.list,
      interviews: endpoints.interviews.list,
      calendarEvents: endpoints.calendarEvents.list,
      webhooksRecall: endpoints.webhooks.recall,
    },
  });
});

export default router;
