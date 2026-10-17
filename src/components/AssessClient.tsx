"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AppShell } from "./AppShell";
import { Icon } from "./Icon";
import { Pipeline, sleep } from "./Pipeline";
import { ReactionTest, Stopwatch } from "./Tools";
import { AUTOFILL_EVENT } from "./DemoBar";
import { byTier, checkValue, MIN_REQUIRED, type Param } from "@/lib/params";
import { assess, type AssessRequest, type Tier } from "@/lib/scoring";
import { autofill } from "@/lib/personas";
import { ctxOf, useStore } from "@/lib/store";
import { CONSENT_VERSION, money, PRICES } from "@/lib/config";

const META: Record<Tier, { n: 1 | 2 | 3; title: string; sub: string; steps: string[] }> = {
  physical: { n: 1, title: "Phase 1 · Physical", sub: "About 10 minutes. Skip anything you can't measure. We need at least 6 of the 11 measures.", steps: ["Validating your entries", "Pre-processing", "Running the physical age model", "Preparing your result"] },
  blood: { n: 2, title: "Phase 2 · Blood", sub: "Copy the values from your lab report. We need at least 6 of the 11 results.", steps: ["Validating your entries", "Pre-processing blood data", "Combining physical and blood data", "Preparing your result"] },
  dna: { n: 3, title: "Phase 3 · DNA", sub: "Upload the report from a supported partner lab, or use sample data for the demo.", steps: ["Running DNA quality check", "Extracting ageing features", "Running the DNA age model", "Integrating physical, blood and DNA", "Preparing your result"] },
};

function parseReport(text: string): { telomere?: number; dnam_age?: number } {
  const want: Record<string, string[]> = {
    telomere: ["telomere_length_kb", "telomere_kb", "telomere_length", "telomere"],
    dnam_age: ["dnam_age", "epigenetic_age", "methylation_age", "dnamage"],
  };
  const flat: Record<string, number> = {};
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    Object.entries(j).forEach(([k, v]) => { if (typeof v === "number") flat[k.toLowerCase()] = v; });
  } catch {
    text.split(/\r?\n/).forEach((line) => {
      if (line.trim().startsWith("#")) return;
      const parts = line.split(/[,:=\t]/);
      if (parts.length >= 2) {
        const n = parseFloat(parts[1]);
        if (Number.isFinite(n)) flat[parts[0].trim().toLowerCase().replace(/[^a-z0-9_]/g, "")] = n;
      }
    });
  }
  const out: { telomere?: number; dnam_age?: number } = {};
  (Object.keys(want) as ("telomere" | "dnam_age")[]).forEach((k) => {
    const hit = want[k].find((alias) => alias in flat);
    if (hit) out[k] = flat[hit];
  });
  return out;
}

export function AssessClient({ tier }: { tier: Tier }) {
  return (
    <AppShell>
      <Gate tier={tier} />
    </AppShell>
  );
}

function GateCard({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="glass pad stack" style={{ padding: 32, textAlign: "center", alignItems: "center" }}>
      <span className="tile ico" style={{ padding: 0 }}><Icon name="lock" /></span>
      <h1 style={{ fontSize: 28 }}>{title}</h1>
      <p className="muted" style={{ maxWidth: 420 }}>{body}</p>
      <Link className="btn btn-primary" href={href}>{cta}</Link>
    </div>
  );
}

function Gate({ tier }: { tier: Tier }) {
  const { state, phaseDone, giveConsent } = useStore();
  if (tier === "blood") {
    if (!phaseDone(1)) return <GateCard title="Finish Phase 1 first" body="Blood analysis builds on your physical results." href="/assess/physical/" cta="Go to Phase 1" />;
    if (!state.unlocked.blood) return <GateCard title="Unlock blood analysis" body="Add your blood results to sharpen your estimate." href="/unlock/blood/" cta={`Unlock for ${money(PRICES.blood)}`} />;
  }
  if (tier === "dna") {
    if (!phaseDone(2)) return <GateCard title="Finish Phase 2 first" body="DNA analysis builds on your physical and blood results." href="/assess/blood/" cta="Go to Phase 2" />;
    if (!state.unlocked.dna) return <GateCard title="Unlock DNA analysis" body="Add a partner-lab DNA report for your epigenetic age." href="/unlock/dna/" cta={`Unlock for ${money(PRICES.dna)}`} />;
    if (!state.consent) return <Consent onGive={giveConsent} />;
  }
  return <Form tier={tier} />;
}

