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
    const [txToEdit, setTxToEdit] = useState<Tx | null>(null);

    // UI states
    const [txTab, setTxTab] = useState<"todas" | "receitas" | "despesas">("todas");
    const [search, setSearch] = useState("");
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // Derived Financials
    const allTxs = workspace?.transactions ?? [];
    const income = allTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = allTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const prevBal = workspace?.accounts.reduce((s, a) => s + a.balance, 0) ?? 0;
    const totalBalance = prevBal + income - expense;

    // Filter transactions
    const filteredTxs = useMemo(() => {
        let list = allTxs;
        if (txTab === "receitas") list = list.filter(t => t.type === "income");
        if (txTab === "despesas") list = list.filter(t => t.type === "expense");
        if (search.trim()) {
            list = list.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
        }
        return list;
    }, [allTxs, txTab, search]);

    const deleteTx = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
        try {
            await fetch(`/api/transactions/${id}`, { method: "DELETE" });
            setOpenMenu(null);
            router.refresh();
        } catch (e) {
            console.error("Erro ao excluir transação:", e);
        }
    };

    const handleOpenNewTx = (type: "income" | "expense") => {
        setTxToEdit(null);
        setModal(type);
    };

    return (
        <div className={styles.page}>
            {/* ─── Sidebar ─── */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarBrand}>
                    <span className={styles.brandDot} />
                    <span className={styles.brandName}>TuraTuno</span>
                </div>
                <nav className={styles.nav}>
                    {[
                        { icon: "📊", label: "Dashboard", href: "/dashboard", active: true },
                        { icon: "📈", label: "Relatórios", href: "/relatorios", active: false },
                        { icon: "🏷️", label: "Categorias", href: "/categorias", active: false },
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
                    <div className={styles.monthNav}>
                        <button className={styles.navArrow}>‹</button>
                        <span className={styles.monthLabel}>Fevereiro</span>
                        <button className={styles.navArrow}>›</button>
                    </div>

                    <div className={styles.headerActions}>
                        <button className={styles.addIncBtn} onClick={() => handleOpenNewTx("income")}>+ Receita</button>
                        <button className={styles.addExpBtn} onClick={() => handleOpenNewTx("expense")}>- Despesa</button>
                        <div className="user-profiles" style={{ display: "flex", gap: "0.5rem", marginLeft: "1rem" }}>
                            <div className={styles.headerAvatar} title={userName}>{userName[0]}</div>
                            <div className={styles.headerAvatar} style={{ background: "#6366f1" }} title="Sócio">S</div>
                        </div>
                    </div>
                </header>

                {/* ─── Transaction Tabs & Filters ─── */}

                <div className={styles.txSectionWrapper}>
                    <div className={styles.txTabs}>
                        {(["todas", "receitas", "despesas"] as const).map(tab => (
                            <button
                                key={tab}
                                className={`${styles.txTab} ${txTab === tab ? styles.txTabActive : ""}`}
                                onClick={() => setTxTab(tab)}
                            >
                                {tab === "todas" ? "Todas" : tab === "receitas" ? "Receitas" : "Despesas"}
                            </button>
                        ))}
                    </div>

                    <div className={styles.txSearchRow}>
                        <div className={styles.searchWrap}>
                            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Pesquisar transações..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className={styles.dateLabel}>Data de Vencimento</div>
                    </div>

                    {/* ─── Movimentações List ─── */}
                    <div className={styles.txListFull} onClick={() => setOpenMenu(null)}>
                        {filteredTxs.length === 0 ? (
                            <p className={styles.emptyText}>Nenhuma movimentação encontrada.</p>
                        ) : (
                            filteredTxs.map(tx => (
                                <div key={tx.id} className={styles.txRowFull}>
                                    <div className={styles.txLeft}>
                                        <div className={styles.txIcon} style={{ background: `${tx.category?.colorHex || (tx.type === "income" ? "#22c55e" : "#ef4444")}20` }}>
                                            {tx.category?.icon || (tx.type === "income" ? "💰" : "💸")}
                                        </div>
                                        <div>
                                            <p className={styles.txName}>{tx.description}</p>
                                            <div className={styles.txTags}>
                                                {tx.status && (
                                                    <span className={`${styles.tag} ${tx.status === "paid" ? styles.tagPaid : styles.tagPending}`}>
                                                        {tx.status === "paid" ? "Pago" : "Pendente"}
                                                    </span>
                                                )}
                                                {tx.category && (
                                                    <span className={styles.tag} style={{ background: `${tx.category.colorHex}20`, color: tx.category.colorHex, borderColor: `${tx.category.colorHex}40` }}>
                                                        {tx.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.txRight}>
                                        <p className={tx.type === "income" ? styles.txInc : styles.txExp}>
                                            {tx.type === "income" ? "+" : "-"} {fmt(Math.abs(tx.amount))}
                                        </p>
                                        <p className={styles.txDate}>{new Date(tx.date).toLocaleDateString("pt-BR")}</p>

                                        {/* Action Menu */}
                                        <div className={styles.txMenuWrap} onClick={e => e.stopPropagation()}>
                                            <button className={styles.txMenuBtn} onClick={() => setOpenMenu(openMenu === tx.id ? null : tx.id)}>
                                                ⋮
                                            </button>
                                            {openMenu === tx.id && (
                                                <div className={styles.txMenuPopover}>
                                                    <div className={styles.txMenuTitle}>Ações</div>
                                                    <button className={styles.txMenuAction} onClick={() => {
                                                        setTxToEdit(tx);
                                                        setModal(tx.type as "income" | "expense");
                                                        setOpenMenu(null);
                                                    }}>
                                                        ✏️ Editar
                                                    </button>
                                                    <button className={styles.txMenuActionDelete} onClick={() => deleteTx(tx.id)}>
                                                        🗑️ Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
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
                    transactionToEdit={txToEdit}
                    onClose={() => setModal(null)}
                    onSaved={() => { setModal(null); router.refresh(); }}
                />
            )}
        </div>
    );
}
