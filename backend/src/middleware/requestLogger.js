/**
 * Log every inbound HTTP request when it finishes.
 * Example: 2026-08-01T15:40:00.000Z GET /api/job-postings 200 12ms
 */
export function requestLogger(req, res, next) {
  const started = Date.now();
  const { method } = req;
  const path = req.originalUrl || req.url;

  res.on("finish", () => {
    const ms = Date.now() - started;
    const stamp = new Date().toISOString();
    console.log(`${stamp} ${method} ${path} ${res.statusCode} ${ms}ms`);
  });

  next();
}
