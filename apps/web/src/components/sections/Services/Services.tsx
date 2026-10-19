import type { ReactNode } from "react";
import Link from "next/link";
import { getServices } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./Services.module.scss";

// Small line icons (24x24, drawn with strokes so they take the text colour).
// The JSON only stores a name ("monitor"); this map turns it into the drawing.
const ICONS: Record<string, ReactNode> = {
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
};

// Section 4 of the Home page: "What we build". Four service cards, each one
// a link to its block on the Services page. Server component (no JavaScript).
export default function Services() {
  const services = getServices();

  return (
    <section className={styles.servicesSection}>
      <div className={styles.servicesContent}>
        <div className={styles.servicesIntro}>
          <SectionHeading
            eyebrow={services.eyebrow}
            title={services.title}
            subtitle={services.subtitle}
          />
          {/* Accent line under the intro: grows and turns green on hover (same as Problem) */}
          <span className={styles.servicesAccentLine} aria-hidden="true" />
        </div>

        <ul className={styles.servicesList}>
          {services.items.map((item) => (
            <li key={item.id} className={styles.servicesItem}>
              <Link href={item.href} className={styles.servicesCard}>
                <span className={styles.servicesCardIcon} aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {ICONS[item.icon]}
                  </svg>
                </span>
                <h3 className={styles.servicesCardTitle}>{item.title}</h3>
                <p className={styles.servicesCardText}>{item.text}</p>
                <span className={styles.servicesCardLink}>
                  {services.linkLabel}
                  <svg
                    className={styles.servicesCardArrow}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
