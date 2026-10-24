/* eslint-disable @next/next/no-html-link-for-pages -- plain links on purpose: this page has no language yet */
import type { Metadata } from "next";
import { display, text } from "./fonts";
import "./globals.scss";

export const metadata: Metadata = {
  title: "404 | Altio",
  robots: { index: false, follow: false },
};

// The 404 page for ANY address that does not exist (the web server shows
// 404.html, see public/.htaccess). The language is unknown here, so the message
// is written in all three languages, with a link to each home page.
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: "2rem", fontFamily: "var(--font-text-stack)" }}>
          <div>
            <h1 style={{ fontSize: "4rem", margin: 0 }}>404</h1>
            <p lang="en">This page does not exist.</p>
            <p lang="fr">Cette page n’existe pas.</p>
            <p lang="ar" dir="rtl">هذه الصفحة غير موجودة.</p>
            <p>
              <a href="/en/">English</a> · <a href="/fr/">Français</a> · <a href="/ar/" lang="ar">العربية</a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
