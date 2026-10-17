import type { Sex, SubKey, Tier } from "./scoring/types";

export interface Ctx {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
}

export interface Param {
  key: string;
  tier: Tier;
  group: string;
  label: string;
  unit: string;
  hint: string;
  min: number; // hard bounds: reject
  max: number;
  softMin: number; // soft bounds: ask to confirm
  softMax: number;
  step: number;
  decimals: number;
  weights: Partial<Record<SubKey, number>>;
  /** Scored against an age/sex-adjusted expected value */
  expected?: (c: Ctx) => number;
  sd?: number;
  higherIsBetter?: boolean;
  /** Scored against an optimal band */
  band?: (c: Ctx) => [number, number];
  badSide?: "low" | "high" | "both";
  tol?: number;
  /** Turn the entered value into the scored value (e.g. waist -> waist/height) */
  transform?: (v: number, c: Ctx) => number;
  tool?: "reaction" | "balance" | "gait";
  equipment?: boolean;
}

const f = (c: Ctx) => c.sex === "female";

export const SUB_LABELS: Record<SubKey, string> = {
  cardio: "Cardiovascular",
  oxygen: "Oxygen & lungs",
  neuro: "Strength & balance",
  metabolic: "Metabolic",
  inflam: "Inflammation & organs",
  epigen: "Epigenetic",
};

export const SUB_PHASE: Record<SubKey, Tier> = {
  cardio: "physical",
  oxygen: "physical",
  neuro: "physical",
  metabolic: "physical",
  inflam: "blood",
  epigen: "dna",
};

