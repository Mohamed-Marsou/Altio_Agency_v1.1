import clsx from "clsx";
import { MessageCircle } from "lucide-react";
import styles from "./MorphButton.module.scss";

type MorphButtonProps = {
  /** WhatsApp link (build it with getWhatsAppUrl). */
  href: string;
  /** Text shown normally, on the blue button. */
  label: string;
  /** Text shown while hovering, on the green button ("Send us a message"). */
  hoverLabel: string;
  size?: "medium" | "large";
  /** primary = blue, light = white (for blue bands), outline = white with border. */
  variant?: "primary" | "light" | "outline";
  /** Stretch to the full width of its container. */
  fullWidth?: boolean;
  className?: string;
};

// The animated call-to-action: a blue button that, on hover, is "wiped" by a
// green WhatsApp button (icon + new text). It is pure CSS: both labels sit in
// the same spot and swap with a slide, so no JavaScript is needed.
export default function MorphButton({
  href,
  label,
  hoverLabel,
  size = "medium",
  variant = "primary",
  fullWidth = false,
  className,
}: MorphButtonProps) {
  const sizeClass =
    size === "large" ? styles.morphButtonSizeLarge : styles.morphButtonSizeMedium;

  return (
    <a
      href={href}
      className={clsx(
        styles.morphButton,
        sizeClass,
        variant === "light" && styles.morphButtonLight,
        variant === "outline" && styles.morphButtonOutline,
        fullWidth && styles.morphButtonFullWidth,
        className,
      )}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.morphButtonLabelDefault}>{label}</span>
      <span className={styles.morphButtonLabelHover} aria-hidden="true">
        <MessageCircle size={18} />
        {hoverLabel}
      </span>
    </a>
  );
}
