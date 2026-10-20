"use client";

import clsx from "clsx";
import { useId, useState, type FormEvent } from "react";
import type { ReferralsContent } from "@/lib/content";
import styles from "@/components/sections/ContactPage/ContactForm.module.scss";

type ReferralFormProps = {
  form: ReferralsContent["form"];
  whatsappNumber: string;
};

type Errors = Partial<Record<"yourName" | "yourPhone" | "theirName", string>>;

// "Refer someone": same idea as the contact form. It checks the answers, builds a
// WhatsApp message with them and opens WhatsApp, so nothing is stored by us. It
// re-uses the contact form's styles on purpose, so both forms look identical.
export default function ReferralForm({ form, whatsappNumber }: ReferralFormProps) {
  const baseId = useId();
  const [reward, setReward] = useState(form.rewardOptions[0]);
  const [errors, setErrors] = useState<Errors>({});

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const yourName = String(data.get("yourName") ?? "").trim();
    const yourPhone = String(data.get("yourPhone") ?? "").trim();
    const theirName = String(data.get("theirName") ?? "").trim();
    const theirPhone = String(data.get("theirPhone") ?? "").trim();

    const found: Errors = {};
    if (!yourName) found.yourName = form.errors.yourName;
    if (yourPhone.replace(/\D/g, "").length < 8) found.yourPhone = form.errors.yourPhone;
    if (!theirName) found.theirName = form.errors.theirName;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const t = form.messageTemplate;
    const lines = [
      t.intro,
      `${t.yourName}: ${yourName} (${yourPhone})`,
      `${t.theirName}: ${theirName}`,
      theirPhone && `${t.theirPhone}: ${theirPhone}`,
      `${t.reward}: ${reward}`,
    ].filter(Boolean);
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
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

      <div className={styles.contactFormRow}>
        <label className={styles.contactFormField}>
          {f.yourName.label}
          <input name="yourName" type="text" autoComplete="name" placeholder={f.yourName.placeholder} {...fieldProps("yourName")} />
          {error("yourName")}
        </label>
        <label className={styles.contactFormField}>
          {f.yourPhone.label}
          <input name="yourPhone" type="tel" autoComplete="tel" inputMode="tel" placeholder={f.yourPhone.placeholder} {...fieldProps("yourPhone")} />
          {error("yourPhone")}
        </label>
      </div>

      <div className={styles.contactFormRow}>
        <label className={styles.contactFormField}>
          {f.theirName.label}
          <input name="theirName" type="text" placeholder={f.theirName.placeholder} {...fieldProps("theirName")} />
          {error("theirName")}
        </label>
        <label className={styles.contactFormField}>
          {f.theirPhone.label}
          <input name="theirPhone" type="tel" inputMode="tel" placeholder={f.theirPhone.placeholder} />
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
      <ul className={styles.contactFormPromises}>
        {form.promises.map((promise) => (
          <li key={promise}>{promise}</li>
        ))}
      </ul>
    </form>
  );
}
