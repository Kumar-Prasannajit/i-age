import { PARAMS, valueForZ, type Ctx } from "./params";
import type { Tier } from "./scoring/types";
import type { Profile } from "./store";

export interface Persona { id: string; label: string; blurb: string; z: number; profile: Profile; }

export const PERSONAS: Persona[] = [
  { id: "fit", label: "Younger than age", blurb: "Active, strong numbers", z: 1.0,
    profile: { name: "Aarav Mehta", email: "aarav@example.com", dob: "1992-03-14", sex: "male", heightCm: 176, weightKg: 70 } },
  { id: "avg", label: "On par", blurb: "Typical for their age", z: 0.05,
    profile: { name: "Meera Iyer", email: "meera@example.com", dob: "1981-08-02", sex: "female", heightCm: 162, weightKg: 61 } },
  { id: "older", label: "Older than age", blurb: "Room to improve", z: -1.1,
    profile: { name: "Rohit Sharma", email: "rohit@example.com", dob: "1974-11-21", sex: "male", heightCm: 172, weightKg: 84 } },
];

function jitter(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 100) / 100 - 0.5) * 0.7; // deterministic, -0.35..0.35
}

export function autofill(tier: Tier, z: number, c: Ctx): Record<string, number> {
  const out: Record<string, number> = {};
  PARAMS.filter((p) => p.tier === tier).forEach((p) => {
    out[p.key] = valueForZ(p, z + jitter(p.key), c);
  });
  if (tier === "physical") {
    out.sbp = Math.max(out.sbp, out.dbp + 25);
  }
  if (tier === "dna") {
    out.dnam_age = Math.round((c.age - z * 5.2 * 0.9) * 10) / 10;
  }
  return out;
}
