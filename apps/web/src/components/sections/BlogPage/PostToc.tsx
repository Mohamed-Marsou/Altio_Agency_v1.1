"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import styles from "./PostToc.module.scss";

type PostTocProps = {
  title: string;
  items: { id: string; text: string }[];
};

// The sticky "In this article" list. The link of the section you are reading is
// highlighted: an IntersectionObserver watches every heading and marks the one
// that has just crossed the upper part of the screen.
export default function PostToc({ title, items }: PostTocProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        // The topmost heading that is inside the "reading zone" wins.
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className={styles.postToc} aria-label={title}>
      <p className={styles.postTocTitle}>{title}</p>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={clsx(styles.postTocLink, item.id === activeId && styles.postTocLinkIsActive)}
          aria-current={item.id === activeId ? "location" : undefined}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
