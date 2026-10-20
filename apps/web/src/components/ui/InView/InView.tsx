"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type InViewProps = {
  className?: string;
  children: ReactNode;
};

// A tiny wrapper that tells CSS when its content is on screen: it sets the
// attribute data-in-view="true" while at least 30% is visible, "false" when it
// has fully left. The stylesheet starts its animations only under
// [data-in-view="true"], so they play when the visitor arrives (and again on
// the next visit), like the Reveal slide.
// Before JavaScript runs the attribute is "server": the stylesheet shows the
// finished picture, so nobody ever sees an empty box.
export default function InView({ className, children }: InViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<"server" | "true" | "false">("server");

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.3) setState("true");
        else if (entry.intersectionRatio === 0) setState("false");
      },
      { threshold: [0, 0.3] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} data-in-view={state}>
      {children}
    </div>
  );
}
