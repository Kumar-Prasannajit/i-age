import { mockAssess } from "./mock";
import type { AssessRequest, AssessResponse } from "./types";

export * from "./types";

const PROVIDER = process.env.NEXT_PUBLIC_SCORING_PROVIDER ?? "mock";
const URL_BASE = process.env.NEXT_PUBLIC_SCORING_URL ?? "";

/**
 * Single entry point for scoring. Swap providers with env config only:
 *   NEXT_PUBLIC_SCORING_PROVIDER=http  NEXT_PUBLIC_SCORING_URL=https://models.example.com
 * The service must implement POST /assess (AssessRequest -> AssessResponse).
 */
export async function assess(req: AssessRequest): Promise<AssessResponse> {
  if (PROVIDER === "http") {
    const res = await fetch(`${URL_BASE.replace(/\/$/, "")}/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`Scoring service returned ${res.status}`);
    return (await res.json()) as AssessResponse;
  }
  return mockAssess(req);
}

export const scoringProvider = PROVIDER;
