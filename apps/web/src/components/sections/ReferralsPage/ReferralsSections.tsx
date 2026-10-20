import type { CSSProperties } from "react";
import { getReferrals, getWhatsAppUrl } from "@/lib/content";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import Reveal from "@/components/ui/Reveal/Reveal";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import ReferralForm from "./ReferralForm";
import styles from "./ReferralsSections.module.scss";

// Everything on the Referrals page: hero, three steps, reward choices and rules,
// and the form. Server component (the form is the only client part).
export default function ReferralsSections({ whatsappNumber }: { whatsappNumber: string }) {
  const { hero, steps, rewards, form } = getReferrals();

  return (
    <>
      <header className={styles.referralsHero}>
        <div className={styles.referralsHeroContent}>
          <div className={styles.referralsHeroText}>
            <p className={styles.referralsEyebrow}>{hero.eyebrow}</p>
            <h1 className={styles.referralsTitle}>
              {hero.title} <span>{hero.accent}</span>
            </h1>
            <p className={styles.referralsLead}>{hero.lead}</p>
            <div className={styles.referralsActions}>
              <MorphButton
                href={getWhatsAppUrl(hero.primary.message)}
                label={hero.primary.label}
                hoverLabel={hero.primary.hoverLabel}
                size="large"
              />
              <a href="#refer-form" className={styles.referralsSecondary}>
                {hero.secondary}
              </a>
            </div>
          </div>

          <div className={styles.referralsGift} aria-hidden="true">
            <span className={styles.referralsGiftLink} />
            {hero.cards.map((card, index) => (
              <span
                key={card.title}
                className={styles.referralsGiftCard}
                data-index={index}
                style={{ "--card": index } as CSSProperties}
              >
                <i>{card.number}</i>
                <b>{card.title}</b>
                {card.text}
              </span>
            ))}
          </div>
        </div>
      </header>

      <Reveal>
        <section className={`${styles.referralsSection} ${styles.referralsSectionIsWhite}`}>
          <div className={styles.referralsContent}>
            <SectionHeading eyebrow={steps.eyebrow} title={steps.title} />
            <ol className={styles.referralsSteps}>
              {steps.items.map((item, index) => (
                <li key={item.title} className={styles.referralsStep}>
                  <span>{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={styles.referralsSection}>
          <div className={styles.referralsContent}>
            <SectionHeading eyebrow={rewards.eyebrow} title={rewards.title} subtitle={rewards.lead} />
            <ul className={styles.referralsRewards}>
              {rewards.items.map((item) => (
                <li key={item.title} className={styles.referralsReward}>
                  <span>{item.icon}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
            <ul className={styles.referralsRules}>
              {rewards.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="refer-form" className={`${styles.referralsSection} ${styles.referralsSectionIsWhite}`}>
          <div className={styles.referralsFormWrap}>
            <ReferralForm form={form} whatsappNumber={whatsappNumber} />
          </div>
        </section>
      </Reveal>
    </>
  );
}
