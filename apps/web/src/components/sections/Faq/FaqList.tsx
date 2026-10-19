"use client";

import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";
import styles from "./Faq.module.scss";

type FaqListProps = {
  items: { question: string; answer: string }[];
};

// The accordion. One question is open at a time (the first one at the start);
// clicking the open one closes it. Each answer slides open with the same
// "grid-template-rows 0fr -> 1fr" trick used in the Audiences cards.
export default function FaqList({ items }: FaqListProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className={styles.faqList}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const answerId = `${baseId}-answer-${index}`;

        return (
          <li key={item.question} className={clsx(styles.faqItem, isOpen && styles.faqItemIsOpen)}>
            <h3 className={styles.faqQuestionHeading}>
              <button
                type="button"
                className={styles.faqQuestion}
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className={styles.faqQuestionText}>{item.question}</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <Plus className={styles.faqIconPlus} size={20} />
                  <Minus className={styles.faqIconMinus} size={20} />
                </span>
              </button>
            </h3>

            <div id={answerId} className={styles.faqAnswer} role="region">
              <div className={styles.faqAnswerInner}>
                <p className={styles.faqAnswerText}>{item.answer}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
