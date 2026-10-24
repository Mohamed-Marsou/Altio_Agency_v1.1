import { redirect } from "next/navigation";
import { LOCALES } from "@/lib/i18n";

export const dynamicParams = false;

// /<lang>/cookies/ has no page of its own: the cookie information lives in the
// Privacy page. With the static export this builds a small page that redirects
// the visitor to /<lang>/privacy/#cookies (the footer link keeps working).
export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${LOCALES.includes(locale as (typeof LOCALES)[number]) ? locale : "en"}/privacy/#cookies`);
}
