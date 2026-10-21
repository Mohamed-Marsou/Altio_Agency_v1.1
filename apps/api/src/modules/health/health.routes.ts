import { Router } from "express";

// GET /v1/health : used by the uptime monitor and by Docker/the host to know the
// API is alive. It deliberately does not touch the database yet; a deeper
// "ready" check can be added when the DB is connected.
export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "altio-api",
    uptimeSeconds: Math.round(process.uptime()),
    time: new Date().toISOString(),
  });
});
