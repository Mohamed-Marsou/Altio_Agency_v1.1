import clsx from "clsx";
import type { ReactNode } from "react";
import CoverImage from "@/components/ui/CoverImage/CoverImage";
import type { CoverImage as CoverImageData } from "@/lib/content";
import styles from "./BlogCover.module.scss";

type BlogCoverProps = {
  /** web | seo | shop | apps | tips: the topic sets the drawing and the colour. */
  kind: string;
  /** A wider, shorter version for article headers. */
  isWide?: boolean;
  /** A real picture from the media library: replaces the drawing. */
  image?: CoverImageData;
};

// The cover picture of an article: a little scene drawn with CSS, tinted by the
// topic colour (data-vibe on a parent sets --pv). Stand-in until real artwork
// exists. Decorative, so aria-hidden. Server component.
const SCENES: Record<string, ReactNode> = {
  web: (
    <>
      <span className={styles.blogCoverCard}>
        <i className={styles.blogCoverLineStrong} />
        <i />
        <i style={{ width: "70%" }} />
        <span className={styles.blogCoverTags}>
          <b>Home</b>
          <b>About</b>
          <b>Contact</b>
        </span>
      </span>
      <span className={styles.blogCoverChip}>Loads in 1.2 s</span>
    </>
  ),
  seo: (
    <>
      <span className={styles.blogCoverCard}>
        <i className={styles.blogCoverLineStrong} />
        <span className={styles.blogCoverBars}>
          <b style={{ height: "30%" }} />
          <b style={{ height: "45%" }} />
          <b style={{ height: "62%" }} />
          <b style={{ height: "80%" }} />
          <b style={{ height: "100%" }} />
        </span>
      </span>
      <span className={styles.blogCoverMagnifier} />
      <span className={styles.blogCoverChip}>Page 1</span>
    </>
  ),
  shop: (
    <>
      <span className={styles.blogCoverCard}>
        <i className={styles.blogCoverLineStrong} />
        <span className={styles.blogCoverTags}>
          <b>320 MAD</b>
          <b>In stock</b>
        </span>
        <i />
        <i style={{ width: "60%" }} />
      </span>
      <span className={styles.blogCoverChip}>New order</span>
    </>
  ),
  apps: (
    <>
      <span className={styles.blogCoverCard}>
        <i className={styles.blogCoverLineStrong} />
        <span className={styles.blogCoverTags}>
          <b>128</b>
          <b>342</b>
          <b>5</b>
        </span>
        <i />
        <i style={{ width: "75%" }} />
      </span>
      <span className={styles.blogCoverChip}>Admin panel</span>
    </>
  ),
  tips: (
    <>
      <span className={styles.blogCoverCard}>
        <i className={styles.blogCoverLineStrong} />
        <i />
        <i style={{ width: "80%" }} />
        <i style={{ width: "55%" }} />
      </span>
      <span className={styles.blogCoverChip}>5 min read</span>
    </>
  ),
};

export default function BlogCover({ kind, isWide = false, image }: BlogCoverProps) {
  if (image) {
    return (
      <div className={clsx(styles.blogCover, styles.blogCoverHasImage, isWide && styles.blogCoverIsWide)}>
        <CoverImage image={image} priority={isWide} sizes={isWide ? "100vw" : "(min-width: 1024px) 33vw, 100vw"} />
      </div>
    );
  }
  return (
    <div className={clsx(styles.blogCover, isWide && styles.blogCoverIsWide)} aria-hidden="true">
      <span className={styles.blogCoverCircle} />
      {SCENES[kind] ?? SCENES.tips}
    </div>
  );
}
