"use client";

import clsx from "clsx";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./SiteLoader.module.scss";

// How long the loader stays AT LEAST (ms since the navigation started), so it is
// never an ugly one-frame flash on a fast connection, and the longest it may stay
// (a safety net: a slow or failed resource must never trap the visitor).
const MIN_TIME = 700;
const MAX_TIME = 5000;
// The finished animation keeps running a moment after "ready" so the logo can
// finish filling before the curtain opens.
const MIN_VISIBLE_AFTER_MOUNT = 450;
const CURTAIN_TIME = 800;

// The three things that must be true before the site is shown, and how much of
// the bar each one is worth (they add up to 100):
//   fonts   = the brand fonts are loaded (otherwise text would jump);
//   load    = the browser's "load" event: HTML, CSS, scripts and images are in;
//   painted = two animation frames passed after that, meaning the first full
//             view has really been drawn on screen.
const WEIGHTS = { fonts: 35, load: 40, painted: 25 };

// The loading screen. It covers the page until the page is REALLY ready (see the
// three stages above), shows the real progress, then opens like a curtain.
//
// How it stays safe:
//  - the inline script in <head> (lib/theme.ts) sets data-loader="on" on <html>
//    before the first paint and sets "done" after 8 s no matter what. Without
//    JavaScript the attribute is never set, so the loader never appears;
//  - the CSS shows the loader only while data-loader="on";
//  - while it is on, the page behind cannot scroll;
//  - reduced-motion visitors get the same logic with almost no animation.
// It runs on a full page load (first visit, refresh). Moving between pages with
// the site's own links does not reload anything, so it does not show again.
export default function SiteLoader() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const percentRef = useRef<HTMLSpanElement | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isGone, setIsGone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const html = document.documentElement;
    // If the loader was never switched on (no inline script), there is nothing to do.
    if (!root || html.getAttribute("data-loader") !== "on") {
      setIsGone(true);
      return;
    }

    const mountedAt = performance.now();
    const done = { fonts: false, load: false, painted: false };
    let shown = 0; // the value drawn on screen (0 to 100)
    let lastTime = mountedAt;
    let frame = 0;
    let finished = false;
    let timeoutId = 0;

    const markReady = (key: keyof typeof done) => {
      done[key] = true;
    };

    // Stage 1: fonts.
    if (document.fonts?.ready) document.fonts.ready.then(() => markReady("fonts"));
    else markReady("fonts");

    // Stages 2 and 3: the load event, then two frames to be sure it is painted.
    const onLoaded = () => {
      markReady("load");
      requestAnimationFrame(() => requestAnimationFrame(() => markReady("painted")));
      // Browsers pause animation frames in a background tab, which would freeze
      // the loader forever; this timer marks "painted" anyway shortly after.
      window.setTimeout(() => markReady("painted"), 150);
    };
    if (document.readyState === "complete") onLoaded();
    else window.addEventListener("load", onLoaded, { once: true });

    const finish = () => {
      if (finished) return;
      finished = true;
      setIsLeaving(true);
      // After the curtain has opened, switch the loader off for good.
      timeoutId = window.setTimeout(() => {
        html.setAttribute("data-loader", "done");
        setIsGone(true);
      }, CURTAIN_TIME);
    };

    const tick = () => {
      const now = performance.now();
      const target =
        (done.fonts ? WEIGHTS.fonts : 0) + (done.load ? WEIGHTS.load : 0) + (done.painted ? WEIGHTS.painted : 0);

      // The bar eases towards what is really ready, but cannot finish before the
      // minimum time has passed (it climbs with the clock until then).
      const timeCap = Math.min(100, ((now - mountedAt + Math.min(now, MIN_TIME)) / (MIN_TIME + MIN_VISIBLE_AFTER_MOUNT)) * 100);
      const goal = now > MAX_TIME ? 100 : Math.min(target, timeCap);
      // Time-based easing (not "per frame"), so it behaves the same at 60 fps,
      // on a slow phone, or when frames are throttled.
      const elapsed = now - lastTime;
      lastTime = now;
      shown += (goal - shown) * (1 - Math.exp(-elapsed / 140));
      if (goal - shown < 0.2) shown = goal;

      root.style.setProperty("--progress", shown.toFixed(1));
      if (percentRef.current) percentRef.current.textContent = String(Math.round(shown));

      if (shown >= 100 && now - mountedAt >= MIN_VISIBLE_AFTER_MOUNT) {
        finish();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeoutId);
      window.removeEventListener("load", onLoaded);
    };
  }, []);

  if (isGone) return null;

  return (
    <div
      ref={rootRef}
      className={clsx(styles.siteLoader, isLeaving && styles.siteLoaderIsLeaving)}
      role="status"
      aria-live="polite"
    >
      <span className={styles.siteLoaderHalfTop} aria-hidden="true" />
      <span className={styles.siteLoaderHalfBottom} aria-hidden="true" />

      <div className={styles.siteLoaderCenter}>
        <div className={styles.siteLoaderMark} aria-hidden="true">
          {/* A faint copy of the logo, and the full-colour copy that is revealed
              from the bottom up as the progress grows (liquid-fill effect). */}
          <Image className={styles.siteLoaderMarkGhost} src="/logo/altio-mark.svg" alt="" width={96} height={96} priority />
          <Image className={styles.siteLoaderMarkFill} src="/logo/altio-mark.svg" alt="" width={96} height={96} priority />
          <svg className={styles.siteLoaderRing} viewBox="0 0 120 120">
            <circle className={styles.siteLoaderRingTrack} cx="60" cy="60" r="56" />
            <circle className={styles.siteLoaderRingValue} cx="60" cy="60" r="56" pathLength={100} />
          </svg>
        </div>

        <p className={styles.siteLoaderWord} aria-hidden="true">
          {"ALTIO".split("").map((letter, index) => (
            <span key={letter + index} style={{ "--i": index } as React.CSSProperties}>
              {letter}
            </span>
          ))}
        </p>
        <p className={styles.siteLoaderPercent} aria-hidden="true">
          <span ref={percentRef}>0</span>%
        </p>
        <span className={styles.siteLoaderLabel}>Loading</span>
      </div>
    </div>
  );
}
