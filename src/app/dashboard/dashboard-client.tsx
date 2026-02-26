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
            <circle cx="80" cy="80" r={r} fill="none" stroke="#1e1e2e" strokeWidth="24" />
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
            <text x="80" y="76" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
                {fmt(income - expense)}
            </text>
            <text x="80" y="92" textAnchor="middle" fontSize="9" fill="#71717a">Total</text>
        </svg>
    );
}

// ── Main Component ─────────────────────────────────────────────
export default function DashboardClient({ userName, workspace }: Props) {
    const router = useRouter();
    const [modal, setModal] = useState<"income" | "expense" | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    return (
        <div className={styles.page}>
            {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

            {/* ─── Sidebar ─── */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarBrand}>
                    <span className={styles.brandDot} />
                    <span className={styles.brandName}>TuraTuno</span>
                    <button className={styles.sidebarCloseBtn} onClick={() => setSidebarOpen(false)}>✕</button>
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
                        {(([["hoje", "Hoje"], ["7dias", "7 dias atrás"], ["mes", "Esse mês"], ["ano", "Esse ano"]] as const)).map(([k, l]) => (
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
                            Limpar filtro
                        </button>
                        <button className={styles.actionBtn} onClick={() => router.refresh()}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-.36-5.29" /></svg>
                            Atualizar
                        </button>
                    </div>
                </header>

                {/* ─── 4 Stat Cards ─── */}
                <div className={styles.statsRow}>

                    {/* Saldo do Período Anterior */}
                    <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                        <div className={styles.statCardTop}>
                            <div>
                                <p className={styles.statLabel}>↗ Saldo Do Período Anterior</p>
                                <p className={styles.statValue} style={{ color: prevBal >= 0 ? "#22c55e" : "#ef4444" }}>{mask(prevBal, hideSaldo)}</p>
                                <p className={styles.statSub}>Até 31 De {MONTHS[mMonth === 0 ? 11 : mMonth - 1]}</p>
                            </div>
                            <EyeBtn hidden={hideSaldo} onToggle={() => setHideSaldo(v => !v)} />
                        </div>
                        <button className={styles.detailToggle} onClick={() => setExpandSaldo(v => !v)}>
                            Ocultar detalhes {expandSaldo ? "∧" : "∨"}
                        </button>
                        {expandSaldo && (
                            <div className={styles.statSubRow}>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>⏳ Pendentes</span>
                                    <span className={styles.subVal}>{mask(prevBal < 0 ? Math.abs(prevBal) : 0, hideSaldo)}</span>
                                </div>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>✅ Disponível</span>
                                    <span className={styles.subVal}>{mask(prevBal, hideSaldo)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Receitas */}
                    <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                        <div className={styles.statCardTop}>
                            <div>
                                <p className={styles.statLabel}>↗ Receitas</p>
                                <p className={styles.statValue} style={{ color: "#22c55e" }}>{mask(income, hideInc)}</p>
                                <p className={styles.statSub}>1 De {monthName} - {lastDay} De {monthName}</p>
                            </div>
                            <EyeBtn hidden={hideInc} onToggle={() => setHideInc(v => !v)} />
                        </div>
                        <button className={styles.detailToggle} onClick={() => setExpandInc(v => !v)}>
                            Ocultar detalhes {expandInc ? "∧" : "∨"}
                        </button>
                        {expandInc && (
                            <div className={styles.statSubRow}>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>✅ Recebeu</span>
                                    <span className={styles.subVal} style={{ color: "#22c55e" }}>{mask(received, hideInc)}</span>
                                </div>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>⏳ A receber</span>
                                    <span className={styles.subVal}>{mask(toReceive, hideInc)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Despesas */}
                    <div className={`${styles.statCard} ${styles.statCardRed}`}>
                        <div className={styles.statCardTop}>
                            <div>
                                <p className={styles.statLabel}>↘ Despesas</p>
                                <p className={styles.statValue} style={{ color: "#ef4444" }}>- {mask(expense, hideExp)}</p>
                                <p className={styles.statSub}>1 De {monthName} - {lastDay} De {monthName}</p>
                            </div>
                            <EyeBtn hidden={hideExp} onToggle={() => setHideExp(v => !v)} />
                        </div>
                        <button className={styles.detailToggle} onClick={() => setExpandExp(v => !v)}>
                            Ocultar detalhes {expandExp ? "∧" : "∨"}
                        </button>
                        {expandExp && (
                            <div className={styles.statSubRow}>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>✅ Pago</span>
                                    <span className={styles.subVal}>{mask(paid, hideExp)}</span>
                                </div>
                                <div className={styles.subItem}>
                                    <span className={styles.subLabel}>⏳ A pagar</span>
                                    <span className={styles.subVal} style={{ color: "#ef4444" }}>{mask(toPay, hideExp)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Saldo Disponível + Previsto */}
                    <div className={`${styles.statCard} ${styles.statCardDouble}`}>
                        <div className={styles.statCardTop}>
                            <div>
                                <p className={styles.statLabel}>↗ Saldo Disponível</p>
                                <p className={styles.statValue} style={{ color: saldoDisp >= 0 ? "#22c55e" : "#ef4444" }}>{mask(saldoDisp, hideDisp)}</p>
                                <p className={styles.statSub}>Até {lastDay} De {monthName} (Receita - Despesas + Saldo Bancário)</p>
                            </div>
                            <EyeBtn hidden={hideDisp} onToggle={() => setHideDisp(v => !v)} />
                        </div>
                        <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.75rem" }}>
                            <p className={styles.statLabel}>↗ Saldo Previsto</p>
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
                                <button className={styles.addIncBtn} onClick={() => setModal("income")}>+ Receita</button>
                                <button className={styles.addExpBtn} onClick={() => setModal("expense")}>+ Despesa</button>
                            </div>
                        </div>

                        <div className={styles.txTabs}>
                            {(([["todas", "Todas"], ["receitas", "Receitas"], ["despesas", "Despesas"]] as const)).map(([k, l]) => (
                                <button key={k} className={`${styles.txTab} ${txTab === k ? styles.txTabActive : ""}`}
                                    onClick={() => setTxTab(k)}>{l}</button>
                            ))}
                        </div>

                        <div className={styles.searchRow}>
                            <div className={styles.searchWrap}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={styles.searchIcon}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                <input className={styles.searchInput} placeholder="Pesquisar transações..."
                                    value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <div className={styles.searchDateLabel}>Data de Vencimento</div>
                        </div>

                        <div className={styles.txList}>
                            {filteredTxs.length === 0 ? (
                                <p className={styles.emptyText}>Nenhuma transação encontrada.</p>
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
                                                            {tx.status === "paid" ? "Pago" : "Pendente"}
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
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chart Panel */}
                    <div className={styles.chartPanel}>
                        <h3 className={styles.chartPanelTitle}>Gráficos</h3>
                        <div className={styles.chartTabs}>
                            {(([["todas", "Todas"], ["receitas", "Receitas"], ["despesas", "Despesas"]] as const)).map(([k, l]) => (
                                <button key={k} className={`${styles.chartTab} ${chartTab === k ? styles.chartTabActive : ""}`}
                                    onClick={() => setChartTab(k)}>{l}</button>
                            ))}
                        </div>
                        <p className={styles.chartSub}>
                            {chartTab === "todas" ? "Todas Receitas e Despesas" : chartTab === "receitas" ? "Receitas por Categoria" : "Despesas por Categoria"}
                        </p>
                        <p className={styles.chartPeriod}>1 {monthName.substring(0, 3)} - {lastDay} {monthName.substring(0, 3)}</p>
                        <div className={styles.donutWrap}>
                            <DonutChart income={chartInc} expense={chartExp} />
                        </div>
                        <div className={styles.chartLegend}>
                            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#22c55e" }} /> Receitas {fmt(chartInc)}</span>
                            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#ef4444" }} /> Despesas {fmt(chartExp)}</span>
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
        </div>
    );
}
