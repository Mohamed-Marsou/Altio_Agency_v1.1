import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { requestId } from "./middleware/requestId.js";
import { healthRouter } from "./modules/health/health.routes.js";

// Builds the Express app. It is a function (not a started server) so tests can
// create the app and call it without opening a port.
export function createApp() {
  const app = express();

  // Behind a proxy (Caddy, Railway...) the real client address is in the
  // X-Forwarded-For header. Needed later for rate limiting.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(requestId);
  app.use(helmet());
  app.use(
    cors({
      // Only our own front-ends may call the API from a browser.
      origin: [env.WEB_ORIGIN, env.ADMIN_ORIGIN],
      credentials: true, // the admin sends its login cookie
    }),
  );
  app.use(express.json({ limit: "100kb" })); // small on purpose: forms, not uploads

  // Version 1 of the API. New modules (auth, leads, projects...) are mounted here.
  app.use("/v1/health", healthRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
