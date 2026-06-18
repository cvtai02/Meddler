"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasAccessToken } from "@/app/core/auth/client-auth";
import Sidebar from "./Sidebar";

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasAccessToken()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
      <Sidebar />
      <main className="max-w-5xl px-6 py-7 md:px-10">{children}</main>
    </div>
  );
}
