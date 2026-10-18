"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./NavLinks.module.scss";

type NavLinkItem = { label: string; href: string };
type BarPosition = { left: number; width: number };

type NavLinksProps = {
  links: NavLinkItem[];
  currentPath: string;
};

// The link row with a SLIDING underline.
// Two bars live under the links:
//   - the ACTIVE bar (accent blue) always sits under the current page;
//   - the HOVER bar (lighter blue) slides to whichever link the mouse is over.
// Both are positioned with CSS variables (--active-left, --hover-left...) that
// we calculate from the real size of each link, and CSS animates the movement.
// This must be a client component: it needs to measure the page and react to
// the mouse.
export default function NavLinks({ links, currentPath }: NavLinksProps) {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [positions, setPositions] = useState<BarPosition[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  const activeIndex = links.findIndex((link) => link.href === currentPath);

  // Measure every link (left edge + width). We re-measure whenever the list
  // changes size (window resize, web font finished loading).
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      setPositions(
        itemRefs.current.map((item) => ({
          left: item?.offsetLeft ?? 0,
          width: item?.offsetWidth ?? 0,
        })),
      );
      // Turn the sliding transitions on only AFTER the first measurement, so
      // the bars do not fly in from the left on page load.
      requestAnimationFrame(() => setIsReady(true));
    };

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const activePosition = positions[activeIndex];
  // While nothing is hovered the hover bar rests under the active link, so when
  // the mouse arrives it slides out from there instead of appearing from nowhere.
  const hoverPosition = positions[hoveredIndex ?? activeIndex];
  const isHoverBarVisible = hoveredIndex !== null && hoveredIndex !== activeIndex;

  const barVariables = {
    "--active-left": `${activePosition?.left ?? 0}px`,
    "--active-width": `${activePosition?.width ?? 0}px`,
    "--hover-left": `${hoverPosition?.left ?? 0}px`,
    "--hover-width": `${hoverPosition?.width ?? 0}px`,
  } as CSSProperties;

  return (
    <ul
      ref={listRef}
      className={clsx(styles.navLinksList, isReady && styles.navLinksListIsReady)}
      style={barVariables}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {links.map((link, index) => {
        const isActive = index === activeIndex;
        return (
          <li
            key={link.href}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            onMouseEnter={() => setHoveredIndex(index)}
          >
            <Link
              href={link.href}
              className={clsx(
                styles.navLinksLink,
                isActive && styles.navLinksLinkIsActive,
                hoveredIndex === index && styles.navLinksLinkIsHovered,
              )}
              aria-current={isActive ? "page" : undefined}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
            >
              {link.label}
            </Link>
          </li>
        );
      })}

      {activeIndex >= 0 && <span className={styles.navLinksActiveBar} aria-hidden="true" />}
      <span
        className={clsx(styles.navLinksHoverBar, isHoverBarVisible && styles.navLinksHoverBarIsVisible)}
        aria-hidden="true"
      />
    </ul>
  );
}
