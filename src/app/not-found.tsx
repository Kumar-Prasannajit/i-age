import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container" style={{ paddingTop: 96, textAlign: "center" }}>
      <div className="glass pad stack" style={{ padding: 36 }}>
        <h1 style={{ fontSize: 32 }}>We couldn't find that page</h1>
        <p className="muted">The link may be old. Head back to your dashboard.</p>
        <div><Link className="btn btn-primary" href="/dashboard/">Go to dashboard</Link></div>
      </div>
    </main>
  );
}
