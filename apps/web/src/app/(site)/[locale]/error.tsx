"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger/client";

// Next.js shows this when a page crashes while rendering (anywhere under /app).
// It also writes the crash to the error log.
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.exception(error, { source: "next-route-error" });
  }, [error]);

  return (
    <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <h1>Something went wrong</h1>
        <p>The problem was recorded. Please try again.</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
