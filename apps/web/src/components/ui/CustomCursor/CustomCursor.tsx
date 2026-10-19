"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CustomCursor.module.scss";

type Ripple = { id: number; x: number; y: number };

// Everything the pointer can interact with: over these the cursor "opens up".
const INTERACTIVE_SELECTOR =
  'a, button, summary, label, select, input, textarea, [role="button"], [role="option"], [tabindex]:not([tabindex="-1"])';

// How long a click ripple lives before we remove it from the page (ms).
const RIPPLE_LIFETIME = 1300;

// How fast the ring catches up with the mouse (0 = never, 1 = instantly).
const RING_FOLLOW_SPEED = 0.18;

// The brand cursor: a small blue dot that sticks to the mouse, plus a thin ring
// that follows it with a soft delay. Over links and buttons the ring grows and
// fills with a light tint. On every click, three circles spread out from the
// click point and fade away.
//
// Rules:
//  - Only on devices with a real mouse ((hover: hover) and (pointer: fine)).
//    Phones and tablets keep their normal behaviour.
//  - The normal arrow is hidden through a data attribute on <html>
//    (see base/_utilities.scss), only while this component is running.
//  - Movement is done with direct DOM updates inside requestAnimationFrame
//    (not React state), so moving the mouse never re-renders the page.
//  - With "reduce motion" on: no delay on the ring and no click ripples.
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Touch screens and pens: do nothing at all.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    root.dataset.customCursor = "on"; // hides the native arrow (CSS)

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let hasMoved = false;
    let frame = 0;
    let rippleId = 0;

    const setVisible = (visible: boolean) => {
      dot.dataset.visible = String(visible);
      ring.dataset.visible = String(visible);
    };

    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      // First movement: put the ring right under the mouse (no flying in).
      if (!hasMoved) {
        hasMoved = true;
        ringX = mouseX;
        ringY = mouseY;
        setVisible(true);
      }

      // The dot is glued to the mouse.
      dot.style.translate = `${mouseX}px ${mouseY}px`;

      // Is the mouse over something clickable? The stylesheet reacts to this attribute.
      const isInteractive = (event.target as Element | null)?.closest?.(INTERACTIVE_SELECTOR);
      dot.dataset.hover = String(Boolean(isInteractive));
      ring.dataset.hover = String(Boolean(isInteractive));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      ring.dataset.pressed = "true";
      dot.dataset.pressed = "true";

      if (!prefersReducedMotion) {
        rippleId += 1;
        const ripple = { id: rippleId, x: event.clientX, y: event.clientY };
        setRipples((current) => [...current, ripple]);
        window.setTimeout(() => {
          setRipples((current) => current.filter((item) => item.id !== ripple.id));
        }, RIPPLE_LIFETIME);
      }
    };

    const onPointerUp = () => {
      ring.dataset.pressed = "false";
      dot.dataset.pressed = "false";
    };

    // The mouse left the browser window / came back.
    const onLeave = () => setVisible(false);
    const onEnter = () => hasMoved && setVisible(true);

    // The animation loop: every frame the ring moves a fraction of the way to
    // the mouse. That repeated fraction is what makes the soft "lag".
    const tick = () => {
      const speed = prefersReducedMotion ? 1 : RING_FOLLOW_SPEED;
      ringX += (mouseX - ringX) * speed;
      ringY += (mouseY - ringY) * speed;
      ring.style.translate = `${ringX}px ${ringY}px`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      delete root.dataset.customCursor;
    };
  }, []);

  return (
    // aria-hidden: purely visual, screen readers ignore it.
    <div aria-hidden="true">
      <div ref={ringRef} className={styles.customCursorRing} data-visible="false" />
      <div ref={dotRef} className={styles.customCursorDot} data-visible="false" />

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={styles.customCursorRipple}
          style={{ left: ripple.x, top: ripple.y }}
        >
          <span className={styles.customCursorRippleRing} />
          <span className={styles.customCursorRippleRing} />
          <span className={styles.customCursorRippleRing} />
        </span>
      ))}
    </div>
  );
}
