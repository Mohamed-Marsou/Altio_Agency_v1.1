"use client";

import { useEffect } from "react";
import { installGlobalHandlers } from "@/lib/logger/client";

// Renders nothing. Its only job is to switch on the global error catchers once
// the page has loaded (window errors and unhandled promise rejections).
export default function ErrorReporter() {
  useEffect(() => {
    installGlobalHandlers();
  }, []);
  return null;
}
