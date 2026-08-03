# Shop Talk API

Express backend for the hiring + Recall capture loop. See the [root README](../README.md) for product context, env vars, and the happy path.

```bash
npm install
cp .env.example .env
npm run dev     # http://localhost:3001
npm test
```

Key modules:

| Path | Role |
|------|------|
| `src/store/db.js` | Domain store + FK checks |
| `src/store/persist.js` | SQLite snapshots |
| `src/services/recallBots.js` | Create bot / normalize transcripts |
| `src/services/recallWebhooks.js` | `bot.*` / recording / transcript handlers |
| `src/services/calendarOauth.js` | Google OAuth → Recall Calendar V2 |
| `src/services/scorecardAi.js` | LLM or heuristic scorecards |
