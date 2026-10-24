import clsx from "clsx";
import { Check } from "lucide-react";
import { getServicesPage, getWhatsAppUrl, type ServicesPageItem } from "@/lib/content";
import InView from "@/components/ui/InView/InView";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import ServiceArt from "./ServiceArt";
import styles from "./ServiceBlock.module.scss";

type ServiceBlockProps = {
  item: ServicesPageItem;
  /** 0-based position: odd blocks are mirrored and sit on the white band. */
  index: number;
};

// One service of the Services page: text on one side, its illustration on the
// other. The id (launch, commerce, custom, managed) is the anchor the Home
// cards link to (/services/#custom). Server component, the illustration's
// entrance animation is handled by <InView>.
export default function ServiceBlock({ item, index }: ServiceBlockProps) {
  const page = getServicesPage();
  const isMirrored = index % 2 === 1;

  return (
    <section
      id={item.id}
      className={clsx(styles.serviceBlock, isMirrored && styles.serviceBlockIsMirrored)}
    >
      <div className={styles.serviceBlockContent}>
        <div className={styles.serviceBlockText}>
          <p className={styles.serviceBlockMeta}>
            <span className={styles.serviceBlockNumber}>
              {page.serviceLabel} {String(index + 1).padStart(2, "0")}
            </span>
            <span className={styles.serviceBlockPack}>
              {page.packLabel} {item.pack}
            </span>
            {item.mostUsed && <span className={styles.serviceBlockMostUsed}>{page.mostUsed}</span>}
          </p>

          <h2 className={styles.serviceBlockTitle}>{item.title}</h2>
          <p className={styles.serviceBlockLead}>{item.lead}</p>

          <ul className={styles.serviceBlockFeatures}>
            {item.features.map((feature) => (
              <li key={feature} className={styles.serviceBlockFeature}>
                <span className={styles.serviceBlockTick} aria-hidden="true">
                  <Check size={11} strokeWidth={3.5} />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <p className={styles.serviceBlockFit}>
            <b>{page.fitLabel}</b> {item.fit}
          </p>

          {/* The catchy CTA: blue, wiped by the green WhatsApp button on hover */}
          <MorphButton
            href={getWhatsAppUrl(item.cta.message)}
            label={item.cta.label}
            hoverLabel={item.cta.hoverLabel}
            size="large"
            variant={item.mostUsed ? "primary" : "outline"}
            className={styles.serviceBlockCta}
          />
        </div>

        <InView className={styles.serviceBlockArt}>
          <ServiceArt kind={item.art as "site" | "store" | "app" | "managed"} />
        </InView>
      </div>
    </section>
  );
}
