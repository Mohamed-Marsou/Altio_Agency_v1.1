import type { Post } from "@/lib/content";
import BlogCover from "./BlogCover";
import styles from "./PostArticle.module.scss";

// Turns the list of blocks in posts.json into HTML: paragraphs, h2 headings
// (with ids, for the table of contents), a big pull quote, a tick-list callout
// and a figure. Server component. Content is plain text (no HTML), so it needs
// no sanitising.
export default function PostArticle({ post }: { post: Post }) {
  return (
    <div className={styles.postArticle}>
      {post.body.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={index} id={block.id} className={styles.postArticleHeading}>
                {block.text}
              </h2>
            );
          case "quote":
            return (
              <blockquote key={index} className={styles.postArticleQuote}>
                {block.text}
              </blockquote>
            );
          case "callout":
            return (
              <aside key={index} className={styles.postArticleCallout}>
                <p>{block.title}</p>
                <ul>
                  {block.items?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </aside>
            );
          case "figure":
            return (
              <figure key={index} className={styles.postArticleFigure}>
                <BlogCover kind={post.category} />
                <figcaption>{block.caption}</figcaption>
              </figure>
            );
          default:
            return <p key={index}>{block.text}</p>;
        }
      })}
    </div>
  );
}
