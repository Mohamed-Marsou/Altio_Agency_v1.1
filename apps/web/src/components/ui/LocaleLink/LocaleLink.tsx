"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ComponentProps } from "react";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n";

// Drop-in replacement for next/link: internal addresses get the current language
// in front ("/services/" becomes "/fr/services/" on the French site), so a visitor
// never falls back to another language by clicking a link.
export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : DEFAULT_LOCALE;
  const target = typeof href === "string" ? localePath(locale, href) : href;
  return <Link href={target} {...props} />;
}
