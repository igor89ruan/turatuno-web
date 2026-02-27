"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/dashboard",     icon: "⚡", label: "Dashboard"    },
  { href: "/transactions",  icon: "💳", label: "Transações"   },
  { href: "/accounts",      icon: "🏦", label: "Contas"       },
  { href: "/credit-cards",  icon: "💎", label: "Cartões"      },
  { href: "/goals",         icon: "🎯", label: "Metas"        },
  { href: "/reports",       icon: "📊", label: "Relatórios"   },
];

const BOTTOM_ITEMS = [
  { href: "/settings",      icon: "⚙️", label: "Configurações" },
];

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "TT";

  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.logoWrap}>
        <span style={s.logo}>TuraTuno</span>
      </div>

      {/* Nav principal */}
      <nav style={s.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}>
              <span style={s.navIcon}>{item.icon}</span>
              <span style={{ ...s.navLabel, ...(active ? s.navLabelActive : {}) }}>{item.label}</span>
              {active && <div style={s.activeDot} />}
            </Link>
          );
        })}
      </nav>

      <div style={s.divider} />

      {/* Bottom nav */}
      <nav style={s.nav}>
        {BOTTOM_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}>
              <span style={s.navIcon}>{item.icon}</span>
              <span style={{ ...s.navLabel, ...(active ? s.navLabelActive : {}) }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div style={s.userArea}>
        <div style={s.avatar}>{initials}</div>
        <div style={s.userInfo}>
          <span style={s.userName}>{user.name ?? "Usuário"}</span>
          <span style={s.userEmail}>{user.email ?? ""}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          style={s.logoutBtn}
          title="Sair"
        >
          ↩
        </button>
      </div>
    </aside>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    position: "fixed",
    left: 0, top: 0, bottom: 0,
    width: "240px",
    background: "#07090f",
    borderRight: "1px solid #1a2540",
    display: "flex",
    flexDirection: "column",
    padding: "0 0.75rem",
    zIndex: 50,
  },
  logoWrap: {
    padding: "1.5rem 0.75rem 1.25rem",
    borderBottom: "1px solid #1a2540",
    marginBottom: "0.75rem",
  },
  logo: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.04em",
    background: "linear-gradient(135deg, #60a5fa, #22d3ee)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  nav: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  navItem: {
    display: "flex", alignItems: "center", gap: "0.65rem",
    padding: "0.65rem 0.85rem", borderRadius: "10px",
    textDecoration: "none", position: "relative",
    transition: "background 0.15s",
    background: "transparent",
  },
  navItemActive: {
    background: "rgba(59,130,246,0.12)",
  },
  navIcon: { fontSize: "1rem", flexShrink: 0 },
  navLabel: { fontSize: "0.83rem", fontWeight: 600, color: "#5d7aaa" },
  navLabelActive: { color: "#60a5fa" },
  activeDot: {
    position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
    width: "6px", height: "6px", borderRadius: "50%",
    background: "#3b82f6",
  },
  divider: { height: "1px", background: "#1a2540", margin: "0.75rem 0.25rem" },
  userArea: {
    marginTop: "auto",
    display: "flex", alignItems: "center", gap: "0.65rem",
    padding: "1rem 0.75rem",
    borderTop: "1px solid #1a2540",
  },
  avatar: {
    width: "34px", height: "34px", borderRadius: "10px",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.75rem", fontWeight: 800, color: "#fff",
    flexShrink: 0,
  },
  userInfo: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  userName: {
    fontSize: "0.78rem", fontWeight: 700, color: "#e2eeff",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  userEmail: {
    fontSize: "0.68rem", color: "#38506e",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#5d7aaa", fontSize: "1rem", padding: "0.25rem",
    borderRadius: "6px", transition: "color 0.15s", flexShrink: 0,
  },
};
