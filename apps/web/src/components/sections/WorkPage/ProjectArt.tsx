import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./ProjectArt.module.scss";

type ProjectArtProps = {
  /** estate | store | app | managed: which drawing to show. */
  kind: string;
  /** Address shown in the little browser bar. Empty = private project. */
  url: string;
  isLive: boolean;
  liveLabel: string;
  privateLabel: string;
  privatePreviewLabel: string;
  /** Hero version: bigger and gently floating. */
  isLarge?: boolean;
};

// The picture of a project: a browser window drawn with CSS, tinted by the
// project's own colour (data-vibe sets --pv on a parent). It is a stand-in until
// real screenshots exist; then only the <div> of the window is replaced by an
// <Image>. Decorative, so aria-hidden. Server component.
function Tiles({ names, meta }: { names: string[]; meta: string[] }) {
  return (
    <div className={styles.projectArtTiles}>
      {names.map((name, index) => (
        <span key={name} className={styles.projectArtTile}>
          <i />
          <b>{name}</b>
          {meta[index]}
        </span>
      ))}
    </div>
  );
}

const BODIES: Record<string, ReactNode> = {
  estate: (
    <>
      <span className={clsx(styles.projectArtLine, styles.projectArtLineStrong)} />
      <span className={styles.projectArtLine} style={{ width: "80%" }} />
      <Tiles
        names={["Villa Malabata", "Apartment Centre", "Riad Kasbah"]}
        meta={["4 bed · Tangier", "2 bed · Centre", "6 bed · Old town"]}
      />
      <span className={styles.projectArtPill} />
    </>
  ),
  store: (
    <>
      <span className={clsx(styles.projectArtLine, styles.projectArtLineStrong)} style={{ width: "45%" }} />
      <Tiles names={["Linen shirt", "Denim jacket", "Canvas bag"]} meta={["320 MAD", "540 MAD", "180 MAD"]} />
      <span className={styles.projectArtPill} style={{ width: "7.5rem" }} />
    </>
  ),
  app: (
    <>
      <div className={styles.projectArtTiles}>
        {[
          ["Today", "18 visits"],
          ["Waiting", "3 patients"],
          ["Unpaid", "2 invoices"],
        ].map(([name, meta]) => (
          <span key={name} className={styles.projectArtTile}>
            <b>{name}</b>
            {meta}
          </span>
        ))}
      </div>
      <span className={styles.projectArtLine} style={{ width: "90%" }} />
      <span className={styles.projectArtLine} style={{ width: "70%" }} />
      <span className={styles.projectArtPill} style={{ width: "8rem" }} />
    </>
  ),
  managed: (
    <>
      <span className={clsx(styles.projectArtLine, styles.projectArtLineStrong)} style={{ width: "50%" }} />
      <span className={styles.projectArtLine} style={{ width: "90%" }} />
      <span className={styles.projectArtLine} style={{ width: "65%" }} />
      <span className={styles.projectArtPill} />
    </>
  ),
};

export default function ProjectArt({
  kind,
  url,
  isLive,
  liveLabel,
  privateLabel,
  privatePreviewLabel,
  isLarge = false,
}: ProjectArtProps) {
  return (
    <div className={clsx(styles.projectArt, isLarge && styles.projectArtIsLarge)} aria-hidden="true">
      <span className={clsx(styles.projectArtStatus, !isLive && styles.projectArtStatusIsPrivate)}>
        <i />
        {isLive ? liveLabel : privateLabel}
      </span>

      <div className={styles.projectArtWindow}>
        <div className={styles.projectArtBar}>
          <i />
          <i />
          <i />
          <span>{url || privatePreviewLabel}</span>
        </div>
        <div className={styles.projectArtBody}>{BODIES[kind] ?? BODIES.managed}</div>
      </div>
    </div>
  );
}
