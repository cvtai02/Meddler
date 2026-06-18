"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Volume2, Download, Key, FileText, LogOut } from "lucide-react";
import { clearAccessToken } from "@/app/core/auth/client-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tts", label: "Text-to-Speech", icon: Volume2 },
  { href: "/admin/crawl", label: "Crawl Assets", icon: Download },
  { href: "/admin/access-token", label: "Access Token", icon: Key },
  { href: "/admin/docs", label: "Docs", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    clearAccessToken();
    router.replace("/admin/login");
  }

  return (
    <aside className="sticky top-0 hidden h-screen flex-col gap-1 border-r border-sidebar-border bg-sidebar px-3 py-5 md:flex">
      <div className="flex items-center gap-2.5 px-3 pb-5 font-bold tracking-wide">
        <span className="size-2.5 rounded-full bg-gradient-to-br from-primary to-[#5b6cff] shadow-[0_0_12px_rgba(124,140,255,0.6)]" />
        <span>Meddler</span>
      </div>

      <nav className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
                active && "bg-sidebar-accent shadow-[inset_0_0_0_1px_var(--border)]"
              )}
            >
              <Icon className="size-4 opacity-80" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <Button
        variant="ghost"
        className="w-full justify-start gap-2.5"
        onClick={signOut}
      >
        <LogOut className="size-4 opacity-80" />
        Sign out
      </Button>

      <div className="px-2 pt-1 text-[11px] text-muted-foreground">
        v0.1 - self-hosted
      </div>
    </aside>
  );
}
