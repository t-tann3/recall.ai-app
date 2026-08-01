import { Router } from "express";
import { db } from "../store/db.js";
import { handleRouteError } from "./helpers.js";

const router = Router();

router.get("/", (req, res) => {
  const calendarEvents = db.listCalendarEvents({
    interviewId: req.query.interviewId,
  });
  res.json({ ok: true, calendarEvents });
});

router.get("/:id", (req, res) => {
  const row = db.getCalendarEvent(req.params.id);
  if (!row) return res.status(404).json({ ok: false, message: "Calendar event not found" });

  return res.json({
    ok: true,
    calendarEvent: row,
    interview: db.getInterview(row.interviewId),
  });
});

router.post("/", (req, res) => {
  try {
    const calendarEvent = db.addCalendarEvent(req.body || {});
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
