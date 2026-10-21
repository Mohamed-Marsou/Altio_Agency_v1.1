import type { Metadata } from "next";
import ErrorReporter from "@/components/system/ErrorReporter";
import { ADMIN_THEME_INIT_SCRIPT } from "@/lib/theme";
import { display, text } from "../fonts";
import "../globals.scss";

// The private admin area. It has its OWN root layout, so it never gets the
// public footer, loading screen or custom cursor.
export const metadata: Metadata = {
  title: "Altio admin",
  robots: { index: false, follow: false },
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
