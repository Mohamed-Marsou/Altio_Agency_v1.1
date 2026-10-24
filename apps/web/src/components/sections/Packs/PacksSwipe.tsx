"use client";

import { useEffect, useRef, type ReactNode } from "react";

type PacksSwipeProps = {
  className: string;
  children: ReactNode;
};

// How long the visitor must leave the cards alone before the hint plays, and
// how long we wait before playing it again (ms).
const IDLE_DELAY = 5000;

// The sideways steps of the hint, in px (negative = cards move left, which
// shows more of the next card). Read it as: small peek, back, big peek showing
// most of card 2, a little shake, then home (back to card 1).
const HINT_KEYFRAMES = [
  { transform: "translateX(0)", offset: 0 },
  { transform: "translateX(-28px)", offset: 0.14 },
  { transform: "translateX(0)", offset: 0.28 },
  { transform: "translateX(-150px)", offset: 0.5 },
  { transform: "translateX(-136px)", offset: 0.58 },
  { transform: "translateX(-150px)", offset: 0.66 },
  { transform: "translateX(-140px)", offset: 0.72 },
  { transform: "translateX(0)", offset: 1 },
];

// The swipe row of the packs on phones. It is the same <ul> as before; this
// wrapper only adds the "suggest a swipe" hint:
//   - only on phones (below 768px, where the cards really scroll sideways);
//   - only while the row is on screen and still at card 1 (never swiped);
//   - 5 seconds of calm -> play the hint -> wait 5 seconds -> if still
//     untouched, play it again. Touching or scrolling the row cancels it.
// The hint moves the cards with a transform (not by scrolling), so it never
// fights the scroll-snap and leaves the real scroll position untouched.
export default function PacksSwipe({ className, children }: PacksSwipeProps) {
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const phone = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let timer = 0;
    let isVisible = false;
    let animations: Animation[] = [];

    const stopHint = () => {
      animations.forEach((animation) => animation.cancel());
      animations = [];
    };

    const schedule = () => {
      window.clearTimeout(timer);
      if (!isVisible || !phone.matches) return;
      timer = window.setTimeout(play, IDLE_DELAY);
    };

    const play = () => {
      // Only hint while the visitor is still on card 1.
      if (!isVisible || !phone.matches || list.scrollLeft > 8) return schedule();
      animations = Array.from(list.children).map((card) =>
        (card as HTMLElement).animate(HINT_KEYFRAMES, { duration: 2200, easing: "ease-in-out" }),
      );
      // Cooldown starts when the hint ends.
      animations[0]?.finished.then(schedule).catch(() => undefined);
    };

    // Any touch, drag or scroll cancels the hint and restarts the 5 seconds.
    const interrupted = () => {
      stopHint();
      schedule();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) schedule();
        else {
          window.clearTimeout(timer);
          stopHint();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(list);

    list.addEventListener("pointerdown", interrupted, { passive: true });
    list.addEventListener("scroll", interrupted, { passive: true });

    return () => {
      window.clearTimeout(timer);
      stopHint();
      observer.disconnect();
      list.removeEventListener("pointerdown", interrupted);
      list.removeEventListener("scroll", interrupted);
    };
  }, []);

  return (
    <ul ref={listRef} className={className}>
      {children}
    </ul>
  );
}
