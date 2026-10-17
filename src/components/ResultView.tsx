"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore, type Assessment } from "@/lib/store";
import { buildPlan, clinicalFlags } from "@/lib/plan";
import { SUB_LABELS } from "@/lib/params";
import { money, PRICES } from "@/lib/config";
import type { SubKey, Tier } from "@/lib/scoring/types";
import { AgeDial } from "./AgeDial";
import { TrendChart } from "./TrendChart";
import { Icon } from "./Icon";

const PHASE_NAME = { 1: "Physical", 2: "Blood", 3: "DNA" } as const;
const TIER_OF: Record<1 | 2 | 3, Tier> = { 1: "physical", 2: "blood", 3: "dna" };
const SUB_ORDER: SubKey[] = ["cardio", "oxygen", "neuro", "metabolic", "inflam", "epigen"];
const NEED: Record<SubKey, string> = {
  cardio: "Physical", oxygen: "Physical", neuro: "Physical", metabolic: "Physical", inflam: "Blood", epigen: "DNA",
};

const signed = (n: number) => (Math.abs(n) < 0.05 ? "0.0" : `${n > 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}`);
const yrs = (n: number) => `${Math.abs(n).toFixed(1)} yr${Math.abs(n) === 1 ? "" : "s"}`;
const gapWord = (g: number) => (Math.abs(g) < 0.5 ? "on par with your age" : g < 0 ? `${yrs(g)} younger than your age` : `${yrs(g)} older than your age`);

