import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { AgeDial } from "@/components/AgeDial";
import { FaqItem } from "@/components/FaqItem";
import { TAGLINE, PRICES, money } from "@/lib/config";

const FAQ = [
  ["Is this a medical diagnosis?", "No. i-Age gives wellness insight about how your body is ageing. It doesn't diagnose or treat any condition. If a result worries you, talk to a doctor."],
  ["How accurate is it?", "This preview uses an illustrative scoring model while our real models are trained on data from our fitness and blood camps. Every result shows a confidence range, and it narrows as you add blood and DNA data."],
  ["What do I need for Phase 1?", "Mostly a tape measure, a timer and a blood pressure cuff. A few measures, such as VO₂ max and FEV₁, need equipment at a partner site. You can skip those and still get a result."],
  ["Will I have to enter my data again?", "Never. Each phase builds on what you've already saved, and your dashboard keeps everything in one place."],
  ["How is my DNA data used?", "Only after you give separate, explicit consent, and only to calculate your result. You can withdraw consent, export your data or delete it from your profile."],
  ["Can I retest?", "Yes. Retake any phase to see how your numbers move. We suggest every 90 days for physical tests and about every 6 months for blood."],
];

export default function Landing() {
  return (
    <>
      <header className="topbar">
        <div className="container">
          <div className="glass tb">
            <Logo />
            <nav className="nav-links" aria-label="Sections">
              <a href="#how">How it works</a>
              <a href="#tiers">Three tiers</a>
              <a href="#pricing">Pricing</a>
              <a href="#privacy">Privacy</a>
              <a href="#faq">FAQ</a>
            </nav>
            <div className="row" style={{ gap: 8 }}>
              <Link className="btn btn-sm" href="/signup/?mode=login">Log in</Link>
              <Link className="btn btn-sm btn-primary" href="/signup/">Start free</Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="container">
          <section className="hero">
            <div className="stack" style={{ gap: 22 }}>
              <h1 className="display">{TAGLINE}</h1>
              <p className="lead">Your birthday says how long you've been around. Your biological age says how your body is doing. Find out the gap, then learn how to close it.</p>
              <div className="row wrap" style={{ gap: 12 }}>
                <Link className="btn btn-primary btn-lg" href="/signup/">Calculate my biological age</Link>
                <a className="btn btn-lg" href="#how">See how it works</a>
              </div>
              <p className="hint">Phase 1 is free and takes about 10 minutes.</p>
            </div>
            <div className="glass pad" style={{ padding: 26, position: "relative" }}>
              <AgeDial bio={31.4} chrono={36} />
              <div className="row between wrap" style={{ marginTop: 12 }}>
                <span className="chip ok">Sample result</span>
                <span className="hint">Calendar age 36 · illustrative</span>
              </div>
            </div>
          </section>
        </div>

        <div className="container section" id="tiers">
          <h2>Three tiers. One account. One dashboard.</h2>
          <p className="sub">Start free. Add blood and DNA data when you want a sharper picture. Every tier reuses what you've already shared.</p>
          <div className="grid three">
            <article className="glass tier-card">
              <div className="row between"><span className="tile ico" style={{ padding: 0 }}><Icon name="activity" /></span><span className="chip free">Free</span></div>
              <h3>Physical</h3>
              <p className="muted">Fitness and function tests you can mostly do yourself.</p>
              <div className="pill-list">{["VO₂ max", "Max heart rate", "Blood pressure", "Push-ups", "Sit & rise", "One-leg stand", "Waist-height ratio", "Reaction time", "FEV₁", "Gait speed"].map((x) => <span key={x}>{x}</span>)}</div>
            </article>
            <article className="glass tier-card">
              <div className="row between"><span className="tile ico" style={{ padding: 0 }}><Icon name="drop" /></span><span className="chip paid">{money(PRICES.blood)}</span></div>
              <h3>Blood</h3>
              <p className="muted">Add routine blood test results for metabolic, inflammation and organ markers.</p>
              <div className="pill-list">{["Ferritin", "Haemoglobin", "Haematocrit", "MCV", "Urea / BUN", "Albumin", "Glucose / HbA1c", "LDL / HDL", "CRP"].map((x) => <span key={x}>{x}</span>)}</div>
            </article>
            <article className="glass tier-card">
              <div className="row between"><span className="tile ico" style={{ padding: 0 }}><Icon name="dna" /></span><span className="chip paid">{money(PRICES.dna)}</span></div>
              <h3>DNA</h3>
              <p className="muted">Add a partner-lab DNA report for your epigenetic age. Needs your explicit consent.</p>
              <div className="pill-list">{["CpG sites", "DNA methylation", "Telomere length"].map((x) => <span key={x}>{x}</span>)}</div>
            </article>
          </div>
        </div>

        <div className="container section" id="how">
          <h2>How it works</h2>
          <p className="sub">From sign-up to your first result in one sitting.</p>
          <div className="steps">
            <div className="glass step"><h3>Create your profile</h3><p className="muted">Your age, sex, height and weight. Saved once, used everywhere.</p></div>
            <div className="glass step"><h3>Take the free tests</h3><p className="muted">Enter your numbers, or use our built-in reaction and timing tools.</p></div>
            <div className="glass step"><h3>See your biological age</h3><p className="muted">Your age gap, confidence range and a score for each body system.</p></div>
            <div className="glass step"><h3>Go deeper when ready</h3><p className="muted">Unlock blood and DNA to refine the result. Nothing to re-enter.</p></div>
          </div>
        </div>

        <div className="container section">
          <h2>What you get</h2>
          <p className="sub">Three outputs on your dashboard, updated every time you retest.</p>
          <div className="grid three">
            <div className="glass pad"><h3 style={{ fontSize: 21, marginBottom: 6 }}>Age acceleration report</h3><p className="muted">Your biological age against your calendar age, with a likely range and a PDF you can download.</p></div>
            <div className="glass pad"><h3 style={{ fontSize: 21, marginBottom: 6 }}>Management plan</h3><p className="muted">Clear next steps for the body systems ageing you fastest, with a suggested retest date.</p></div>
            <div className="glass pad"><h3 style={{ fontSize: 21, marginBottom: 6 }}>Progress tracking</h3><p className="muted">Watch your biological age move over time as you act on the plan.</p></div>
          </div>
        </div>

        <div className="container section">
          <div className="glass pad" style={{ padding: 28 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,34px)" }}>Built on real-world data</h2>
            <p className="muted" style={{ fontSize: 18, maxWidth: "40em" }}>We're running blood and fitness camps now to collect the data our models learn from. Until they're ready, this preview scores with an illustrative model and says so on every result.</p>
          </div>
        </div>

        <div className="container section" id="pricing">
          <h2>Pricing</h2>
          <p className="sub">Pay once per tier. Retests included for 12 months. Preview prices, not final.</p>
          <div className="grid three">
            {[
              { n: "Physical", p: "Free", d: "Your first biological age estimate.", c: "Start free", href: "/signup/" },
              { n: "Blood", p: money(PRICES.blood), d: "Adds metabolic, inflammation and organ markers.", c: "Get started", href: "/signup/" },
              { n: "DNA", p: money(PRICES.dna), d: "Adds epigenetic age. The most precise tier.", c: "Get started", href: "/signup/" },
            ].map((t) => (
              <div key={t.n} className="glass tier-card">
                <h3>{t.n}</h3>
                <div className="price num">{t.p}</div>
                <p className="muted">{t.d}</p>
                <Link className={`btn ${t.p === "Free" ? "btn-primary" : ""}`} href={t.href}>{t.c}</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="container section" id="privacy">
          <h2>Your data stays yours</h2>
          <p className="sub">Health and genetic data are sensitive. We're designing around India's DPDP Act and GDPR principles.</p>
          <div className="grid three">
            {[
              ["shield", "Consent you can see", "Every consent is recorded with a date and version. DNA needs its own, separate consent."],
              ["upload", "Export anytime", "Download everything you've shared and every result."],
              ["refresh", "Delete or withdraw", "Withdraw consent or delete your account and data from your profile."],
            ].map(([ic, t, d]) => (
              <div key={t} className="glass pad stack" style={{ gap: 8 }}><span className="tile ico" style={{ padding: 0 }}><Icon name={ic} /></span><h3 style={{ fontSize: 20 }}>{t}</h3><p className="muted">{d}</p></div>
            ))}
          </div>
        </div>

        <div className="container section" id="faq">
          <h2 style={{ textAlign: "center" }}>Questions</h2>
          <div className="stack" style={{ gap: 12, maxWidth: 760, margin: "20px auto 0" }}>
            {FAQ.map(([q, a]) => (
              <FaqItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>

        <div className="container section" style={{ textAlign: "center" }}>
          <div className="glass pad stack" style={{ padding: "44px 22px", alignItems: "center" }}>
            <h2 style={{ fontSize: "clamp(30px,6vw,52px)", margin: 0 }}>{TAGLINE}</h2>
            <Link className="btn btn-primary btn-lg" href="/signup/">Start my free assessment</Link>
          </div>
        </div>
      </main>

      <footer className="container footer">
        <div className="row between wrap">
          <Logo />
          <span>i-Age gives wellness insight, not medical advice. Preview build with an illustrative model.</span>
        </div>
      </footer>
    </>
  );
}
