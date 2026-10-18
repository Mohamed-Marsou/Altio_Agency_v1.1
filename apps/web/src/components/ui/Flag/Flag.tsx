import styles from "./Flag.module.scss";

export type FlagCode = "en" | "fr" | "ar";

// Round country flags drawn as tiny inline SVGs. (We do not use emoji flags:
// Windows shows them as plain letters like "GB".)
//   en = United Kingdom, fr = France, ar = Morocco (for when Arabic is added)
export default function Flag({ code }: { code: FlagCode }) {
  return (
    <span className={styles.flagCircle} aria-hidden="true">
      {code === "en" && (
        <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
          <rect width="60" height="30" fill="#012169" />
          <path d="M0 0l60 30M60 0L0 30" stroke="#fff" strokeWidth="6" />
          <path d="M0 0l60 30M60 0L0 30" stroke="#C8102E" strokeWidth="3" />
          <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
          <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
        </svg>
      )}
      {code === "fr" && (
        <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
          <rect width="10" height="20" fill="#0055A4" />
          <rect x="10" width="10" height="20" fill="#fff" />
          <rect x="20" width="10" height="20" fill="#EF4135" />
        </svg>
      )}
      {code === "ar" && (
        <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
          <rect width="30" height="20" fill="#C1272D" />
          <path
            d="M15 5.5l1.2 3.7h3.9l-3.1 2.3 1.2 3.7-3.2-2.3-3.2 2.3 1.2-3.7-3.1-2.3h3.9z"
            fill="none"
            stroke="#006233"
            strokeWidth="0.9"
          />
        </svg>
      )}
    </span>
  );
}
