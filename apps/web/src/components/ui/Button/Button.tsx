import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Button.module.scss";

type ButtonProps = {
  href: string;
  children: ReactNode;
  /** primary = blue fill, secondary = white with border, dark = inverse. */
  variant?: "primary" | "secondary" | "dark";
  size?: "medium" | "large";
  /** Stretch to the full width of its container. */
  fullWidth?: boolean;
  className?: string;
};

// Readable lookup tables: prop value -> CSS class.
const variantClass = {
  primary: styles.buttonPrimary,
  secondary: styles.buttonSecondary,
  dark: styles.buttonDark,
};

const sizeClass = {
  medium: styles.buttonSizeMedium,
  large: styles.buttonSizeLarge,
};

// A plain button-looking link. For the animated blue-to-green WhatsApp button
// see MorphButton. External links (https://...) use <a>, internal pages use
// Next's <Link> (client-side navigation).
export default function Button({
  href,
  children,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  className,
}: ButtonProps) {
  const classes = clsx(
    styles.buttonBase,
    variantClass[variant],
    sizeClass[size],
    fullWidth && styles.buttonFullWidth,
    className,
  );
  const isExternal = /^https?:\/\//.test(href);

  if (isExternal) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
