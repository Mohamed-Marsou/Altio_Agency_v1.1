import { BarChart3, Gift, MessageCircle, RefreshCw, Search, Smartphone } from "lucide-react";
import type { ComponentType } from "react";
import { getServicesPage } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./Included.module.scss";

// The JSON stores an icon NAME; this table turns it into the real icon.
const ICONS: Record<string, ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>> = {
  design: Gift,
  search: Search,
  message: MessageCircle,
  chart: BarChart3,
  phone: Smartphone,
  refresh: RefreshCw,
};

// "Included in every pack": the six things all four services share.
// Server component.
export default function Included() {
  const { included } = getServicesPage();

  return (
    <section className={styles.includedSection}>
      <div className={styles.includedContent}>
        <SectionHeading eyebrow={included.eyebrow} title={included.title} subtitle={included.lead} />

        <ul className={styles.includedGrid}>
          {included.items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={item.title} className={styles.includedCard}>
                <span className={styles.includedIcon}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className={styles.includedTitle}>{item.title}</h3>
                <p className={styles.includedText}>{item.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
