import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import Sidebar from "./Sidebar";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isLoggedIn())) redirect("/admin/login");
  return (
    <div className="app">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}
