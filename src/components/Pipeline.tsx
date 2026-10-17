"use client";
import { Icon } from "./Icon";

export function Pipeline({ title, steps, index }: { title: string; steps: string[]; index: number }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="glass glass-strong sheet">
        <h2 style={{ fontSize: 24 }}>{title}</h2>
        <p className="muted" style={{ marginTop: 4 }}>This takes a few seconds.</p>
        <ol className="pipe">
          {steps.map((s, i) => (
            <li key={s} className={i < index ? "done" : i === index ? "on" : ""}>
              <span className="dotp">{i < index ? <Icon name="check" size={14} /> : null}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
