"use client";

import { useState, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import ProfileModal from "@/components/profile/ProfileModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./relatorios.module.css";
import TransactionModal from "../transaction-modal";
import ThemeToggleBtn from "@/components/ui/ThemeToggleBtn";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { useLanguage } from "@/lib/language-context";

// ── Types ──────────────────────────────────────────────────────
type Tx = {
    id: string; amount: number; type: string; date: string | Date; status?: string;
    category: { name: string; icon: string; colorHex: string } | null;
};
type Workspace = { id: string; transactions: Tx[]; accounts: any[]; categories: any[]; } | null;
interface Props { userName: string; workspace: Workspace; }

// ── Helpers ────────────────────────────────────────────────────
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ── Chart definitions ──────────────────────────────────────────
type ChartId =
    | "pizza-despesas"
    | "frequencia"
    | "pizza-receitas"
    | "pizza-despesas-pagas"
    | "pizza-despesas-nao-pagas"
    | "pizza-receitas-pagas"
    | "pizza-receitas-nao-pagas";

const CHART_DEFS: { id: ChartId; label: string }[] = [
    { id: "pizza-despesas", label: "Gráfico Pizza - Despesas" },
    { id: "frequencia", label: "Gráficos de frequência Receitas X Despesas" },
    { id: "pizza-receitas", label: "Gráfico Pizza - Receitas" },
    { id: "pizza-despesas-pagas", label: "Gráfico Pizza - Despesas Pagas" },
    { id: "pizza-despesas-nao-pagas", label: "Gráfico Pizza - Despesas Não Pagas" },
    { id: "pizza-receitas-pagas", label: "Gráfico Pizza - Receitas Pagas" },
    { id: "pizza-receitas-nao-pagas", label: "Gráfico Pizza - Receitas Não Pagas" },
];

const DEFAULT_VISIBLE: Record<ChartId, boolean> = {
    "pizza-despesas": true,
    "frequencia": true,
    "pizza-receitas": true,
    "pizza-despesas-pagas": false,
    "pizza-despesas-nao-pagas": false,
    "pizza-receitas-pagas": false,
    "pizza-receitas-nao-pagas": false,
};

// ── Donut chart ────────────────────────────────────────────────
function MultiSliceDonut({ data, total, title, emptyColor }: { data: { val: number, color: string }[], total: number, title: string, emptyColor: string }) {
    const r = 70;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const cx = 90, cy = 90;

    return (
        <svg width="220" height="220" viewBox="0 0 180 180" className={styles.donutSvg}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={emptyColor} strokeWidth="28" />
            {total > 0 && data.map((slice, i) => {
                const sliceLength = (slice.val / total) * circ;
                const dashval = `${sliceLength} ${circ}`;
                const offval = -offset;
                offset += sliceLength;
                return (
                    <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={slice.color} strokeWidth="28"
                        strokeDasharray={dashval} strokeDashoffset={offval}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        style={{ transition: "all 0.6s ease-out" }}
                    />
                );
            })}
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-primary)">
                {fmt(total)}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                {title}
            </text>
        </svg>
    );
}

