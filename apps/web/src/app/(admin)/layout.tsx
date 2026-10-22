import type { Metadata } from "next";
import ErrorReporter from "@/components/system/ErrorReporter";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { ADMIN_THEME_INIT_SCRIPT } from "@/lib/theme";
import { display, text } from "../fonts";
import "../globals.scss";

// The private admin area. It has its OWN root layout, so it never gets the
// public footer, loading screen or custom cursor.
// Every admin page tells search engines: do not list it, do not follow its links, do not keep a copy,
// do not show a text snippet, do not index its pictures. (robots.txt and the server also say no.)
export const metadata: Metadata = {
  title: "Altio admin",
  robots: ADMIN_ROBOTS,
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ADMIN_THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ErrorReporter />
      </body>
    </html>
  );
}
