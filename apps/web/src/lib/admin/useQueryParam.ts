"use client";

import { useEffect, useState } from "react";

/**
 * Reads one value of the address, e.g. ?slug=my-post  ->  "my-post".
 *   undefined = the browser has not read the address yet
 *   null      = the address has no such value
 * It reads window.location after the page loaded (no Suspense needed in the static
 * export). The value is fixed for the life of the page: after a save we keep our own copy.
 */
export function useQueryParam(name: string): string | null | undefined {
  const [value, setValue] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const id = setTimeout(() => setValue(new URLSearchParams(window.location.search).get(name)), 0);
    return () => clearTimeout(id);
  }, [name]);
  return value;
}
