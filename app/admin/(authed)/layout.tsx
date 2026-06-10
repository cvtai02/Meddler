"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasSecret } from "@/lib/clientAuth";
import Sidebar from "./Sidebar";

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasSecret()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="app">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}
