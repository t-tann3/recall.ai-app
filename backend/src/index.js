import cors from "cors";
import express from "express";
import { config, endpoints } from "./config.js";
import routes from "./routes/index.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(routes);

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
  console.log(`Public base URL: ${config.baseUrl}`);
  console.log(`Recall webhook URL: ${endpoints.webhooks.recall}`);
  if (config.recall.region) {
    console.log(`Recall region: ${config.recall.region}`);
  }
});
