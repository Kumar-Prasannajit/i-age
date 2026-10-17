import type { Assessment } from "@/lib/store";

export function TrendChart({ items }: { items: Assessment[] }) {
  if (!items.length) return null;
  const W = 560, H = 190, P = 30;
  const bios = items.map((i) => i.result.biological_age);
  const chr = items.map((i) => i.result.chronological_age);
  const all = [...bios, ...chr];
  const lo = Math.floor(Math.min(...all) - 2);
  const hi = Math.ceil(Math.max(...all) + 2);
  const x = (i: number) => (items.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (items.length - 1));
  const y = (v: number) => H - P - ((v - lo) / (hi - lo || 1)) * (H - 2 * P);
  const line = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Biological age over time" style={{ display: "block" }}>
      {[0, 0.5, 1].map((t) => {
        const v = lo + t * (hi - lo);
        return (
          <g key={t}>
            <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="var(--hairline)" />
            <text x={4} y={y(v) + 4} fontSize="11" fill="var(--faint)">{Math.round(v)}</text>
          </g>
        );
      })}
      {items.length > 1 && <path d={line(chr)} fill="none" stroke="var(--warm)" strokeWidth="2" strokeDasharray="5 5" />}
      {items.length > 1 && <path d={line(bios)} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
      {items.map((it, i) => (
        <g key={it.id}>
          <circle cx={x(i)} cy={y(chr[i])} r="4" fill="var(--warm)" />
          <circle cx={x(i)} cy={y(bios[i])} r="7" fill="var(--accent)" stroke="#fff" strokeWidth="2.5" />
          <text x={x(i)} y={y(bios[i]) - 13} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">{bios[i].toFixed(1)}</text>
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--faint)">Phase {it.phase}</text>
        </g>
      ))}
    </svg>
  );
}
