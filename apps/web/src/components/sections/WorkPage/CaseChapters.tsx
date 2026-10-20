import clsx from "clsx";
import type { CSSProperties } from "react";
import type { Project, WorkPageContent } from "@/lib/content";
import InView from "@/components/ui/InView/InView";
import Reveal from "@/components/ui/Reveal/Reveal";
import CaseVisual from "./CaseVisual";
import styles from "./CaseChapters.module.scss";

type CaseChaptersProps = {
  project: Project;
  content: WorkPageContent;
};

// The story of a project, told in six chapters:
//   problem > journey > what we built > before and after > result and quote.
// Every chapter sits in <Reveal> (slides up) and the parts that "move"
// (notes, timeline, bars) start when they scroll into view (<InView>).
// data-vibe on the wrapper gives the whole story the project's colour.
export default function CaseChapters({ project, content }: CaseChaptersProps) {
  const { case: study } = project;
  const text = content.case;

  return (
    <div data-vibe={project.vibe}>
      {/* 1. The problem ------------------------------------------------------------------ */}
      <Reveal>
        <section className={styles.caseChapter}>
          <div className={clsx(styles.caseChapterContent, styles.caseChapterSplit)}>
            <div className={styles.caseChapterText}>
              <p className={styles.caseKicker}>{text.problemKicker}</p>
              <h2 className={styles.caseTitle}>{study.problem.title}</h2>
              <p className={styles.caseLead}>{study.problem.lead}</p>
              <ul className={styles.casePains}>
                {study.problem.pains.map((pain) => (
                  <li key={pain}>{pain}</li>
                ))}
              </ul>
            </div>

            <InView className={styles.caseBefore}>
              <div className={styles.caseBeforeWindow} aria-hidden="true">
                <span className={clsx(styles.caseBeforeLine, styles.caseBeforeLineStrong)} />
                <span className={styles.caseBeforeLine} />
                <span className={styles.caseBeforeLine} style={{ width: "55%" }} />
                <span className={styles.caseBeforeBlock} />
                <span className={styles.caseBeforeLine} style={{ width: "80%" }} />
              </div>
              {study.problem.notes.map((note, index) => (
                <span
                  key={note}
                  className={clsx(styles.caseNote, styles[`caseNote${index + 1}`])}
                  style={{ "--delay": `${0.3 + index * 0.25}s` } as CSSProperties}
                >
                  {note}
                </span>
              ))}
            </InView>
          </div>
        </section>
      </Reveal>

      {/* 2. The journey ----------------------------------------------------------------- */}
      <Reveal>
        <section className={clsx(styles.caseChapter, styles.caseChapterIsWhite)}>
          <div className={styles.caseChapterContent}>
            <div className={styles.caseChapterText}>
              <p className={styles.caseKicker}>{text.journeyKicker}</p>
              <h2 className={styles.caseTitle}>{text.journeyTitle}</h2>
            </div>

            <InView className={styles.caseJourney}>
              <ol className={styles.caseJourneyList}>
                {study.journey.map((step, index) => (
                  <li
                    key={step.title}
                    className={styles.caseStep}
                    style={{ "--step": index } as CSSProperties}
                  >
                    <span className={styles.caseStepDot}>{index + 1}</span>
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

      {/* 3. What we built ------------------------------------------------------------- */}
      <Reveal>
        <section className={styles.caseChapter}>
          <div className={styles.caseChapterContent}>
            <div className={styles.caseChapterText}>
              <p className={styles.caseKicker}>{text.builtKicker}</p>
              <h2 className={styles.caseTitle}>{text.builtTitle}</h2>
            </div>

            <ul className={styles.caseBuilt}>
              {study.built.map((item) => (
                <li key={item.title} className={styles.caseBuiltCard}>
                  <CaseVisual kind={item.visual} />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      {/* 4. Before and after --------------------------------------------------------- */}
      <Reveal>
        <section className={clsx(styles.caseChapter, styles.caseChapterIsWhite)}>
          <div className={styles.caseChapterContent}>
            <div className={styles.caseChapterText}>
              <p className={styles.caseKicker}>{text.compareKicker}</p>
              <h2 className={styles.caseTitle}>{text.compareTitle}</h2>
            </div>

            <InView className={styles.caseCompare}>
              {(["before", "after"] as const).map((side) => (
                <div
                  key={side}
                  className={clsx(styles.casePane, side === "after" && styles.casePaneIsAfter)}
                >
                  <h3>{text[side]}</h3>
                  {study.compare[side].map((row, index) => (
                    <div
                      key={row.label}
                      className={styles.caseBar}
                      style={{ "--value": `${row.value}%`, "--delay": `${index * 0.15}s` } as CSSProperties}
                    >
                      <div>
                        <span>{row.label}</span>
                        <b>{row.value}</b>
                      </div>
                      <i />
                    </div>
                  ))}
                </div>
              ))}
            </InView>
          </div>
        </section>
      </Reveal>

      {/* 5. The result + quote ------------------------------------------------------ */}
      <Reveal>
        <section className={styles.caseChapter}>
          <div className={styles.caseChapterContent}>
            <div className={styles.caseChapterText}>
              <p className={styles.caseKicker}>{text.resultsKicker}</p>
              <h2 className={styles.caseTitle}>{text.resultsTitle}</h2>
            </div>

            <ul className={styles.caseResults}>
              {study.results.map((result) => (
                <li key={result.label} className={styles.caseResult}>
                  <b>{result.value}</b>
                  <span>{result.label}</span>
                  <small>{result.note}</small>
                </li>
              ))}
            </ul>
            <p className={styles.caseSample}>{content.sampleNote}</p>

            <figure className={styles.caseQuote}>
              <blockquote>“{study.quote.text}”</blockquote>
              <figcaption>{study.quote.by}</figcaption>
            </figure>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
