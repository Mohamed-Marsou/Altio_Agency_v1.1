"use client";

import clsx from "clsx";
import { Info } from "lucide-react";
import Image from "next/image";
import { useId, useState, type CSSProperties } from "react";
import Tooltip from "@/components/ui/Tooltip/Tooltip";
import {
  PLOT,
  areaPath,
  smoothPath,
  toPercent,
  toPoint,
  toPoints,
} from "@/lib/chart";
import type { AudienceOption, AudiencesContent } from "@/lib/content";
import styles from "./AudienceChart.module.scss";

type SeriesKey = "template" | "bad" | "altio";

type AudienceChartProps = {
  /** The audience whose numbers are drawn (business or individuals). */
  option: AudienceOption;
  chart: AudiencesContent["chart"];
  /** 0 = waiting (not on screen); 1+ = playing. A new number restarts the animation. */
  playId: number;
  panelId: string;
};

// Months shown under the chart (the series have 13 points: month 0 to 12).
const AXIS_MONTHS = [0, 3, 6, 9, 12];
const POINT_COUNT = 13;

// The right-hand panel: the 12-month growth chart for the selected audience,
// a legend, three KPI comparison bars and the six-step strategy ribbon.
//
// Everything that animates sits inside one box with `key={playId + audience}`.
// When that key changes, React throws the box away and builds a fresh one, and
// every CSS animation inside starts again from zero. That is how "replay" works.
export default function AudienceChart({ option, chart, playId, panelId }: AudienceChartProps) {
  const gradientId = useId();
  const [focusedSeries, setFocusedSeries] = useState<SeriesKey | null>(null);

  const isPlaying = playId > 0;
  const series = option.chart.series;
  const animationKey = `${option.key}-${playId}`;

  const lineClass = (key: SeriesKey) =>
    clsx(
      styles.audienceChartLine,
      key === "template" && styles.audienceChartLineTemplate,
      key === "bad" && styles.audienceChartLineBad,
      key === "altio" && styles.audienceChartLineAltio,
      focusedSeries && focusedSeries !== key && styles.audienceChartLineIsDimmed,
    );

  const altioPoints = toPoints(series.altio);

  return (
    <div
      id={panelId}
      role="region"
      aria-label={chart.title}
      className={clsx(styles.audienceChartPanel, isPlaying && styles.audienceChartPanelIsPlaying)}
    >
      <div className={styles.audienceChartHeader}>
        <div className={styles.audienceChartHeaderText}>
          <h3 className={styles.audienceChartTitle}>{chart.title}</h3>
          <p className={styles.audienceChartMetric}>{option.chart.metric}</p>
        </div>
        <Tooltip text={chart.badgeTip} align="end" side="bottom">
          <span className={styles.audienceChartBadge}>
            <Info size={14} aria-hidden="true" />
            {chart.badge}
          </span>
        </Tooltip>
      </div>

      {/* ---- The chart: SVG lines + HTML labels laid on top of it ---------------------- */}
      <div key={animationKey} className={styles.audienceChartAnimated}>
        <div className={styles.audienceChartPlot}>
          <svg
            className={styles.audienceChartSvg}
            viewBox="0 0 640 300"
            role="img"
            aria-label={`${chart.endLabels.template}, ${chart.endLabels.bad}, ${chart.endLabels.altio}`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" className={styles.audienceChartGradientStart} />
                <stop offset="1" className={styles.audienceChartGradientEnd} />
              </linearGradient>
            </defs>

            {/* Horizontal guide lines at 0, 25, 50, 75 and 100 */}
            {[0, 25, 50, 75, 100].map((value) => {
              const y = toPoint(value, 0, POINT_COUNT).y;
              return (
                <line
                  key={value}
                  className={styles.audienceChartGridLine}
                  x1={PLOT.left}
                  x2={PLOT.right}
                  y1={y}
                  y2={y}
                />
              );
            })}

            <path
              className={styles.audienceChartArea}
              d={areaPath(altioPoints)}
              fill={`url(#${gradientId})`}
            />
            <path className={lineClass("template")} d={smoothPath(toPoints(series.template))} pathLength={1} />
            <path className={lineClass("bad")} d={smoothPath(toPoints(series.bad))} pathLength={1} />
            <path className={lineClass("altio")} d={smoothPath(altioPoints)} pathLength={1} />
          </svg>

          {/* Month labels under the chart */}
          {AXIS_MONTHS.map((month) => (
            <span
              key={month}
              className={styles.audienceChartAxisLabel}
              style={{ left: toPercent(toPoint(0, month, POINT_COUNT)).left }}
            >
              {month === 0 ? chart.startLabel : `${chart.monthLabel} ${month}`}
            </span>
          ))}

          {/* Milestones on the Altio line: a dot, a label (from md up) and a tooltip */}
          {option.chart.milestones.map((milestone, index) => {
            const position = toPercent(toPoint(series.altio[milestone.month], milestone.month, POINT_COUNT));
            return (
              <div
                key={milestone.label}
                className={styles.audienceChartMilestone}
                style={{ ...position, "--delay": `${0.5 + index * 0.45}s` } as CSSProperties}
              >
                <Tooltip text={milestone.tip} side="bottom">
                  <span className={styles.audienceChartMilestoneDot} />
                  <span className={styles.audienceChartMilestoneLabel}>{milestone.label}</span>
                </Tooltip>
              </div>
            );
          })}

          {/* End-of-line labels: Plateaus / Decays / Compounds */}
          {(["template", "bad", "altio"] as const).map((key) => {
            const position = toPercent(toPoint(series[key][12], 12, POINT_COUNT));
            return (
              <span
                key={key}
                className={clsx(
                  styles.audienceChartEndLabel,
                  key === "template" && styles.audienceChartEndLabelTemplate,
                  key === "bad" && styles.audienceChartEndLabelBad,
                  key === "altio" && styles.audienceChartEndLabelAltio,
                )}
                style={position}
              >
                {key === "altio" && (
                  <Image src="/logo/altio-mark.svg" alt="" width={14} height={14} />
                )}
                <span className={styles.audienceChartEndLabelText}>{chart.endLabels[key]}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* ---- Legend: what each line means (hover one to spotlight its line) ---------- */}
      <div className={styles.audienceChartLegend}>
        {chart.legend.map((item, index) => (
          <Tooltip
            key={item.key}
            text={item.tip}
            align={index === 0 ? "start" : index === chart.legend.length - 1 ? "end" : "center"}
            className={styles.audienceChartLegendItem}
          >
            <span
              className={clsx(
                styles.audienceChartLegendCard,
                item.key === "altio" && styles.audienceChartLegendCardIsBrand,
              )}
              onPointerEnter={() => setFocusedSeries(item.key as SeriesKey)}
              onPointerLeave={() => setFocusedSeries(null)}
              onFocus={() => setFocusedSeries(item.key as SeriesKey)}
              onBlur={() => setFocusedSeries(null)}
            >
              <span className={styles.audienceChartLegendTitle}>
                {item.key === "altio" ? (
                  <Image src="/logo/altio-mark.svg" alt="" width={18} height={18} />
                ) : (
                  <i
                    className={clsx(
                      styles.audienceChartLegendDot,
                      item.key === "template" && styles.audienceChartLegendDotTemplate,
                      item.key === "bad" && styles.audienceChartLegendDotBad,
                    )}
                  />
                )}
                {item.title}
              </span>
              <span className={styles.audienceChartLegendText}>{item.text}</span>
            </span>
          </Tooltip>
        ))}
      </div>

      {/* ---- KPI bars: template / badly coded / Altio ----------------------------------- */}
      <div key={`${animationKey}-kpis`} className={styles.audienceChartKpis}>
        {option.chart.kpis.map((kpi, index) => (
          <Tooltip
            key={kpi.label}
            text={kpi.tip}
            align={index === 0 ? "start" : index === option.chart.kpis.length - 1 ? "end" : "center"}
            className={styles.audienceChartKpiItem}
          >
            <span className={styles.audienceChartKpi} style={{ "--delay": `${index * 0.15}s` } as CSSProperties}>
              <span className={styles.audienceChartKpiHeader}>
                {kpi.label}
                <span className={styles.audienceChartKpiContext}>{kpi.context}</span>
              </span>
              <span className={styles.audienceChartKpiBars}>
                <span
                  className={clsx(styles.audienceChartKpiBar, styles.audienceChartKpiBarTemplate)}
                  style={{ "--bar-width": `${kpi.values[0]}%` } as CSSProperties}
                />
                <span
                  className={clsx(styles.audienceChartKpiBar, styles.audienceChartKpiBarBad)}
                  style={{ "--bar-width": `${kpi.values[1]}%` } as CSSProperties}
                />
                <span
                  className={clsx(styles.audienceChartKpiBar, styles.audienceChartKpiBarAltio)}
                  style={{ "--bar-width": `${kpi.values[2]}%` } as CSSProperties}
                />
              </span>
            </span>
          </Tooltip>
        ))}
      </div>

      {/* ---- Phones only: the three KPIs as rings (Altio value, small "vs template") ----
          Replaces the legend and the KPI bars, which are too dense for a phone. */}
      <div key={`${animationKey}-stats`} className={styles.audienceChartStats}>
        {option.chart.kpis.map((kpi, index) => (
          <Tooltip
            key={kpi.label}
            text={kpi.tip}
            align={index === 0 ? "start" : index === option.chart.kpis.length - 1 ? "end" : "center"}
            className={styles.audienceChartStatItem}
          >
            <span className={styles.audienceChartStat} style={{ "--delay": `${index * 0.15}s` } as CSSProperties}>
              <svg className={styles.audienceChartStatRing} viewBox="0 0 52 52" aria-hidden="true">
                <circle className={styles.audienceChartStatTrack} cx="26" cy="26" r="21" />
                <circle
                  className={styles.audienceChartStatValue}
                  cx="26"
                  cy="26"
                  r="21"
                  pathLength={100}
                  style={{ "--ring-value": kpi.values[2] } as CSSProperties}
                />
                <text className={styles.audienceChartStatNumber} x="26" y="31" textAnchor="middle">
                  {kpi.values[2]}
                </text>
              </svg>
              <span className={styles.audienceChartStatLabel}>{kpi.label}</span>
              <span className={styles.audienceChartStatVersus}>
                {chart.statsVersus} {kpi.values[0]}
              </span>
            </span>
          </Tooltip>
        ))}
      </div>

      {/* ---- The six strategy steps, lighting up one after another -------------------
          On phones the steps become a row of pills you can swipe. */}
      <div className={styles.audienceChartStepsHeader} aria-hidden="true">
        <span className={styles.audienceChartStepsTitle}>{chart.stepsLabel}</span>
        <span className={styles.audienceChartStepsHint}>{chart.stepsHint}</span>
      </div>
      <ol key={`${animationKey}-steps`} className={styles.audienceChartSteps} aria-label={chart.stepsLabel}>
        {chart.steps.map((step, index) => (
          <li
            key={step.title}
            className={styles.audienceChartStepItem}
            style={{ "--step-index": index } as CSSProperties}
          >
            <Tooltip
              text={step.tip}
              side="top"
              align={index < 2 ? "start" : index > chart.steps.length - 3 ? "end" : "center"}
              className={styles.audienceChartStepTooltip}
            >
              <span className={styles.audienceChartStep}>
                <span className={styles.audienceChartStepNumber}>{index + 1}</span>
                <span className={styles.audienceChartStepTitle}>{step.title}</span>
              </span>
            </Tooltip>
          </li>
        ))}
      </ol>

      <p className={styles.audienceChartDisclaimer}>{chart.disclaimer}</p>
    </div>
  );
}