export const PARAMS: Param[] = [
  // ---------- Phase 1 · Physical ----------
  {
    key: "vo2max", tier: "physical", group: "Heart & circulation", label: "VO₂ max", unit: "ml/kg/min",
    hint: "From a treadmill or bike test, or a wearable estimate.", equipment: true,
    min: 10, max: 90, softMin: 15, softMax: 70, step: 0.1, decimals: 1,
    expected: (c) => (f(c) ? 42 - 0.28 * (c.age - 20) : 50 - 0.34 * (c.age - 20)), sd: 7, higherIsBetter: true,
    weights: { cardio: 0.5, oxygen: 0.5 },
  },
  {
    key: "hrmax", tier: "physical", group: "Heart & circulation", label: "Max heart rate", unit: "bpm",
    hint: "Highest rate reached in a stress test.", equipment: true,
    min: 100, max: 230, softMin: 120, softMax: 215, step: 1, decimals: 0,
    expected: (c) => 208 - 0.7 * c.age, sd: 10, higherIsBetter: true,
    weights: { cardio: 0.5 },
  },
  {
    key: "sbp", tier: "physical", group: "Heart & circulation", label: "Blood pressure, systolic", unit: "mmHg",
    hint: "Resting, seated, after 5 minutes of quiet.",
    min: 70, max: 260, softMin: 90, softMax: 180, step: 1, decimals: 0,
    expected: (c) => 106 + 0.4 * (c.age - 20), sd: 12, higherIsBetter: false,
    weights: { cardio: 1 },
  },
  {
    key: "dbp", tier: "physical", group: "Heart & circulation", label: "Blood pressure, diastolic", unit: "mmHg",
    hint: "The lower number on the cuff.",
    min: 40, max: 150, softMin: 50, softMax: 110, step: 1, decimals: 0,
    expected: (c) => 68 + 0.15 * (c.age - 20), sd: 8, higherIsBetter: false,
    weights: { cardio: 0.6 },
  },
  {
    key: "pushups", tier: "physical", group: "Strength & balance", label: "Push-ups", unit: "reps",
    hint: "Full push-ups in one go, good form, to failure.",
    min: 0, max: 150, softMin: 0, softMax: 80, step: 1, decimals: 0,
    expected: (c) => Math.max(2, f(c) ? 25 - 0.35 * (c.age - 20) : 35 - 0.45 * (c.age - 20)), sd: 10, higherIsBetter: true,
    weights: { neuro: 1 },
  },
  {
    key: "sitrise", tier: "physical", group: "Strength & balance", label: "Sit & rise score", unit: "of 10",
    hint: "Sit on the floor and stand up. 10 points, minus 1 for each hand, knee or other support used.",
    min: 0, max: 10, softMin: 0, softMax: 10, step: 0.5, decimals: 1,
    expected: (c) => 9.5 - 0.06 * (c.age - 20), sd: 1.5, higherIsBetter: true,
    weights: { neuro: 1 },
  },
  {
    key: "oneleg", tier: "physical", group: "Strength & balance", label: "One-leg stand, eyes closed", unit: "seconds",
    hint: "Time your best of three tries. Stop at 60 seconds.", tool: "balance",
    min: 0, max: 120, softMin: 0, softMax: 60, step: 1, decimals: 0,
    expected: (c) => Math.max(4, 28 - 0.38 * (c.age - 20)), sd: 8, higherIsBetter: true,
    weights: { neuro: 1 },
  },
  {
    key: "reaction", tier: "physical", group: "Strength & balance", label: "Reaction time", unit: "ms",
    hint: "Average of five tries. Use the built-in test.", tool: "reaction",
    min: 100, max: 1000, softMin: 150, softMax: 600, step: 1, decimals: 0,
    expected: (c) => 230 + 1.6 * (c.age - 20), sd: 35, higherIsBetter: false,
    weights: { neuro: 0.8 },
  },
  {
    key: "waist", tier: "physical", group: "Body & breath", label: "Waist circumference", unit: "cm",
    hint: "Around the navel, relaxed. We use your height to get the waist-height ratio.",
    min: 40, max: 200, softMin: 55, softMax: 150, step: 0.5, decimals: 1,
    transform: (v, c) => v / c.heightCm,
    expected: (c) => 0.46 + 0.0017 * (c.age - 20), sd: 0.05, higherIsBetter: false,
    weights: { metabolic: 1, cardio: 0.3 },
  },
  {
    key: "fev1", tier: "physical", group: "Body & breath", label: "FEV₁", unit: "litres",
    hint: "Air blown out in the first second of a spirometer test.", equipment: true,
    min: 0.5, max: 7, softMin: 1, softMax: 6, step: 0.01, decimals: 2,
    expected: (c) => (f(c) ? 0.0342 * c.heightCm - 0.0255 * c.age - 1.578 : 0.0414 * c.heightCm - 0.0244 * c.age - 2.19),
    sd: 0.6, higherIsBetter: true,
    weights: { oxygen: 1 },
  },
  {
    key: "gait", tier: "physical", group: "Body & breath", label: "Gait speed", unit: "m/s",
    hint: "Comfortable walking pace over 10 metres. Use the built-in timer.", tool: "gait",
    min: 0.2, max: 3, softMin: 0.4, softMax: 2.2, step: 0.01, decimals: 2,
    expected: (c) => 1.45 - 0.0065 * (c.age - 20), sd: 0.2, higherIsBetter: true,
    weights: { neuro: 1, cardio: 0.3 },
  },

  // ---------- Phase 2 · Blood ----------
  {
    key: "ferritin", tier: "blood", group: "Blood count & iron", label: "Serum ferritin", unit: "ng/mL",
    hint: "Iron stores.",
    min: 1, max: 2000, softMin: 5, softMax: 1000, step: 1, decimals: 0,
    band: (c) => (f(c) ? [25, 150] : [40, 200]), badSide: "both", tol: 80,
    weights: { inflam: 0.5, oxygen: 0.3 },
  },
  {
    key: "hb", tier: "blood", group: "Blood count & iron", label: "Haemoglobin", unit: "g/dL",
    hint: "Oxygen-carrying capacity.",
    min: 4, max: 22, softMin: 8, softMax: 19, step: 0.1, decimals: 1,
    band: (c) => (f(c) ? [12, 15.5] : [13.5, 17.5]), badSide: "both", tol: 1.5,
    weights: { oxygen: 1 },
  },
  {
    key: "hct", tier: "blood", group: "Blood count & iron", label: "Haematocrit", unit: "%",
    hint: "Share of blood made up of red cells.",
    min: 15, max: 65, softMin: 25, softMax: 58, step: 0.1, decimals: 1,
    band: (c) => (f(c) ? [36, 46] : [41, 50]), badSide: "both", tol: 4,
    weights: { oxygen: 0.7 },
  },
  {
    key: "mcv", tier: "blood", group: "Blood count & iron", label: "Mean cell volume (MCV)", unit: "fL",
    hint: "Average size of red blood cells.",
    min: 50, max: 130, softMin: 65, softMax: 115, step: 0.1, decimals: 1,
    band: () => [82, 96], badSide: "both", tol: 6,
    weights: { oxygen: 0.4 },
  },
  {
    key: "bun", tier: "blood", group: "Kidney & liver", label: "Blood urea nitrogen", unit: "mg/dL",
    hint: "Protein metabolism and kidney function.",
    min: 2, max: 120, softMin: 5, softMax: 60, step: 0.1, decimals: 1,
    band: () => [7, 20], badSide: "high", tol: 8,
    weights: { inflam: 0.6 },
  },
  {
    key: "albumin", tier: "blood", group: "Kidney & liver", label: "Albumin", unit: "g/dL",
    hint: "Liver function and nutrition.",
    min: 1.5, max: 6.5, softMin: 3, softMax: 5.5, step: 0.1, decimals: 1,
    band: () => [4.0, 5.0], badSide: "low", tol: 0.5,
    weights: { inflam: 0.8 },
  },
  {
    key: "glucose", tier: "blood", group: "Sugar & cholesterol", label: "Fasting glucose", unit: "mg/dL",
    hint: "After at least 8 hours without food.",
    min: 30, max: 600, softMin: 55, softMax: 300, step: 1, decimals: 0,
    band: () => [70, 99], badSide: "both", tol: 18,
    weights: { metabolic: 1 },
  },
  {
    key: "hba1c", tier: "blood", group: "Sugar & cholesterol", label: "HbA1c", unit: "%",
    hint: "Average blood sugar over about 3 months.",
    min: 3, max: 18, softMin: 4, softMax: 12, step: 0.1, decimals: 1,
    band: () => [4.5, 5.6], badSide: "high", tol: 0.6,
    weights: { metabolic: 1.2 },
  },
  {
    key: "ldl", tier: "blood", group: "Sugar & cholesterol", label: "LDL cholesterol", unit: "mg/dL",
    hint: "The lipid most linked to artery plaque.",
    min: 20, max: 400, softMin: 40, softMax: 250, step: 1, decimals: 0,
    band: () => [40, 100], badSide: "high", tol: 35,
    weights: { cardio: 0.6, metabolic: 0.5 },
  },
  {
    key: "hdl", tier: "blood", group: "Sugar & cholesterol", label: "HDL cholesterol", unit: "mg/dL",
    hint: "Higher is generally better.",
    min: 10, max: 150, softMin: 25, softMax: 120, step: 1, decimals: 0,
    band: () => [50, 90], badSide: "low", tol: 15,
    weights: { cardio: 0.6, metabolic: 0.5 },
  },
  {
    key: "crp", tier: "blood", group: "Inflammation", label: "C-reactive protein (hs-CRP)", unit: "mg/L",
    hint: "A general marker of inflammation.",
    min: 0, max: 300, softMin: 0, softMax: 50, step: 0.1, decimals: 1,
    band: () => [0, 1], badSide: "high", tol: 2,
    weights: { inflam: 1.5 },
  },

  // ---------- Phase 3 · DNA ----------
  {
    key: "telomere", tier: "dna", group: "DNA report", label: "Telomere length", unit: "kb",
    hint: "Mean telomere length from your lab report.",
    min: 2, max: 15, softMin: 3.5, softMax: 12, step: 0.01, decimals: 2,
    expected: (c) => 8.4 - 0.03 * (c.age - 20), sd: 0.8, higherIsBetter: true,
    weights: { epigen: 1 },
  },
  {
    key: "dnam_age", tier: "dna", group: "DNA report", label: "Methylation clock estimate", unit: "years",
    hint: "Epigenetic age estimate from the lab's methylation analysis.",
    min: 0, max: 120, softMin: 10, softMax: 100, step: 0.1, decimals: 1,
    weights: {},
  },
];

