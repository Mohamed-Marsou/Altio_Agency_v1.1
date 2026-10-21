// =============================================================================
// SPAM CONTROL WITHOUT A SERVER
// -----------------------------------------------------------------------------
// Three cheap checks that stop most bots and accidents:
//   1. HONEYPOT: a hidden field no human sees. Bots fill every field, so a filled
//      honeypot means "bot": the form silently does nothing.
//   2. FILL TIME: a real person needs more than 3 seconds to fill a form.
//   3. RATE GUARD: at most 3 sends per 10 minutes from this browser.
// These do not replace server checks (the backend adds its own later); they just
// keep the obvious junk out while the site has no server.
// =============================================================================

export const HONEYPOT_FIELD = "company_site";
export const MIN_FILL_MS = 3000;
export const MAX_SENDS = 3;
export const WINDOW_MS = 10 * 60 * 1000;
const STORAGE_KEY = "altio-form-log";

export type SpamVerdict = "ok" | "honeypot" | "too-fast" | "rate-limited";

export function checkSpam(input: { honeypot: string; startedAt: number; now: number; recent: number[] }): SpamVerdict {
  if (input.honeypot.trim() !== "") return "honeypot";
  if (input.now - input.startedAt < MIN_FILL_MS) return "too-fast";
  const inWindow = input.recent.filter((time) => input.now - time < WINDOW_MS);
  if (inWindow.length >= MAX_SENDS) return "rate-limited";
  return "ok";
}

/** Times (ms) of the sends made recently from this browser. Never throws. */
export function readRecent(storage: Pick<Storage, "getItem"> | null, now: number): number[] {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((n): n is number => typeof n === "number" && now - n < WINDOW_MS) : [];
  } catch {
    return [];
  }
}

export function recordSend(storage: Pick<Storage, "getItem" | "setItem"> | null, now: number): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify([...readRecent(storage, now), now]));
  } catch {
    // storage blocked: the guard simply does not remember
  }
}

/** The browser session storage, or null when it is blocked. */
export function getSessionStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}
