"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LogOut, ShieldCheck, Settings } from "lucide-react";

type Me = { name: string; role: "ADMIN" | "MEMBER" } | null;

export function TopBar() {
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setMe({ name: d.user.name, role: d.user.role });
      })
      .catch(() => {});
  }, []);

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
        background: "rgba(7,13,8,0.7)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Link href="/home">
        <Logo size={26} />
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Nome do usuário */}
        {me && (
          <span style={{ color: "var(--text-muted)", fontSize: 13.5 }}>
            {me.name}
          </span>
        )}

        {/* Configurações (membros) */}
        {me?.role === "MEMBER" && (
          <Link
            href="/settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              borderRadius: 10,
              padding: "7px 12px",
              fontSize: 13.5,
              textDecoration: "none",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--primary)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)";
            }}
          >
            <Settings size={15} /> Configurações
          </Link>
        )}

        {/* Link de admin */}
        {me?.role === "ADMIN" && (
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              borderRadius: 10,
              padding: "7px 12px",
              fontSize: 13.5,
              textDecoration: "none",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--primary)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)";
            }}
          >
            <ShieldCheck size={15} /> Admin
          </Link>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          title="Sair"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            borderRadius: 10,
            padding: "7px 12px",
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            gap: 7,
            transition: "border-color 0.15s, color 0.15s",
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
          <LogOut size={15} /> Sair
        </button>
      </div>
    </header>
  );
}