export function ResultView() {
  const { state } = useStore();
  const items = state.history;
  const phases = ([1, 2, 3] as const).filter((n) => items.some((i) => i.phase === n));
  const [sel, setSel] = useState<1 | 2 | 3 | null>(null);
  const active = sel && phases.includes(sel) ? sel : phases[phases.length - 1];

  if (!phases.length) {
    return (
      <div className="glass pad stack" style={{ textAlign: "center", padding: 36 }}>
        <h1 style={{ fontSize: 30 }}>No results yet</h1>
        <p className="muted">Your first result takes about 10 minutes and is free.</p>
        <div><Link className="btn btn-primary btn-lg" href="/assess/physical/">Start Phase 1</Link></div>
      </div>
    );
  }

  const cur: Assessment = [...items].reverse().find((i) => i.phase === active)!;
  const r = cur.result;
  const plan = buildPlan(r);
  const flags = clinicalFlags(state.data.physical, active >= 2 ? state.data.blood : undefined);
  const lo = Math.min(r.confidence.low, r.chronological_age) - 3;
  const hi = Math.max(r.confidence.high, r.chronological_age) + 3;
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const younger = r.drivers.filter((d) => d.effect_years < 0).slice(0, 3);
  const older = r.drivers.filter((d) => d.effect_years > 0).slice(0, 3);

  const next = (() => {
    const done = (n: 1 | 2 | 3) => items.some((i) => i.phase === n);
    if (!done(2)) return state.unlocked.blood ? { href: "/assess/blood/", label: "Continue to Phase 2", note: "You've unlocked blood analysis." } : { href: "/unlock/blood/", label: `Unlock Phase 2 · ${money(PRICES.blood)}`, note: "Add your blood results to sharpen this estimate and see inflammation and organ health." };
    if (!done(3)) return state.unlocked.dna ? { href: "/assess/dna/", label: "Continue to Phase 3", note: "You've unlocked DNA analysis." } : { href: "/unlock/dna/", label: `Unlock Phase 3 · ${money(PRICES.dna)}`, note: "Add DNA data for the most precise estimate, including your epigenetic age." };
    return null;
  })();

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row between wrap no-print">
        <h1 style={{ fontSize: "clamp(28px,5vw,40px)" }}>Your result</h1>
        <div className="seg" role="tablist" aria-label="Phase">
          {phases.map((n) => (
            <button key={n} role="tab" aria-selected={n === active} onClick={() => setSel(n)} style={{ padding: "0 16px" }}>
              Phase {n}
            </button>
          ))}
        </div>
      </div>
      <p className="muted" style={{ marginTop: -8 }}>
        Prepared for {state.profile?.name} · {new Date(cur.at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {PHASE_NAME[active]} phase
      </p>

      <section className="glass pad" style={{ padding: 24 }} aria-label="Biological age">
        <div className="grid two" style={{ alignItems: "center" }}>
          <AgeDial bio={r.biological_age} chrono={r.chronological_age} />
          <div className="stack">
            <div className="row wrap" style={{ gap: 8 }}>
              <span className="chip warm">Demo model · illustrative</span>
              <span className="chip">{r.model_version}</span>
              <span className="chip">{r.phases_used.length} of 3 tiers used</span>
            </div>
            <div>
              <div className="muted" style={{ fontWeight: 600 }}>Age acceleration</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: r.age_gap <= 0.5 ? "var(--good)" : "var(--warm)" }}>{gapWord(r.age_gap)}</div>
              <p className="muted" style={{ marginTop: 6 }}>
                Calendar age <b className="num">{r.chronological_age.toFixed(1)}</b>. Biological age shows how your body is performing compared with others your age.
              </p>
            </div>
            <div>
              <div className="row between"><span style={{ fontWeight: 600 }}>Confidence</span><span className="chip">{r.confidence.level}</span></div>
              <div className="band" aria-label={`Likely range ${r.confidence.low} to ${r.confidence.high}`}>
                <div className="track" />
                <div className="range" style={{ left: pos(r.confidence.low), width: `calc(${pos(r.confidence.high)} - ${pos(r.confidence.low)})` }} />
                <div className="tick" style={{ left: pos(r.chronological_age) }} title="Your calendar age" />
                <div className="dot" style={{ left: pos(r.biological_age) }} />
              </div>
              <div className="hint num">Likely range {r.confidence.low.toFixed(1)}–{r.confidence.high.toFixed(1)} years. The orange line is your calendar age. {Math.round(r.completeness * 100)}% of measures provided.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass pad" aria-label="Sub-scores">
        <h2 style={{ fontSize: 22, marginBottom: 14 }}>Where your body stands</h2>
        <div className="stack" style={{ gap: 14 }}>
          {SUB_ORDER.map((k) => {
            const s = r.subscores.find((x) => x.key === k);
            if (!s) {
              return (
                <div key={k} className="row between" style={{ opacity: 0.55 }}>
                  <span className="row" style={{ gap: 8 }}><Icon name="lock" size={16} />{SUB_LABELS[k]}</span>
                  <span className="hint">Add {NEED[k]} data to see this</span>
                </div>
              );
            }
            const w = Math.min(50, (Math.abs(s.delta) / 12) * 50);
            return (
              <div key={k} className="sub-row">
                <div className="row between"><span style={{ fontWeight: 600 }}>{s.label}</span><span className="num" style={{ fontWeight: 700, color: s.delta <= 0.5 ? "var(--good)" : "var(--warm)" }}>{s.age.toFixed(1)} <span className="muted" style={{ fontWeight: 500 }}>({signed(s.delta)})</span></span></div>
                <div className="bar" role="img" aria-label={`${s.label} ${s.delta.toFixed(1)} years versus your age`}>
                  <i style={{ left: s.delta < 0 ? `${50 - w}%` : "50%", width: `${w}%`, background: s.delta <= 0.5 ? "var(--good)" : "var(--warm)" }} />
                  <i style={{ left: "calc(50% - 1px)", width: 2, background: "var(--faint)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {(younger.length > 0 || older.length > 0) && (
        <section className="grid two">
          <div className="glass pad">
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>Keeping you younger</h2>
            <div className="stack" style={{ gap: 10 }}>
              {younger.length ? younger.map((d) => (
                <div key={d.key} className="row between"><span>{d.label} <span className="muted num">{d.value} {d.unit}</span></span><b className="num" style={{ color: "var(--good)" }}>−{Math.abs(d.effect_years).toFixed(1)}</b></div>
              )) : <p className="muted">Nothing stands out yet.</p>}
            </div>
          </div>
          <div className="glass pad">
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>Ageing you faster</h2>
            <div className="stack" style={{ gap: 10 }}>
              {older.length ? older.map((d) => (
                <div key={d.key} className="row between"><span>{d.label} <span className="muted num">{d.value} {d.unit}</span></span><b className="num" style={{ color: "var(--warm)" }}>+{d.effect_years.toFixed(1)}</b></div>
              )) : <p className="muted">Nothing stands out. Nice.</p>}
            </div>
          </div>
        </section>
      )}

      <p className="hint" style={{ marginTop: -6 }}>Years shown are what each measure adds or removes on its own, compared with a typical person your age.</p>

      <section className="glass pad" aria-label="Management plan">
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>{plan.maintain ? "Keep your edge" : "Your management plan"}</h2>
        <p className="muted" style={{ marginBottom: 14 }}>{plan.maintain ? "No area is ageing you faster. Keep these habits going." : "Focus on the areas below first. Small, steady changes add up."}</p>
        <div className="grid three">
          {plan.items.map((it) => (
            <div key={it.key} className="glass pad glass-strong" style={{ boxShadow: "none" }}>
              <h3 style={{ fontSize: 18 }}>{it.title}</h3>
              <p className="hint" style={{ margin: "4px 0 10px" }}>{it.why}</p>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>{it.actions.map((a) => <li key={a}>{a}</li>)}</ul>
              <p className="hint" style={{ marginTop: 10, fontWeight: 600 }}>{it.retest}</p>
            </div>
          ))}
        </div>
        {flags.length > 0 && (
          <div className="glass pad glass-strong" style={{ marginTop: 14, boxShadow: "none", borderColor: "var(--warn)" }}>
            <h3 style={{ fontSize: 17, color: "var(--warn)" }}>Worth discussing with a doctor</h3>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>{flags.map((f) => <li key={f.label}><b>{f.label}.</b> {f.note}</li>)}</ul>
          </div>
        )}
      </section>

      <section className="glass pad" aria-label="Progress">
        <h2 style={{ fontSize: 22, marginBottom: 14 }}>Phase-wise breakdown</h2>
        <div className="stack" style={{ gap: 12 }}>
          {([1, 2, 3] as const).map((n) => {
            const it = [...items].reverse().find((i) => i.phase === n);
            return it ? (
              <div key={n} className="row between">
                <span className="row" style={{ gap: 10 }}><span className="chip ok"><Icon name="check" size={13} />Phase {n}</span>{PHASE_NAME[n]}</span>
                <span className="num"><b>{it.result.biological_age.toFixed(1)}</b> <span className="muted">({signed(it.result.age_gap)})</span></span>
              </div>
            ) : (
              <div key={n} className="row between" style={{ opacity: 0.55 }}>
                <span className="row" style={{ gap: 10 }}><span className="chip"><Icon name="lock" size={13} />Phase {n}</span>{PHASE_NAME[n]}</span>
                <span className="muted">Not done yet</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 18 }}>
          <div className="row between" style={{ marginBottom: 6 }}><span style={{ fontWeight: 600 }}>Trend</span><span className="hint">Blue: biological age · dashed: calendar age</span></div>
          <TrendChart items={items} />
        </div>
      </section>

      <div className="row wrap no-print" style={{ gap: 12 }}>
        <button className="btn btn-primary" onClick={() => window.print()}><Icon name="file" size={18} />Download PDF report</button>
        <Link className="btn" href={`/assess/${TIER_OF[active]}/`}><Icon name="refresh" size={18} />Retake Phase {active}</Link>
      </div>

      {next && (
        <section className="glass pad glass-strong no-print" style={{ textAlign: "center", padding: 28 }}>
          <h2 style={{ fontSize: 24 }}>Get a sharper estimate</h2>
          <p className="muted" style={{ margin: "6px auto 16px", maxWidth: 34 * 14 }}>{next.note}</p>
          <Link className="btn btn-primary btn-lg" href={next.href}>{next.label}</Link>
        </section>
      )}
      <p className="hint" style={{ textAlign: "center" }}>
        i-Age gives wellness insight, not a medical diagnosis. This demo uses an illustrative scoring model; results are not clinically validated.
      </p>
    </div>
  );
}
