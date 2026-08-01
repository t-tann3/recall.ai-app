import { Router } from "express";
import { db } from "../store/db.js";
import { handleRouteError } from "./helpers.js";

const router = Router();

router.get("/", (req, res) => {
  const applications = db.listApplications({
    candidateId: req.query.candidateId,
    jobPostingId: req.query.jobPostingId,
  });
  res.json({ ok: true, applications });
});

router.get("/:id", (req, res) => {
  const row = db.getApplication(req.params.id);
  if (!row) return res.status(404).json({ ok: false, message: "Application not found" });

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
    const application = db.addApplication(req.body || {});
    return res.status(201).json({ ok: true, application });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
