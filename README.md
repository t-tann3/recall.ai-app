# AI Meeting Workspace

| Path | Role |
|------|------|
| [`frontend/`](frontend/) | Next.js — AI Meeting Workspace UI (Vercel) |
| [`backend/`](backend/) | Node.js API skeleton (DigitalOcean) |

## Product

Paste a meeting URL → Recall bot joins → after the call, open a **Meeting Workspace** with tabs:

Summary · Transcript · Insights · Action Items · Questions · Developer View · Settings

## Run locally

```bash
cd frontend && npm install && npm run dev
cd backend && npm install && cp .env.example .env && npm run dev
```

- Web: http://localhost:3000  
- API health: http://localhost:3001/health  

A demo workspace (**Product Kickoff**) is seeded in the UI so you can explore every tab before the API is wired.
