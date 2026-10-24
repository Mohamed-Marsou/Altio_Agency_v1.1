"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Download, FlaskConical, RefreshCw } from "lucide-react";
import type { LogEntry, LogLevel } from "@/lib/logger/format";
import { authHeaders, signalLoggedOut } from "@/lib/admin/auth-client";
import { getLogBase, logger } from "@/lib/logger/client";
import styles from "./AuditView.module.scss";

type LevelFilter = "ALL" | LogLevel;
type LoadState = "loading" | "ready" | "offline";

// Text of one entry, for the "copy" button (handy to paste in a bug report).
function entryText(e: LogEntry): string {
  return [
    `#${e.id} ${e.level} ${e.time}`,
    `Component: ${e.component}`,
    `Source: ${e.source}`,
    `Page: ${e.page}`,
    `Message: ${e.message}`,
    e.file ? `File: ${e.file}` : "",
    e.client ? `Client: ${e.client}` : "",
    e.stack ? `Stack:\n${e.stack}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function AuditView() {
  const base = getLogBase(); // null when logging is off (production static site)
  const [state, setState] = useState<LoadState>(base ? "loading" : "offline");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [file, setFile] = useState("");
  const [level, setLevel] = useState<LevelFilter>("ALL");
  const [source, setSource] = useState("ALL");
  const [query, setQuery] = useState("");
  const [auto, setAuto] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!base) return;
    try {
      const res = await fetch(`${base}/logs`, { cache: "no-store", headers: authHeaders() });
      if (res.status === 401) return signalLoggedOut();
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { file: string; entries: LogEntry[] };
      setEntries(json.entries);
      setFile(json.file);
      setState("ready");
    } catch {
      setState("offline");
    }
  }, [base]);

  // First load, and optional refresh every 5 seconds.
  useEffect(() => {
    // started on the next tick (load() sets state; React asks not to do that inside the effect body)
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [auto, load]);

  const sources = useMemo(() => ["ALL", ...Array.from(new Set(entries.map((e) => e.source))).sort()], [entries]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (level === "ALL" || e.level === level) &&
        (source === "ALL" || e.source === source) &&
        (!q || `${e.message} ${e.component} ${e.page} ${e.file ?? ""}`.toLowerCase().includes(q)),
    );
  }, [entries, level, source, query]);

  const errorCount = entries.filter((e) => e.level === "ERROR").length;
  const warnCount = entries.length - errorCount;
  const last = entries[0];

  // The txt file is private (same login as the rest), so it is fetched with the session
  // and shown from memory: a plain link could not carry the login.
  const openTxt = async () => {
    if (!base) return;
    try {
      const res = await fetch(`${base}/logs.txt`, { headers: authHeaders(), cache: "no-store" });
      if (res.status === 401) return signalLoggedOut();
      const blob = new Blob([await res.text()], { type: "text/plain;charset=utf-8" });
      window.open(URL.createObjectURL(blob), "_blank", "noopener");
    } catch {
      setState("offline");
    }
  };

  const sendTest = () => {
    logger.error("Test error sent from the Audit log page", { component: "AuditView", source: "manual-test" });
    setTimeout(() => void load(), 700);
  };

  const copy = async (e: LogEntry) => {
    try {
      await navigator.clipboard.writeText(entryText(e));
      setCopied(e.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard blocked: nothing to do
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Audit log</h1>
          <p className={styles.sub}>Every error from the website and the dashboard, with date, component and page.</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={() => void load()} disabled={!base}>
            <RefreshCw size={16} aria-hidden="true" /> Refresh
          </button>
          <button type="button" className={styles.btn} onClick={sendTest} disabled={!base}>
            <FlaskConical size={16} aria-hidden="true" /> Send test error
          </button>
          {base && (
            <button type="button" className={styles.btn} onClick={() => void openTxt()}>
              <Download size={16} aria-hidden="true" /> Open .txt
            </button>
          )}
        </div>
      </div>

      {state === "offline" && (
        <div className={styles.notice} role="status">
          <strong>The error logger is not connected.</strong>
          <p>
            {base
              ? "Start the site with npm run dev (it starts the logger on port 4001), then press Refresh."
              : "File logging only runs while developing (npm run dev). On the live static site errors are not stored yet; they will be sent to the backend once it exists."}
          </p>
        </div>
      )}

      {state === "ready" && (
        <>
          <section className={styles.stats} aria-label="Summary">
            <div className={styles.stat}><span>{entries.length}</span><small>Total</small></div>
            <div className={`${styles.stat} ${styles.statError}`}><span>{errorCount}</span><small>Errors</small></div>
            <div className={`${styles.stat} ${styles.statWarn}`}><span>{warnCount}</span><small>Warnings</small></div>
            <div className={styles.stat}><span className={styles.lastTime}>{last ? last.time.slice(0, 16) : "None"}</span><small>Latest</small></div>
          </section>
          <p className={styles.file}>
            Saved in <code>{file}</code>
          </p>

          <div className={styles.filters}>
            <div className={styles.chips} role="group" aria-label="Level">
              {(["ALL", "ERROR", "WARN"] as LevelFilter[]).map((l) => (
                <button key={l} type="button" className={`${styles.chip} ${level === l ? styles.chipOn : ""}`} aria-pressed={level === l} onClick={() => setLevel(l)}>
                  {l === "ALL" ? "All" : l === "ERROR" ? "Errors" : "Warnings"}
                </button>
              ))}
            </div>
            <label className={styles.field}>
              <span className={styles.srOnly}>Source</span>
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                {sources.map((s) => (
                  <option key={s} value={s}>{s === "ALL" ? "All sources" : s}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.srOnly}>Search</span>
              <input type="search" placeholder="Search message, component, page" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label className={styles.auto}>
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto refresh
            </label>
          </div>

          {shown.length === 0 ? (
            <p className={styles.empty}>{entries.length === 0 ? "No errors recorded yet. That is good news." : "No entry matches these filters."}</p>
          ) : (
            <ul className={styles.list}>
              {shown.map((e) => (
                <li key={e.id} className={`${styles.entry} ${e.level === "ERROR" ? styles.isError : styles.isWarn}`}>
                  <div className={styles.entryHead}>
                    <span className={styles.level}>{e.level}</span>
                    <span className={styles.time}>#{String(e.id).padStart(4, "0")} · {e.time}</span>
                    <button type="button" className={styles.copy} onClick={() => void copy(e)} aria-label={`Copy entry ${e.id}`}>
                      <Copy size={14} aria-hidden="true" /> {copied === e.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className={styles.message}>{e.message}</p>
                  <dl className={styles.meta}>
                    <div><dt>Component</dt><dd>{e.component}</dd></div>
                    <div><dt>Page</dt><dd>{e.page}</dd></div>
                    <div><dt>Source</dt><dd>{e.source}</dd></div>
                  </dl>
                  {(e.stack || e.file || e.client) && (
                    <details className={styles.details}>
                      <summary>Details</summary>
                      {e.file && <p><b>File:</b> {e.file}</p>}
                      {e.client && <p><b>Client:</b> {e.client}</p>}
                      {e.stack && <pre>{e.stack}</pre>}
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {state === "loading" && <p className={styles.empty}>Loading…</p>}
    </div>
  );
}
