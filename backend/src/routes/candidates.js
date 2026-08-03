import { Router } from "express";
import { db } from "../store/db.js";
import { handleRouteError } from "./helpers.js";
import {
  assertCanAccessCandidate,
  assertCanManageJobs,
  canAccessJob,
} from "../auth/access.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    ok: true,
    candidates: db.listCandidatesVisibleTo({
      orgId: req.orgId,
      userId: req.userId,
      role: req.role,
    }),
  });
});

router.get("/:id", (req, res) => {
  try {
    const row = assertCanAccessCandidate(req.tenant, req.params.id);
    const visibleJobIds = new Set(
      db
        .listJobsVisibleTo({
          orgId: req.orgId,
          userId: req.userId,
          role: req.role,
        })
        .map((j) => j.id),
    );
    const applications = db
      .listApplications({ candidateId: row.id })
      .filter((a) => visibleJobIds.has(a.jobPostingId));
    const interviews = db.listInterviewsVisibleTo(
      { orgId: req.orgId, userId: req.userId, role: req.role },
      { candidateId: row.id },
    );
    return res.json({ ok: true, candidate: row, applications, interviews });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

router.post("/", (req, res) => {
  try {
    assertCanManageJobs(req.tenant);
    const candidate = db.addCandidate({
      ...(req.body || {}),
      orgId: req.orgId,
    });
    return res.status(201).json({ ok: true, candidate });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
