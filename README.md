# Shop Talk

Meeting conversations, captured and turned into a workspace.

| Path | Role |
|------|------|
| [`frontend/`](frontend/) | Next.js — Shop Talk UI (Vercel) |
| [`backend/`](backend/) | Node.js API (DigitalOcean) — Recall + app logic |

## Product

Paste a meeting URL → capture the call → open a **Shop Talk** meeting with tabs:

Summary · Transcript · Insights · Action Items · Questions · Developer View · Settings

## Run locally

```bash
cd frontend && npm install && npm run dev
cd backend && npm install && cp .env.example .env && npm run dev
```

- Web: http://localhost:3000  
- API health: http://localhost:3001/health  
