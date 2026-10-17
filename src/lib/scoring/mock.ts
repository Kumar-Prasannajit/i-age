import { PARAMS, PARAM_MAP, SUB_LABELS, SUB_PHASE, paramZ, type Ctx } from "../params";
import type { AssessRequest, AssessResponse, Driver, SubKey, Subscore, Tier } from "./types";

const K = 5.2; // years of biological age per 1 unit of score (mock calibration)
const r1 = (x: number) => Math.round(x * 10) / 10;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Illustrative scoring engine. Replace by pointing the provider at the real model service. */
export function mockAssess(req: AssessRequest): AssessResponse {
  const { profile, phases } = req;
  const c: Ctx = { age: profile.age_years, sex: profile.sex, heightCm: profile.height_cm, weightKg: profile.weight_kg };

  const used: Tier[] = [];
  const zs: { key: string; z: number; w: number }[] = [];
  const subAcc: Partial<Record<SubKey, { sum: number; w: number }>> = {};
  let supplied = 0;
  let possible = 0;

  (["physical", "blood"] as Tier[]).forEach((tier) => {
    const data = phases[tier];
    if (!data) return;
    used.push(tier);
    PARAMS.filter((p) => p.tier === tier).forEach((p) => {
      possible += 1;
      const v = data[p.key];
      if (typeof v !== "number" || !Number.isFinite(v)) return;
      supplied += 1;
      const z = paramZ(p, v, c);
      const total = Object.values(p.weights).reduce((a, b) => a + (b ?? 0), 0);
      zs.push({ key: p.key, z, w: total });
      (Object.entries(p.weights) as [SubKey, number][]).forEach(([sk, w]) => {
        const acc = (subAcc[sk] ??= { sum: 0, w: 0 });
        acc.sum += z * w;
        acc.w += w;
      });
    });
  });

  const wSum = zs.reduce((a, b) => a + b.w, 0) || 1;
  const gapBody = clamp(-(zs.reduce((a, b) => a + b.z * b.w, 0) / wSum) * K, -15, 15);

  const subscores: Subscore[] = [];
  (Object.keys(subAcc) as SubKey[]).forEach((sk) => {
    const acc = subAcc[sk]!;
    const delta = clamp(-(acc.sum / acc.w) * K, -15, 15);
    subscores.push({ key: sk, label: SUB_LABELS[sk], age: r1(c.age + delta), delta: r1(delta), phase: SUB_PHASE[sk] });
  });

  // DNA tier
  let gapFinal = gapBody;
  const dna = phases.dna;
  if (dna && typeof dna.dnam_age === "number") {
    used.push("dna");
    possible += 2;
    supplied += 1;
    const epiDelta = dna.dnam_age - c.age;
    let teloDelta = epiDelta;
    if (typeof dna.telomere === "number") {
      supplied += 1;
      teloDelta = clamp(-paramZ(PARAM_MAP.telomere, dna.telomere, c) * K, -15, 15);
      zs.push({ key: "telomere", z: paramZ(PARAM_MAP.telomere, dna.telomere, c), w: 1 });
    }
    const epigen = clamp(0.7 * epiDelta + 0.3 * teloDelta, -20, 20);
    subscores.push({ key: "epigen", label: SUB_LABELS.epigen, age: r1(c.age + epigen), delta: r1(epigen), phase: "dna" });
    gapFinal = used.length > 1 ? 0.6 * gapBody + 0.4 * epigen : epigen;
  }

  const completeness = possible ? supplied / possible : 0;
  let ci = used.includes("dna") ? 2.2 : used.includes("blood") ? 3.4 : 4.8;
  ci *= 1 + (1 - completeness) * 0.6;
  const level = ci > 4 ? "low" : ci > 2.8 ? "moderate" : "high";

  const bio = c.age + gapFinal;
  const drivers: Driver[] = zs
    .filter((x) => x.key !== "telomere")
    .map((x) => {
      const p = PARAM_MAP[x.key];
      const raw = (phases.physical?.[x.key] ?? phases.blood?.[x.key]) as number;
      return { key: x.key, label: p.label, value: raw, unit: p.unit, effect_years: r1(-x.z * K * Math.min(1, Math.max(0.3, x.w))) };
    })
    .sort((a, b) => Math.abs(b.effect_years) - Math.abs(a.effect_years))
    .slice(0, 6);

  return {
    chronological_age: r1(c.age),
    biological_age: r1(bio),
    age_gap: r1(gapFinal),
    confidence: { low: r1(bio - ci), high: r1(bio + ci), level },
    subscores,
    drivers,
    phases_used: used,
    completeness: Math.round(completeness * 100) / 100,
    model_version: "mock-0.1.0",
    is_demo: true,
  };
}
