import { Router } from "express";
import { db } from "../store/db.js";
import { handleRouteError } from "./helpers.js";

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
  return res.json({ ok: true, ...detail });
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
