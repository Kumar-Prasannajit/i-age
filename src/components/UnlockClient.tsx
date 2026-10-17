"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "./AppShell";
import { Icon } from "./Icon";
import { Pipeline, sleep } from "./Pipeline";
import { useStore } from "@/lib/store";
import { money, PRICES } from "@/lib/config";

const INFO = {
  blood: { n: 2, name: "Blood analysis", price: PRICES.blood, needs: 1 as const, back: "/assess/physical/", perks: ["Metabolic, oxygen and inflammation scores", "A narrower confidence range", "Retests included for 12 months"] },
  dna: { n: 3, name: "DNA analysis", price: PRICES.dna, needs: 2 as const, back: "/assess/blood/", perks: ["Your epigenetic age", "The most precise estimate", "Separate, explicit DNA consent"] },
};
const METHODS = ["UPI", "Card", "Net banking"] as const;

export function UnlockClient({ tier }: { tier: "blood" | "dna" }) {
  return (
    <AppShell>
      <Checkout tier={tier} />
    </AppShell>
  );
}

function Checkout({ tier }: { tier: "blood" | "dna" }) {
  const info = INFO[tier];
  const router = useRouter();
  const { state, phaseDone, unlock } = useStore();
  const [method, setMethod] = useState<(typeof METHODS)[number]>("UPI");
  const [upi, setUpi] = useState("");
  const [step, setStep] = useState<number | null>(null);
  const steps = ["Contacting payment gateway", "Verifying payment", `Unlocking Phase ${info.n}`];

  if (!phaseDone(info.needs)) {
    return (
      <div className="glass pad stack" style={{ padding: 32, textAlign: "center", alignItems: "center" }}>
        <h1 style={{ fontSize: 28 }}>Finish Phase {info.needs} first</h1>
        <p className="muted">{info.name} builds on the data you've already shared.</p>
        <Link className="btn btn-primary" href={info.back}>Go to Phase {info.needs}</Link>
      </div>
    );
  }
  if (state.unlocked[tier]) {
    return (
      <div className="glass pad stack" style={{ padding: 32, textAlign: "center", alignItems: "center" }}>
        <h1 style={{ fontSize: 28 }}>Phase {info.n} is already unlocked</h1>
        <Link className="btn btn-primary" href={`/assess/${tier}/`}>Continue to Phase {info.n}</Link>
      </div>
    );
  }

  const pay = async () => {
    setStep(0);
    for (let i = 1; i <= steps.length; i++) { await sleep(700); setStep(i); }
    unlock(tier);
    router.push(`/assess/${tier}/`);
  };

  return (
    <div className="grid two" style={{ alignItems: "start" }}>
      <section className="glass pad stack" aria-label="Order summary">
        <div className="row between"><h1 style={{ fontSize: 28 }}>Unlock Phase {info.n}</h1><span className="chip paid">One-time</span></div>
        <div className="price num">{money(info.price)}</div>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 10 }}>
          {info.perks.map((p) => <li key={p} className="row" style={{ gap: 10 }}><span style={{ color: "var(--good)" }}><Icon name="check" size={18} /></span>{p}</li>)}
        </ul>
        <p className="hint">Your earlier results and measures stay saved. Nothing to re-enter.</p>
      </section>
      <section className="glass pad stack" aria-label="Payment">
        <h2 style={{ fontSize: 22 }}>Pay with</h2>
        <div className="seg" role="group" aria-label="Payment method">
          {METHODS.map((m) => <button key={m} aria-pressed={method === m} onClick={() => setMethod(m)}>{m}</button>)}
        </div>
        {method === "UPI" && (
          <div className="field"><label htmlFor="upi">UPI ID</label><input id="upi" className="input" placeholder="name@bank" value={upi} onChange={(e) => setUpi(e.target.value)} /></div>
        )}
        {method !== "UPI" && <p className="muted">You'll be redirected to your {method === "Card" ? "card" : "bank"}'s page to complete payment.</p>}
        <div className="glass glass-strong pad" style={{ boxShadow: "none", padding: 14 }}>
          <b>Test mode.</b> <span className="muted">No real payment is taken. Tap pay to simulate a successful payment.</span>
        </div>
        <button className="btn btn-primary btn-lg btn-block" onClick={pay}>Pay {money(info.price)}</button>
      </section>
      {step !== null && <Pipeline title="Completing your payment" steps={steps} index={step} />}
    </div>
  );
}
