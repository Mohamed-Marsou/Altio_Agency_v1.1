import { ArrowRight, Mail, MapPin, MessageCircle } from "lucide-react";
import { getContact, getWhatsAppUrl } from "@/lib/content";
import MapArt from "@/components/ui/MapArt/MapArt";
import styles from "./ContactMethods.module.scss";

// The three ways to reach us: WhatsApp (the big green one), email, and the
// place, followed by the reply-time note and a small map. Server component.
export default function ContactMethods() {
  const { methods } = getContact();

  return (
    <div className={styles.contactMethods}>
      <a
        className={`${styles.contactMethod} ${styles.contactMethodIsWhatsapp}`}
        href={getWhatsAppUrl(methods.whatsapp.message)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.contactMethodIcon}>
          <MessageCircle size={22} aria-hidden="true" />
        </span>
        <span className={styles.contactMethodText}>
          <b>{methods.whatsapp.title}</b>
          {methods.whatsapp.text}
        </span>
        <ArrowRight className={styles.contactMethodArrow} size={20} aria-hidden="true" />
      </a>

      <a className={styles.contactMethod} href={`mailto:${methods.email.address}`}>
        <span className={styles.contactMethodIcon}>
          <Mail size={22} aria-hidden="true" />
        </span>
        <span className={styles.contactMethodText}>
          <b>{methods.email.address}</b>
          {methods.email.text}
        </span>
        <ArrowRight className={styles.contactMethodArrow} size={20} aria-hidden="true" />
      </a>

      <div className={styles.contactMethod}>
        <span className={styles.contactMethodIcon}>
          <MapPin size={22} aria-hidden="true" />
        </span>
        <span className={styles.contactMethodText}>
          <b>{methods.location.title}</b>
          {methods.location.text}
        </span>
      </div>

      <p className={styles.contactMethodsReply}>
        <i aria-hidden="true" />
        {methods.reply}
      </p>

      <MapArt label={methods.mapLabel} isCompact />
    </div>
  );
}
