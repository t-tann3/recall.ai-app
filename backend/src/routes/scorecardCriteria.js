import { Router } from "express";
import { db } from "../store/db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { handleRouteError } from "./helpers.js";
import { config } from "../config.js";

const router = Router();

/**
 * GET /api/scorecard-criteria?jobPostingId=...
 * Returns (or creates) the rubric for this job + logged-in hiring manager.
 */
router.get("/", requireAuth, (req, res) => {
  try {
    const jobPostingId = req.query.jobPostingId;
    if (!jobPostingId || typeof jobPostingId !== "string") {
      throw Object.assign(new Error("jobPostingId query param is required"), { status: 400 });
    }

    const job = db.getJobPosting(jobPostingId);
    if (!job) {
      throw Object.assign(new Error("Job posting not found"), { status: 404 });
    }

    const criteria = db.getOrCreateCriteriaForJob(req.hiringManager.id, jobPostingId);
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

/**
 * PUT /api/scorecard-criteria
 * Body: { jobPostingId, items: [...] }
 */
router.put("/", requireAuth, (req, res) => {
  try {
    const jobPostingId = req.body?.jobPostingId;
    const items = req.body?.items;

    if (!jobPostingId) {
      throw Object.assign(new Error("jobPostingId is required"), { status: 400 });
    }
    if (!Array.isArray(items)) {
      throw Object.assign(new Error("items must be an array of criteria"), { status: 400 });
    }

    const job = db.getJobPosting(jobPostingId);
    if (!job) {
      throw Object.assign(new Error("Job posting not found"), { status: 404 });
    }

    const existing = db.listScorecardCriteria({
      hiringManagerId: req.hiringManager.id,
      jobPostingId,
    })[0];

    let criteria;
    if (existing) {
      criteria = db.updateScorecardCriteria(existing.id, { items, jobPostingId });
    } else {
      criteria = db.addScorecardCriteria({
        hiringManagerId: req.hiringManager.id,
        jobPostingId,
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
