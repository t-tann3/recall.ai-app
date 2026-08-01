import { Router } from "express";
import { db } from "../store/db.js";
import { handleRouteError } from "./helpers.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, candidates: db.listCandidates() });
});

router.get("/:id", (req, res) => {
  const row = db.getCandidate(req.params.id);
  if (!row) return res.status(404).json({ ok: false, message: "Candidate not found" });

  const applications = db.listApplications({ candidateId: row.id });
  const interviews = db.listInterviews({ candidateId: row.id });
  return res.json({ ok: true, candidate: row, applications, interviews });
});

router.post("/", (req, res) => {
  try {
    const candidate = db.addCandidate(req.body || {});
    return res.status(201).json({ ok: true, candidate });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
