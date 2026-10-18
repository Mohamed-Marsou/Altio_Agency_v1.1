"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Reveal.module.scss";

// The three states of a revealed block:
//  "server"  = what the server sends and what visitors without JavaScript see:
//              fully visible (so the content is never lost);
//  "hidden"  = waiting below the screen (invisible, pushed down a little);
//  "visible" = on screen (slid up and faded in).
type RevealState = "server" | "hidden" | "visible";

type RevealProps = {
  children: ReactNode;
};

// Wrap any section in <Reveal> and it SLIDES UP from the bottom while fading in
// when the visitor scrolls to it. The animation is NOT one-shot: when the
// section leaves the screen it is reset, so scrolling back up (or down again)
// plays it again.
//
// Two nested boxes on purpose:
//   outer = never moves, it is the one we WATCH with IntersectionObserver;
//   inner = the one that moves. If we watched the moving box, the small shift
//   itself could push it out of view and make the animation flicker.
export default function Reveal({ children }: RevealProps) {
  const watchedRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<RevealState>("server");

  useEffect(() => {
    const element = watchedRef.current;
    if (!element) return;

    // ratio = how much of the box is on screen (0 = none, 1 = all of it).
    // Show when at least 12% is visible. Hide again only when NONE is visible.
    // Between the two we keep the current state (this stops flicker).
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.12) setState("visible");
        else if (entry.intersectionRatio === 0) setState("hidden");
      },
      { threshold: [0, 0.12] },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={watchedRef}>
      <div
        className={clsx(
          styles.revealBlock,
          state === "hidden" && styles.revealBlockIsHidden,
          state === "visible" && styles.revealBlockIsVisible,
        )}
      >
        {children}
      </div>
    </div>
  );
}
