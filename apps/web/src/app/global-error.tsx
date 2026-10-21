"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger/client";

// Last safety net: used only when the root layout itself crashes. It must draw
// its own <html> and <body>, and cannot use the site's styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.exception(error, { source: "next-global-error", component: "RootLayout" });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, textAlign: "center" }}>
        <div>
          <h1>Something went wrong</h1>
          <p>The problem was recorded. Please try again.</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
