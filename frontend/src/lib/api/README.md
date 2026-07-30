# Frontend → Backend API

All HTTP calls go through Axios via `src/lib/api`.

```ts
import {
  api,
  endpoints,
  listWorkspaces,
  createWorkspace,
  getWorkspaceSummary,
} from "@/lib/api";

// Domain helpers (preferred in pages)
const { workspaces } = await listWorkspaces();

// Or raw Axios + path constants
await api.get(endpoints.health);
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` (default `http://localhost:3001`).
