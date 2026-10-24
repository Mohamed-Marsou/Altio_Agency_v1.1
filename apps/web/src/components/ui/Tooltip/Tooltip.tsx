import clsx from "clsx";
import { useId, type ReactNode } from "react";
import styles from "./Tooltip.module.scss";

type TooltipProps = {
  /** The explanation shown in the bubble. */
  text: string;
  children: ReactNode;
  /** Where the bubble sits relative to the element: centred, or aligned to its start/end edge.
   *  Use start/end for elements near the screen edge so the bubble never goes off screen. */
  align?: "center" | "start" | "end";
  /** Show the bubble above (default) or below the element. */
  side?: "top" | "bottom";
  className?: string;
};

// A small explanation bubble for anything that deserves one. It appears on
// mouse hover AND on keyboard focus (and on a tap on phones, because the
// wrapper is focusable). Pure CSS: no JavaScript needed to show it.
//   <Tooltip text="What this means"> <Chip/> </Tooltip>
export default function Tooltip({
  text,
  children,
  align = "center",
  side = "top",
  className,
}: TooltipProps) {
  const bubbleId = useId();

  return (
    <span className={clsx(styles.tooltipRoot, className)} tabIndex={0} aria-describedby={bubbleId}>
      {children}
      <span
        id={bubbleId}
        role="tooltip"
        className={clsx(
          styles.tooltipBubble,
          side === "bottom" ? styles.tooltipBubbleBelow : styles.tooltipBubbleAbove,
          align === "start" && styles.tooltipBubbleAlignStart,
          align === "end" && styles.tooltipBubbleAlignEnd,
        )}
      >
        {/* dir="auto": the text reads in its own direction (Arabic right to left), while the bubble keeps its place */}
        <span dir="auto" style={{ display: "block" }}>
          {text}
        </span>
      </span>
    </span>
  );
}
