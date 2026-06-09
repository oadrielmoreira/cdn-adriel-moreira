"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LogOut } from "lucide-react";

export function TopBar() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(11,11,18,0.6)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Link href="/home">
        <Logo size={26} />
      </Link>

      <button
        onClick={logout}
        title="Sair"
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
          borderRadius: 10,
          padding: "8px 14px",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--danger)";
          e.currentTarget.style.color = "var(--danger)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        <LogOut size={16} /> Sair
      </button>
    </header>
  );
}
