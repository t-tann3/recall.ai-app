# Backend scaffold

```
src/
  config.js              # BASE_URL + endpoints + Recall env
  index.js               # Express app entry
  models/                # Shape templates (no DB yet)
    workspace.js
    bot.js
    recording.js
    transcript.js
    workspaceContent.js  # insights, action items, questions
    developerEvent.js
  routes/
    health.js
    bots.js
    workspaces.js
    webhooks.js
```

All mutating/read routes under `/api/*` return `501 not_implemented` until you fill them in.

## Endpoints (stubs)

| Method | Path | Feature key |
|--------|------|-------------|
| GET | `/health` | live |
| POST | `/api/bots` | `bots.create` |
| GET | `/api/bots/:id` | `bots.get` |
| GET/POST | `/api/workspaces` | list / create |
| GET/PATCH/DELETE | `/api/workspaces/:id` | get / update / delete |
| GET | `/api/workspaces/:id/summary` | tab |
| GET | `/api/workspaces/:id/transcript` | tab |
| GET | `/api/workspaces/:id/insights` | tab |
| GET | `/api/workspaces/:id/action-items` | tab |
| GET | `/api/workspaces/:id/questions` | tab |
| GET | `/api/workspaces/:id/developer` | tab |
| POST | `/api/webhooks/recall` | Svix-verified (see below) |

## Webhooks (local)

Per [Testing Webhooks Locally](https://docs.recall.ai/docs/testing-webhooks-locally):

1. Keep ngrok + backend running
2. In Recall dashboard → Add Endpoint:
   `https://blazer-bulgur-booting.ngrok-free.dev/api/webhooks/recall`
3. Copy the endpoint **signing secret** into `.env` as `RECALL_SVIX_WEBHOOK_SECRET`
4. Until then, the docs sample secret is used as a fallback (real deliveries will fail verification until you set yours)

Handler: `src/routes/webhooks.js` — verifies with `svix`, logs the event, returns `{}`.
