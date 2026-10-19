import Link from "next/link";
import { getFooter, getWhatsAppUrl } from "@/lib/content";
import Button from "@/components/ui/Button/Button";
import Logo from "@/components/ui/Logo/Logo";
import styles from "./Footer.module.scss";

// The bottom of every page: brand block, three link columns, legal line.
// Server component. It lives in the root layout, so every page gets it.
export default function Footer() {
  const footer = getFooter();

  return (
    <footer className={styles.footerRoot}>
      <div className={styles.footerContent}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Logo label={footer.logoLabel} />
            <p className={styles.footerDescription}>{footer.description}</p>
            <Button href={getWhatsAppUrl(footer.ctaMessage)}>{footer.ctaLabel}</Button>
          </div>

          {footer.columns.map((column) => (
            <nav key={column.title} className={styles.footerColumn} aria-label={column.title}>
              <h2 className={styles.footerColumnTitle}>{column.title}</h2>
              <ul className={styles.footerLinks}>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.footerLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className={styles.footerColumn}>
            <h2 className={styles.footerColumnTitle}>{footer.contact.title}</h2>
            <ul className={styles.footerLinks}>
              <li className={styles.footerText}>{footer.contact.location}</li>
              <li>
                <a
                  className={styles.footerLink}
                  href={getWhatsAppUrl(footer.ctaMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {footer.contact.whatsapp}
                </a>
              </li>
              <li>
                <a className={styles.footerLink} href={`mailto:${footer.contact.email}`}>
                  {footer.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerCopyright}>{footer.copyright}</p>
          <ul className={styles.footerLegal}>
            {footer.legal.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className={styles.footerLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
