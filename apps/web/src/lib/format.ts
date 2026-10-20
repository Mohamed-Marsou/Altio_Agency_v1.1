// Small formatting helpers shared by pages.

// "2026-03-12" -> "Mar 12, 2026". UTC on purpose: the date is the same for
// every visitor, whatever their time zone, and the static build matches the browser.
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
