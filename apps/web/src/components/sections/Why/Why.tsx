import { Code, Layers, MessageCircle, Workflow } from "lucide-react";
import type { ComponentType } from "react";
import { getWhy } from "@/lib/content";
import Tooltip from "@/components/ui/Tooltip/Tooltip";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./Why.module.scss";

// The JSON stores an icon NAME; this table turns it into the real icon.
const ICONS: Record<string, ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>> = {
  code: Code,
  layers: Layers,
  workflow: Workflow,
  message: MessageCircle,
};

// Section 8 of the Home page: "Why Altio". Left: heading, short text and three
// big numbers. Right: four reason cards and the tools we use.
// Server component (no JavaScript).
export default function Why() {
  const why = getWhy();

  return (
    <section className={styles.whySection}>
      <div className={styles.whyContent}>
        <div className={styles.whyIntro}>
          <SectionHeading eyebrow={why.eyebrow} title={why.title} subtitle={why.text} />

          <dl className={styles.whyStats}>
            {why.stats.map((stat) => (
              <div key={stat.label} className={styles.whyStat}>
                <dt className={styles.whyStatValue}>{stat.value}</dt>
                <dd className={styles.whyStatLabel}>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={styles.whyDetails}>
          <ul className={styles.whyCards}>
            {why.cards.map((card) => {
              const Icon = ICONS[card.icon];
              return (
                <li key={card.title} className={styles.whyCard}>
                  <span className={styles.whyCardIcon}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3 className={styles.whyCardTitle}>{card.title}</h3>
                  <p className={styles.whyCardText}>{card.text}</p>
                </li>
              );
            })}
          </ul>

          <div className={styles.whyStack}>
            <p className={styles.whyStackLabel}>{why.stackLabel}</p>
            <ul className={styles.whyStackList}>
              {why.stack.map((tool) => (
                <li key={tool.name} className={styles.whyStackItem}>
                  {tool.mostUsed ? (
                    <Tooltip text={why.mostUsedTip}>{tool.name}</Tooltip>
                  ) : (
                    tool.name
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
