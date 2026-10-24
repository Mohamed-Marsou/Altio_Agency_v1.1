"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, MessageCircle } from "lucide-react";
import {
  getAdminOverview,
  STATUS_LABEL,
  type LeadStatus,
  type Period,
} from "@/lib/admin/overview";
import styles from "./OverviewView.module.scss";

type LeadFilter = "ALL" | "NEEDS_REPLY" | LeadStatus;

const FILTERS: { id: LeadFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "NEEDS_REPLY", label: "Needs reply" },
  { id: "NEW", label: "New" },
  { id: "DESIGN_SENT", label: "Design sent" },
  { id: "PROPOSAL", label: "Proposal" },
];

// Tiny line chart drawn as SVG (no chart library). Points are scaled to a 100x32 box.
function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * 100},${30 - ((p - min) / span) * 28}`)
    .join(" ");
  return (
    <svg className={styles.spark} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function OverviewView() {
  const [period, setPeriod] = useState<Period>("7d");
  const [filter, setFilter] = useState<LeadFilter>("ALL");
  // ids of the tasks the owner ticked (kept only in memory until the API exists)
  const [done, setDone] = useState<Set<string>>(new Set());

  const data = getAdminOverview(period);

  const leads = useMemo(
    () =>
      data.leads.filter((l) =>
        filter === "ALL" ? true : filter === "NEEDS_REPLY" ? l.needsReply : l.status === filter,
      ),
    [data.leads, filter],
  );

  const toggleTask = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Smooth-scroll to a section when an attention card is tapped.
  const jump = (id: string) => document.getElementById(`ov-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const funnelMax = data.funnel[0]?.value ?? 1;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Overview</h1>
          <p className={styles.sub}>What needs you today, then how the week is going.</p>
        </div>
        <div className={styles.seg} role="group" aria-label="Period">
          {(["7d", "30d"] as Period[]).map((p) => (
            <button key={p} type="button" className={`${styles.segBtn} ${period === p ? styles.segOn : ""}`} aria-pressed={period === p} onClick={() => setPeriod(p)}>
              {p === "7d" ? "7 days" : "30 days"}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Needs attention: the most important block, first on every screen size */}
      <section aria-label="Needs attention" className={styles.attention}>
        {data.attention.map((a) => (
          <button key={a.key} type="button" className={`${styles.attCard} ${styles[`tone_${a.tone}`]}`} onClick={() => jump(a.target)}>
            <span className={styles.attCount}>{a.count}</span>
            <span className={styles.attLabel}>{a.label}</span>
            <span className={styles.attDetail}>{a.detail}</span>
          </button>
        ))}
      </section>

      {/* 2. Numbers */}
      <section aria-label="Key numbers" className={styles.kpis}>
        {data.kpis.map((k) => {
          const up = !k.delta.includes("faster") && !k.delta.includes("slower") ? !k.delta.startsWith("-") : k.delta.includes("slower");
          return (
            <article key={k.key} className={styles.kpi}>
              <p className={styles.kpiLabel}>{k.label}</p>
              <p className={styles.kpiValue}>{k.value}</p>
              <p className={`${styles.kpiDelta} ${k.isGood ? styles.good : styles.bad}`}>
                {up ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />}
                {k.delta}
              </p>
              <Sparkline points={k.points} />
            </article>
          );
        })}
      </section>

      <div className={styles.cols}>
        {/* 3. Leads */}
        <section id="ov-leads" className={`${styles.card} ${styles.span2}`} aria-labelledby="h-leads">
          <h2 id="h-leads" className={styles.h2}>Recent leads</h2>
          <div className={styles.chips} role="group" aria-label="Filter leads">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" className={`${styles.chip} ${filter === f.id ? styles.chipOn : ""}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          {leads.length === 0 ? (
            <p className={styles.empty}>No leads match this filter.</p>
          ) : (
            <ul className={styles.list}>
              {leads.map((l) => (
                <li key={l.id} className={styles.lead}>
                  <div className={styles.leadMain}>
                    <strong>{l.name}</strong>
                    <span className={styles.muted}>{l.business}</span>
                    <span className={styles.muted}>{l.service} · {l.source} · {l.age} ago</span>
                  </div>
                  <span className={`${styles.status} ${styles[`st_${l.status}`]}`}>{STATUS_LABEL[l.status]}</span>
                  <a className={styles.wa} href={`https://wa.me/${l.phone}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${l.name}`}>
                    <MessageCircle size={18} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4. Tasks */}
        <section id="ov-tasks" className={styles.card} aria-labelledby="h-tasks">
          <h2 id="h-tasks" className={styles.h2}>To do</h2>
          <ul className={styles.list}>
            {data.tasks.map((t) => (
              <li key={t.id}>
                <label className={styles.task}>
                  <input type="checkbox" checked={done.has(t.id)} onChange={() => toggleTask(t.id)} />
                  <span className={done.has(t.id) ? styles.struck : ""}>{t.text}</span>
                  <span className={styles.due}>{t.due}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Funnel */}
        <section className={styles.card} aria-labelledby="h-funnel">
          <h2 id="h-funnel" className={styles.h2}>Pipeline</h2>
          <ul className={styles.list}>
            {data.funnel.map((f) => (
              <li key={f.label} className={styles.funnelRow}>
                <span>{f.label}</span>
                <span className={styles.bar}><i style={{ width: `${(f.value / funnelMax) * 100}%` }} /></span>
                <strong>{f.value}</strong>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Payments */}
        <section id="ov-payments" className={styles.card} aria-labelledby="h-pay">
          <h2 id="h-pay" className={styles.h2}>Payments due</h2>
          <ul className={styles.list}>
            {data.payments.map((p) => (
              <li key={p.id} className={styles.pay}>
                <div>
                  <strong>{p.client}</strong>
                  <span className={styles.muted}>{p.milestone}</span>
                </div>
                <div className={styles.payRight}>
                  <strong>{p.amount}</strong>
                  <span className={p.inDays < 0 ? styles.overdue : styles.muted}>
                    {p.inDays < 0 ? `${-p.inDays} days overdue` : `in ${p.inDays} days`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 7. Activity */}
        <section id="ov-activity" className={styles.card} aria-labelledby="h-act">
          <h2 id="h-act" className={styles.h2}>Latest activity</h2>
          <ul className={styles.list}>
            {data.activity.map((a) => (
              <li key={a.id} className={styles.act}>
                <span>{a.text}</span>
                <span className={styles.muted}>{a.time}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
