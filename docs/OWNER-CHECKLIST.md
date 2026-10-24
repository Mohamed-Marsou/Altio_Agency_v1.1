# Owner checklist: what is needed to go live

The code is finished and tested. These are the only things that need a person.
**Part A is information to send to the developer (Claude).** Parts B to E are your own checks.

---

## A. Information to send (about 15 minutes)

Send these in one message. Each one is changed in a single place and then appears on every page, in all three languages.

| # | What | Where it shows | Example |
|---|---|---|---|
| 1 | **WhatsApp number** (international form, digits) | every WhatsApp button, the forms, footer, contact page, Google data | `212661234567` |
| 2 | **Phone as you want it written** | footer, contact, privacy and terms | `+212 6 61 23 45 67` |
| 3 | **Business email** | footer, contact, privacy and terms, email fallback of the forms | `hello@yourdomain.ma` |
| 4 | **Domain name** and whether it is `yourdomain.ma` or `www.yourdomain.ma` | links, sitemap, social cards, 404 page | `altio.ma` |
| 5 | **City and public address** (or only the city) and the **GPS point** if you want a map pin | Google data, contact page | Tangier |
| 6 | **Opening hours** (the site says Monday to Friday 09:00 to 18:00 and Saturday 10:00 to 14:00) | contact, about, Google data | confirm or correct |
| 7 | **Social links** to show (or "none") | footer | Instagram, LinkedIn |
| 8 | **Legal name** and registration number, for the Privacy and Terms pages | privacy, terms | |
| 9 | **Default language** of the site (what `/` should show first) | the language chooser | English, French or Arabic |
| 10 | **Arabic style**: confirm Modern Standard Arabic, Western digits (0 to 9) | all Arabic pages | yes / change |
| 11 | **The four case studies**: which are real? For each: keep (real), or "label as concept", or remove. For the real ones: the client's written permission and the measured results | Work page, home page | see `docs/content-audit.md`, section 1 |
| 12 | **Prices on the site?** (current decision: no public prices) | packs | no |

When the data is in, one file holds it: `apps/web/src/content/shared/site.json`. Setting `"verified": true` in it tells the release build that a person checked it.

## B. Read and approve the text

The French and Arabic texts were written by Claude as **drafts**. Every file is listed in `apps/web/src/content/review-status.json` as `draft` until a person has read it.

1. **English:** read every page and the claims list `docs/content-audit.md`. For each line write Keep, Change to ..., Remove or Label as concept.
2. **French:** a fluent French reader checks all French files, then those files are set to `reviewed`.
3. **Arabic:** a fluent Arabic reader checks all Arabic files (grammar, tone, culture), then they are set to `reviewed`.
4. **Legal pages** (Privacy, Terms, cookies information): a lawyer reads them in each language you publish. The pages say "draft, to be reviewed by a lawyer" until then.

The release build **refuses to run while any text is still a draft**, so nothing unreviewed can go live by accident.

## C. Look at it with your own eyes (what a computer cannot judge)

Open the site in **light and dark**, in **English, French and Arabic**, on a **real phone** and a computer:

- spacing, alignment, colours on brand, pictures sharp;
- Arabic fully mirrored (menu, arrows, cards), long French texts not breaking boxes;
- the small drawings inside the pages contain a few **English words** (shop, dashboard, booking). On the French and Arabic sites they stay English. Tell Claude if you want them translated.
- the intro loading screen: it looks good but adds about one second. Keep it, or switch it off (`NEXT_PUBLIC_SITE_LOADER=off`) for better Google speed scores.

Then:
1. Send each form (contact, free design, referral) from your own phone, with a good number, a wrong number and an empty field. Check the WhatsApp message is readable, in the right language.
2. Click every phone, email and WhatsApp link on every page.
3. Open the site on mobile data (not Wi-Fi) and feel whether it is fast.
4. Safari on iPhone and Chrome on Android.
5. Approve or reject the visual snapshot changes if any (`npm run e2e` shows a difference only when something changed).

## D. Accounts

- **Google Search Console** and **Bing Webmaster Tools** for the domain: add the site, submit `https://yourdomain.ma/sitemap.xml`, ask to index the three home pages.
- **Google Business Profile**: same name, address and phone as the site.
- **Hostinger FTP details** as GitHub secrets (never in chat or code): `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`; variables `FTP_DIR` and `SITE_URL`. See `docs/DEPLOY.md`.

## E. Go live

1. Part A done and `site.json` verified.
2. Texts reviewed (Part B).
3. Part C done.
4. `npm run build:release` is green (it stops with a clear list if something is left).
5. Merge to `main`: the deploy workflow uploads the site and runs the smoke test.
6. Open the live site once from a phone.
