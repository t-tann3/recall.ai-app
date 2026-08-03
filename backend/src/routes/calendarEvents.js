import { Router } from "express";
import { db } from "../store/db.js";
import { handleRouteError } from "./helpers.js";
import { assertCanAccessInterview, assertCanManageJobs } from "../auth/access.js";

const router = Router();

router.get("/", (req, res) => {
  let calendarEvents = db.listCalendarEvents({
    interviewId: req.query.interviewId,
  });

  calendarEvents = calendarEvents.filter((event) => {
    const interview = db.getInterview(event.interviewId);
    return interview && interview.orgId === req.orgId;
  });

  res.json({ ok: true, calendarEvents });
});

router.get("/:id", (req, res) => {
  const row = db.getCalendarEvent(req.params.id);
  if (!row) return res.status(404).json({ ok: false, message: "Calendar event not found" });

  const interview = db.getInterview(row.interviewId);
  if (!interview || interview.orgId !== req.orgId) {
    return res.status(404).json({ ok: false, message: "Calendar event not found" });
  }

  return res.json({
    ok: true,
    calendarEvent: row,
    interview,
  });
});

router.post("/", (req, res) => {
  try {
    assertCanManageJobs(req.tenant);
    const body = req.body || {};
    assertCanAccessInterview(req.tenant, body.interviewId);
    const calendarEvent = db.addCalendarEvent(body);
    return res.status(201).json({
      ok: true,
      calendarEvent,
      interview: db.getInterview(calendarEvent.interviewId),
    });
  } catch (err) {
    return handleRouteError(res, err);
  }
});

export default router;
