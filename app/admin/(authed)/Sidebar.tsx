"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSecret } from "@/lib/clientAuth";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/tts", label: "Text-to-Speech", icon: "♪" },
  { href: "/admin/crawl", label: "Crawl Assets", icon: "↗" },
  { href: "/admin/docs", label: "Docs", icon: "❮❯" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    clearSecret();
    router.replace("/admin/login");
  }

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
      <button type="button" onClick={signOut} className="ghost" style={{ width: "100%" }}>Sign out</button>
      <div className="footer">v0.1 · self-hosted</div>
    </aside>
  );
}
