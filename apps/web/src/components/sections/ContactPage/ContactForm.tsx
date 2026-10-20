"use client";

import clsx from "clsx";
import { useId, useState, type FormEvent } from "react";
import type { ContactContent } from "@/lib/content";
import styles from "./ContactForm.module.scss";

type ContactFormProps = {
  form: ContactContent["form"];
  /** The WhatsApp number (digits only), from site.json. */
  whatsappNumber: string;
  /** The free-design landing page hides the long message box. */
  showMessage?: boolean;
};

type Errors = Partial<Record<"name" | "phone" | "need", string>>;

// The "Get your free design" form.
//
// The site is a static export for now (no server to receive a form), so on
// submit we check the answers, build a ready-made WhatsApp message from them
// and open WhatsApp with it. The visitor only has to press send. When the PHP
// endpoint exists, only the body of `onSubmit` changes.
//
// Validation is simple and friendly: name, a phone/WhatsApp number (at least 8
// digits) and one choice of need are required. Errors appear under the field
// and are announced to screen readers (aria-describedby + role="alert").
export default function ContactForm({ form, whatsappNumber, showMessage = true }: ContactFormProps) {
  const baseId = useId();
  const [need, setNeed] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const business = String(data.get("business") ?? "").trim();
    const details = String(data.get("message") ?? "").trim();

    const found: Errors = {};
    if (!name) found.name = form.errors.name;
    if (phone.replace(/\D/g, "").length < 8) found.phone = form.errors.phone;
    if (!need) found.need = form.errors.need;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const t = form.messageTemplate;
    const lines = [
      t.intro,
      `${t.name}: ${name}`,
      business && `${t.business}: ${business}`,
      `${t.need}: ${need}`,
      details && `${t.details}: ${details}`,
    ].filter(Boolean);
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const fieldProps = (key: keyof Errors) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `${baseId}-${key}-error` : undefined,
  });

  const error = (key: keyof Errors) =>
    errors[key] ? (
      <span id={`${baseId}-${key}-error`} className={styles.contactFormError} role="alert">
        {errors[key]}
      </span>
    ) : null;

  return (
    <form className={styles.contactForm} onSubmit={onSubmit} noValidate>
      <h2 className={styles.contactFormTitle}>{form.title}</h2>
      <p className={styles.contactFormSubtitle}>{form.subtitle}</p>

      <div className={styles.contactFormRow}>
        <label className={styles.contactFormField}>
          {form.fields.name.label}
          <input
            name="name"
            type="text"
            autoComplete="name"
            placeholder={form.fields.name.placeholder}
            {...fieldProps("name")}
          />
          {error("name")}
        </label>
        <label className={styles.contactFormField}>
          {form.fields.phone.label}
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder={form.fields.phone.placeholder}
            {...fieldProps("phone")}
          />
          {error("phone")}
        </label>
      </div>

      <label className={styles.contactFormField}>
        {form.fields.business.label}
        <input name="business" type="text" placeholder={form.fields.business.placeholder} />
      </label>

      <fieldset className={styles.contactFormField} {...fieldProps("need")}>
        <legend>{form.fields.need.label}</legend>
        <div className={styles.contactFormOptions}>
          {form.needs.map((option) => (
            <button
              key={option}
              type="button"
              className={clsx(styles.contactFormOption, need === option && styles.contactFormOptionIsOn)}
              aria-pressed={need === option}
              onClick={() => {
                setNeed(option);
                setErrors((current) => ({ ...current, need: undefined }));
              }}
            >
              {option}
            </button>
          ))}
        </div>
        {error("need")}
      </fieldset>

      {showMessage && (
        <label className={styles.contactFormField}>
          {form.fields.message.label}
          <textarea name="message" rows={4} placeholder={form.fields.message.placeholder} />
        </label>
      )}

      <button type="submit" className={styles.contactFormSubmit}>
        {form.submit}
      </button>
      <p className={styles.contactFormNote}>{form.note}</p>

      <ul className={styles.contactFormPromises}>
        {form.promises.map((promise) => (
          <li key={promise}>{promise}</li>
        ))}
      </ul>
    </form>
  );
}
