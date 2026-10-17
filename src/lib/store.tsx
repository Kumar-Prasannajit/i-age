"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AssessResponse, Sex, Tier } from "./scoring/types";
import type { Ctx } from "./params";
import { CONSENT_VERSION } from "./config";

export interface Profile {
  name: string;
  email: string;
  dob: string; // yyyy-mm-dd
  sex: Sex;
  heightCm: number;
  weightKg: number;
}

export interface Assessment {
  id: string;
  at: string;
  phase: 1 | 2 | 3;
  result: AssessResponse;
}

export interface AppState {
  v: 1;
  profile?: Profile;
  data: Record<Tier, Record<string, number>>;
  unlocked: { blood: boolean; dna: boolean };
  consent?: { at: string; version: string };
  history: Assessment[];
  /** Set on log out. The profile and its data stay so the same email can log back in. */
  signedOut?: boolean;
}

const KEY = "iage.demo.v1";
const EMPTY: AppState = {
  v: 1,
  data: { physical: {}, blood: {}, dna: {} },
  unlocked: { blood: false, dna: false },
  history: [],
};

export function ageFromDob(dob: string, now = new Date()): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a -= 1;
  return a;
}

export function ctxOf(p: Profile): Ctx {
  return { age: ageFromDob(p.dob), sex: p.sex, heightCm: p.heightCm, weightKg: p.weightKg };
}

interface StoreApi {
  state: AppState;
  ready: boolean;
  signedIn: boolean;
  setProfile: (p: Profile) => void;
  signIn: () => void;
  signOut: () => void;
  saveData: (tier: Tier, values: Record<string, number>) => void;
  unlock: (t: "blood" | "dna") => void;
  giveConsent: () => void;
  withdrawConsent: () => void;
  addAssessment: (phase: 1 | 2 | 3, result: AssessResponse) => void;
  reset: () => void;
  latest: Assessment | undefined;
  phaseDone: (n: 1 | 2 | 3) => boolean;
}

const Ctx_ = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed?.v === 1) setState(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable */
    }
  }, [state, ready]);

  // One account per browser: a different email starts from empty data so it never inherits the last user's results.
  const setProfile = useCallback(
    (profile: Profile) =>
      setState((s) => {
        const same = s.profile?.email.toLowerCase() === profile.email.toLowerCase();
        return { ...(same || !s.profile ? s : EMPTY), profile, signedOut: false };
      }),
    [],
  );
  const signIn = useCallback(() => setState((s) => ({ ...s, signedOut: false })), []);
  const signOut = useCallback(() => setState((s) => ({ ...s, signedOut: true })), []);
  const saveData = useCallback(
    (tier: Tier, values: Record<string, number>) => setState((s) => ({ ...s, data: { ...s.data, [tier]: values } })),
    [],
  );
  const unlock = useCallback((t: "blood" | "dna") => setState((s) => ({ ...s, unlocked: { ...s.unlocked, [t]: true } })), []);
  const giveConsent = useCallback(
    () => setState((s) => ({ ...s, consent: { at: new Date().toISOString(), version: CONSENT_VERSION } })),
    [],
  );
  const withdrawConsent = useCallback(() => setState((s) => ({ ...s, consent: undefined, data: { ...s.data, dna: {} } })), []);
  const addAssessment = useCallback(
    (phase: 1 | 2 | 3, result: AssessResponse) =>
      setState((s) => ({
        ...s,
        history: [...s.history, { id: `${Date.now()}-${phase}`, at: new Date().toISOString(), phase, result }],
      })),
    [],
  );
  const reset = useCallback(() => setState(EMPTY), []);

  const api = useMemo<StoreApi>(() => {
    const latest = state.history[state.history.length - 1];
    return {
      state, ready, signedIn: !!state.profile && !state.signedOut,
      setProfile, signIn, signOut, saveData, unlock, giveConsent, withdrawConsent, addAssessment, reset, latest,
      phaseDone: (n) => state.history.some((h) => h.phase === n),
    };
  }, [state, ready, setProfile, signIn, signOut, saveData, unlock, giveConsent, withdrawConsent, addAssessment, reset]);

  return <Ctx_.Provider value={api}>{children}</Ctx_.Provider>;
}

export function useStore(): StoreApi {
  const v = useContext(Ctx_);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
