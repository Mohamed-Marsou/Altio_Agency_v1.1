"use client";

import { useEffect, useState } from "react";
import styles from "./HeroHeadline.module.scss";

type HeroHeadlineProps = {
  /** The real, stable title (read by search engines and screen readers). */
  title: string;
  /** The sentences that are typed, erased and replaced one after another. */
  headlines: string[];
};

// Typing speeds in milliseconds.
const TYPE_DELAY = 45; // between two typed letters
const ERASE_DELAY = 22; // between two erased letters (faster than typing)
const HOLD_DELAY = 10000; // how long a finished sentence stays on screen
const PAUSE_DELAY = 350; // empty pause before the next sentence starts

// The H1 that "writes and rewrites" itself with different hooks.
//  - <span visually-hidden> holds the REAL title: Google and screen readers
//    always read one stable sentence instead of half-typed text.
//  - <span aria-hidden> shows the animated text for human eyes.
//  - With "reduce motion" enabled the first sentence simply stays (no typing).
export default function HeroHeadline({ title, headlines }: HeroHeadlineProps) {
  // We start with the first sentence fully written, so the server-rendered
  // HTML (and the first paint) already shows a complete, readable headline.
  const [visibleText, setVisibleText] = useState(headlines[0]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let headlineIndex = 0;
    let letterCount = headlines[0].length;
    let isErasing = true; // the first sentence is already written: erase it first
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      const sentence = headlines[headlineIndex];

      if (isErasing) {
        letterCount -= 1;
        setVisibleText(sentence.slice(0, letterCount));
        if (letterCount === 0) {
          isErasing = false;
          headlineIndex = (headlineIndex + 1) % headlines.length;
          timer = setTimeout(step, PAUSE_DELAY);
          return;
        }
        timer = setTimeout(step, ERASE_DELAY);
      } else {
        letterCount += 1;
        setVisibleText(sentence.slice(0, letterCount));
        if (letterCount === sentence.length) {
          isErasing = true;
          timer = setTimeout(step, HOLD_DELAY);
          return;
        }
        timer = setTimeout(step, TYPE_DELAY);
      }
    };

    // First sentence stays for a while, then the loop starts erasing it.
    timer = setTimeout(step, HOLD_DELAY);
    return () => clearTimeout(timer);
  }, [headlines]);

  return (
    <h1 className={styles.heroHeadline}>
      <span className="visually-hidden">{title}</span>
      <span className={styles.heroHeadlineText} aria-hidden="true">
        {visibleText}
        <span className={styles.heroHeadlineCaret} />
      </span>
    </h1>
  );
}