// ── Donut Card ─────────────────────────────────────────────────
function DonutCard({ title, monthName, lastDay, data, total, emptyColor }: {
    title: string; monthName: string; lastDay: number;
    data: { val: number; name: string; color: string }[];
    total: number; emptyColor: string;
}) {
    return (
        <div className={styles.chartCard}>
            <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>{title}</h3>
                <button className={styles.dragHandle}>⋮⋮</button>
            </div>
            <p className={styles.cardDate}>1 De {monthName} - {lastDay} De {monthName}</p>
            <div className={styles.donutContainer}>
                <MultiSliceDonut data={data} total={total} title="Total" emptyColor={emptyColor} />
            </div>
            <div className={styles.detailsList}>
                <h4 className={styles.detailsTitle}>Detalhes</h4>
                {data.length === 0 && <p className={styles.emptyText}>Sem dados no período</p>}
                {data.map((cat, i) => (
                    <div key={i} className={styles.detailRow}>
                        <div className={styles.detailLabel}>
                            <span className={styles.detailBadge} style={{ background: cat.color }}>{cat.name}</span>
                        </div>
                        <div className={styles.detailValueBox}>
                            <span className={styles.detailAmount}>{fmt(cat.val)}</span>
                            <span className={styles.detailPct}>({((cat.val / (total || 1)) * 100).toFixed(2)}%)</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────
export default function ReportsClient({ userName: initialUserName, workspace }: Props) {
    const router = useRouter();
    const { t } = useLanguage();
    const { data: session } = useSession();
    const now = new Date();

    // UI State
    const [monthOffset, setMonthOffset] = useState(0);
    const [activeFilter, setActiveFilter] = useState<"hoje" | "7dias" | "mes" | "ano">("mes");
    const [modal, setModal] = useState<"income" | "expense" | null>(null);
    const [showManage, setShowManage] = useState(false);
    const [visible, setVisible] = useState<Record<ChartId, boolean>>(DEFAULT_VISIBLE);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [userName, setUserName] = useState(initialUserName);

    const toggleChart = (id: ChartId) => setVisible(v => ({ ...v, [id]: !v[id] }));
    const resetCharts = () => setVisible(DEFAULT_VISIBLE);

    // Derived dates
    const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const mYear = viewDate.getFullYear();
    const mMonth = viewDate.getMonth();
    const monthName = MONTHS[mMonth];
    const lastDay = new Date(mYear, mMonth + 1, 0).getDate();

    // Filter transactions for the selected month
    const monthTxs = useMemo(() => {
        if (!workspace) return [];
        return workspace.transactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === mYear && d.getMonth() === mMonth;
        });
    }, [workspace, mYear, mMonth]);

    // ── Aggregations ──
    const catGroups = useMemo(() => {
        const inc = new Map<string, { val: number, name: string, color: string }>();
        const exp = new Map<string, { val: number, name: string, color: string }>();
        const expPaid = new Map<string, { val: number, name: string, color: string }>();
        const expUnpaid = new Map<string, { val: number, name: string, color: string }>();
        const incPaid = new Map<string, { val: number, name: string, color: string }>();
        const incUnpaid = new Map<string, { val: number, name: string, color: string }>();

        monthTxs.forEach(t => {
            const catName = t.category?.name || "Sem categoria";
            const color = t.category?.colorHex || (t.type === "income" ? "#22c55e" : "#ef4444");
            const isPaid = t.status === "paid" || !t.status;

            const addTo = (map: Map<string, { val: number, name: string, color: string }>) => {
                const existing = map.get(catName) || { val: 0, name: catName, color };
                existing.val += Math.abs(t.amount);
                map.set(catName, existing);
            };

            if (t.type === "income") {
                addTo(inc);
                if (isPaid) addTo(incPaid); else addTo(incUnpaid);
            } else {
                addTo(exp);
                if (isPaid) addTo(expPaid); else addTo(expUnpaid);
            }
        });

        const sortFn = (a: any, b: any) => b.val - a.val;
        return {
            income: Array.from(inc.values()).sort(sortFn),
            expense: Array.from(exp.values()).sort(sortFn),
            expPaid: Array.from(expPaid.values()).sort(sortFn),
            expUnpaid: Array.from(expUnpaid.values()).sort(sortFn),
            incPaid: Array.from(incPaid.values()).sort(sortFn),
            incUnpaid: Array.from(incUnpaid.values()).sort(sortFn),
        };
    }, [monthTxs]);

    const totalInc = catGroups.income.reduce((s, c) => s + c.val, 0);
    const totalExp = catGroups.expense.reduce((s, c) => s + c.val, 0);
    const totalExpPaid = catGroups.expPaid.reduce((s, c) => s + c.val, 0);
    const totalExpUnpd = catGroups.expUnpaid.reduce((s, c) => s + c.val, 0);
    const totalIncPaid = catGroups.incPaid.reduce((s, c) => s + c.val, 0);
    const totalIncUnpd = catGroups.incUnpaid.reduce((s, c) => s + c.val, 0);

    // Bar chart data (Group by day)
    const dailyData = useMemo(() => {
        const days = Array.from({ length: lastDay }, (_, i) => ({ day: i + 1, inc: 0, exp: 0 }));
        monthTxs.forEach(t => {
            const d = new Date(t.date).getDate() - 1;
            if (d >= 0 && d < lastDay) {
                if (t.type === "income") days[d].inc += Math.abs(t.amount);
                else days[d].exp += Math.abs(t.amount);
            }
        });
        const maxVal = Math.max(1, ...days.map(d => Math.max(d.inc, d.exp, 0)));
        return { days, maxVal };
    }, [monthTxs, lastDay]);

    const visibleCount = CHART_DEFS.filter(c => visible[c.id]).length;

    return (
        <div className={`${styles.page} ${sidebarCollapsed ? styles.pageCollapsed : ""}`}>
            {/* ─── Mobile sidebar overlay ─── */}
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
                    <button className={styles.sidebarCloseBtn} onClick={() => setSidebarOpen(false)} title="Fechar menu">
                        ✕
                    </button>
                </div>
                <nav className={styles.nav}>
                    {[
                        { icon: "📊", labelKey: "dashboard" as const, href: "/dashboard", active: false },
                        { icon: "📈", labelKey: "reports" as const, href: "/dashboard/relatorios", active: true },
                        { icon: "🏷️", labelKey: "categories" as const, href: "#", active: false },
                        { icon: "🏦", labelKey: "bankAccounts" as const, href: "#", active: false },
                        { icon: "💳", labelKey: "creditCards" as const, href: "#", active: false },
                        { icon: "⚙️", labelKey: "settings" as const, href: "#", active: false },
                    ].map(item => (
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

                <div className={styles.profileMenuWrap}>
                    {showProfileMenu && !sidebarCollapsed && (
                        <div className={styles.profileMenu} onClick={e => e.stopPropagation()}>
                            <div className={styles.profileMenuHeader}>
                                <div className={styles.profileMenuAvatar}>
                                    {avatarUrl
                                        ? <img src={avatarUrl} alt="avatar" className={styles.userAvatar} />
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
                                ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
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
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <main className={styles.main}>

                {/* Global Tab Bar */}
                <div className={styles.globalTabs}>
                    <button className={styles.hamburger} onClick={() => setSidebarOpen(true)} title="Abrir menu">
                        <span /><span /><span />
                    </button>
                    <button className={`${styles.globalTab} ${styles.globalTabActive}`}>Gráficos</button>
                    <button className={styles.globalTab}>Lançamentos pendentes</button>
                    <button className={styles.globalTab}>Fluxo de caixa</button>
                </div>

                {/* Filter Toolbar */}
                <header className={styles.topNav}>
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
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <span>01/{String(mMonth + 1).padStart(2, "0")}/{mYear} – {lastDay}/{String(mMonth + 1).padStart(2, "0")}/{mYear}</span>
                    </div>
                    <div className={styles.topActions}>
                        <button className={styles.actionBtn}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6" /><path d="M10 11v6m4-6v6" /><path d="M9 6V4h6v2" /></svg>
                            Limpar filtro
                        </button>
                        <button className={styles.actionBtn}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-.36-5.29" /></svg>
                            Atualizar
                        </button>
                    </div>
                </header>

                <div className={styles.contentWrap}>
                    <div className={styles.pageHeader}>
                        <div>
                            <h2 className={styles.pageTitle}>Gráficos de Análise</h2>
                            <p className={styles.pageSub}>{visibleCount} gráfico{visibleCount !== 1 ? "s" : ""} visível{visibleCount !== 1 ? "is" : ""}</p>
                        </div>
                        <button className={styles.manageChartsBtn} onClick={() => setShowManage(true)}>
                            ⚙️ Gerenciar Gráficos
                        </button>
                    </div>

                    {/* ── Charts Grid ── */}
                    <div className={styles.grid}>

                        {/* Pizza Despesas */}
                        {visible["pizza-despesas"] && (
                            <DonutCard title="Despesas por Categoria" monthName={monthName} lastDay={lastDay}
                                data={catGroups.expense} total={totalExp} emptyColor="var(--bg-surface)" />
                        )}

                        {/* Pizza Receitas */}
                        {visible["pizza-receitas"] && (
                            <DonutCard title="Receitas por Categoria" monthName={monthName} lastDay={lastDay}
                                data={catGroups.income} total={totalInc} emptyColor="var(--bg-surface)" />
                        )}

                        {/* Pizza Despesas Pagas */}
                        {visible["pizza-despesas-pagas"] && (
                            <DonutCard title="Despesas Pagas" monthName={monthName} lastDay={lastDay}
                                data={catGroups.expPaid} total={totalExpPaid} emptyColor="var(--bg-surface)" />
                        )}

                        {/* Pizza Despesas Não Pagas */}
                        {visible["pizza-despesas-nao-pagas"] && (
                            <DonutCard title="Despesas Não Pagas" monthName={monthName} lastDay={lastDay}
                                data={catGroups.expUnpaid} total={totalExpUnpd} emptyColor="var(--bg-surface)" />
                        )}

                        {/* Pizza Receitas Pagas */}
                        {visible["pizza-receitas-pagas"] && (
                            <DonutCard title="Receitas Pagas" monthName={monthName} lastDay={lastDay}
                                data={catGroups.incPaid} total={totalIncPaid} emptyColor="var(--bg-surface)" />
                        )}

                        {/* Pizza Receitas Não Pagas */}
                        {visible["pizza-receitas-nao-pagas"] && (
                            <DonutCard title="Receitas Não Pagas" monthName={monthName} lastDay={lastDay}
                                data={catGroups.incUnpaid} total={totalIncUnpd} emptyColor="var(--bg-surface)" />
                        )}

                        {/* Frequência (full-width bar chart) */}
                        {visible["frequencia"] && (
                            <div className={`${styles.chartCard} ${styles.span2}`}>
                                <div className={styles.cardTop}>
                                    <div>
                                        <h3 className={styles.cardTitle}><span style={{ color: "#6366f1" }}>↗</span> Gráficos de frequência Receitas X Despesas</h3>
                                        <p className={styles.cardSubTitle}>Visualize a frequência de receitas e despesas ao longo do tempo</p>
                                    </div>
                                    <div className={styles.chartControls}>
                                        <div className={styles.selectWrap}>
                                            <select className={styles.chartSelect} defaultValue="coluna"><option value="coluna">📊 Coluna</option></select>
                                        </div>
                                        <div className={styles.selectWrap}>
                                            <select className={styles.chartSelect} defaultValue="diario"><option value="diario">📅 Diário</option></select>
                                        </div>
                                        <button className={styles.dragHandle}>⋮⋮</button>
                                    </div>
                                </div>
                                <div className={styles.barChartContainer}>
                                    <svg width="100%" height="200" style={{ overflow: "visible" }}>
                                        <line x1="0" y1="170" x2="100%" y2="170" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                                        {dailyData.days.map((d, i) => {
                                            const x = `${(i / lastDay) * 100}%`;
                                            const expH = (d.exp / dailyData.maxVal) * 150;
                                            const incH = (d.inc / dailyData.maxVal) * 150;
                                            const showLabel = i === 0 || i === lastDay - 1 || (i % 3 === 0);
                                            return (
                                                <g key={i}>
                                                    {d.inc > 0 && <rect x={`calc(${x} + 2px)`} y={170 - incH} width="6" height={incH} fill="#22c55e" rx="2" />}
                                                    {d.exp > 0 && <rect x={`calc(${x} + 10px)`} y={170 - expH} width="6" height={expH} fill="#ef4444" rx="2" />}
                                                    {showLabel && <text x={`calc(${x} + 6px)`} y="190" fontSize="10" fill="#71717a" textAnchor="middle">{d.day} {monthName.substring(0, 3)}</text>}
                                                </g>
                                            );
                                        })}
                                    </svg>
                                    <div className={styles.barLegend}>
                                        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#22c55e" }} /> Receitas</span>
                                        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#ef4444" }} /> Despesas</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {visibleCount === 0 && (
                            <div className={styles.emptyCharts}>
                                <p>Nenhum gráfico visível.</p>
                                <button className={styles.manageChartsBtn} onClick={() => setShowManage(true)}>⚙️ Gerenciar Gráficos</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ── Gerenciar Gráficos Modal ── */}
            {showManage && (
                <div className={styles.manageOverlay} onClick={() => setShowManage(false)}>
                    <div className={styles.manageModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.manageHeader}>
                            <h3 className={styles.manageTitle}>Gerenciar Gráficos do Dashboard</h3>
                            <button className={styles.manageClose} onClick={() => setShowManage(false)}>✕</button>
                        </div>

                        <div className={styles.manageSectionHeader}>
                            <span className={styles.manageSectionLabel}>Gráficos Disponíveis</span>
                            <button className={styles.resetBtn} onClick={resetCharts}>Resetar Gráficos</button>
                        </div>

                        <div className={styles.manageList}>
                            {CHART_DEFS.map(chart => {
                                const isOn = visible[chart.id];
                                return (
                                    <div key={chart.id} className={`${styles.manageItem} ${isOn ? styles.manageItemOn : ""}`}>
                                        <span className={`${styles.manageIndicator} ${isOn ? styles.manageIndicatorOn : ""}`} />
                                        <span className={styles.manageLabel}>{chart.label}</span>
                                        <div className={styles.toggleRow}>
                                            <button
                                                role="switch"
                                                aria-checked={isOn}
                                                className={`${styles.toggle} ${isOn ? styles.toggleOn : ""}`}
                                                onClick={() => toggleChart(chart.id)}
                                            >
                                                <span className={styles.toggleThumb} />
                                            </button>
                                            <span className={styles.toggleLabel}>{isOn ? "Visível" : "Oculto"}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

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
