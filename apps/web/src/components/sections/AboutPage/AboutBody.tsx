import type { CSSProperties } from "react";
import { getAbout } from "@/lib/content";
import MapArt from "@/components/ui/MapArt/MapArt";
import Reveal from "@/components/ui/Reveal/Reveal";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./AboutBody.module.scss";

// The rest of the About page: facts, story, principles, roles and the place.
// Every part slides up with <Reveal>. Server component.
export default function AboutBody() {
  const { numbers, story, principles, roles, place } = getAbout();

  return (
    <>
      <Reveal>
        <section className={styles.aboutNumbersSection}>
          <div className={styles.aboutContent}>
            <ul className={styles.aboutNumbers}>
              {numbers.map((item) => (
                <li key={item.label}>
                  <b>{item.value}</b>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={styles.aboutSection}>
          <div className={`${styles.aboutContent} ${styles.aboutStory}`}>
            <div>
              <p className={styles.aboutEyebrow}>{story.eyebrow}</p>
              <h2 className={styles.aboutStoryTitle}>{story.title}</h2>
            </div>
            <div className={styles.aboutStoryText}>
              <p className={styles.aboutStoryBig}>
                {story.big} <span>{story.bigAccent}</span>
              </p>
              {story.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={`${styles.aboutSection} ${styles.aboutSectionIsWhite}`}>
          <div className={styles.aboutContent}>
            <SectionHeading eyebrow={principles.eyebrow} title={principles.title} />
            <ul className={styles.aboutPrinciples}>
              {principles.items.map((item, index) => (
                <li key={item.title} className={styles.aboutPrinciple}>
                  <span className={styles.aboutPrincipleNumber}>{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={styles.aboutSection}>
          <div className={styles.aboutContent}>
            <SectionHeading eyebrow={roles.eyebrow} title={roles.title} />
            <ul className={styles.aboutRoles}>
              {roles.items.map((role) => (
                <li key={role.tag} className={styles.aboutRole}>
                  <span className={styles.aboutRoleArt} aria-hidden="true">
                    {role.bars.map((height, index) => (
                      <i
                        key={index}
                        style={{ "--height": `${height}%`, "--index": index } as CSSProperties}
                      />
                    ))}
                  </span>
                  <span className={styles.aboutRoleTag}>{role.tag}</span>
                  <h3>{role.title}</h3>
                  <ul className={styles.aboutRolePoints}>
                    {role.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <ul className={styles.aboutStack}>
              {roles.stack.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={styles.aboutPlaceSection}>
          <div className={styles.aboutContent}>
            <div className={styles.aboutPlace}>
              <div className={styles.aboutPlaceText}>
                <p className={styles.aboutEyebrow}>{place.eyebrow}</p>
                <h2 className={styles.aboutPlaceTitle}>{place.title}</h2>
                <p className={styles.aboutPlaceLead}>{place.text}</p>
                <dl className={styles.aboutHours}>
                  {place.hours.map((row) => (
                    <div key={row.day}>
                      <dt>{row.day}</dt>
                      <dd>{row.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <MapArt label={place.mapLabel} />
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
