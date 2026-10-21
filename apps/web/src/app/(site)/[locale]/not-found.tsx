import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar/Navbar";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import { getNotFound, getWhatsAppUrl } from "@/lib/content";
import styles from "./not-found.module.scss";

export const metadata: Metadata = {
  title: "Page not found | Altio",
};

// The 404 page. With the static export Next turns this file into 404.html, which
// the web server shows for any address that does not exist (see the .htaccess
// step in the hosting plan). A broken browser window with the Altio mark as the
// zero, and ways out: home, WhatsApp, and the most popular pages.
export default function NotFound() {
  const content = getNotFound();

  return (
    <>
      <Navbar currentPath="" />
      <main className={styles.notFound}>
        <div className={styles.notFoundContent}>
          <div className={styles.notFoundWindow}>
            <div className={styles.notFoundBar}>
              <i />
              <i />
              <i />
              <span>{content.url}</span>
            </div>
            <div className={styles.notFoundBody}>
              <p className={styles.notFoundNumber} aria-hidden="true">
                <span>4</span>
                <span className={styles.notFoundZero}>
                  <svg viewBox="0 0 64 64">
                    <path d="M32 6 58 58H46L32 28 20 52h13l3 6H6L32 6Z" fill="currentColor" />
                  </svg>
                </span>
                <span>4</span>
              </p>
              <h1 className={styles.notFoundTitle}>{content.title}</h1>
              <p className={styles.notFoundLead}>{content.lead}</p>
              <div className={styles.notFoundActions}>
                <Link href="/" className={styles.notFoundHome}>
                  {content.home}
                </Link>
                <MorphButton
                  href={getWhatsAppUrl(content.whatsapp.message)}
                  label={content.whatsapp.label}
                  hoverLabel="Send us a message"
                  size="large"
                />
              </div>
            </div>
          </div>

          <div className={styles.notFoundPopular}>
            <p>{content.popularTitle}</p>
            <ul>
              {content.popular.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
