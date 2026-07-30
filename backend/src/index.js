import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend" });
});

// Add API routes here (e.g. Recall bots, webhooks)

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
