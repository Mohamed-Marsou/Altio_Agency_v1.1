"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import site from "@/content/shared/site.json";
import type { ReferralsContent } from "@/lib/content";
import { fieldErrors, referralSchema } from "@/lib/forms/schemas";
import { HONEYPOT_FIELD, checkSpam, getSessionStorage, readRecent, recordSend } from "@/lib/forms/spam";
import { hasApi, submitLead, whatsappSubmission, type SubmitContext, type SubmitResult } from "@/lib/forms/submit";
import { useLocale } from "@/lib/use-locale";
import { FormFeedback, Honeypot, focusFirstError, type FormStatus } from "@/components/sections/ContactPage/FormParts";
import styles from "@/components/sections/ContactPage/ContactForm.module.scss";

type ReferralFormProps = {
  form: ReferralsContent["form"];
  whatsappNumber: string;
};

type Errors = Partial<Record<"yourName" | "yourPhone" | "theirName", string>>;

// "Refer someone": same idea as the contact form (same checks, same protection,
// same WhatsApp or backend path, see ContactForm.tsx). It re-uses the contact
// form's styles on purpose, so both forms look identical.
export default function ReferralForm({ form, whatsappNumber }: ReferralFormProps) {
  const baseId = useId();
  const locale = useLocale();
  const startedAt = useRef(0);
  const [reward, setReward] = useState(form.rewardOptions[0] ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });

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
    const verdict = checkSpam({ honeypot: text(HONEYPOT_FIELD), startedAt: startedAt.current, now, recent: readRecent(storage, now) });
    if (verdict === "honeypot") return;

    const parsed = referralSchema(form.errors).safeParse({
      yourName: text("yourName"),
      yourPhone: text("yourPhone"),
      theirName: text("theirName"),
      theirPhone: text("theirPhone"),
      reward,
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
      `${t.yourName}: ${value.yourName} (${value.yourPhone})`,
      `${t.theirName}: ${value.theirName}`,
      value.theirPhone && `${t.theirPhone}: ${value.theirPhone}`,
      `${t.reward}: ${value.reward}`,
    ]
      .filter(Boolean)
      .join("\n");

    const context: SubmitContext = { whatsappNumber, email: site.email, subject: form.emailSubject, message };
    const result: SubmitResult = hasApi
      ? await submitLead({ kind: "referral", locale, page: window.location.pathname, fields: { ...value } }, context)
      : whatsappSubmission(context);

    recordSend(storage, now);
    if (result.channel === "whatsapp") {
      const opened = window.open(result.url, "_blank");
      if (opened) opened.opener = null;
      setStatus({ kind: "sent", whatsappUrl: result.url, emailUrl: result.emailUrl });
    } else {
      setStatus({ kind: "sent", whatsappUrl: `https://wa.me/${whatsappNumber}`, emailUrl: `mailto:${site.email}` });
    }
    formElement.reset();
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

  const f = form.fields;

  return (
    <form className={styles.contactForm} onSubmit={onSubmit} noValidate>
      <h2 className={styles.contactFormTitle}>{form.title}</h2>
      <p className={styles.contactFormSubtitle}>{form.subtitle}</p>
      <Honeypot />

      <div className={styles.contactFormRow}>
        <label className={styles.contactFormField}>
          {f.yourName.label}
          <input name="yourName" type="text" autoComplete="name" maxLength={80} placeholder={f.yourName.placeholder} {...fieldProps("yourName")} />
          {error("yourName")}
        </label>
        <label className={styles.contactFormField}>
          {f.yourPhone.label}
          <input name="yourPhone" type="tel" dir="ltr" autoComplete="tel" inputMode="tel" maxLength={24} placeholder={f.yourPhone.placeholder} {...fieldProps("yourPhone")} />
          {error("yourPhone")}
        </label>
      </div>

      <div className={styles.contactFormRow}>
        <label className={styles.contactFormField}>
          {f.theirName.label}
          <input name="theirName" type="text" maxLength={120} placeholder={f.theirName.placeholder} {...fieldProps("theirName")} />
          {error("theirName")}
        </label>
        <label className={styles.contactFormField}>
          {f.theirPhone.label}
          <input name="theirPhone" type="tel" dir="ltr" inputMode="tel" maxLength={24} placeholder={f.theirPhone.placeholder} />
        </label>
      </div>

      <fieldset className={styles.contactFormField}>
        <legend>{f.reward.label}</legend>
        <div className={styles.contactFormOptions}>
          {form.rewardOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={clsx(styles.contactFormOption, reward === option && styles.contactFormOptionIsOn)}
              aria-pressed={reward === option}
              onClick={() => setReward(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

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
