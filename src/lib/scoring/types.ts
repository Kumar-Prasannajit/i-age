/**
 * i-Age scoring API contract.
 * The demo implements this in the browser (mock). The real model service
 * only needs to implement POST /assess with the same shapes.
 */
export type Sex = "male" | "female";
export type Tier = "physical" | "blood" | "dna";
export type SubKey = "cardio" | "oxygen" | "neuro" | "metabolic" | "inflam" | "epigen";

export interface AssessRequest {
  profile: { age_years: number; sex: Sex; height_cm: number; weight_kg: number };
  /** Raw measured values keyed by parameter key (see lib/params.ts). */
  phases: Partial<Record<Tier, Record<string, number>>>;
}

export interface Subscore {
  key: SubKey;
  label: string;
  age: number; // years
  delta: number; // years vs chronological age (+ = older)
  phase: Tier; // which tier mainly informs it
}

export interface Driver {
  key: string;
  label: string;
  value: number;
  unit: string;
  effect_years: number; // + = ageing you, - = keeping you younger
}

export interface AssessResponse {
  chronological_age: number;
  biological_age: number;
  age_gap: number; // biological - chronological (+ = older)
  confidence: { low: number; high: number; level: "low" | "moderate" | "high" };
  subscores: Subscore[];
  drivers: Driver[];
  phases_used: Tier[];
  completeness: number; // 0..1 share of parameters supplied
  model_version: string;
  is_demo: boolean;
}
