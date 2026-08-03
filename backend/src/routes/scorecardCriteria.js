import { Router } from "express";
import { db } from "../store/db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { handleRouteError } from "./helpers.js";
import { config } from "../config.js";
import { assertCanAccessJob, assertCanManageJobs } from "../auth/access.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  try {
    const jobPostingId = req.query.jobPostingId;
    if (!jobPostingId || typeof jobPostingId !== "string") {
      throw Object.assign(new Error("jobPostingId query param is required"), { status: 400 });
    }

    const job = assertCanAccessJob(req.tenant, jobPostingId);
    const criteria = db.getOrCreateCriteriaForJob(
      job.hiringManagerId || req.userId,
      jobPostingId,
    );
    return res.json({
      ok: true,
      criteria,
      jobPosting: { id: job.id, title: job.title },
      openaiConfigured: Boolean(config.openai.apiKey),
    });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

router.put("/", requireAuth, (req, res) => {
  try {
    assertCanManageJobs(req.tenant);
    const jobPostingId = req.body?.jobPostingId;
    const items = req.body?.items;

    if (!jobPostingId) {
      throw Object.assign(new Error("jobPostingId is required"), { status: 400 });
    }
    if (!Array.isArray(items)) {
      throw Object.assign(new Error("items must be an array of criteria"), { status: 400 });
    }

    const job = assertCanAccessJob(req.tenant, jobPostingId);

    const existing = db.listScorecardCriteria({
      hiringManagerId: job.hiringManagerId,
      jobPostingId,
    })[0];

    let criteria;
    if (existing) {
      criteria = db.updateScorecardCriteria(existing.id, { items, jobPostingId });
    } else {
      criteria = db.addScorecardCriteria({
        hiringManagerId: job.hiringManagerId || req.userId,
        jobPostingId,
        orgId: req.orgId,
        items,
      });
    }

    return res.json({
      ok: true,
      criteria,
      jobPosting: { id: job.id, title: job.title },
    });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
