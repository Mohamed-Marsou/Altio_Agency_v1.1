"use client";

import clsx from "clsx";
import { Check, Link2, MessageCircle } from "lucide-react";
import { useState } from "react";
import styles from "./PostShare.module.scss";

type PostShareProps = {
  title: string;
  copyLabel: string;
  copiedLabel: string;
  whatsappLabel: string;
  /** "rail" = vertical stack on the side (desktop), "row" = horizontal (phones). */
  layout: "rail" | "row";
};

// Share buttons: WhatsApp first (the way people really share in Morocco), then
// "copy link". The address comes from the browser at click time, so it is right
// on any domain. The clipboard can be refused (old browsers, private mode), so
// the copy is wrapped in try/catch and simply does nothing visible if it fails.
export default function PostShare({ title, copyLabel, copiedLabel, whatsappLabel, layout }: PostShareProps) {
  const [copied, setCopied] = useState(false);

  const shareOnWhatsapp = () => {
    const text = `${title} ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore: the visitor can still copy from the address bar
    }
  };

  return (
    <div className={clsx(styles.postShare, layout === "row" ? styles.postShareIsRow : styles.postShareIsRail)}>
      <button
        type="button"
        className={clsx(styles.postShareButton, styles.postShareButtonIsWhatsapp)}
        aria-label={whatsappLabel}
        title={whatsappLabel}
        onClick={shareOnWhatsapp}
      >
        <MessageCircle size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.postShareButton}
        aria-label={copied ? copiedLabel : copyLabel}
        title={copied ? copiedLabel : copyLabel}
        onClick={copyLink}
      >
        {copied ? <Check size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
      </button>
      <span className={styles.postShareStatus} role="status">
        {copied ? copiedLabel : ""}
      </span>
    </div>
  );
}
