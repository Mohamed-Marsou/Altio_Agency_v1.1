import type { ReactNode } from "react";
import PostToc from "@/components/sections/BlogPage/PostToc";
import Button from "@/components/ui/Button/Button";
import { getLegal, getWhatsAppUrl, type LegalBlock, type LegalDoc } from "@/lib/content";
import styles from "./LegalPage.module.scss";

// One layout for every legal page (Privacy, Terms): a draft notice, the title,
// an "In short" summary in plain words, a sticky table of contents and the
// numbered sections. The sections come from legal.json as small typed blocks
// (paragraph, list, table, payment bar, callout), so adding a rule is a text
// edit, not a code change. Server component (only the contents list is client).
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  const { labels } = getLegal();

  const renderBlock = (block: LegalBlock, index: number): ReactNode => {
    switch (block.type) {
      case "ul":
        return (
          <ul key={index}>
            {block.items?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      case "table":
        return (
          <table key={index} className={styles.legalTable}>
            <thead>
              <tr>
                {block.head?.map((cell) => (
                  <th key={cell}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows?.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, cellIndex) => (
                    <td key={cell}>{cellIndex === 0 ? <b>{cell}</b> : cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "pay":
        return (
          <div key={index} className={styles.legalPay}>
            {block.parts?.map((part) => (
              <div key={part.label}>
                <b>{part.value}</b>
                <span>{part.label}</span>
              </div>
            ))}
          </div>
        );
      case "callout":
        return (
          <p key={index} className={styles.legalCallout}>
            {block.text}
          </p>
        );
      default:
        return <p key={index}>{block.text}</p>;
    }
  };

  return (
    <div data-vibe="web">
      <header className={styles.legalHeader}>
        <div className={styles.legalHeaderContent}>
          <span className={styles.legalDraft}>{labels.draft}</span>
          <h1 className={styles.legalTitle}>{doc.title}</h1>
          <p className={styles.legalUpdated}>
            {labels.updated}: {doc.updated}
          </p>
          <div className={styles.legalShort}>
            <p>{labels.shortTitle}</p>
            <ul>
              {doc.short.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <div className={styles.legalBody}>
        <aside className={styles.legalToc}>
          <PostToc title={labels.tocTitle} items={doc.sections.map((section) => ({ id: section.id, text: section.title }))} />
        </aside>

        <article className={styles.legalDoc}>
          {doc.sections.map((section, index) => (
            <section key={section.id} id={section.id} className={styles.legalSection}>
              <h2>
                <i>{index + 1}</i>
                {section.title}
              </h2>
              {section.blocks.map(renderBlock)}
            </section>
          ))}

          <div className={styles.legalAsk}>
            <h3>{doc.ask.title}</h3>
            <Button href={getWhatsAppUrl(doc.ask.message)} variant="primary">
              {doc.ask.cta}
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
