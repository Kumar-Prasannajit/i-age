"use client";
import { useEffect, useRef, useState } from "react";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="glass glass-strong sheet" onClick={(e) => e.stopPropagation()}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 22 }}>{title}</h2>
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

type RPhase = "idle" | "wait" | "go" | "early" | "done";
const ROUNDS = 5;

export function ReactionTest({ onUse, onClose }: { onUse: (ms: number) => void; onClose: () => void }) {
  const [phase, setPhase] = useState<RPhase>("idle");
  const [times, setTimes] = useState<number[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const t0 = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const arm = () => {
    setPhase("wait");
    timer.current = window.setTimeout(() => {
      t0.current = performance.now();
      setPhase("go");
    }, 1200 + Math.random() * 2400);
  };
  const tap = () => {
    if (phase === "idle" || phase === "early") return arm();
    if (phase === "wait") {
      window.clearTimeout(timer.current);
      return setPhase("early");
    }
    if (phase === "go") {
      const t = Math.round(performance.now() - t0.current);
      const next = [...times, t];
      setTimes(next);
      if (next.length >= ROUNDS) setPhase("done");
      else arm();
    }
  };
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const text =
    phase === "idle" ? "Tap to start. When the pad turns green, tap as fast as you can."
    : phase === "wait" ? "Wait for green…"
    : phase === "go" ? "Tap now!"
    : phase === "early" ? "Too early. Tap to try this round again."
    : "";
  return (
    <Modal title="Reaction time test" onClose={onClose}>
      {phase !== "done" ? (
        <>
          <button className={`react-pad ${phase === "go" ? "go" : phase === "wait" ? "wait" : "idle"}`} style={{ width: "100%", border: 0 }} onPointerDown={tap}>
            {text}
          </button>
          <p className="muted num" style={{ marginTop: 12, textAlign: "center" }}>
            Round {Math.min(times.length + 1, ROUNDS)} of {ROUNDS}{times.length ? ` · last ${times[times.length - 1]} ms` : ""}
          </p>
        </>
      ) : (
        <div className="stack">
          <div style={{ textAlign: "center" }}>
            <div className="big-age num">{avg}</div>
            <div className="muted">ms average over {ROUNDS} tries</div>
          </div>
          <p className="muted num" style={{ textAlign: "center" }}>{times.join(" · ")} ms</p>
          <button className="btn btn-primary btn-block" onClick={() => { onUse(avg); onClose(); }}>Use {avg} ms</button>
          <button className="btn btn-block" onClick={() => { setTimes([]); setPhase("idle"); }}>Try again</button>
        </div>
      )}
    </Modal>
  );
}

export function Stopwatch({ mode, onUse, onClose }: { mode: "balance" | "gait"; onUse: (v: number) => void; onClose: () => void }) {
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState(0);
  const start = useRef(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setMs(performance.now() - start.current), 40);
    return () => window.clearInterval(id);
  }, [running]);
  const secs = ms / 1000;
  const toggle = () => {
    if (running) return setRunning(false);
    start.current = performance.now() - ms;
    setRunning(true);
  };
  const value = mode === "gait" ? (secs > 0 ? Math.round((10 / secs) * 100) / 100 : 0) : Math.min(60, Math.round(secs));
  const title = mode === "gait" ? "10 metre walk timer" : "One-leg stand timer";
  const help = mode === "gait"
    ? "Mark out 10 metres. Start the timer as you begin walking at a comfortable pace and stop it when you cross the line."
    : "Stand near a wall for safety. Lift one foot, close your eyes, and start the timer. Stop it when you put your foot down or lose balance.";
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{help}</p>
      <div className="big-age num" style={{ textAlign: "center", margin: "18px 0" }}>{secs.toFixed(1)}<span style={{ fontSize: 22 }}> s</span></div>
      <div className="stack">
        <button className="btn btn-primary btn-lg btn-block" onClick={toggle}>{running ? "Stop" : ms ? "Resume" : "Start"}</button>
        <div className="row">
          <button className="btn btn-block" onClick={() => { setRunning(false); setMs(0); }}>Reset</button>
          <button className="btn btn-block" disabled={running || ms === 0} onClick={() => { onUse(value); onClose(); }}>
            Use {mode === "gait" ? `${value} m/s` : `${value} s`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
