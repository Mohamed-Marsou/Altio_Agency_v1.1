"use client";

import { useEffect, useRef } from "react";
import styles from "./PostProgress.module.scss";

type PostProgressProps = {
  /** id of the article element whose reading progress is shown. */
  targetId: string;
  label: string;
};

// The thin reading-progress bar at the very top of the screen. It measures how
// far the visitor has scrolled through the article and stretches the bar to
// match. It is written straight into the DOM (no React state), once per frame,
// so scrolling never re-renders the page.
export default function PostProgress({ targetId, label }: PostProgressProps) {
  const barRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    const article = document.getElementById(targetId);
    if (!bar || !article) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      // 0 when the article top reaches the screen top, 1 when its end does.
      const travelled = -rect.top + window.innerHeight * 0.25;
      const progress = Math.min(1, Math.max(0, travelled / rect.height));
      bar.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  return (
    <div className={styles.postProgress} role="progressbar" aria-label={label} aria-hidden="true">
      <span ref={barRef} className={styles.postProgressBar} />
    </div>
  );
}
