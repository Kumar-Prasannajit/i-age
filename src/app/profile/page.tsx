"use client";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ageFromDob, useStore } from "@/lib/store";

function Profile() {
  const { state, withdrawConsent, reset, signOut } = useStore();
  const router = useRouter();
  const p = state.profile!;
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "i-age-my-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const rows: [string, string][] = [
    ["Name", p.name], ["Email", p.email], ["Age", `${ageFromDob(p.dob)} years`], ["Sex at birth", p.sex === "male" ? "Male" : "Female"],
    ["Height", `${p.heightCm} cm`], ["Weight", `${p.weightKg} kg`],
  ];
  return (
    <div className="stack" style={{ gap: 18, maxWidth: 680 }}>
      <h1 style={{ fontSize: "clamp(28px,5vw,40px)" }}>Profile</h1>
      <section className="glass pad stack" style={{ gap: 12 }}>
        {rows.map(([k, v]) => <div key={k} className="row between"><span className="muted">{k}</span><b>{v}</b></div>)}
        <div><button className="btn" onClick={() => { signOut(); router.replace("/signup/?mode=login"); }}>Log out</button></div>
      </section>
      <section className="glass pad stack">
        <h2 style={{ fontSize: 20 }}>Privacy and consent</h2>
        <div className="row between wrap">
          <span>DNA data consent</span>
          <span className={`chip ${state.consent ? "ok" : ""}`}>{state.consent ? `Given ${new Date(state.consent.at).toLocaleDateString("en-IN")} · ${state.consent.version}` : "Not given"}</span>
        </div>
        {state.consent && <div><button className="btn btn-sm" onClick={() => { if (confirm("Withdraw DNA consent? Your saved DNA values will be removed.")) withdrawConsent(); }}>Withdraw consent</button></div>}
        <div className="row wrap" style={{ gap: 10 }}>
          <button className="btn" onClick={exportData}>Export my data</button>
          <button className="btn" onClick={() => { if (confirm("Delete your account and all data? This can't be undone.")) { reset(); router.replace("/"); } }}>Delete my account</button>
        </div>
        <p className="hint">Demo build: your data lives only in this browser.</p>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <Profile />
    </AppShell>
  );
}
