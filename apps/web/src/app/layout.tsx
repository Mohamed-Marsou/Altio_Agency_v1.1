import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import CustomCursor from "@/components/ui/CustomCursor/CustomCursor";
import "./globals.scss";

// Fonts: next/font downloads them at BUILD time and serves them from our own
// site (no request to Google when a visitor loads the page). Each font becomes
// a CSS variable (--font-display / --font-text) used by the typography tokens.
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const text = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Altio",
  description: "Custom websites and web apps for businesses in Morocco.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-theme="light" picks the light tokens (dark mode comes later)
    <html lang="en" data-theme="light" className={`${display.variable} ${text.variable}`}>
      <body>
        {children}
        {/* The brand cursor + click ripple (only runs on devices with a mouse) */}
        <CustomCursor />
      </body>
    </html>
  );
}
