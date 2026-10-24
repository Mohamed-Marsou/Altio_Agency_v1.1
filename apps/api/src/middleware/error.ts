import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { isProduction } from "../config/env.js";

// An error WE throw on purpose, with the HTTP status and a stable code that the
// front-end can react to:  throw new AppError(404, "NOT_FOUND", "Lead not found")
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

// Any address that no route handled.
export const notFound: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, "NOT_FOUND", "This endpoint does not exist."));
};

// The ONE place where errors become HTTP responses. Every error leaves the API in
// the same shape:  { error: { code, message, fields? } }
// Unexpected errors never leak details in production.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
    return;
  }

  if (err instanceof ZodError) {
    const fields = Object.fromEntries(err.issues.map((issue: { path: PropertyKey[]; message: string }) => [issue.path.join("."), issue.message]));
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Some fields are invalid.", fields } });
    return;
  }

  // Body too large or malformed JSON (thrown by express.json()).
  const status = typeof err?.status === "number" && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status < 500) {
    res.status(status).json({ error: { code: "BAD_REQUEST", message: "The request could not be read." } });
    return;
  }

  console.error({ requestId: res.locals.requestId, err });
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: isProduction ? "Something went wrong on our side." : String(err?.message ?? err),
    },
  });
};
