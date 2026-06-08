"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/tts", label: "Text-to-Speech", icon: "♪" },
  { href: "/admin/crawl", label: "Crawl Assets", icon: "↗" },
  { href: "/admin/api-keys", label: "API Keys", icon: "⌬" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="dot" />
        <span>Meddler</span>
      </div>
      {ITEMS.map((it) => {
        const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className="nav-link" data-active={active}>
            <span className="ico" aria-hidden>{it.icon}</span>
            <span>{it.label}</span>
          </Link>
        );
      })}
      <div className="spacer" />
      <form action="/api/auth/logout" method="post">
        <button type="submit" className="ghost" style={{ width: "100%" }}>Sign out</button>
      </form>
      <div className="footer">v0.1 · self-hosted</div>
    </aside>
  );
}
