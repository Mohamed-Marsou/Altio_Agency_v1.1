import type { ReactNode } from "react";
import styles from "./Badge.module.scss";

// Small pill with a soft blue background (used for tags and labels).
export default function Badge({ children }: { children: ReactNode }) {
  return <span className={styles.badgePill}>{children}</span>;
}
