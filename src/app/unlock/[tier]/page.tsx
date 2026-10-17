import { notFound } from "next/navigation";
import { UnlockClient } from "@/components/UnlockClient";

export const dynamicParams = false;
export function generateStaticParams() {
  return [{ tier: "blood" }, { tier: "dna" }];
}

export default async function Page({ params }: { params: Promise<{ tier: string }> }) {
  const { tier } = await params;
  if (tier !== "blood" && tier !== "dna") notFound();
  return <UnlockClient tier={tier} />;
}
