import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./CaseVisual.module.scss";

// The small drawings of the "What we built" cards. Chosen by the `visual` key
// in projects.json. Decorative (aria-hidden); the strings are part of the
// drawings, not site copy.
const VISUALS: Record<string, ReactNode> = {
  listing: (
    <>
      <span className={styles.caseVisualChips}>
        <i>New</i>
        <i>Popular</i>
        <i>Sale</i>
      </span>
      <span className={styles.caseVisualTiles}>
        <b />
        <b />
      </span>
    </>
  ),
  admin: (
    <>
      <span className={clsx(styles.caseVisualLine, styles.caseVisualLineStrong)} />
      <span className={styles.caseVisualLine} />
      <span className={styles.caseVisualLine} style={{ width: "85%" }} />
      <span className={styles.caseVisualLine} style={{ width: "60%" }} />
    </>
  ),
  whatsapp: <span className={styles.caseVisualWhatsapp}>Chat on WhatsApp</span>,
  cart: (
    <>
      <span className={styles.caseVisualRow}>
        Cart · 2 items <em>640 MAD</em>
      </span>
      <span className={styles.caseVisualButton}>Checkout</span>
    </>
  ),
  calendar: (
    <>
      <span className={styles.caseVisualRow}>
        09:00 <em>Confirmed</em>
      </span>
      <span className={styles.caseVisualRow}>
        09:30 <em>Waiting</em>
      </span>
      <span className={styles.caseVisualRow}>
        10:00 <em>Confirmed</em>
      </span>
    </>
  ),
  report: (
    <span className={styles.caseVisualBars}>
      <i style={{ height: "40%" }} />
      <i style={{ height: "62%" }} />
      <i style={{ height: "55%" }} />
      <i style={{ height: "80%" }} />
      <i style={{ height: "95%" }} />
    </span>
  ),
};

export default function CaseVisual({ kind }: { kind: string }) {
  return (
    <div className={styles.caseVisual} aria-hidden="true">
      {VISUALS[kind] ?? VISUALS.admin}
    </div>
  );
}
