"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AgeDial } from "@/components/AgeDial";
import { Icon } from "@/components/Icon";
import { TrendChart } from "@/components/TrendChart";
import { useStore } from "@/lib/store";
import { money, PRICES } from "@/lib/config";

function Dashboard() {
  const { state, latest, phaseDone } = useStore();
  const name = state.profile!.name.split(" ")[0];
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const last = (n: 1 | 2 | 3) => [...state.history].reverse().find((i) => i.phase === n);

  const tiles = [
    {
      n: 1 as const, icon: "activity", title: "Physical", chip: <span className="chip free">Free</span>,
      desc: "11 fitness and function measures.", locked: false,
      action: phaseDone(1) ? { href: "/assess/physical/", label: "Retake", ghost: true } : { href: "/assess/physical/", label: "Start Phase 1" },
    },
    {
      n: 2 as const, icon: "drop", title: "Blood", chip: <span className="chip paid">{money(PRICES.blood)}</span>,
      desc: "Iron, blood count, sugar, cholesterol and inflammation.", locked: !phaseDone(1) || !state.unlocked.blood,
      action: !phaseDone(1) ? { href: "/assess/physical/", label: "Finish Phase 1 first", ghost: true }
        : !state.unlocked.blood ? { href: "/unlock/blood/", label: `Unlock · ${money(PRICES.blood)}` }
        : phaseDone(2) ? { href: "/assess/blood/", label: "Retake", ghost: true } : { href: "/assess/blood/", label: "Start Phase 2" },
    },
    {
      n: 3 as const, icon: "dna", title: "DNA", chip: <span className="chip paid">{money(PRICES.dna)}</span>,
      desc: "Epigenetic age from a partner-lab report. Needs consent.", locked: !phaseDone(2) || !state.unlocked.dna,
      action: !phaseDone(2) ? { href: "/assess/blood/", label: "Finish Phase 2 first", ghost: true }
        : !state.unlocked.dna ? { href: "/unlock/dna/", label: `Unlock · ${money(PRICES.dna)}` }
        : phaseDone(3) ? { href: "/assess/dna/", label: "Retake", ghost: true } : { href: "/assess/dna/", label: "Start Phase 3" },
    },
  ];

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>
        <p className="muted">{greet},</p>
        <h1 style={{ fontSize: "clamp(30px,6vw,44px)" }}>{name}</h1>
      </div>

      <section className="glass pad" style={{ padding: 24 }} aria-label="Summary">
        {latest ? (
          <div className="grid two" style={{ alignItems: "center" }}>
            <AgeDial bio={latest.result.biological_age} chrono={latest.result.chronological_age} size={250} />
            <div className="stack">
              <div className="row wrap" style={{ gap: 8 }}><span className="chip">Latest · Phase {latest.phase}</span><span className="chip warm">Demo model</span></div>
              <p className="muted">Your biological age is shown against a calendar age of <b className="num">{latest.result.chronological_age.toFixed(1)}</b>. Add more data to narrow the range.</p>
              <div className="row wrap" style={{ gap: 10 }}>
                <Link className="btn btn-primary" href="/result/">See full result</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="stack" style={{ alignItems: "flex-start" }}>
            <h2 style={{ fontSize: 26 }}>Find out your biological age</h2>
            <p className="muted" style={{ maxWidth: 480 }}>Phase 1 is free and takes about 10 minutes. Your numbers stay saved for the next phases.</p>
            <Link className="btn btn-primary btn-lg" href="/assess/physical/">Start Phase 1</Link>
          </div>
        )}
      </section>

      <section aria-label="Phases">
        <div className="grid three">
          {tiles.map((t) => {
            const done = phaseDone(t.n);
            const l = last(t.n);
            return (
              <article key={t.n} className={`glass tile ${t.locked ? "dim locked" : ""}`}>
                <div className="row between">
                  <span className="ico"><Icon name={t.locked ? "lock" : t.icon} /></span>
                  {done ? <span className="chip ok"><Icon name="check" size={13} />Complete</span> : t.chip}
                </div>
                <h3>Phase {t.n} · {t.title}</h3>
                <p className="muted">{t.desc}</p>
                {l && <p className="num" style={{ fontWeight: 700 }}>{l.result.biological_age.toFixed(1)} <span className="muted" style={{ fontWeight: 500 }}>biological age</span></p>}
                <div style={{ marginTop: "auto" }}>
                  <Link className={`btn btn-block ${t.action.ghost ? "" : "btn-primary"}`} href={t.action.href}>{t.action.label}</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {state.history.length > 0 && (
        <section className="glass pad" aria-label="History">
          <div className="row between" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 22 }}>Your progress</h2><Link className="link" href="/result/">Details</Link></div>
          <TrendChart items={state.history} />
          <div className="stack" style={{ gap: 8, marginTop: 12 }}>
            {[...state.history].reverse().slice(0, 5).map((h) => (
              <div key={h.id} className="row between"><span>Phase {h.phase} · {new Date(h.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span><b className="num">{h.result.biological_age.toFixed(1)} <span className="muted" style={{ fontWeight: 500 }}>({Math.abs(h.result.age_gap) < 0.05 ? "0.0" : `${h.result.age_gap > 0 ? "+" : "−"}${Math.abs(h.result.age_gap).toFixed(1)}`})</span></b></div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
