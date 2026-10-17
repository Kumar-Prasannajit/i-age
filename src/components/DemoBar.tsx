"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { scoringProvider } from "@/lib/scoring";

export const AUTOFILL_EVENT = "iage:autofill";

export function DemoBar() {
  const [open, setOpen] = useState(false);
  const { unlock, giveConsent, reset } = useStore();
  const router = useRouter();
  const fire = (z: number) => {
    window.dispatchEvent(new CustomEvent(AUTOFILL_EVENT, { detail: { z } }));
    setOpen(false);
  };
  return (
    <>
      <button className="btn btn-sm demo-fab no-print" onClick={() => setOpen(true)}>Demo tools</button>
      {open && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Demo tools" onClick={() => setOpen(false)}>
          <div className="glass glass-strong sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row between">
              <h2 style={{ fontSize: 22 }}>Demo tools</h2>
              <button className="btn btn-sm" onClick={() => setOpen(false)}>Close</button>
            </div>
            <p className="muted" style={{ margin: "6px 0 14px" }}>For presenting. Not part of the product. Scoring engine: <b>{scoringProvider}</b>.</p>
            <div className="stack">
              <div>
                <div className="label" style={{ marginBottom: 8 }}>Fill the form on screen with sample values</div>
                <div className="grid" style={{ gap: 8 }}>
                  <button className="btn" onClick={() => fire(1.0)}>Younger than age</button>
                  <button className="btn" onClick={() => fire(0.05)}>On par</button>
                  <button className="btn" onClick={() => fire(-1.1)}>Older than age</button>
                </div>
              </div>
              <button className="btn" onClick={() => { unlock("blood"); unlock("dna"); giveConsent(); setOpen(false); }}>Unlock all phases (skip payment)</button>
              <button className="btn" onClick={() => { if (confirm("Clear all demo data and start over?")) { reset(); setOpen(false); router.replace("/"); } }}>Reset demo data</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
