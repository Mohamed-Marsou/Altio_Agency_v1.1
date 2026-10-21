import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

// Gives every request a unique id. It is sent back in the `x-request-id` header
// and written in the error logs, so "what went wrong at 14:03?" can be traced
// to one request. A caller (for example the web app) may send its own id.
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.length <= 100 ? incoming : randomUUID();
  res.locals.requestId = id;
  res.setHeader("x-request-id", id);
  next();
};
