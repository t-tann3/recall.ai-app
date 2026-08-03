import { Router } from "express";
import { db } from "../store/db.js";
import { toPublicHiringManager } from "../models/hiringManager.js";
import { handleRouteError } from "./helpers.js";
import {
  assertCanAccessJob,
  assertCanManageJobs,
  canAccessJob,
} from "../auth/access.js";

const router = Router();

router.get("/", (req, res) => {
  const jobPostings = db.listJobsVisibleTo({
    orgId: req.orgId,
    userId: req.userId,
    role: req.role,
  });
  res.json({ ok: true, jobPostings });
});

router.get("/:id", (req, res) => {
  try {
    const row = assertCanAccessJob(req.tenant, req.params.id);
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
  } catch (err) {
    return handleRouteError(res, err);
  }
});

router.post("/", (req, res) => {
  try {
    assertCanManageJobs(req.tenant);

    const body = {
      ...(req.body || {}),
      hiringManagerId: req.userId,
      orgId: req.orgId,
    };

    const jobPosting = db.addJobPosting(body);
    db.getOrCreateCriteriaForJob(req.userId, jobPosting.id);
    return res.status(201).json({ ok: true, jobPosting });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
