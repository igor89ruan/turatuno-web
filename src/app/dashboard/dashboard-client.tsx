"use client";

import { useState, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";
import TransactionModal from "./transaction-modal";
import ProfileModal from "@/components/profile/ProfileModal";
import ThemeToggleBtn from "@/components/ui/ThemeToggleBtn";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { useLanguage } from "@/lib/language-context";

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
const mask = (v: number, hide: boolean) => hide ? "••••" : fmt(v);
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ── Eye button ─────────────────────────────────────────────────
function EyeBtn({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
    return (
        <button className={styles.statEye} onClick={onToggle} title={hidden ? "Mostrar valores" : "Esconder valores"}>
            {hidden
                ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            }
        </button>
    );
}

// ── Donut chart ────────────────────────────────────────────────
function DonutChart({ income, expense }: { income: number; expense: number }) {
    const total = income + expense || 1;
    const r = 60;
    const circ = 2 * Math.PI * r;
    const incSlice = (income / total) * circ;
    const expSlice = (expense / total) * circ;

    return (
        <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={r} fill="none" stroke="var(--bg-page)" strokeWidth="24" />
            {expense > 0 && (
                <circle cx="80" cy="80" r={r} fill="none" stroke="#ef4444" strokeWidth="24"
                    strokeDasharray={`${expSlice} ${circ}`} strokeDashoffset={0}
                    transform="rotate(-90 80 80)" style={{ transition: "all 0.6s" }} />
            )}
            {income > 0 && (
                <circle cx="80" cy="80" r={r} fill="none" stroke="#22c55e" strokeWidth="24"
                    strokeDasharray={`${incSlice} ${circ}`}
                    strokeDashoffset={expense > 0 ? -expSlice : 0}
                    transform="rotate(-90 80 80)" style={{ transition: "all 0.6s" }} />
            )}
            <text x="80" y="76" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-primary)">
                {fmt(income - expense)}
            </text>
            <text x="80" y="92" textAnchor="middle" fontSize="9" fill="var(--text-muted)">Total</text>
        </svg>
    );
}

// ── Main Component ─────────────────────────────────────────────
export default function DashboardClient({ userName: initialUserName, workspace }: Props) {
    const router = useRouter();
    const { data: session } = useSession();
    const { t } = useLanguage();

    const [modal, setModal] = useState<"income" | "expense" | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [monthOffset, setMonthOffset] = useState(0);
    const [activeFilter, setActiveFilter] = useState<"hoje" | "7dias" | "mes" | "ano">("mes");
    const [txTab, setTxTab] = useState<"todas" | "receitas" | "despesas">("todas");
    const [chartTab, setChartTab] = useState<"todas" | "receitas" | "despesas">("todas");
    const [search, setSearch] = useState("");
    const [expandSaldo, setExpandSaldo] = useState(true);
    const [expandInc, setExpandInc] = useState(true);
    const [expandExp, setExpandExp] = useState(true);

    // Per-card hide states
    const [hideSaldo, setHideSaldo] = useState(false);
    const [hideInc, setHideInc] = useState(false);
    const [hideExp, setHideExp] = useState(false);
    const [hideDisp, setHideDisp] = useState(false);

    // Per-row action menu
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // Local user state (updated after profile edit)
    const [userName, setUserName] = useState(initialUserName);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const deleteTx = async (id: string) => {
        if (!confirm("Excluir esta transação?")) return;
        await fetch(`/api/transactions/${id}`, { method: "DELETE" });
        setOpenMenu(null);
        router.refresh();
    };

    const now = new Date();
    const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const mYear = viewDate.getFullYear();
    const mMonth = viewDate.getMonth();
    const monthName = MONTHS[mMonth];
    const lastDay = new Date(mYear, mMonth + 1, 0).getDate();

    const allTxs = workspace?.transactions ?? [];

    const monthTxs = useMemo(() => allTxs.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === mYear && d.getMonth() === mMonth;
    }), [allTxs, mYear, mMonth]);

    const income = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + Math.abs(t.amount), 0);
    const expense = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    const received = monthTxs.filter(t => t.type === "income" && t.status === "paid").reduce((s, t) => s + Math.abs(t.amount), 0);
    const toReceive = income - received;
    const paid = monthTxs.filter(t => t.type === "expense" && t.status === "paid").reduce((s, t) => s + Math.abs(t.amount), 0);
    const toPay = expense - paid;
    const prevBal = workspace?.accounts.reduce((s, a) => s + a.balance, 0) ?? 0;
    const saldoDisp = prevBal + received - paid;
    const saldoPrev = prevBal + income - expense;

    const filteredTxs = useMemo(() => {
        let txs = monthTxs;
        if (txTab === "receitas") txs = txs.filter(t => t.type === "income");
        if (txTab === "despesas") txs = txs.filter(t => t.type === "expense");
        if (search.trim()) txs = txs.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
        return txs;
    }, [monthTxs, txTab, search]);

    const chartInc = chartTab === "despesas" ? 0 : income;
    const chartExp = chartTab === "receitas" ? 0 : expense;

    const navItems = [
        { icon: "📊", labelKey: "dashboard" as const, href: "/dashboard", active: true },
        { icon: "📈", labelKey: "reports" as const, href: "/dashboard/relatorios", active: false },
        { icon: "🏷️", labelKey: "categories" as const, href: "#", active: false },
        { icon: "🏦", labelKey: "bankAccounts" as const, href: "#", active: false },
        { icon: "💳", labelKey: "creditCards" as const, href: "#", active: false },
        { icon: "⚙️", labelKey: "settings" as const, href: "#", active: false },
    ];

    return (
        <div className={`${styles.page} ${sidebarCollapsed ? styles.pageCollapsed : ""}`}>
            {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
            {showProfileMenu && <div className={styles.profileMenuOverlay} onClick={() => setShowProfileMenu(false)} />}

            {/* ─── Sidebar ─── */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
                <div className={styles.sidebarBrand}>
                    <div className={styles.brandLogo}>
                        <svg width="28" height="30" viewBox="0 0 120 130" fill="none">
                            <path d="M60 8 L112 118 L88 118 L60 55 L32 118 L8 118 Z" fill="var(--logo-main)" />
                            <path d="M60 55 Q70 78 88 118 L76 118 Q67 93 57 70 Z" fill="var(--logo-shadow)" />
                        </svg>
                    </div>
                    {!sidebarCollapsed && <span className={styles.brandName}>TuraTuno</span>}

                    <button
                        className={styles.collapseBtn}
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        title={sidebarCollapsed ? "Expandir" : "Recolher"}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}>
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button className={styles.sidebarCloseBtn} onClick={() => setSidebarOpen(false)}>✕</button>
                </div>
                <nav className={styles.nav}>
                    {navItems.map(item => (
                        <Link href={item.href} key={item.labelKey} className={`${styles.navItem} ${item.active ? styles.navActive : ""}`} title={sidebarCollapsed ? t(item.labelKey) : undefined}>
                            <span className={styles.navIcon}>{item.icon}</span>
                            {!sidebarCollapsed && <span>{t(item.labelKey)}</span>}
                        </Link>
                    ))}
                </nav>

                {/* ─── Theme & Language Controls ─── */}
                <div className={`${styles.sidebarControls} ${sidebarCollapsed ? styles.sidebarControlsCollapsed : ""}`}>
                    {!sidebarCollapsed && <span className={styles.sidebarControlLabel}>{t("theme")}</span>}
                    <ThemeToggleBtn collapsed={sidebarCollapsed} />
                    {!sidebarCollapsed && <span className={styles.sidebarControlLabel} style={{ marginTop: "0.25rem" }}>{t("language")}</span>}
                    <LanguageSelector collapsed={sidebarCollapsed} />
                </div>

                {/* ─── User section ─── */}
                <div className={styles.profileMenuWrap}>
                    {showProfileMenu && !sidebarCollapsed && (
                        <div className={styles.profileMenu} onClick={e => e.stopPropagation()}>
                            <div className={styles.profileMenuHeader}>
                                <div className={styles.profileMenuAvatar}>
                                    {avatarUrl
                                        ? <img src={avatarUrl} alt="avatar" className={styles.userAvatarImg} />
                                        : userName[0].toUpperCase()
                                    }
                                </div>
                                <div className={styles.profileMenuInfo}>
                                    <p className={styles.profileMenuName}>{userName}</p>
                                    <p className={styles.profileMenuEmail}>{session?.user?.email ?? ""}</p>
                                </div>
                            </div>
                            <div className={styles.profileMenuDivider} />
                            <button
                                className={styles.profileMenuItem}
                                onClick={() => { setShowProfileMenu(false); setProfileOpen(true); }}
                            >
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                                Configurações
                            </button>
                        </div>
                    )}
                    <div
                        className={`${styles.sidebarUser} ${sidebarCollapsed ? styles.sidebarUserCollapsed : ""}`}
                        onClick={() => sidebarCollapsed ? setProfileOpen(true) : setShowProfileMenu(v => !v)}
                        title={sidebarCollapsed ? "Editar perfil" : "Menu do perfil"}
                    >
                        <div className={styles.userAvatar}>
                            {avatarUrl
                                ? <img src={avatarUrl} alt="avatar" className={styles.userAvatarImg} />
                                : userName[0].toUpperCase()
                            }
                        </div>
                        {!sidebarCollapsed && (
                            <div className={styles.userInfo}>
                                <p className={styles.userName}>{userName.split(" ")[0]}</p>
                                <p className={styles.userRole}>{t("owner")}</p>
                            </div>
                        )}
                        {!sidebarCollapsed && (
                            <button className={styles.logoutIcon} onClick={e => { e.stopPropagation(); signOut({ callbackUrl: "/login" }); }} title={t("logout")}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* ─── Main ─── */}
            <main className={styles.main}>

                {/* Filter Toolbar */}
                <header className={styles.toolbar}>
                    <button className={styles.hamburger} onClick={() => setSidebarOpen(true)}>
                        <span /><span /><span />
                    </button>
                    <div className={styles.monthNav}>
                        <button className={styles.navArrow} onClick={() => setMonthOffset(o => o - 1)}>‹</button>
                        <span className={styles.monthLabel}>{monthName}</span>
                        <button className={styles.navArrow} onClick={() => setMonthOffset(o => o + 1)}>›</button>
                    </div>
                    <div className={styles.filterBtns}>
                        {(([["hoje", t("today")], ["7dias", t("last7days")], ["mes", t("thisMonth")], ["ano", t("thisYear")]] as const)).map(([k, l]) => (
                            <button key={k} className={`${styles.filterBtn} ${activeFilter === k ? styles.filterActive : ""}`}
                                onClick={() => setActiveFilter(k)}>{l}</button>
                        ))}
                    </div>
                    <div className={styles.dateRange}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <span>01/{String(mMonth + 1).padStart(2, "0")}/{mYear} – {lastDay}/{String(mMonth + 1).padStart(2, "0")}/{mYear}</span>
                    </div>
                    <div className={styles.toolbarActions}>
                        <button className={styles.actionBtn} onClick={() => { setMonthOffset(0); setActiveFilter("mes"); }}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6" /></svg>
                            {t("clearFilter")}
                        </button>
                        <button className={styles.actionBtn} onClick={() => router.refresh()}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-.36-5.29" /></svg>
                            {t("refresh")}
                        </button>
                    </div>
                </header>

                {/* ─── 4 Stat Cards ─── */}
                <div className={styles.statsRow}>

                    {/* Saldo do Período Anterior */}
                    <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                        <div className={styles.statCardTop}>
                            <div>
                                <p className={styles.statLabel}>↗ {t("prevBalance")}</p>
                                <p className={styles.statValue} style={{ color: prevBal >= 0 ? "#22c55e" : "#ef4444" }}>{mask(prevBal, hideSaldo)}</p>
                                <p className={styles.statSub}>Até 31 De {MONTHS[mMonth === 0 ? 11 : mMonth - 1]}</p>
                            </div>
                            <EyeBtn hidden={hideSaldo} onToggle={() => setHideSaldo(v => !v)} />
                        </div>
                        <button className={styles.detailToggle} onClick={() => setExpandSaldo(v => !v)}>
                            {expandSaldo ? t("hideDetails") : t("showDetails")} {expandSaldo ? "∧" : "∨"}
                        </button>
                        {expandSaldo && (
                            <div className={styles.statSubRow}>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>⏳ {t("pending")}</span>
                                    <span className={styles.subVal}>{mask(prevBal < 0 ? Math.abs(prevBal) : 0, hideSaldo)}</span>
                                </div>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>✅ {t("availableBalance")}</span>
                                    <span className={styles.subVal}>{mask(prevBal, hideSaldo)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Receitas */}
                    <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                        <div className={styles.statCardTop}>
                            <div>
                                <p className={styles.statLabel}>↗ {t("income")}</p>
                                <p className={styles.statValue} style={{ color: "#22c55e" }}>{mask(income, hideInc)}</p>
                                <p className={styles.statSub}>1 De {monthName} - {lastDay} De {monthName}</p>
                            </div>
                            <EyeBtn hidden={hideInc} onToggle={() => setHideInc(v => !v)} />
                        </div>
                        <button className={styles.detailToggle} onClick={() => setExpandInc(v => !v)}>
                            {expandInc ? t("hideDetails") : t("showDetails")} {expandInc ? "∧" : "∨"}
                        </button>
                        {expandInc && (
                            <div className={styles.statSubRow}>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>✅ {t("received")}</span>
                                    <span className={styles.subVal} style={{ color: "#22c55e" }}>{mask(received, hideInc)}</span>
                                </div>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>⏳ {t("toReceive")}</span>
                                    <span className={styles.subVal}>{mask(toReceive, hideInc)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Despesas */}
                    <div className={`${styles.statCard} ${styles.statCardRed}`}>
                        <div className={styles.statCardTop}>
                            <div>
                                <p className={styles.statLabel}>↘ {t("expenses")}</p>
                                <p className={styles.statValue} style={{ color: "#ef4444" }}>- {mask(expense, hideExp)}</p>
                                <p className={styles.statSub}>1 De {monthName} - {lastDay} De {monthName}</p>
                            </div>
                            <EyeBtn hidden={hideExp} onToggle={() => setHideExp(v => !v)} />
                        </div>
                        <button className={styles.detailToggle} onClick={() => setExpandExp(v => !v)}>
                            {expandExp ? t("hideDetails") : t("showDetails")} {expandExp ? "∧" : "∨"}
                        </button>
                        {expandExp && (
                            <div className={styles.statSubRow}>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>✅ {t("paid")}</span>
                                    <span className={styles.subVal}>{mask(paid, hideExp)}</span>
                                </div>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>⏳ {t("toPay")}</span>
                                    <span className={styles.subVal} style={{ color: "#ef4444" }}>{mask(toPay, hideExp)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Saldo Disponível + Previsto */}
                    <div className={`${styles.statCard} ${styles.statCardDouble}`}>
                        <div className={styles.statCardTop}>
                            <div>
                                <p className={styles.statLabel}>↗ {t("availableBalance")}</p>
                                <p className={styles.statValue} style={{ color: saldoDisp >= 0 ? "#22c55e" : "#ef4444" }}>{mask(saldoDisp, hideDisp)}</p>
                                <p className={styles.statSub}>Até {lastDay} De {monthName} (Receita - Despesas + Saldo Bancário)</p>
                            </div>
                            <EyeBtn hidden={hideDisp} onToggle={() => setHideDisp(v => !v)} />
                        </div>
                        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-main)", paddingTop: "0.75rem" }}>
                            <p className={styles.statLabel}>↗ {t("projectedBalance")}</p>
                            <p className={styles.statValue} style={{ color: saldoPrev >= 0 ? "#22c55e" : "#ef4444" }}>{mask(saldoPrev, hideDisp)}</p>
                            <p className={styles.statSub}>Até {lastDay} De {monthName} (Receitas - Despesas + Saldo Bancário)</p>
                        </div>
                    </div>
                </div>

                {/* ─── Bottom Section ─── */}
                <div className={styles.bottomRow}>

                    {/* Transaction List */}
                    <div className={styles.txPanel}>
                        <div className={styles.txPanelTop}>
                            <div className={styles.txMonthNav}>
                                <button className={styles.navArrow} onClick={() => setMonthOffset(o => o - 1)}>‹</button>
                                <span className={styles.monthLabel}>{monthName}</span>
                                <button className={styles.navArrow} onClick={() => setMonthOffset(o => o + 1)}>›</button>
                            </div>
                            <div className={styles.txBtns}>
                                <button className={styles.addIncBtn} onClick={() => setModal("income")}>{t("addIncome")}</button>
                                <button className={styles.addExpBtn} onClick={() => setModal("expense")}>{t("addExpense")}</button>
                            </div>
                        </div>

                        <div className={styles.txTabs}>
                            {(([["todas", t("all")], ["receitas", t("income")], ["despesas", t("expenses")]] as const)).map(([k, l]) => (
                                <button key={k} className={`${styles.txTab} ${txTab === k ? styles.txTabActive : ""}`}
                                    onClick={() => setTxTab(k)}>{l}</button>
                            ))}
                        </div>

                        <div className={styles.searchRow}>
                            <div className={styles.searchWrap}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={styles.searchIcon}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                <input className={styles.searchInput} placeholder={t("search")}
                                    value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <div className={styles.searchDateLabel}>{t("dueDate")}</div>
                        </div>

                        <div className={styles.txList} onClick={() => setOpenMenu(null)}>
                            {filteredTxs.length === 0 ? (
                                <p className={styles.emptyText}>{t("noneFound")}</p>
                            ) : (
                                filteredTxs.map(tx => (
                                    <div key={tx.id} className={styles.txRow}>
                                        <div className={styles.txLeft}>
                                            <div className={styles.txIcon} style={{ background: `${tx.category?.colorHex || (tx.type === "income" ? "#22c55e" : "#ef4444")}22` }}>
                                                {tx.category?.icon || (tx.type === "income" ? "💰" : "💸")}
                                            </div>
                                            <div>
                                                <p className={styles.txName}>{tx.description}</p>
                                                <div className={styles.txTags}>
                                                    {tx.status && (
                                                        <span className={`${styles.tag} ${tx.status === "paid" ? styles.tagPaid : styles.tagPending}`}>
                                                            {tx.status === "paid" ? t("paid") : t("pending")}
                                                        </span>
                                                    )}
                                                    {tx.category && (
                                                        <span className={styles.tag} style={{ background: `${tx.category.colorHex}22`, color: tx.category.colorHex, borderColor: `${tx.category.colorHex}44` }}>
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
                                        </div>
                                        {/* ─── 3-dot menu ─── */}
                                        <div className={styles.txMenuWrap} onClick={e => e.stopPropagation()}>
                                            <button className={styles.txMenuBtn}
                                                onClick={() => setOpenMenu(openMenu === tx.id ? null : tx.id)}>
                                                ⋮
                                            </button>
                                            {openMenu === tx.id && (
                                                <div className={styles.txMenuPopover}>
                                                    <p className={styles.txMenuTitle}>{t("actions")}</p>
                                                    <button className={styles.txMenuDelete} onClick={() => deleteTx(tx.id)}>
                                                        🗑️ {t("deleteAction")}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>

                    {/* Chart Panel */}
                    <div className={styles.chartPanel}>
                        <h3 className={styles.chartPanelTitle}>{t("charts")}</h3>
                        <div className={styles.chartTabs}>
                            {(([["todas", t("all")], ["receitas", t("income")], ["despesas", t("expenses")]] as const)).map(([k, l]) => (
                                <button key={k} className={`${styles.chartTab} ${chartTab === k ? styles.chartTabActive : ""}`}
                                    onClick={() => setChartTab(k)}>{l}</button>
                            ))}
                        </div>
                        <p className={styles.chartSub}>
                            {chartTab === "todas" ? t("allIncExp") : chartTab === "receitas" ? t("incomeByCategory") : t("expensesByCategory")}
                        </p>
                        <p className={styles.chartPeriod}>1 {monthName.substring(0, 3)} - {lastDay} {monthName.substring(0, 3)}</p>
                        <div className={styles.donutWrap}>
                            <DonutChart income={chartInc} expense={chartExp} />
                        </div>
                        <div className={styles.chartLegend}>
                            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#22c55e" }} /> {t("income")} {fmt(chartInc)}</span>
                            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#ef4444" }} /> {t("expenses")} {fmt(chartExp)}</span>
                        </div>
                    </div>
                </div>

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

            {profileOpen && (session?.user as { id?: string } | undefined)?.id && (
                <ProfileModal
                    userId={(session!.user as { id: string }).id}
                    name={userName}
                    email={session?.user?.email ?? null}
                    phone={(session?.user as { phone?: string } | undefined)?.phone ?? null}
                    avatarUrl={avatarUrl}
                    onClose={() => setProfileOpen(false)}
                    onUpdated={(newName, newAvatar) => {
                        setUserName(newName);
                        setAvatarUrl(newAvatar);
                    }}
                />
            )}
        </div>
    );
}
