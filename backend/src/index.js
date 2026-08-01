import cors from "cors";
import express from "express";
import { config, endpoints } from "./config.js";
import { seedDemoData } from "./store/db.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import botsRouter from "./routes/bots.js";
import workspacesRouter from "./routes/workspaces.js";
import webhooksRouter from "./routes/webhooks.js";
import hiringManagersRouter from "./routes/hiringManagers.js";
import candidatesRouter from "./routes/candidates.js";
import jobPostingsRouter from "./routes/jobPostings.js";
import applicationsRouter from "./routes/applications.js";
import interviewsRouter from "./routes/interviews.js";
import calendarEventsRouter from "./routes/calendarEvents.js";
import { requireAuth } from "./middleware/requireAuth.js";

seedDemoData();

const app = express();

app.use(cors({ origin: config.corsOrigin }));

// Webhooks need the raw body for Svix verification — mount before express.json()
app.use("/api/webhooks", webhooksRouter);

app.use(express.json());
app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/bots", botsRouter);
app.use("/api/workspaces", workspacesRouter);
app.use("/api/hiring-managers", hiringManagersRouter);
app.use("/api/candidates", requireAuth, candidatesRouter);
app.use("/api/job-postings", requireAuth, jobPostingsRouter);
app.use("/api/applications", requireAuth, applicationsRouter);
app.use("/api/interviews", requireAuth, interviewsRouter);
app.use("/api/calendar-events", requireAuth, calendarEventsRouter);

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
  console.log(`Public base URL: ${config.baseUrl}`);
  console.log(`Recall webhook URL: ${endpoints.webhooks.recall}`);
  if (config.recall.region) {
    console.log(`Recall region: ${config.recall.region}`);
  }
});
