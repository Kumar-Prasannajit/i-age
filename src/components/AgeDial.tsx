"use client";
import { useEffect, useState } from "react";

const MIN = 10;
const MAX = 100;
const frac = (age: number) => Math.min(1, Math.max(0, (age - MIN) / (MAX - MIN)));

export function AgeDial({ bio, chrono, size = 300 }: { bio: number; chrono: number; size?: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 120);
    return () => window.clearTimeout(t);
  }, []);
  const r = 118;
  const c = 2 * Math.PI * r;
  const bioLen = c * frac(bio);
  const ang = frac(chrono) * 2 * Math.PI - Math.PI / 2;
  const tx = 150 + Math.cos(ang) * r;
  const ty = 150 + Math.sin(ang) * r;
  const gap = bio - chrono;
  const label = Math.abs(gap) < 0.5 ? "on par with your age" : gap < 0 ? `${Math.abs(gap).toFixed(1)} years younger` : `${gap.toFixed(1)} years older`;
  return (
    <div style={{ width: size, maxWidth: "100%", aspectRatio: "1", position: "relative", margin: "0 auto" }}>
      <svg viewBox="0 0 300 300" width="100%" height="100%" role="img" aria-label={`Biological age ${bio.toFixed(1)}, ${label}`}>
        <defs>
          <linearGradient id="dialg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3949ff" />
            <stop offset="0.55" stopColor="#6a5cff" />
            <stop offset="1" stopColor="#14bfae" />
          </linearGradient>
        </defs>
        <circle cx="150" cy="150" r={r} fill="none" stroke="var(--hairline)" strokeWidth="18" />
        <circle
          cx="150" cy="150" r={r} fill="none" stroke="url(#dialg)" strokeWidth="18" strokeLinecap="round"
          strokeDasharray={`${on ? bioLen : 0} ${c}`} transform="rotate(-90 150 150)"
          style={{ transition: "stroke-dasharray 1.4s cubic-bezier(.2,.8,.2,1)" }}
        />
        <circle cx={tx} cy={ty} r="8" fill="var(--warm)" stroke="#fff" strokeWidth="3" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>
        <div>
          <div className="muted" style={{ fontSize: 14, fontWeight: 600 }}>Biological age</div>
          <div className="big-age num" style={{ fontSize: size * 0.3 }}>{bio.toFixed(1)}</div>
          <div style={{ fontWeight: 700, color: gap <= 0.5 ? "var(--good)" : "var(--warm)", fontSize: 15 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}
