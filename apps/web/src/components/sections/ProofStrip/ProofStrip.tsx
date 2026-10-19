import { Check } from "lucide-react";
import { getProof } from "@/lib/content";
import styles from "./ProofStrip.module.scss";

// The slim "trust" bar right under the Hero: four short promises in one card.
// Server component (no JavaScript).
export default function ProofStrip() {
  const proof = getProof();

  return (
    <section className={styles.proofStripSection}>
      <div className={styles.proofStripContent}>
        <ul className={styles.proofStripCard}>
        {proof.items.map((item) => (
          <li key={item.title} className={styles.proofStripItem}>
            <span className={styles.proofStripIcon} aria-hidden="true">
              <Check size={16} />
            </span>
            <span className={styles.proofStripText}>
              <strong className={styles.proofStripTitle}>{item.title}</strong>
              <span className={styles.proofStripDetail}>{item.text}</span>
            </span>
          </li>
        ))}
        </ul>
      </div>
    </section>
  );
}
