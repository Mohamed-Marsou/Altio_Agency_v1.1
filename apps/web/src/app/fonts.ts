import { IBM_Plex_Sans_Arabic, Inter, Plus_Jakarta_Sans } from "next/font/google";

// Fonts: next/font downloads them at BUILD time and serves them from our own
// site (no request to Google when a visitor loads the page). Each font becomes
// a CSS variable (--font-display / --font-text / --font-arabic) used by the
// typography tokens.
export const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const text = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-text",
  display: "swap",
});

// Arabic font. preload: false = no <link rel="preload"> on English and French
// pages. The browser only downloads the file when the page really uses the
// family, which only happens when <html dir="rtl"> is set (the /ar pages).
export const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-arabic",
  display: "swap",
  preload: false,
});