function Consent({ onGive }: { onGive: () => void }) {
  const [c, setC] = useState([false, false, false]);
  const items = [
    "I agree to i-Age processing my DNA data to calculate my biological age.",
    "I understand genetic data is sensitive, and that my result is wellness insight, not a medical diagnosis.",
    "I know I can withdraw consent, export my data or delete it at any time from my profile.",
  ];
  return (
    <div className="glass pad stack" style={{ padding: 26, maxWidth: 640, margin: "0 auto" }}>
      <span className="tile ico" style={{ padding: 0 }}><Icon name="shield" /></span>
      <h1 style={{ fontSize: 28 }}>Before you share DNA data</h1>
      <p className="muted">This consent is separate from your account and covers DNA data only. We'll record the date and version ({CONSENT_VERSION}).</p>
      {items.map((t, i) => (
        <label key={t} className="check">
          <input type="checkbox" checked={c[i]} onChange={(e) => setC((s) => s.map((v, j) => (j === i ? e.target.checked : v)))} />
          <span>{t}</span>
        </label>
      ))}
      <button className="btn btn-primary btn-lg" disabled={!c.every(Boolean)} onClick={onGive}>Give consent and continue</button>
    </div>
  );
}

function Form({ tier }: { tier: Tier }) {
  const router = useRouter();
  const { state, saveData, addAssessment } = useStore();
  const profile = state.profile!;
  const ctx = useMemo(() => ctxOf(profile), [profile]);
  const params = useMemo(() => byTier(tier), [tier]);
  const meta = META[tier];

  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(state.data[tier]).map(([k, v]) => [k, String(v)])),
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [tool, setTool] = useState<{ key: string; kind: "reaction" | "balance" | "gait" } | null>(null);
  const [pipe, setPipe] = useState<number | null>(null);
  const [fail, setFail] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const on = (e: Event) => {
      const z = (e as CustomEvent<{ z: number }>).detail.z;
      const filled = autofill(tier, z, ctx);
      setVals(Object.fromEntries(Object.entries(filled).map(([k, v]) => [k, String(v)])));
      setConfirm(false);
      setNote({ ok: true, text: "Sample values filled in." });
    };
    window.addEventListener(AUTOFILL_EVENT, on);
    return () => window.removeEventListener(AUTOFILL_EVENT, on);
  }, [tier, ctx]);

  const parsed = params.map((p) => {
    const raw = (vals[p.key] ?? "").trim();
    return { p, raw, value: raw === "" ? null : Number(raw) };
  });
  const filled = parsed.filter((x) => x.value !== null);
  const issues: Record<string, ReturnType<typeof checkValue>> = {};
  filled.forEach((x) => { issues[x.p.key] = checkValue(x.p, x.value as number); });
  if (tier === "physical" && vals.sbp && vals.dbp && Number(vals.sbp) <= Number(vals.dbp) && !issues.sbp)
    issues.sbp = { level: "error", message: "Systolic should be higher than diastolic." };
  const errors = Object.values(issues).filter((i) => i?.level === "error").length;
  const warns = Object.values(issues).filter((i) => i?.level === "warn").length;
  const need = MIN_REQUIRED[tier];
  const enough = filled.length >= need;

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const got = parseReport(text);
    if (got.telomere !== undefined && got.dnam_age !== undefined) {
      setVals({ telomere: String(got.telomere), dnam_age: String(got.dnam_age) });
      setNote({ ok: true, text: `Read 2 values from ${file.name}. Check they match your report.` });
    } else {
      setNote({ ok: false, text: `We couldn't find both telomere length and a methylation clock estimate in ${file.name}. Download the sample file to see the expected format.` });
    }
    e.target.value = "";
  };

  const submit = async () => {
    setSubmitted(true);
    setFail("");
    if (errors > 0 || !enough) return;
    if (warns > 0 && !confirm) return;
    const data: Record<string, number> = {};
    filled.forEach((x) => { data[x.p.key] = x.value as number; });
    saveData(tier, data);
    const phases: AssessRequest["phases"] =
      tier === "physical" ? { physical: data }
      : tier === "blood" ? { physical: state.data.physical, blood: data }
      : { physical: state.data.physical, blood: state.data.blood, dna: data };
    const req: AssessRequest = { profile: { age_years: ctx.age, sex: ctx.sex, height_cm: ctx.heightCm, weight_kg: ctx.weightKg }, phases };
    try {
      setPipe(0);
      const job = assess(req);
      for (let i = 1; i <= meta.steps.length; i++) { await sleep(520); setPipe(i); }
      const res = await job;
      addAssessment(meta.n, res);
      router.push("/result/");
    } catch {
      setPipe(null);
      setFail("We couldn't calculate your result. Check your connection and try again.");
    }
  };

  const groups = Array.from(new Set(params.map((p) => p.group)));
  const show = (p: Param) => (touched[p.key] || submitted) ? issues[p.key] : null;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>
        <h1 style={{ fontSize: "clamp(28px,5vw,40px)" }}>{meta.title}</h1>
        <p className="muted" style={{ marginTop: 6 }}>{meta.sub}</p>
      </div>

      {tier === "dna" && (
        <section className="glass pad stack" aria-label="Upload DNA report">
          <label className="stack" style={{ alignItems: "center", textAlign: "center", padding: 22, border: "2px dashed var(--hairline)", borderRadius: 20, cursor: "pointer", gap: 8 }}>
            <Icon name="upload" size={28} />
            <b>Upload your lab report</b>
            <span className="hint">CSV, JSON or text with telomere length and a methylation clock estimate</span>
            <input type="file" accept=".csv,.json,.txt" onChange={onFile} className="sr" />
          </label>
          <div className="row wrap" style={{ gap: 10 }}>
            <button className="btn btn-sm" type="button" onClick={() => window.dispatchEvent(new CustomEvent(AUTOFILL_EVENT, { detail: { z: 0.3 } }))}>Use sample data</button>
            <a className="btn btn-sm" href="/samples/sample-dna-report.csv" download>Download sample file</a>
          </div>
        </section>
      )}

      {note && <p className={note.ok ? "msg-warn" : "msg-err"} style={note.ok ? { color: "var(--good)" } : undefined} role="status">{note.text}</p>}

      {groups.map((g) => (
        <section key={g} className="glass pad" aria-label={g}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>{g}</h2>
          <div className="grid two" style={{ gap: 16 }}>
            {params.filter((p) => p.group === g).map((p) => {
              const iss = show(p);
              return (
                <div key={p.key} className="field">
                  <label htmlFor={p.key}>
                    {p.label}
                    {p.equipment && <span className="chip" style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px" }}>Needs equipment</span>}
                  </label>
                  <div className="unit">
                    <input
                      id={p.key} className={`input num ${iss?.level === "error" ? "err" : iss?.level === "warn" ? "warn" : ""}`}
                      inputMode="decimal" autoComplete="off" value={vals[p.key] ?? ""}
                      onChange={(e) => { setVals((s) => ({ ...s, [p.key]: e.target.value })); setConfirm(false); }}
                      onBlur={() => setTouched((t) => ({ ...t, [p.key]: true }))}
                      aria-invalid={iss?.level === "error"} aria-describedby={`${p.key}-h`}
                    />
                    <span>{p.unit}</span>
                  </div>
                  {iss && <span className={iss.level === "error" ? "msg-err" : "msg-warn"} role="alert">{iss.message}</span>}
                  <span className="hint" id={`${p.key}-h`}>{p.hint}</span>
                  {p.tool && (
                    <div><button type="button" className="link" onClick={() => setTool({ key: p.key, kind: p.tool! })}>
                      {p.tool === "reaction" ? "Run the reaction test" : p.tool === "gait" ? "Time a 10 m walk" : "Open the timer"}
                    </button></div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="glass pad glass-strong stack" aria-live="polite">
        <div className="row between"><b>{filled.length} of {params.length} provided</b><span className="hint">at least {need} needed</span></div>
        <div className="progress"><i style={{ width: `${(filled.length / params.length) * 100}%` }} /></div>
        {submitted && !enough && <p className="msg-err" role="alert">Add at least {need} measures to continue. You've entered {filled.length}.</p>}
        {submitted && errors > 0 && <p className="msg-err" role="alert">Fix the highlighted fields to continue.</p>}
        {warns > 0 && errors === 0 && (
          <label className="check">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
            <span>Some values look unusual. I've double-checked them and they're correct.</span>
          </label>
        )}
        {submitted && warns > 0 && !confirm && errors === 0 && <p className="msg-warn" role="alert">Confirm your unusual values to continue.</p>}
        {fail && <p className="msg-err" role="alert">{fail}</p>}
        <button className="btn btn-primary btn-lg btn-block" onClick={submit}>
          {tier === "dna" ? "Run DNA analysis" : "See my result"}
        </button>
      </section>

      {tool?.kind === "reaction" && <ReactionTest onClose={() => setTool(null)} onUse={(ms) => setVals((s) => ({ ...s, [tool.key]: String(ms) }))} />}
      {tool && tool.kind !== "reaction" && <Stopwatch mode={tool.kind} onClose={() => setTool(null)} onUse={(v) => setVals((s) => ({ ...s, [tool.key]: String(v) }))} />}
      {pipe !== null && <Pipeline title={tier === "dna" ? "Analysing your DNA data" : "Calculating your biological age"} steps={meta.steps} index={pipe} />}
    </div>
  );
}
