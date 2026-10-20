import styles from "./MapArt.module.scss";

type MapArtProps = {
  label: string;
  /** Smaller version for the Contact page. */
  isCompact?: boolean;
};

// A little stylised map (grid of streets, a road, the sea and a pin) drawn with
// CSS. It is a stand-in until a real map link is added. Decorative, so aria-hidden.
export default function MapArt({ label, isCompact = false }: MapArtProps) {
  return (
    <div className={isCompact ? styles.mapArtIsCompact : styles.mapArt} aria-hidden="true">
      <span className={styles.mapArtSea} />
      <span className={styles.mapArtRoad} />
      <span className={styles.mapArtPin} />
      <span className={styles.mapArtLabel}>{label}</span>
    </div>
  );
}
