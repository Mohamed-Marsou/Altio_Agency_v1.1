// Next.js runs this file once when the server starts.
//  - register(): in `npm run dev` only, starts the error-log file writer.
//  - onRequestError(): errors thrown on the SERVER (while rendering a page) are
//    written to the same txt file, so one file has everything.
// None of this exists in the static export that goes to Hostinger.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "development") {
    const { startLogServer } = await import("@/lib/logger/server");
    startLogServer();
  }
}

export async function onRequestError(
  err: unknown,
  request: { path: string },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "development") return;

  const { writeLog } = await import("@/lib/logger/server");
  const error = err instanceof Error ? err : new Error(String(err));
  writeLog({
    level: "ERROR",
    source: `server-render (${context.routeType})`,
    component: context.routePath,
    page: request.path,
    message: error.message,
    stack: error.stack,
  });
}
