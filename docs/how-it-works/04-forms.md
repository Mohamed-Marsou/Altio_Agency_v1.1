# 04. Forms: contact, free design, referral

Three forms, one engine. There is no server yet, so a form "sends" by opening WhatsApp with the message already written (or an email draft). When the backend exists the same forms post to it.

## Files

| File | Role |
|---|---|
| `components/sections/ContactPage/ContactForm.tsx` | Contact page form and the free-design page form (`showMessage={false}` hides the long box) |
| `components/sections/ReferralsPage/ReferralForm.tsx` | "Refer someone" form (same logic, reuses the contact styles) |
| `components/sections/ContactPage/FormParts.tsx` | `Honeypot`, `FormFeedback` (sent message + links), `focusFirstError` |
| `lib/forms/phone.ts` | `normalizePhone`, `isValidPhone`, `formatPhone` |
| `lib/forms/schemas.ts` | Zod rules: `contactSchema`, `referralSchema`, `fieldErrors` |
| `lib/forms/spam.ts` | honeypot, minimum fill time, rate guard |
| `lib/forms/submit.ts` | WhatsApp / email links, `submitLead`, backend-ready path |
| `content/<lang>/contact.json`, `free-design.json`, `referrals.json` | labels, error texts, message template, "sent" texts (`form.errors`, `form.emailFallback`...) |

## What happens on submit (`ContactForm.tsx`, function `onSubmit`)
1. Spam check (below). A filled honeypot: nothing happens, no message.
2. Zod validation. Errors appear under the fields in the page language, fields get `aria-invalid` and `aria-describedby`, and the keyboard focus jumps to the first problem.
3. Too fast or too many sends: a message asks to try again.
4. The message text is built from `form.messageTemplate` (the visitor's language).
5. No backend: `whatsappSubmission()` gives a `wa.me` link, opened at once with `window.open` (it must be directly after the click, or browsers block it). Under the form: "WhatsApp is open..." plus two plain links (open WhatsApp again, send by email).
6. Backend configured (`NEXT_PUBLIC_API_URL`): `submitLead()` posts JSON to `/v1/leads` with an 8 second timeout and falls back to WhatsApp if it fails.

## Phones (`lib/forms/phone.ts`)
Accepted: `06 12 34 56 78`, `0612345678`, `+212 6 12 34 56 78`, `00212...`, `212...`, `612345678`, `+212 0612...`, separators ` .-()`. Moroccan numbers need 9 digits after +212 starting with 5, 6, 7 or 8. Other countries: `+` and 8 to 15 digits. Result is always `+212612345678` form. Refused: letters, too short/long, `+212 1...`.

## Spam control without a server (`lib/forms/spam.ts`)
- **Honeypot** field `company_site`: hidden with clip (not moved off screen, which broke Arabic layout), invisible to people and screen readers. Robots fill it.
- **Minimum fill time**: 3 seconds from when the form appeared.
- **Rate guard**: 3 sends per 10 minutes, kept in `sessionStorage` (works if storage is blocked).
These are only basic. The backend will add real checks.

## Limits (Zod)
Name 80, business 120, details 1000 characters, no control characters. WhatsApp links break when too long, so `limitMessage` cuts at 1400 characters with an ellipsis.

## Tests
`lib/forms/forms.test.ts` (30+ phone cases, schemas, spam, links, backend path), `components/sections/ContactPage/ContactForm.test.tsx` (French errors, focus, correct WhatsApp URL, robot ignored, too fast), `e2e/public/forms.spec.ts` (real browser incl. Arabic).
