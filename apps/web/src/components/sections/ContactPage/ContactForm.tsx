"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import site from "@/content/shared/site.json";
import type { ContactContent } from "@/lib/content";
import { contactSchema, fieldErrors } from "@/lib/forms/schemas";
import { HONEYPOT_FIELD, checkSpam, getSessionStorage, readRecent, recordSend } from "@/lib/forms/spam";
import { hasApi, submitLead, whatsappSubmission, type SubmitContext, type SubmitResult } from "@/lib/forms/submit";
import { useLocale } from "@/lib/use-locale";
import { FormFeedback, Honeypot, focusFirstError, type FormStatus } from "./FormParts";
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
// submit we check the answers (lib/forms/schemas.ts), build a ready-made
// WhatsApp message and open WhatsApp with it. The visitor only has to press send.
// If the backend exists (NEXT_PUBLIC_API_URL) the same data is posted there
// instead; the form does not change (lib/forms/submit.ts).
//
// Protection without a server (lib/forms/spam.ts): a hidden honeypot field, a
// minimum fill time and a limit of 3 sends per 10 minutes.
// Errors appear under the field, are announced to screen readers, and the
// keyboard focus jumps to the first problem.
export default function ContactForm({ form, whatsappNumber, showMessage = true }: ContactFormProps) {
  const baseId = useId();
  const locale = useLocale();
  const startedAt = useRef(0);
  const [need, setNeed] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });

  // The fill-time clock starts when the form appears.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    const text = (key: string) => String(data.get(key) ?? "");

    const now = Date.now();
    const storage = getSessionStorage();
    const verdict = checkSpam({
      honeypot: text(HONEYPOT_FIELD),
      startedAt: startedAt.current,
      now,
      recent: readRecent(storage, now),
    });
    if (verdict === "honeypot") return; // a bot: do nothing, say nothing

    const parsed = contactSchema(form.errors).safeParse({
      name: text("name"),
      phone: text("phone"),
      business: text("business"),
      need,
      details: text("message"),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setStatus({ kind: "idle" });
      focusFirstError(formElement);
      return;
    }
    setErrors({});

    if (verdict === "too-fast") return setStatus({ kind: "blocked", message: form.errors.tooFast });
    if (verdict === "rate-limited") return setStatus({ kind: "blocked", message: form.errors.rateLimit });

    const value = parsed.data;
    const t = form.messageTemplate;
    const message = [
      t.intro,
      `${t.name}: ${value.name}`,
      value.business && `${t.business}: ${value.business}`,
      `${t.need}: ${value.need}`,
      value.details && `${t.details}: ${value.details}`,
    ]
      .filter(Boolean)
      .join("\n");

    const context: SubmitContext = { whatsappNumber, email: site.email, subject: form.emailSubject, message };
    const result: SubmitResult = hasApi
      ? await submitLead(
          {
            kind: showMessage ? "contact" : "free-design",
            locale,
            page: window.location.pathname,
            fields: { name: value.name, phone: value.phone, business: value.business, need: value.need, details: value.details },
          },
          context,
        )
      : whatsappSubmission(context);

    recordSend(storage, now);
    if (result.channel === "whatsapp") {
      // No "noopener" here: it would make window.open() return null. We cut the link ourselves.
      const opened = window.open(result.url, "_blank");
      if (opened) opened.opener = null;
      setStatus({ kind: "sent", whatsappUrl: result.url, emailUrl: result.emailUrl });
    } else {
      setStatus({ kind: "sent", whatsappUrl: `https://wa.me/${whatsappNumber}`, emailUrl: `mailto:${site.email}` });
    }
    formElement.reset();
    setNeed("");
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
      <Honeypot />

      <div className={styles.contactFormRow}>
        <label className={styles.contactFormField}>
          {form.fields.name.label}
          <input
            name="name"
            type="text"
            autoComplete="name"
            maxLength={80}
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
            dir="ltr"
            autoComplete="tel"
            inputMode="tel"
            maxLength={24}
            placeholder={form.fields.phone.placeholder}
            {...fieldProps("phone")}
          />
          {error("phone")}
        </label>
      </div>

      <label className={styles.contactFormField}>
        {form.fields.business.label}
        <input name="business" type="text" maxLength={120} autoComplete="organization" placeholder={form.fields.business.placeholder} />
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
          <textarea name="message" rows={4} maxLength={1000} placeholder={form.fields.message.placeholder} />
        </label>
      )}

      <button type="submit" className={styles.contactFormSubmit}>
        {form.submit}
      </button>
      <p className={styles.contactFormNote}>{form.note}</p>
      <FormFeedback status={status} labels={{ sent: form.sent, openWhatsapp: form.openWhatsapp, emailFallback: form.emailFallback }} />

      <ul className={styles.contactFormPromises}>
        {form.promises.map((promise) => (
          <li key={promise}>{promise}</li>
        ))}
      </ul>
    </form>
  );
}
