import type { AssessResponse, SubKey } from "./scoring/types";

export interface PlanItem { key: SubKey; title: string; why: string; actions: string[]; retest: string; }

const LIB: Record<SubKey, Omit<PlanItem, "key" | "why">> = {
  cardio: {
    title: "Heart & circulation",
    actions: ["Build to 150 minutes a week of brisk walking, cycling or swimming.", "Add 1–2 interval sessions a week once your base is steady.", "Cut back on salt and ultra-processed food; check your blood pressure at home weekly."],
    retest: "Retest blood pressure and fitness in 90 days.",
  },
  oxygen: {
    title: "Oxygen & lungs",
    actions: ["Do steady cardio you can hold a conversation during, 3 times a week.", "Practise slow nasal breathing for 5 minutes a day.", "Avoid smoke and poor-air exposure; ask a doctor about iron if your blood count is low."],
    retest: "Retest lung and fitness measures in 90 days.",
  },
  neuro: {
    title: "Strength & balance",
    actions: ["Strength-train major muscle groups twice a week.", "Practise one-leg balance daily, eyes open first, then closed near a wall.", "Walk a little faster than comfortable for part of each walk."],
    retest: "Retest push-ups, balance and gait speed in 90 days.",
  },
  metabolic: {
    title: "Metabolic health",
    actions: ["Aim for a smaller waist-height ratio: below 0.5 is a good target.", "Fill half your plate with vegetables; swap sugary drinks for water.", "Take a 10-minute walk after your biggest meals."],
    retest: "Retest waist and blood sugar markers in 3–6 months.",
  },
  inflam: {
    title: "Inflammation & organ health",
    actions: ["Prioritise 7–9 hours of sleep and regular sleep times.", "Eat more fibre, oily fish, nuts and colourful plants.", "Review alcohol intake and recent illness or injury with your doctor."],
    retest: "Repeat blood work in 6 months.",
  },
  epigen: {
    title: "Epigenetic ageing",
    actions: ["Combine the steps above: exercise, sleep, diet and stress care all show up in methylation over time.", "Stop smoking and keep alcohol low.", "Keep a steady routine for at least 6 months before retesting."],
    retest: "Retest DNA no sooner than 12 months.",
  },
};

export function buildPlan(r: AssessResponse): { items: PlanItem[]; maintain: boolean } {
  const worse = [...r.subscores].filter((s) => s.delta > 0.5).sort((a, b) => b.delta - a.delta).slice(0, 3);
  if (!worse.length) {
    const best = [...r.subscores].sort((a, b) => a.delta - b.delta)[0];
    return {
      maintain: true,
      items: best ? [{ key: best.key, why: "Your strongest area. Keep doing what works.", ...LIB[best.key] }] : [],
    };
  }
  return {
    maintain: false,
    items: worse.map((s) => ({ key: s.key, why: `About ${s.delta.toFixed(1)} years older than your age.`, ...LIB[s.key] })),
  };
}

export interface Flag { label: string; note: string; }

/** Simple threshold flags. Information only, never a diagnosis. */
export function clinicalFlags(physical?: Record<string, number>, blood?: Record<string, number>): Flag[] {
  const out: Flag[] = [];
  if (physical && ((physical.sbp ?? 0) >= 140 || (physical.dbp ?? 0) >= 90))
    out.push({ label: "Blood pressure", note: "Readings at or above 140/90 are worth checking with a doctor." });
  if (blood?.hba1c !== undefined && blood.hba1c >= 6.5) out.push({ label: "HbA1c", note: "6.5% or higher is a level doctors look into." });
  if (blood?.glucose !== undefined && blood.glucose >= 126) out.push({ label: "Fasting glucose", note: "126 mg/dL or higher is worth a follow-up." });
  if (blood?.crp !== undefined && blood.crp >= 3) out.push({ label: "CRP", note: "3 mg/L or higher suggests raised inflammation. A doctor can help find the cause." });
  if (blood?.ldl !== undefined && blood.ldl >= 160) out.push({ label: "LDL cholesterol", note: "160 mg/dL or higher is considered high." });
  if (blood?.hb !== undefined && blood.hb < 11) out.push({ label: "Haemoglobin", note: "A low reading can mean anaemia. Ask a doctor." });
  return out;
}
