import { notFound } from "next/navigation";
import { AssessClient } from "@/components/AssessClient";
import type { Tier } from "@/lib/scoring/types";

const TIERS: Tier[] = ["physical", "blood", "dna"];
export const dynamicParams = false;
export function generateStaticParams() {
  return TIERS.map((phase) => ({ phase }));
}

export default async function Page({ params }: { params: Promise<{ phase: string }> }) {
  const { phase } = await params;
  if (!TIERS.includes(phase as Tier)) notFound();
  return <AssessClient tier={phase as Tier} />;
}
