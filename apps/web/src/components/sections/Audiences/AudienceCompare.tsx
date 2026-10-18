"use client";

import clsx from "clsx";
import { ArrowRight, Building2, Check, ShieldCheck, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Tooltip from "@/components/ui/Tooltip/Tooltip";
import type { AudiencesContent } from "@/lib/content";
import AudienceChart from "./AudienceChart";
import styles from "./AudienceCompare.module.scss";

type AudienceCompareProps = {
  data: AudiencesContent;
};

// Icon of each option, looked up by its key in the content file.
const optionIcons = {
  business: Building2,
  individuals: User,
};

// The interactive block: two audience cards on one side, the growth chart on
// the other. CLICKING (or tapping, or pressing Enter/Space on) a card selects it;
// the card opens and the chart replays its animation for that audience.
// Hovering does nothing on purpose: the visitor decides when to switch.
//
// `playId` is a counter that drives the animation:
//    0   = the section is not on screen, the chart waits (lines undrawn);
//    1+  = on screen. It goes up every time the visitor picks another card, and
//          the chart restarts because React re-creates it when the number changes.
export default function AudienceCompare({ data }: AudienceCompareProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeKey, setActiveKey] = useState(data.options[0].key);
  const [playId, setPlayId] = useState(0);

  // Start the animation when the block scrolls into view, and reset it when it
  // has fully left, so it plays again next time (like the Reveal slide).
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.2) setPlayId((current) => (current === 0 ? 1 : current));
        else if (entry.intersectionRatio === 0) setPlayId(0);
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const select = (key: string) => {
    if (key === activeKey) return;
    setActiveKey(key);
    setPlayId((current) => (current === 0 ? 0 : current + 1));
  };

  const activeOption = data.options.find((option) => option.key === activeKey) ?? data.options[0];

  return (
    <div ref={rootRef} className={styles.audienceCompare}>
      <div className={styles.audienceCompareOptions} role="group" aria-label={data.optionsLabel}>
        {data.options.map((option) => {
          const isSelected = option.key === activeKey;
          const Icon = optionIcons[option.key as keyof typeof optionIcons];

          return (
            <div
              key={option.key}
              className={clsx(styles.audienceOption, isSelected && styles.audienceOptionIsSelected)}
            >
              <button
                type="button"
                className={styles.audienceOptionHeader}
                aria-expanded={isSelected}
                aria-controls={`audience-panel-${option.key}`}
                onClick={() => select(option.key)}
              >
                <span className={styles.audienceOptionIconTile}>
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span className={styles.audienceOptionHeading}>
                  <span className={styles.audienceOptionTitle}>{option.title}</span>
                  <span className={styles.audienceOptionAudience}>{option.audience}</span>
                </span>
                <span className={styles.audienceOptionArrow} aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              </button>

              {/* The details slide open for the selected card only */}
              <div className={styles.audienceOptionBody}>
                <div className={styles.audienceOptionBodyInner}>
                  <p className={styles.audienceOptionValue}>{option.value}</p>
                  <ul className={styles.audienceOptionOutcomes}>
                    {option.outcomes.map((outcome) => (
                      <li key={outcome} className={styles.audienceOptionOutcome}>
                        <Check size={16} aria-hidden="true" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.audienceOptionChips}>
                    {option.chips.map((chip) => (
                      <Tooltip key={chip.label} text={chip.tip} align="start">
                        <span className={styles.audienceOptionChip}>{chip.label}</span>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className={styles.audienceNote}>
          <ShieldCheck size={22} aria-hidden="true" />
          <div className={styles.audienceNoteText}>
            <p className={styles.audienceNoteTitle}>{data.note.title}</p>
            <p>{data.note.text}</p>
          </div>
        </div>
      </div>

      <AudienceChart
        option={activeOption}
        chart={data.chart}
        playId={playId}
        panelId={`audience-panel-${activeOption.key}`}
      />
    </div>
  );
}
