"use client";

import { useState } from "react";

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

interface MonthData  { label: string; income: number; expense: number; balance: number; }
interface CatData    { name: string; icon: string; color: string; total: number; count: number; pct: number; }
interface Account    { id: string; name: string; color: string; balance: number; type: string; }
interface Transaction { id: string; description: string; amount: number; date: string; category?: { name: string; icon: string; colorHex: string } | null; account?: { name: string } | null; }

interface Props {
  monthlyData:        MonthData[];
  categoryBreakdown:  CatData[];
  topExpenses:        Transaction[];
  accounts:           Account[];
  summary: {
    totalTransactions: number;
    totalIncome:  number;
    totalExpense: number;
    netBalance:   number;
    bestIncomeMonth:   { label: string; income: number };
    worstExpenseMonth: { label: string; expense: number };
  };
}

export default function ReportsClient({ monthlyData, categoryBreakdown, topExpenses, accounts, summary }: Props) {
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [chartView, setChartView] = useState<"bar" | "line">("bar");

  const maxVal = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1);
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  // ── Exportar CSV ─────────────────────────────────────────────────────────
  function exportCSV() {
    const rows = [
      ["Mês", "Receitas", "Despesas", "Saldo"],
      ...monthlyData.map(m => [m.label, m.income.toFixed(2), m.expense.toFixed(2), m.balance.toFixed(2)]),
      [],
      ["Categoria", "Total", "Transações", "%"],
      ...categoryBreakdown.map(c => [c.name, c.total.toFixed(2), c.count, c.pct.toFixed(1) + "%"]),
    ];
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `turatuno-relatorio.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={s.root}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>📊 Relatórios</h1>
          <p style={s.sub}>Visão geral da sua saúde financeira</p>
        </div>
        <button onClick={exportCSV} style={s.exportBtn}>
          ⬇️ Exportar CSV
        </button>
      </div>

      {/* Cards de resumo geral */}
      <div style={s.summaryGrid}>
        <div style={s.summaryCard}>
          <div style={s.summaryIcon}>💳</div>
          <div>
            <p style={s.summaryLabel}>Total de transações</p>
            <p style={s.summaryVal}>{summary.totalTransactions.toLocaleString("pt-BR")}</p>
          </div>
        </div>
        <div style={s.summaryCard}>
          <div style={{ ...s.summaryIcon, background: "rgba(52,211,153,0.15)" }}>📈</div>
          <div>
            <p style={s.summaryLabel}>Total recebido</p>
            <p style={{ ...s.summaryVal, color: "#34d399" }}>{fmt(summary.totalIncome)}</p>
          </div>
        </div>
        <div style={s.summaryCard}>
          <div style={{ ...s.summaryIcon, background: "rgba(248,113,113,0.15)" }}>📉</div>
          <div>
            <p style={s.summaryLabel}>Total gasto</p>
            <p style={{ ...s.summaryVal, color: "#f87171" }}>{fmt(summary.totalExpense)}</p>
          </div>
        </div>
        <div style={s.summaryCard}>
          <div style={{ ...s.summaryIcon, background: summary.netBalance >= 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)" }}>💰</div>
          <div>
            <p style={s.summaryLabel}>Saldo líquido total</p>
            <p style={{ ...s.summaryVal, color: summary.netBalance >= 0 ? "#34d399" : "#f87171" }}>{fmt(summary.netBalance)}</p>
          </div>
        </div>
      </div>

      {/* Destaques */}
      <div style={s.highlightsRow}>
        <div style={s.highlightCard}>
          <span style={s.highlightEmoji}>🏆</span>
          <div>
            <p style={s.highlightLabel}>Melhor mês de receita</p>
            <p style={s.highlightVal}>{summary.bestIncomeMonth.label}</p>
            <p style={{ ...s.highlightSub, color: "#34d399" }}>{fmt(summary.bestIncomeMonth.income)}</p>
          </div>
        </div>
        <div style={s.highlightCard}>
          <span style={s.highlightEmoji}>⚠️</span>
          <div>
            <p style={s.highlightLabel}>Mês com mais gastos</p>
            <p style={s.highlightVal}>{summary.worstExpenseMonth.label}</p>
            <p style={{ ...s.highlightSub, color: "#f87171" }}>{fmt(summary.worstExpenseMonth.expense)}</p>
          </div>
        </div>
        <div style={s.highlightCard}>
          <span style={s.highlightEmoji}>🏦</span>
          <div>
            <p style={s.highlightLabel}>Patrimônio em contas</p>
            <p style={s.highlightVal}>{accounts.length} conta{accounts.length !== 1 ? "s" : ""}</p>
            <p style={{ ...s.highlightSub, color: totalBalance >= 0 ? "#34d399" : "#f87171" }}>{fmt(totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* ── Gráfico de barras — evolução mensal ── */}
      <div style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.cardTitle}>Evolução mensal</h2>
          <div style={s.chartToggle}>
            <button onClick={() => setChartView("bar")} style={{ ...s.chartToggleBtn, ...(chartView === "bar" ? s.chartToggleBtnActive : {}) }}>📊 Barras</button>
            <button onClick={() => setChartView("line")} style={{ ...s.chartToggleBtn, ...(chartView === "line" ? s.chartToggleBtnActive : {}) }}>📈 Linhas</button>
          </div>
        </div>

        {monthlyData.every(m => m.income === 0 && m.expense === 0) ? (
          <div style={s.chartEmpty}>Nenhum dado ainda. Adicione transações para ver o gráfico!</div>
        ) : chartView === "bar" ? (
          <BarChart data={monthlyData} maxVal={maxVal} activeBar={activeBar} setActiveBar={setActiveBar} />
        ) : (
          <LineChart data={monthlyData} maxVal={maxVal} />
        )}

        {/* Legenda */}
        <div style={s.legend}>
          <span style={s.legendItem}><span style={{ ...s.legendDot, background: "#34d399" }} />Receitas</span>
          <span style={s.legendItem}><span style={{ ...s.legendDot, background: "#f87171" }} />Despesas</span>
          <span style={s.legendItem}><span style={{ ...s.legendDot, background: "#60a5fa" }} />Saldo</span>
        </div>
      </div>

      {/* ── Linha 2: Pizza categorias + Distribuição contas ── */}
      <div style={s.row2}>

        {/* Gastos por categoria */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>Gastos por categoria</h2>
            <span style={s.cardSub}>mês atual</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div style={s.chartEmpty}>Nenhuma despesa registrada este mês.</div>
          ) : (
            <>
              <DonutChart data={categoryBreakdown} />
              <div style={s.catList}>
                {categoryBreakdown.map((cat, i) => (
                  <div key={i} style={s.catRow}>
                    <div style={{ ...s.catDot, background: cat.color }} />
                    <span style={s.catIcon}>{cat.icon}</span>
                    <span style={s.catName}>{cat.name}</span>
                    <div style={{ flex: 1, height: "4px", background: "#1a2540", borderRadius: "99px", overflow: "hidden", margin: "0 0.75rem" }}>
                      <div style={{ height: "100%", borderRadius: "99px", width: `${cat.pct}%`, background: cat.color, transition: "width 0.5s ease" }} />
                    </div>
                    <span style={s.catPct}>{cat.pct.toFixed(0)}%</span>
                    <span style={s.catAmt}>{fmt(cat.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Distribuição de contas */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>Distribuição por conta</h2>
            <span style={s.cardSub}>{fmt(totalBalance)} total</span>
          </div>

          {accounts.length === 0 ? (
            <div style={s.chartEmpty}>Nenhuma conta cadastrada.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {accounts.map((acc) => {
                const pct = totalBalance > 0 ? Math.max((acc.balance / totalBalance) * 100, 0) : 0;
                return (
                  <div key={acc.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: acc.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.83rem", fontWeight: 700, color: "#e2eeff" }}>{acc.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.7rem", color: "#5d7aaa", fontWeight: 600 }}>{pct.toFixed(1)}%</span>
                        <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: acc.balance >= 0 ? "#34d399" : "#f87171" }}>{fmt(acc.balance)}</span>
                      </div>
                    </div>
                    <div style={{ height: "6px", background: "#1a2540", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "99px", width: `${pct}%`, background: acc.color, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Top 10 maiores despesas do mês ── */}
      <div style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.cardTitle}>Top 10 maiores despesas</h2>
          <span style={s.cardSub}>mês atual</span>
        </div>

        {topExpenses.length === 0 ? (
          <div style={s.chartEmpty}>Nenhuma despesa registrada este mês.</div>
        ) : (
          <div style={s.topList}>
            {topExpenses.map((tx, i) => (
              <div key={tx.id} style={s.topRow}>
                <div style={s.topRank}>
                  <span style={{ fontSize: i < 3 ? "1.1rem" : "0.78rem", fontWeight: 800, color: i < 3 ? ["#fbbf24","#94a3b8","#cd7f32"][i] : "#38506e" }}>
                    {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i + 1}`}
                  </span>
                </div>
                <div style={{ ...s.topIcon, background: tx.category?.colorHex ? tx.category.colorHex + "20" : "rgba(59,130,246,0.1)", border: `1px solid ${tx.category?.colorHex ?? "#3b82f6"}30` }}>
                  {tx.category?.icon ?? "📉"}
                </div>
                <div style={s.topInfo}>
                  <p style={s.topDesc}>{tx.description}</p>
                  <p style={s.topMeta}>{tx.category?.name ?? "Sem categoria"}{tx.account && ` · ${tx.account.name}`}</p>
                </div>
                <div style={{ textAlign: "right" as const }}>
                  <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#f87171", margin: 0 }}>
                    {fmt(tx.amount)}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "#38506e", margin: 0 }}>
                    {new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ── GRÁFICO DE BARRAS ──────────────────────────────────────────────────────

function BarChart({ data, maxVal, activeBar, setActiveBar }: {
  data: MonthData[]; maxVal: number;
  activeBar: number | null; setActiveBar: (i: number | null) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "200px", padding: "0 0.5rem" }}>
      {data.map((m, i) => {
        const incH  = (m.income  / maxVal) * 160;
        const expH  = (m.expense / maxVal) * 160;
        const active = activeBar === i;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}
            onMouseEnter={() => setActiveBar(i)} onMouseLeave={() => setActiveBar(null)}>
            {active && (
              <div style={{ background: "#0c1221", border: "1px solid #1a2540", borderRadius: "8px", padding: "0.4rem 0.6rem", fontSize: "0.68rem", fontWeight: 700, color: "#e2eeff", whiteSpace: "nowrap", textAlign: "center" }}>
                📈 {m.income > 0 ? fmt(m.income) : "—"}<br />
                📉 {m.expense > 0 ? fmt(m.expense) : "—"}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "160px" }}>
              {/* Receita */}
              <div style={{ width: "14px", height: `${incH}px`, borderRadius: "4px 4px 0 0", background: active ? "#34d399" : "rgba(52,211,153,0.5)", transition: "all 0.2s", minHeight: m.income > 0 ? "4px" : "0" }} />
              {/* Despesa */}
              <div style={{ width: "14px", height: `${expH}px`, borderRadius: "4px 4px 0 0", background: active ? "#f87171" : "rgba(248,113,113,0.5)", transition: "all 0.2s", minHeight: m.expense > 0 ? "4px" : "0" }} />
            </div>
            <span style={{ fontSize: "0.65rem", color: activeBar === i ? "#e2eeff" : "#38506e", fontWeight: 700, textAlign: "center" }}>{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── GRÁFICO DE LINHAS ──────────────────────────────────────────────────────

function LineChart({ data, maxVal }: { data: MonthData[]; maxVal: number }) {
  const W = 100, H = 160, pad = 8;
  const n = data.length;

  function x(i: number) { return pad + (i / (n - 1)) * (W - pad * 2); }
  function y(val: number) { return H - pad - (val / maxVal) * (H - pad * 2); }

  function polyline(vals: number[], color: string, dashed?: boolean) {
    if (n < 2) return null;
    const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    return (
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeDasharray={dashed ? "3,3" : undefined} strokeLinecap="round" strokeLinejoin="round" />
    );
  }

  return (
    <div style={{ padding: "0 0.5rem" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "200px", overflow: "visible" }}>
        {/* Grid */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad} y1={y(maxVal * f)} x2={W - pad} y2={y(maxVal * f)}
            stroke="#1a2540" strokeWidth="0.5" />
        ))}
        {polyline(data.map(m => m.income),  "#34d399")}
        {polyline(data.map(m => m.expense), "#f87171")}
        {polyline(data.map(m => m.balance), "#60a5fa", true)}
        {/* Pontos */}
        {data.map((m, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(m.income)}  r="2" fill="#34d399" />
            <circle cx={x(i)} cy={y(m.expense)} r="2" fill="#f87171" />
            <circle cx={x(i)} cy={y(m.balance)} r="2" fill="#60a5fa" />
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
        {data.map((m, i) => (
          <span key={i} style={{ fontSize: "0.62rem", color: "#38506e", fontWeight: 700, textAlign: "center", flex: 1 }}>{m.label}</span>
        ))}
      </div>
    </div>
  );
}

// ── DONUT CHART ────────────────────────────────────────────────────────────

function DonutChart({ data }: { data: CatData[] }) {
  const SIZE = 160, R = 58, CX = 80, CY = 80;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  let offset = 0;

  const total = data.reduce((s, c) => s + c.total, 0);

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1a2540" strokeWidth="18" />
        {data.map((cat, i) => {
          const pct  = total > 0 ? cat.total / total : 0;
          const dash = pct * CIRCUMFERENCE;
          const gap  = CIRCUMFERENCE - dash;
          const el = (
            <circle key={i} cx={CX} cy={CY} r={R}
              fill="none" stroke={cat.color} strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          );
          offset += dash;
          return el;
        })}
        {/* Centro */}
        <text x={CX} y={CY - 8}  textAnchor="middle" fill="#e2eeff" fontSize="11" fontWeight="800" fontFamily="'Bricolage Grotesque',sans-serif">
          {data.length}
        </text>
        <text x={CX} y={CY + 8}  textAnchor="middle" fill="#5d7aaa" fontSize="8" fontWeight="700">
          categorias
        </text>
      </svg>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1100px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  title: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  sub: { fontSize: "0.82rem", color: "#5d7aaa", marginTop: "0.2rem" },
  exportBtn: { padding: "0.65rem 1.25rem", background: "#0c1221", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.85rem", transition: "all 0.2s" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" },
  summaryCard: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "16px", padding: "1.1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" },
  summaryIcon: { width: "38px", height: "38px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 },
  summaryLabel: { fontSize: "0.7rem", fontWeight: 700, color: "#5d7aaa", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 0.2rem" },
  summaryVal: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.03em", color: "#e2eeff", margin: 0 },
  highlightsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" },
  highlightCard: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "14px", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.85rem" },
  highlightEmoji: { fontSize: "1.6rem", flexShrink: 0 },
  highlightLabel: { fontSize: "0.7rem", fontWeight: 700, color: "#5d7aaa", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 0.15rem" },
  highlightVal: { fontSize: "0.88rem", fontWeight: 800, color: "#e2eeff", margin: 0 },
  highlightSub: { fontSize: "0.78rem", fontWeight: 700, margin: "0.15rem 0 0" },
  card: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "20px", padding: "1.5rem" },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  cardTitle: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "#e2eeff", margin: 0 },
  cardSub: { fontSize: "0.75rem", fontWeight: 700, color: "#5d7aaa" },
  chartToggle: { display: "flex", gap: "0.3rem", background: "#080d1a", border: "1px solid #1a2540", borderRadius: "8px", padding: "0.2rem" },
  chartToggleBtn: { padding: "0.3rem 0.65rem", borderRadius: "6px", border: "none", background: "transparent", color: "#5d7aaa", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" },
  chartToggleBtnActive: { background: "rgba(59,130,246,0.2)", color: "#60a5fa" },
  chartEmpty: { padding: "2.5rem", textAlign: "center", color: "#38506e", fontSize: "0.83rem" },
  legend: { display: "flex", gap: "1.25rem", marginTop: "1rem", justifyContent: "center" },
  legendItem: { display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 700, color: "#5d7aaa" },
  legendDot: { width: "8px", height: "8px", borderRadius: "50%" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  catList: { display: "flex", flexDirection: "column", gap: "0.7rem" },
  catRow: { display: "flex", alignItems: "center", gap: "0.5rem" },
  catDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  catIcon: { fontSize: "0.9rem", flexShrink: 0 },
  catName: { fontSize: "0.78rem", fontWeight: 700, color: "#e2eeff", minWidth: "80px" },
  catPct: { fontSize: "0.7rem", fontWeight: 700, color: "#5d7aaa", minWidth: "30px", textAlign: "right" as const },
  catAmt: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#e2eeff", minWidth: "90px", textAlign: "right" as const },
  topList: { display: "flex", flexDirection: "column" },
  topRow: { display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.75rem 0", borderBottom: "1px solid #0f1929" },
  topRank: { width: "28px", textAlign: "center" as const, flexShrink: 0 },
  topIcon: { width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 },
  topInfo: { flex: 1, minWidth: 0 },
  topDesc: { fontSize: "0.83rem", fontWeight: 700, color: "#e2eeff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  topMeta: { fontSize: "0.7rem", color: "#5d7aaa", margin: 0 },
};
