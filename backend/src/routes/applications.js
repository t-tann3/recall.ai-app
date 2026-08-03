import { Router } from "express";
import { db } from "../store/db.js";
import { handleRouteError } from "./helpers.js";
import { assertCanAccessJob, assertCanManageJobs } from "../auth/access.js";

const router = Router();

router.get("/", (req, res) => {
  const applications = db.listApplicationsVisibleTo(
    { orgId: req.orgId, userId: req.userId, role: req.role },
    {
      candidateId: req.query.candidateId,
      jobPostingId: req.query.jobPostingId,
    },
  );
  res.json({ ok: true, applications });
});

router.get("/:id", (req, res) => {
  const row = db.getApplication(req.params.id);
  if (!row || row.orgId !== req.orgId) {
    return res.status(404).json({ ok: false, message: "Application not found" });
  }

  try {
    assertCanAccessJob(req.tenant, row.jobPostingId);
  } catch {
    return res.status(404).json({ ok: false, message: "Application not found" });
  }

  return res.json({
    ok: true,
    application: row,
    candidate: db.getCandidate(row.candidateId),
    jobPosting: db.getJobPosting(row.jobPostingId),
    interviews: db.listInterviews({ applicationId: row.id }),
  });
});

router.post("/", (req, res) => {
  try {
    assertCanManageJobs(req.tenant);
    const body = req.body || {};
    assertCanAccessJob(req.tenant, body.jobPostingId);
    const application = db.addApplication({
      ...body,
      orgId: req.orgId,
    });
    return res.status(201).json({ ok: true, application });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