export const PARAM_MAP: Record<string, Param> = Object.fromEntries(PARAMS.map((p) => [p.key, p]));
export const byTier = (t: Tier) => PARAMS.filter((p) => p.tier === t);
export const MIN_REQUIRED: Record<Tier, number> = { physical: 6, blood: 6, dna: 2 };

export interface FieldIssue {
  level: "error" | "warn";
  message: string;
}

export function checkValue(p: Param, v: number): FieldIssue | null {
  if (!Number.isFinite(v)) return { level: "error", message: "Enter a number." };
  if (v < p.min || v > p.max) return { level: "error", message: `Enter a value between ${p.min} and ${p.max} ${p.unit}.` };
  if (v < p.softMin || v > p.softMax) return { level: "warn", message: `That's unusual (typical ${p.softMin}–${p.softMax}). Check it before continuing.` };
  return null;
}

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Score one parameter. Positive = better than expected for age, negative = worse. */
export function paramZ(p: Param, raw: number, c: Ctx): number {
  const v = p.transform ? p.transform(raw, c) : raw;
  if (p.expected && p.sd) {
    const z = (v - p.expected(c)) / p.sd;
    return clamp(p.higherIsBetter ? z : -z, -3, 3);
  }
  if (p.band) {
    const [lo, hi] = p.band(c);
    const side = p.badSide ?? "both";
    const tol = p.tol ?? (hi - lo) / 2;
    const width = Math.max(hi - lo, 1e-9);
    if (v > hi) return side === "low" ? 0.6 : clamp(-(v - hi) / tol, -3, 0);
    if (v < lo) return side === "high" ? 0.6 : clamp(-(lo - v) / tol, -3, 0);
    let t: number;
    if (side === "high") t = (v - lo) / width;
    else if (side === "low") t = (hi - v) / width;
    else t = Math.abs(v - (lo + hi) / 2) / (width / 2);
    return 0.6 * (1 - clamp(t, 0, 1));
  }
  return 0;
}

/** Inverse of paramZ for demo personas: produce a realistic value for a target score. */
export function valueForZ(p: Param, z: number, c: Ctx): number {
  let v: number;
  if (p.expected && p.sd) {
    const target = p.expected(c) + (p.higherIsBetter ? z : -z) * p.sd;
    v = p.transform ? target * c.heightCm : target;
  } else if (p.band) {
    const [lo, hi] = p.band(c);
    const side = p.badSide ?? "both";
    const tol = p.tol ?? (hi - lo) / 2;
    if (z >= 0) {
      const t = 1 - Math.min(z, 0.6) / 0.6;
      if (side === "high") v = lo + t * (hi - lo);
      else if (side === "low") v = hi - t * (hi - lo);
      else v = (lo + hi) / 2 + t * ((hi - lo) / 2) * 0.9;
    } else {
      const dist = -z * tol;
      v = side === "low" ? lo - dist : hi + dist;
    }
  } else v = (p.softMin + p.softMax) / 2;
  v = clamp(v, p.softMin, p.softMax);
  const m = Math.pow(10, p.decimals);
  return Math.round(v * m) / m;
}
