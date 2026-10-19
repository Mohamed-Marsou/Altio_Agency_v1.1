"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import styles from "./ThemeToggle.module.scss";

type ThemeToggleProps = {
  /** Accessible name of the button ("Toggle dark mode"). */
  label: string;
};

// The round light/dark button in the navbar.
//
// It does NOT keep the theme in React state. The single source of truth is the
// data-theme attribute on <html>: the CSS reads it, and the inline script in
// <head> sets it before the first paint. A click flips the attribute and saves
// the choice, so there is nothing for the server and the browser to disagree on.
//
// Both icons are always in the HTML; CSS shows the right one (the moon in light
// mode = "go dark", the sun in dark mode = "go light"). That is why the server
// render and the browser render are identical (no hydration warning).
export default function ThemeToggle({ label }: ThemeToggleProps) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);

    // Remember the choice for the next visit. Wrapped in try/catch because the
    // browser may block storage (private mode); the theme still changes now.
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore: the choice just will not survive a refresh
    }
  };

  return (
    <button type="button" className={styles.themeToggle} aria-label={label} onClick={toggle}>
      <Moon className={styles.themeToggleMoon} size={18} aria-hidden="true" />
      <Sun className={styles.themeToggleSun} size={18} aria-hidden="true" />
    </button>
  );
}
