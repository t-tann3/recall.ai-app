import cors from "cors";
import express from "express";
import { config, endpoints } from "./config.js";
import healthRouter from "./routes/health.js";
import botsRouter from "./routes/bots.js";
import workspacesRouter from "./routes/workspaces.js";
import webhooksRouter from "./routes/webhooks.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));

// Webhooks need the raw body for Svix verification — mount before express.json()
app.use("/api/webhooks", webhooksRouter);

app.use(express.json());
app.use("/health", healthRouter);
app.use("/api/bots", botsRouter);
app.use("/api/workspaces", workspacesRouter);

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
  console.log(`Public base URL: ${config.baseUrl}`);
  console.log(`Recall webhook URL: ${endpoints.webhooks.recall}`);
  if (config.recall.region) {
    console.log(`Recall region: ${config.recall.region}`);
  }
});
