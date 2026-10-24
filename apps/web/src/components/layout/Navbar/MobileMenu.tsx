"use client";

import clsx from "clsx";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "@/components/ui/LocaleLink/LocaleLink";
import { useParams } from "next/navigation";
import { useEffect, useId, useState, type CSSProperties } from "react";
import { isLocale } from "@/lib/i18n";
import { switchLocale } from "@/lib/i18n-client";
import Flag, { type FlagCode } from "@/components/ui/Flag/Flag";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import styles from "./MobileMenu.module.scss";

type MobileMenuProps = {
  links: { label: string; href: string }[];
  currentPath: string;
  languages: { code: string; label: string }[];
  ctaHref: string;
  ctaLabel: string;
  ctaHoverLabel: string;
  openLabel: string;
  closeLabel: string;
  title: string;
};

// The hamburger button and the full-screen menu panel that it opens (phones and
// tablets, below 1280px; from there the normal link row is shown instead).
//
// While the panel is open:
//   - the page behind it cannot scroll (body gets overflow hidden);
//   - Escape, a tap on a link, or growing the window to desktop size closes it.
// The panel is always in the HTML (so the animation can run both ways) but is
// invisible and not focusable while closed (visibility: hidden in the CSS).
export default function MobileMenu({
  links,
  currentPath,
  languages,
  ctaHref,
  ctaLabel,
  ctaHoverLabel,
  openLabel,
  closeLabel,
  title,
}: MobileMenuProps) {
  const panelId = useId();
  const params = useParams<{ locale?: string }>();
  const currentCode = isLocale(params?.locale) ? params.locale : languages[0].code;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    // If the visitor rotates the phone or resizes to a desktop width, the menu
    // has no reason to stay open.
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => desktop.matches && setIsOpen(false);

    document.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [isOpen]);

  const isActive = (href: string) =>
    href === "/" ? currentPath === "/" : currentPath.startsWith(href);

  return (
    <>
      <button
        type="button"
        className={styles.mobileMenuButton}
        aria-label={isOpen ? closeLabel : openLabel}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
      </button>

      <div
        id={panelId}
        className={clsx(styles.mobileMenuPanel, isOpen && styles.mobileMenuPanelIsOpen)}
        role="dialog"
        aria-label={title}
      >
        <div className={styles.mobileMenuContent}>
          <nav aria-label={title}>
            <ul className={styles.mobileMenuLinks}>
              {links.map((link, index) => (
                <li
                  key={link.href}
                  className={styles.mobileMenuItem}
                  style={{ "--index": index } as CSSProperties}
                >
                  <Link
                    href={link.href}
                    className={clsx(styles.mobileMenuLink, isActive(link.href) && styles.mobileMenuLinkIsActive)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={20} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.mobileMenuFooter} style={{ "--index": links.length } as CSSProperties}>
            <ul className={styles.mobileMenuLanguages}>
              {languages.map((language) => (
                <li
                  key={language.code}
                  className={clsx(styles.mobileMenuLanguage, language.code === currentCode && styles.mobileMenuLanguageIsCurrent)}
                >
                  <button
                    type="button"
                    className={styles.mobileMenuLanguageButton}
                    aria-current={language.code === currentCode ? "true" : undefined}
                    lang={language.code}
                    onClick={() => switchLocale(language.code)}
                  >
                    <Flag code={language.code as FlagCode} />
                    {language.label}
                  </button>
                </li>
              ))}
            </ul>
            <MorphButton
              href={ctaHref}
              label={ctaLabel}
              hoverLabel={ctaHoverLabel}
              size="large"
              fullWidth
            />
          </div>
        </div>
      </div>
    </>
  );
}
