"use client";

import { HONEYPOT_FIELD } from "@/lib/forms/spam";
import styles from "./ContactForm.module.scss";

// The trap for bots. People never see it (it is shrunk to nothing and skipped
// by the keyboard and by screen readers), but bots fill every field they find.
export function Honeypot() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", opacity: 0, pointerEvents: "none" }}>
      <label>
        Leave this field empty
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export type FormStatus =
  | { kind: "idle" }
  | { kind: "sent"; whatsappUrl: string; emailUrl: string }
  | { kind: "blocked"; message: string };

type FormStatusProps = {
  status: FormStatus;
  labels: { sent: string; openWhatsapp: string; emailFallback: string };
};

// What the visitor sees under the button after sending: a confirmation, plus two
// plain links in case WhatsApp did not open (pop-up blocked) or they prefer email.
export function FormFeedback({ status, labels }: FormStatusProps) {
  if (status.kind === "idle") return <div role="status" aria-live="polite" />;
  if (status.kind === "blocked") {
    return (
      <p role="alert" className={styles.contactFormError}>
        {status.message}
      </p>
    );
  }
  return (
    <div role="status" aria-live="polite" className={styles.contactFormNote}>
      <p>{labels.sent}</p>
      <p>
        <a href={status.whatsappUrl} target="_blank" rel="noopener noreferrer">
          {labels.openWhatsapp}
        </a>
        {" · "}
        <a href={status.emailUrl}>{labels.emailFallback}</a>
      </p>
    </div>
  );
}

/** Moves the keyboard focus to the first field with a problem. */
export function focusFirstError(form: HTMLFormElement) {
  requestAnimationFrame(() => {
    const target = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!target) return;
    (target.tagName === "FIELDSET" ? target.querySelector<HTMLElement>("button") : target)?.focus();
  });
}
