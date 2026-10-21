import Image from "next/image";
import Link from "@/components/ui/LocaleLink/LocaleLink";
import styles from "./Logo.module.scss";

type LogoProps = {
  /** Accessible name of the link, read by screen readers. */
  label: string;
  /** Size of the symbol in px. */
  size?: number;
};

// The Altio mark (gradient "A") + the ALTIO wordmark. The mark is a static SVG
// in /public/logo; the wordmark is real text so it follows the theme colour.
export default function Logo({ label, size = 34 }: LogoProps) {
  return (
    <Link href="/" className={styles.logoLink} aria-label={label}>
      <Image src="/logo/altio-mark.svg" alt="" width={size} height={size} priority />
      <span className={styles.logoWordmark}>ALTIO</span>
    </Link>
  );
}
