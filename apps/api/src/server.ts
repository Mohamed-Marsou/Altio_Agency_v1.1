import { createApp } from "./app.js";
import { env } from "./config/env.js";

// Starts the HTTP server and shuts it down politely when the host asks it to
// stop (Docker/Railway send SIGTERM), so running requests can finish.
const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Altio API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, closing the server...`);
  server.close(() => process.exit(0));
  // If something keeps the server open, force the exit after 10 seconds.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
