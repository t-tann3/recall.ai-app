# Shop Talk

Interview insights for hiring teams — capture calls with [Recall.ai](https://www.recall.ai/) bots, then review recordings, transcripts, and AI scorecards against per-job rubrics.

| Path | Role |
|------|------|
| [`frontend/`](frontend/) | Next.js UI |
| [`backend/`](backend/) | Express API — auth, hiring domain, Recall bots/webhooks/calendar, scorecards |

## Architecture

```text
Hiring manager
  → Job posting (owns scorecard criteria)
  → Candidate + application
  → Interview (meeting URL)
  → POST /api/bots  → Recall bot joins call
  → Svix webhooks   → recording + transcript stored (SQLite)
  → Generate scorecard from transcript + job rubric
```

**Persistence:** domain state is held in memory for fast access and snapshotted to SQLite (`backend/data/shoptalk.sqlite`) so restarts keep jobs, bots, and transcripts.

**Authz:** every business row is stamped with `orgId`. JWT carries `orgId` + `role` (`admin` | `recruiter` | `hiring_manager` | `interviewer`). List/detail APIs only return data visible in the active organization (org-wide roles see all; hiring managers see owned jobs; interviewers see panelist assignments).

## Happy path (demo)

1. Start backend + frontend (below).
2. Sign in as admin: `alex@shoptalk.example` / `password123`  
   Or interviewer (narrower view): `sam@shoptalk.example` / `password123`
3. Open a job → edit **Scorecard criteria**
4. Open a candidate interview → **Send recording bot** (needs Recall env)
5. After the call, webhooks fill recording/transcript → **Generate scorecard**

Signup creates a **new organization** automatically — that tenant cannot see Shop Talk demo data.
## Run locally

```bash
# API
cd backend && npm install && cp .env.example .env
# fill RECALL_* / PUBLIC_API_BASE_URL / JWT_SECRET as needed
npm run dev

# UI (separate terminal)
cd frontend && npm install && npm run dev
```

- Web: http://localhost:3000  
- API health: http://localhost:3001/health  
- Webhook URL: `{PUBLIC_API_BASE_URL}/api/webhooks/recall`

### Tests

```bash
cd backend && npm test
```

Covers transcript normalization, bot status mapping, and `recording.done` / `transcript.done` handling.

## Recall dashboard setup

Subscribe the webhook endpoint to at least:

- `bot.*`
- `recording.done` / `recording.failed`
- `transcript.done` / `transcript.failed`

Use your real `RECALL_SVIX_WEBHOOK_SECRET` (required in production; verification fails closed when unset).

## Env checklist

See [`backend/.env.example`](backend/.env.example). Notable vars:

| Var | Purpose |
|-----|---------|
| `JWT_SECRET` | Auth signing (required in production) |
| `PUBLIC_API_BASE_URL` | Public API origin (ngrok locally) |
| `RECALL_REGION` / `RECALL_API_KEY` | Bot + Calendar APIs |
| `RECALL_SVIX_WEBHOOK_SECRET` | Svix verification |
| `GOOGLE_OAUTH_*` | Calendar connect |
| `OPENAI_API_KEY` | LLM scorecards (heuristic fallback if missing) |
| `DATABASE_PATH` | Optional SQLite path |

## Known limitations

- SQLite snapshot (not a full relational schema) — enough for durable demos, not multi-instance HA.
- Calendar OAuth creates a Recall calendar; auto-scheduling bots from every event is not wired yet.
- JWT is stored in `localStorage` (fine for this demo; prefer httpOnly cookies for production).
