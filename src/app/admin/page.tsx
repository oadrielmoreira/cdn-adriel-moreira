import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/home");

  return (
    <>
      <TopBar />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "36px 24px" }}>
        <AdminClient />
      </main>
    </>
  );
}
