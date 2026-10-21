import type { Metadata } from "next";
import { display, text } from "../fonts";
import "../globals.scss";

export const metadata: Metadata = {
  title: "Altio",
  robots: { index: false, follow: true },
};

// Root layout for the "/" page only (the language chooser).
export default function RootChooserLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
