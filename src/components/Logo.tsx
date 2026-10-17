import Link from "next/link";

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3949ff" />
          <stop offset="0.6" stopColor="#6a5cff" />
          <stop offset="1" stopColor="#14bfae" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="16" fill="none" stroke="url(#lg)" strokeWidth="4.5" strokeDasharray="78 100" strokeLinecap="round" transform="rotate(-70 20 20)" />
      <circle cx="20" cy="12.5" r="2.6" fill="#ff6a5c" />
      <rect x="18.1" y="17.5" width="3.8" height="10" rx="1.9" fill="url(#lg)" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="row" style={{ gap: 8, fontWeight: 700, fontSize: 21, letterSpacing: "-0.03em" }} aria-label="i-Age home">
      <LogoMark />
      <span>i-Age</span>
    </Link>
  );
}
