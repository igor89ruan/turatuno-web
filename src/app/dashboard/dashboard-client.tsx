"use client";

import { useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";
import TransactionModal from "./transaction-modal";

// ── Types ──────────────────────────────────────────────────────
type Tx = {
    id: string; description: string; amount: number; type: string; date: string | Date; status?: string;
    category: { name: string; icon: string; colorHex: string } | null;
    user: { name: string };
};
type Account = { id: string; name: string; balance: number; type: string; color: string };
type Workspace = {
    id: string; name: string; profileType: string;
    accounts: Account[]; transactions: Tx[];
    categories: { id: string; name: string; icon: string; colorHex: string; type: string }[];
} | null;
interface Props { userName: string; workspace: Workspace }

// ── Helpers ────────────────────────────────────────────────────
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DashboardClient({ userName, workspace }: Props) {
    const router = useRouter();
    const [modal, setModal] = useState<"income" | "expense" | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Derived Financials
    const allTxs = workspace?.transactions ?? [];
    const income = allTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = allTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const prevBal = workspace?.accounts.reduce((s, a) => s + a.balance, 0) ?? 0;
    const totalBalance = prevBal + income - expense;

    // Last transactions
    const latestTxs = useMemo(() => {
        return allTxs.slice(0, 5); // take max 5
    }, [allTxs]);

    return (
        <div className={styles.page}>
            {/* ─── Mobile sidebar overlay ─── */}
            {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

            {/* ─── Sidebar ─── */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarBrand}>
                    <span className={styles.brandDot} />
                    <span className={styles.brandName}>TuraTuno</span>
                    <button className={styles.sidebarCloseBtn} onClick={() => setSidebarOpen(false)} title="Fechar menu">
                        ✕
                    </button>
                </div>
                <nav className={styles.nav}>
                    {[
                        { icon: "📊", label: "Dashboard", href: "/dashboard", active: true },
                        { icon: "📈", label: "Relatórios", href: "/dashboard/relatorios", active: false },
                        { icon: "🏷️", label: "Categorias", href: "#", active: false },
                        { icon: "🏦", label: "Contas Bancárias", href: "#", active: false },
                        { icon: "💳", label: "Cartão de Crédito", href: "#", active: false },
                        { icon: "⚙️", label: "Configuração", href: "#", active: false },
                    ].map(item => (
                        <Link href={item.href} key={item.label} className={`${styles.navItem} ${item.active ? styles.navActive : ""}`}>
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className={styles.sidebarUser}>
                    <div className={styles.userAvatar}>{userName[0].toUpperCase()}</div>
                    <div className={styles.userInfo}>
                        <p className={styles.userName}>{userName.split(" ")[0]}</p>
                        <p className={styles.userRole}>Owner</p>
                    </div>
                    <button className={styles.logoutIcon} onClick={() => signOut({ callbackUrl: "/login" })} title="Sair">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <button className={styles.hamburger} onClick={() => setSidebarOpen(true)} title="Abrir menu">
                        <span /><span /><span />
                    </button>
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                    <div className="user-profiles" style={{ display: "flex", gap: "0.5rem" }}>
                        <div className={styles.headerAvatar} title={userName}>{userName[0]}</div>
                        <div className={styles.headerAvatar} style={{ background: "#6366f1" }} title="Sócio">S</div>
                    </div>
                </header>

                <div className={styles.grid}>
                    <div className={styles.leftCol}>
                        {/* ─── Saldo Card ─── */}
                        <div className={`${styles.card} ${styles.saldoCard}`}>
                            <p className={styles.saldoLabel}>Saldo Total Compartilhado</p>
                            <h2 className={styles.saldoValue}>{fmt(totalBalance)}</h2>

                            <div className={styles.saldoFoot}>
                                <div>
                                    <p className={styles.sfLabel}>Receitas (Mês)</p>
                                    <p className={styles.sfInc}>+ {fmt(income)}</p>
                                </div>
                                <div>
                                    <p className={styles.sfLabel}>Despesas (Mês)</p>
                                    <p className={styles.sfExp}>- {fmt(expense)}</p>
                                </div>
                            </div>
                        </div>

                        {/* ─── Movimentações ─── */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Últimas Movimentações</h3>

                            {latestTxs.length === 0 ? (
                                <p className={styles.emptyText}>Nenhuma movimentação recente.</p>
                            ) : (
                                <div className={styles.txList}>
                                    {latestTxs.map(tx => (
                                        <div key={tx.id} className={styles.txRow}>
                                            <div className={styles.txLeft}>
                                                <div className={styles.txIcon} style={{ background: `${tx.category?.colorHex || (tx.type === "income" ? "#22c55e" : "#ef4444")}20` }}>
                                                    {tx.category?.icon || (tx.type === "income" ? "💰" : "🍔")}
                                                </div>
                                                <div>
                                                    <p className={styles.txName}>{tx.description}</p>
                                                    <p className={styles.txMeta}>
                                                        {tx.category?.name || "Outros"} • Cartão Nubank
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={styles.txRight}>
                                                <p className={tx.type === "income" ? styles.txInc : styles.txExp}>
                                                    {tx.type === "income" ? "+" : "-"} {fmt(Math.abs(tx.amount))}
                                                </p>
                                                <p className={styles.txUser}>{tx.user.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.rightCol}>
                        {/* ─── Cartões de Crédito ─── */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Cartões de Crédito</h3>

                            <div className={styles.ccList}>
                                {/* Nubank */}
                                <div className={styles.ccItem}>
                                    <div className={styles.ccHeader}>
                                        <div className={styles.ccName}><span style={{ color: "#8b5cf6" }}>●</span> Nubank</div>
                                        <div className={styles.ccBadge}>Fatura Aberta</div>
                                    </div>
                                    <div className={styles.ccTrack}>
                                        <div className={styles.ccFill} style={{ width: "65%", background: "#8b5cf6" }} />
                                    </div>
                                    <div className={styles.ccFoot}>
                                        <span>Limite: R$ 5.000,00</span>
                                        <span>Usado: R$ 3.250,00</span>
                                    </div>
                                </div>

                                {/* Itaú */}
                                <div className={styles.ccItem}>
                                    <div className={styles.ccHeader}>
                                        <div className={styles.ccName}><span style={{ color: "#f97316" }}>●</span> Itaú Black</div>
                                        <div className={styles.ccBadge} style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)" }}>Fatura Paga</div>
                                    </div>
                                    <div className={styles.ccTrack}>
                                        <div className={styles.ccFill} style={{ width: "15%", background: "#4f46e5" }} />
                                    </div>
                                    <div className={styles.ccFoot}>
                                        <span>Limite: R$ 15.000,00</span>
                                        <span>Usado: R$ 2.250,00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAB */}
                <button className={styles.fab} onClick={() => setModal("income")}>+</button>

            </main>

            {modal && workspace && (
                <TransactionModal
                    type={modal}
                    workspaceId={workspace.id}
                    categories={workspace.categories}
                    accounts={workspace.accounts}
                    userName={userName}
                    onClose={() => setModal(null)}
                    onSaved={() => { setModal(null); router.refresh(); }}
                />
            )}
        </div>
    );
}
