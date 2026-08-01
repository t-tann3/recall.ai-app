# Backend — Shop Talk

## Core HR models

```
HiringManager
    └── owns → JobPosting
Candidate
    └── Application → JobPosting
Interview
    ├── candidateId → Candidate
    ├── jobPostingId → JobPosting
    ├── applicationId → Application (optional)
    ├── calendarEventId ↔ CalendarEvent
    ├── panelists → InterviewPanelist → HiringManager
    └── botId / recordingId / transcriptId → Recall (later)
```

In-memory store: `src/store/db.js` (enforces FKs). Seeded on boot.

## Core API

| Method | Path |
|--------|------|
| GET/POST | `/api/hiring-managers` |
| GET/POST | `/api/candidates` |
| GET/POST | `/api/job-postings` |
| GET/POST | `/api/applications` |
| GET/POST | `/api/interviews` |
| POST | `/api/interviews/:id/panelists` |
| GET/POST | `/api/calendar-events` |

`GET /api/interviews/:id` returns interview + candidate + job + application + calendar + panelists.

## Recall / legacy stubs

- `POST /api/webhooks/recall` — Svix verify
- `/api/bots`, `/api/workspaces/*` — still 501 stubs
