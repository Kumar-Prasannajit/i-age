"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { DemoBar } from "./DemoBar";

const TABS = [
  { href: "/dashboard/", label: "Home", icon: "home" },
  { href: "/result/", label: "Results", icon: "chart" },
  { href: "/profile/", label: "Profile", icon: "user" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { state, ready } = useStore();
  const router = useRouter();
  const path = usePathname() ?? "";

  useEffect(() => {
    if (ready && !state.profile) router.replace("/signup/");
  }, [ready, state.profile, router]);

  if (!ready || !state.profile) {
    return <div className="container" style={{ paddingTop: 96 }}><p className="muted">Loading…</p></div>;
  }
  const initials = state.profile.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const cur = (href: string) => (path.startsWith(href.replace(/\/$/, "")) ? "page" : undefined);

  return (
    <>
      <header className="topbar no-print">
        <div className="container">
          <div className="glass tb">
            <Logo href="/dashboard/" />
            <nav className="desk-tabs" aria-label="Main">
              {TABS.map((t) => (
                <Link key={t.href} href={t.href} aria-current={cur(t.href)}>{t.label}</Link>
              ))}
            </nav>
            <Link href="/profile/" className="avatar" aria-label="Your profile">{initials}</Link>
          </div>
        </div>
      </header>
      <main className="container app-main">{children}</main>
      <nav className="glass tabbar" aria-label="Main">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={cur(t.href)}>
            <Icon name={t.icon} />
            {t.label}
          </Link>
        ))}
      </nav>
      <DemoBar />
    </>
  );
}
