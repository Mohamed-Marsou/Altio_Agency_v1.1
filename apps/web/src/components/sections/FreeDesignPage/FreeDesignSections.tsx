import type { CSSProperties } from "react";
import ContactForm from "@/components/sections/ContactPage/ContactForm";
import InView from "@/components/ui/InView/InView";
import Reveal from "@/components/ui/Reveal/Reveal";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { getFreeDesign } from "@/lib/content";
import styles from "./FreeDesignSections.module.scss";

// The Free design landing page: the offer and a short form side by side, what
// you get, and what happens next. This page is the target of most "Get your free
// design" buttons, so the form is the first thing in view. Server component.
export default function FreeDesignSections({ whatsappNumber }: { whatsappNumber: string }) {
  const { hero, form, get, next } = getFreeDesign();

  return (
    <>
      <header className={styles.freeDesignHero}>
        <div className={styles.freeDesignHeroContent}>
          <div className={styles.freeDesignHeroText}>
            <p className={styles.freeDesignEyebrow}>{hero.eyebrow}</p>
            <h1 className={styles.freeDesignTitle}>
              {hero.title} <span>{hero.accent}</span>
            </h1>
            <p className={styles.freeDesignLead}>{hero.lead}</p>
            <p className={styles.freeDesignClock}>
              <b>{hero.clockValue}</b>
              <span>
                {hero.clockText[0]}
                <br />
                {hero.clockText[1]}
              </span>
            </p>
          </div>

          <ContactForm form={form} whatsappNumber={whatsappNumber} showMessage={false} />
        </div>
      </header>

      <Reveal>
        <section className={styles.freeDesignSection}>
          <div className={styles.freeDesignContent}>
            <SectionHeading eyebrow={get.eyebrow} title={get.title} />
            <ul className={styles.freeDesignGet}>
              {get.items.map((item, index) => (
                <li key={item.title} className={styles.freeDesignGetCard}>
                  <span className={styles.freeDesignGetArt} aria-hidden="true">
                    <i data-strong />
                    <i />
                    <i style={{ width: `${[75, 60, 85][index % 3]}%` }} />
                    {index === 0 && <i />}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={`${styles.freeDesignSection} ${styles.freeDesignSectionIsWhite}`}>
          <div className={styles.freeDesignContent}>
            <SectionHeading eyebrow={next.eyebrow} title={next.title} />
            <InView>
              <ol className={styles.freeDesignSteps}>
                {next.steps.map((step, index) => (
                  <li
                    key={step.title}
                    className={styles.freeDesignStep}
                    style={{ "--step": index } as CSSProperties}
                  >
                    <span>{index + 1}</span>
                    <small>{step.when}</small>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
            </InView>
          </div>
        </section>
      </Reveal>
    </>
  );
}
