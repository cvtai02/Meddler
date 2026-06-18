"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAccessToken } from "@/app/core/auth/client-auth";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "D" },
  { href: "/admin/tts", label: "Text-to-Speech", icon: "T" },
  { href: "/admin/crawl", label: "Crawl Assets", icon: "C" },
  { href: "/admin/access-token", label: "Access Token", icon: "K" },
  { href: "/admin/docs", label: "Docs", icon: "{}" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    clearAccessToken();
    router.replace("/admin/login");
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="dot" />
        <span>Meddler</span>
      </div>
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="nav-link"
            data-active={active}
          >
            <span className="ico" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
      <div className="spacer" />
      <button
        type="button"
        onClick={signOut}
        className="ghost"
        style={{ width: "100%" }}
      >
        Sign out
      </button>
      <div className="footer">v0.1 - self-hosted</div>
    </aside>
  );
}
