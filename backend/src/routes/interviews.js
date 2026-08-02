import { Router } from "express";
import { db } from "../store/db.js";
import { handleRouteError } from "./helpers.js";
import { generateScorecardFromTranscript } from "../services/scorecardAi.js";
import { config } from "../config.js";

const router = Router();

router.get("/", (req, res) => {
  const interviews = db.listInterviews({
    candidateId: req.query.candidateId,
    jobPostingId: req.query.jobPostingId,
    applicationId: req.query.applicationId,
  });

  const items = interviews.map((interview) => ({
    interview,
    candidate: db.getCandidate(interview.candidateId),
    jobPosting: db.getJobPosting(interview.jobPostingId),
  }));

  res.json({ ok: true, interviews: items });
});

router.get("/:id", (req, res) => {
  const detail = db.getInterviewDetail(req.params.id);
  if (!detail) return res.status(404).json({ ok: false, message: "Interview not found" });

  const scorecard = req.hiringManager
    ? db.getScorecardResult(req.params.id, req.hiringManager.id)
    : null;

  return res.json({ ok: true, ...detail, scorecard });
});

/**
 * POST /api/interviews/:id/generate-scorecard
 * Uses the logged-in HM's criteria + interview transcript.
 */
router.post("/:id/generate-scorecard", async (req, res) => {
  try {
    if (!req.hiringManager?.id) {
      throw Object.assign(new Error("You must be signed in"), { status: 401 });
    }

    const detail = db.getInterviewDetail(req.params.id);
    if (!detail) {
      throw Object.assign(new Error("Interview not found"), { status: 404 });
    }

    const transcript = detail.transcript;
    if (!transcript || transcript.status !== "done" || !transcript.lines?.length) {
      throw Object.assign(
        new Error("Transcript is not ready for this interview yet"),
        { status: 400 },
      );
    }

    const criteria = db.getOrCreateCriteriaForJob(
      req.hiringManager.id,
      detail.interview.jobPostingId,
    );

    const draft = await generateScorecardFromTranscript({
      criteriaItems: criteria.items,
      transcriptLines: transcript.lines,
      jobTitle: detail.jobPosting?.title,
      interviewType: detail.interview.type,
      candidateName: detail.candidate?.name,
    });

    const scorecard = db.upsertScorecardResult({
      interviewId: detail.interview.id,
      hiringManagerId: req.hiringManager.id,
      ...draft,
      source: "ai",
    });

    return res.json({
      ok: true,
      scorecard,
      criteria,
      usedOpenAI: Boolean(config.openai.apiKey),
    });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

/**
 * PUT /api/interviews/:id/scorecard
 * Persist HM edits to the scorecard.
 */
router.put("/:id/scorecard", (req, res) => {
  try {
    if (!req.hiringManager?.id) {
      throw Object.assign(new Error("You must be signed in"), { status: 401 });
    }

    const interview = db.getInterview(req.params.id);
    if (!interview) {
      throw Object.assign(new Error("Interview not found"), { status: 404 });
    }

    const body = req.body || {};
    const scorecard = db.upsertScorecardResult({
      interviewId: interview.id,
      hiringManagerId: req.hiringManager.id,
      recommendation: body.recommendation || "",
      score: body.score ?? null,
      criteriaScores: body.criteriaScores || [],
      strengths: body.strengths || "",
      concerns: body.concerns || "",
      notes: body.notes || "",
      source: "manual",
    });

    return res.json({ ok: true, scorecard });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

router.post("/", (req, res) => {
  try {
    const body = req.body || {};
    const interview = db.addInterview(body);

    if (body.hiringManagerId) {
      db.addInterviewPanelist({
        interviewId: interview.id,
        hiringManagerId: body.hiringManagerId,
        role: body.panelistRole || "interviewer",
      });
    }

    if (body.calendar) {
      db.addCalendarEvent({
        interviewId: interview.id,
        provider: body.calendar.provider || "manual",
        title: body.calendar.title,
        startsAt: body.calendar.startsAt || body.scheduledAt,
        endsAt: body.calendar.endsAt,
        meetingUrl: body.calendar.meetingUrl || body.meetingUrl,
        attendeeEmails: body.calendar.attendeeEmails || [],
      });
    }

    return res.status(201).json({ ok: true, ...db.getInterviewDetail(interview.id) });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

router.post("/:id/panelists", (req, res) => {
  try {
    const panelist = db.addInterviewPanelist({
      interviewId: req.params.id,
      hiringManagerId: req.body?.hiringManagerId,
      role: req.body?.role,
    });
    return res.status(201).json({
      ok: true,
      panelist: {
        ...panelist,
        hiringManager: db.getHiringManager(panelist.hiringManagerId),
      },
    });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
