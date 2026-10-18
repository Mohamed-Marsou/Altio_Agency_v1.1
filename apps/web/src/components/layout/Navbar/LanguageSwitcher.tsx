"use client";

import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Flag, { type FlagCode } from "@/components/ui/Flag/Flag";
import styles from "./LanguageSwitcher.module.scss";

type LanguageOption = { code: string; label: string };

type LanguageSwitcherProps = {
  languages: LanguageOption[];
  /** Accessible name of the button ("Choose language"). */
  buttonLabel: string;
};

// Shows ONLY the current language (flag + code). Clicking opens a small popup
// with every language (flag + name). For now choosing one just updates the
// button: the real language switch (changing /en to /fr) comes with i18n.
export default function LanguageSwitcher({ languages, buttonLabel }: LanguageSwitcherProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [currentCode, setCurrentCode] = useState(languages[0].code);
  const [isOpen, setIsOpen] = useState(false);

  const current = languages.find((language) => language.code === currentCode) ?? languages[0];

  // While the popup is open: a click outside it or the Escape key closes it.
  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={styles.languageSwitcher}>
      <button
        type="button"
        className={styles.languageSwitcherButton}
        aria-label={buttonLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Flag code={current.code as FlagCode} />
        <span className={styles.languageSwitcherCode}>{current.code}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={clsx(
            styles.languageSwitcherChevron,
            isOpen && styles.languageSwitcherChevronIsOpen,
          )}
        />
      </button>

      {isOpen && (
        <ul className={styles.languageSwitcherMenu} role="listbox" aria-label={buttonLabel}>
          {languages.map((language) => {
            const isSelected = language.code === currentCode;
            return (
              <li key={language.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={clsx(
                    styles.languageSwitcherOption,
                    isSelected && styles.languageSwitcherOptionIsSelected,
                  )}
                  onClick={() => {
                    setCurrentCode(language.code);
                    setIsOpen(false);
                  }}
                >
                  <Flag code={language.code as FlagCode} />
                  <span className={styles.languageSwitcherOptionLabel}>{language.label}</span>
                  {isSelected && <Check size={16} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
