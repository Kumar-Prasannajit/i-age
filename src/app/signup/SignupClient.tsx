"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/Logo";
import { useStore, ageFromDob, type Profile } from "@/lib/store";
import { PERSONAS } from "@/lib/personas";

export function SignupClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, ready, signedIn, setProfile, signIn } = useStore();
  const [mode, setMode] = useState<"signup" | "login">(params.get("mode") === "login" ? "login" : "signup");
  const [f, setF] = useState({ name: "", email: "", password: "", dob: "", sex: "male", height: "", weight: "" });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (ready && signedIn && mode === "signup" && !f.name) router.replace("/dashboard/");
  }, [ready, signedIn, mode, f.name, router]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    if (mode === "login") {
      if (state.profile && state.profile.email.toLowerCase() === f.email.trim().toLowerCase()) {
        signIn();
        return router.push("/dashboard/");
      }
      return setErr("We don't have an account for that email in this demo. Sign up, or try a sample profile below.");
    }
    const h = Number(f.height), w = Number(f.weight);
    const age = ageFromDob(f.dob);
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Enter your name and a valid email.");
    if (f.password.length < 8) return setErr("Use a password with at least 8 characters.");
    if (!f.dob || age < 18 || age > 100) return setErr("You must be between 18 and 100 to use i-Age. Check your date of birth.");
    if (!(h >= 120 && h <= 230)) return setErr("Enter your height between 120 and 230 cm.");
    if (!(w >= 30 && w <= 250)) return setErr("Enter your weight between 30 and 250 kg.");
    const p: Profile = { name: f.name.trim(), email: f.email.trim(), dob: f.dob, sex: f.sex as Profile["sex"], heightCm: h, weightKg: w };
    setProfile(p);
    router.push("/dashboard/");
  };

  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className="container" style={{ maxWidth: 520, paddingTop: 22, paddingBottom: 60 }}>
      <div className="row between" style={{ marginBottom: 22 }}><Logo /></div>
      <div className="glass pad stack" style={{ padding: 24, gap: 18 }}>
        <div className="seg" role="group" aria-label="Account mode">
          <button aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setErr(""); }}>Sign up</button>
          <button aria-pressed={mode === "login"} onClick={() => { setMode("login"); setErr(""); }}>Log in</button>
        </div>
        <div>
          <h1 style={{ fontSize: 30 }}>{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="muted" style={{ marginTop: 6 }}>{mode === "signup" ? "Tell us a little about you. We reuse this in every phase." : "Log in with your email to pick up where you left off."}</p>
        </div>
        <form className="stack" onSubmit={submit} noValidate>
          {mode === "signup" && (
            <div className="field"><label htmlFor="n">Full name</label><input id="n" className="input" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          )}
          <div className="field"><label htmlFor="e">Email</label><input id="e" className="input" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="field"><label htmlFor="p">Password</label><input id="p" className="input" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={f.password} onChange={(e) => set("password", e.target.value)} />{mode === "signup" && <span className="hint">At least 8 characters. Demo only: nothing is sent anywhere.</span>}</div>
          {mode === "signup" && (
            <>
              <div className="grid two" style={{ gap: 12 }}>
                <div className="field"><label htmlFor="d">Date of birth</label><input id="d" className="input" type="date" max={today} value={f.dob} onChange={(e) => set("dob", e.target.value)} /></div>
                <div className="field"><label htmlFor="s">Sex at birth</label><select id="s" className="input" value={f.sex} onChange={(e) => set("sex", e.target.value)}><option value="male">Male</option><option value="female">Female</option></select><span className="hint">Reference ranges differ by sex.</span></div>
              </div>
              <div className="grid two" style={{ gap: 12 }}>
                <div className="field"><label htmlFor="h">Height</label><div className="unit"><input id="h" className="input" inputMode="decimal" value={f.height} onChange={(e) => set("height", e.target.value)} /><span>cm</span></div></div>
                <div className="field"><label htmlFor="w">Weight</label><div className="unit"><input id="w" className="input" inputMode="decimal" value={f.weight} onChange={(e) => set("weight", e.target.value)} /><span>kg</span></div></div>
              </div>
            </>
          )}
          {err && <p className="msg-err" role="alert">{err}</p>}
          <button className="btn btn-primary btn-lg btn-block" type="submit">{mode === "signup" ? "Create account" : "Log in"}</button>
        </form>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Presenting? Try a sample profile</div>
          <div className="stack" style={{ gap: 8 }}>
            {PERSONAS.map((p) => (
              <button key={p.id} className="btn" style={{ justifyContent: "space-between" }} onClick={() => { setProfile(p.profile); router.push("/dashboard/"); }}>
                <span>{p.profile.name}, {ageFromDob(p.profile.dob)}</span><span className="muted" style={{ fontWeight: 500, fontSize: 14 }}>{p.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
