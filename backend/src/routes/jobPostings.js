import { Router } from "express";
import { db } from "../store/db.js";
import { toPublicHiringManager } from "../models/hiringManager.js";
import { handleRouteError } from "./helpers.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, jobPostings: db.listJobPostings() });
});

router.get("/:id", (req, res) => {
  const row = db.getJobPosting(req.params.id);
  if (!row) return res.status(404).json({ ok: false, message: "Job posting not found" });

  const hiringManager = toPublicHiringManager(db.getHiringManager(row.hiringManagerId));
  const applications = db.listApplications({ jobPostingId: row.id }).map((application) => ({
    application,
    candidate: db.getCandidate(application.candidateId),
  }));
  const interviews = db.listInterviews({ jobPostingId: row.id }).map((interview) => ({
    interview,
    candidate: db.getCandidate(interview.candidateId),
    jobPosting: row,
  }));
  return res.json({
    ok: true,
    jobPosting: row,
    hiringManager,
    applications,
    interviews,
  });
});

router.post("/", (req, res) => {
  try {
    // Always own the posting as the authenticated hiring manager.
    if (!req.hiringManager?.id) {
      throw Object.assign(new Error("You must be signed in to create a job posting"), {
        status: 401,
      });
    }

    const body = {
      ...(req.body || {}),
      hiringManagerId: req.hiringManager.id,
    };

    const jobPosting = db.addJobPosting(body);
    db.getOrCreateCriteriaForJob(req.hiringManager.id, jobPosting.id);
    return res.status(201).json({ ok: true, jobPosting });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
