"use client";

import Link from "next/link";

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Props {
  workspace: any;
  user: any;
  totalBalance: number;
  accounts: any[];
  monthIncome: number;
  monthExpense: number;
  expenseVariation: number;
  categoryData: { name: string; icon: string; color: string; total: number }[];
  recentTransactions: any[];
  goals: any[];
  pendingCount: number;
  monthLabel: string;
}

export default function DashboardClient({
  workspace,
  user,
  totalBalance,
  accounts,
  monthIncome,
  monthExpense,
  expenseVariation,
  categoryData,
  recentTransactions,
  goals,
  pendingCount,
  monthLabel,
}: Props) {
  const firstName = user?.name?.split(" ")[0] ?? "você";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const totalCatExpense = categoryData.reduce((s, c) => s + c.total, 0);

  return (
    <div style={s.root}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.greeting}>{greeting}, {firstName}! {workspace.iconEmoji ?? "👋"}</h1>
          <p style={s.subGreeting}>{monthLabel} · {workspace.name}</p>
        </div>
        <Link href="/transactions/new" style={s.newTransactionBtn}>
          + Nova transação
        </Link>
      </div>

      {/* ── SALDO TOTAL ── */}
      <div style={s.balanceCard}>
        <div style={s.balanceGlow} />
        <div style={s.balanceInner}>
          <div>
            <p style={s.balanceLabel}>Saldo total</p>
            <p style={s.balanceValue}>{fmt(totalBalance)}</p>
            <div style={s.accountPills}>
              {accounts.map((acc) => (
                <span key={acc.id} style={{ ...s.accountPill, borderColor: acc.color + "55" }}>
                  <span style={{ ...s.accountDot, background: acc.color }} />
                  {acc.name}
                </span>
              ))}
            </div>
          </div>
          {pendingCount > 0 && (
            <div style={s.pendingBadge}>
              ⏳ {pendingCount} {pendingCount === 1 ? "pendente" : "pendentes"}
            </div>
          )}
        </div>
      </div>

      {/* ── CARDS RECEITA / DESPESA ── */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statHeader}>
            <div style={{ ...s.statIcon, background: "rgba(52,211,153,0.15)" }}>📈</div>
            <span style={s.statLabel}>Receitas</span>
          </div>
          <p style={{ ...s.statValue, color: "#34d399" }}>{fmt(monthIncome)}</p>
          <p style={s.statSub}>esse mês</p>
        </div>

        <div style={s.statCard}>
          <div style={s.statHeader}>
            <div style={{ ...s.statIcon, background: "rgba(248,113,113,0.15)" }}>📉</div>
            <span style={s.statLabel}>Despesas</span>
          </div>
          <p style={{ ...s.statValue, color: "#f87171" }}>{fmt(monthExpense)}</p>
          <p style={s.statSub}>
            {expenseVariation !== 0 && (
              <span style={{ color: expenseVariation > 0 ? "#f87171" : "#34d399", fontWeight: 700 }}>
                {expenseVariation > 0 ? "▲" : "▼"} {Math.abs(expenseVariation)}%{" "}
              </span>
            )}
            vs mês anterior
          </p>
        </div>

        <div style={s.statCard}>
          <div style={s.statHeader}>
            <div style={{ ...s.statIcon, background: "rgba(59,130,246,0.15)" }}>💰</div>
            <span style={s.statLabel}>Saldo do mês</span>
          </div>
          <p style={{
            ...s.statValue,
            color: monthIncome - monthExpense >= 0 ? "#34d399" : "#f87171",
          }}>
            {fmt(monthIncome - monthExpense)}
          </p>
          <p style={s.statSub}>receitas − despesas</p>
        </div>
      </div>

      {/* ── LINHA 2: CATEGORIAS + TRANSAÇÕES ── */}
      <div style={s.row2}>

        {/* Gastos por categoria */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>Gastos por categoria</h2>
            <Link href="/reports" style={s.cardLink}>Ver relatório →</Link>
          </div>

          {categoryData.length === 0 ? (
            <EmptyState
              emoji="📊"
              text="Nenhuma despesa registrada ainda"
              sub="Adicione sua primeira transação!"
            />
          ) : (
            <div style={s.catList}>
              {categoryData.map((cat) => {
                const pct = totalCatExpense > 0 ? (cat.total / totalCatExpense) * 100 : 0;
                return (
                  <div key={cat.name} style={s.catItem}>
                    <div style={s.catLeft}>
                      <div style={{ ...s.catEmoji, background: cat.color + "22", border: `1px solid ${cat.color}44` }}>
                        {cat.icon}
                      </div>
                      <div>
                        <p style={s.catName}>{cat.name}</p>
                        <p style={s.catPct}>{pct.toFixed(1)}% do total</p>
                      </div>
                    </div>
                    <div style={s.catRight}>
                      <p style={s.catAmount}>{fmt(cat.total)}</p>
                      <div style={s.catBarTrack}>
                        <div style={{ ...s.catBar, width: `${pct}%`, background: cat.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Metas */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>🎯 Metas & Sonhos</h2>
            <Link href="/goals" style={s.cardLink}>Ver todas →</Link>
          </div>

          {goals.length === 0 ? (
            <EmptyState
              emoji="🎯"
              text="Nenhuma meta criada ainda"
              sub="Crie sua primeira meta e comece a sonhar!"
              cta={{ label: "+ Criar meta", href: "/goals/new" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {goals.map((goal: any) => {
                const pct = goal.targetAmount > 0
                  ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                  : 0;
                const remaining = goal.targetAmount - goal.currentAmount;
                return (
                  <div key={goal.id} style={s.goalItem}>
                    <div style={s.goalHeader}>
                      <span style={s.goalEmoji}>{goal.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <p style={s.goalName}>{goal.name}</p>
                        <p style={s.goalSub}>
                          {fmt(goal.currentAmount)} de {fmt(goal.targetAmount)}
                        </p>
                      </div>
                      <span style={s.goalPct}>{pct.toFixed(0)}%</span>
                    </div>
                    <div style={s.goalBarTrack}>
                      <div style={{
                        ...s.goalBar,
                        width: `${pct}%`,
                        background: pct >= 100
                          ? "linear-gradient(90deg,#34d399,#10b981)"
                          : "linear-gradient(90deg,#3b82f6,#22d3ee)",
                      }} />
                    </div>
                    {remaining > 0 && (
                      <p style={s.goalRemaining}>Faltam {fmt(remaining)}</p>
                    )}
                  </div>
                );
              })}
              <Link href="/goals/new" style={s.addGoalBtn}>+ Nova meta</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── TRANSAÇÕES RECENTES ── */}
      <div style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.cardTitle}>Transações recentes</h2>
          <Link href="/transactions" style={s.cardLink}>Ver todas →</Link>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            emoji="💳"
            text="Nenhuma transação ainda"
            sub="Registre seu primeiro gasto ou receita!"
            cta={{ label: "+ Nova transação", href: "/transactions/new" }}
          />
        ) : (
          <div style={s.txList}>
            {recentTransactions.map((tx: any) => (
              <div key={tx.id} style={s.txItem}>
                <div style={{
                  ...s.txIcon,
                  background: tx.category?.colorHex ? tx.category.colorHex + "22" : "rgba(59,130,246,0.12)",
                  border: `1px solid ${tx.category?.colorHex ?? "#3b82f6"}44`,
                }}>
                  {tx.category?.icon ?? "💳"}
                </div>
                <div style={s.txInfo}>
                  <p style={s.txDesc}>{tx.description}</p>
                  <p style={s.txMeta}>
                    {tx.category?.name ?? "Sem categoria"}
                    {tx.account && ` · ${tx.account.name}`}
                    {tx.creditCard && ` · ${tx.creditCard.name}`}
                  </p>
                </div>
                <div style={s.txRight}>
                  <p style={{
                    ...s.txAmount,
                    color: tx.type === "income" ? "#34d399" : tx.type === "expense" ? "#f87171" : "#60a5fa",
                  }}>
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                    {fmt(tx.amount)}
                  </p>
                  <span style={{
                    ...s.txStatus,
                    background: tx.status === "paid" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
                    color:      tx.status === "paid" ? "#34d399"               : "#fbbf24",
                    border:     `1px solid ${tx.status === "paid" ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.25)"}`,
                  }}>
                    {tx.status === "paid" ? "Pago" : "Pendente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function EmptyState({ emoji, text, sub, cta }: {
  emoji: string; text: string; sub: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{emoji}</div>
      <p style={{ fontWeight: 700, color: "#e2eeff", fontSize: "0.88rem", marginBottom: "0.3rem" }}>{text}</p>
      <p style={{ color: "#5d7aaa", fontSize: "0.78rem", marginBottom: cta ? "1rem" : 0 }}>{sub}</p>
      {cta && (
        <Link href={cta.href} style={{
          display: "inline-flex", padding: "0.5rem 1rem",
          background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff",
          borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700,
          textDecoration: "none",
        }}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1100px" },

  /* header */
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" },
  greeting: {
    fontFamily: "'Bricolage Grotesque',sans-serif",
    fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0,
  },
  subGreeting: { fontSize: "0.82rem", color: "#5d7aaa", marginTop: "0.2rem" },
  newTransactionBtn: {
    padding: "0.65rem 1.25rem",
    background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    color: "#fff", borderRadius: "10px", textDecoration: "none",
    fontWeight: 800, fontSize: "0.85rem",
    boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
  },

  /* balance card */
  balanceCard: {
    borderRadius: "20px", border: "1px solid rgba(59,130,246,0.3)",
    background: "linear-gradient(135deg,rgba(59,130,246,0.12) 0%,#0c1221 60%)",
    padding: "1.75rem 2rem", position: "relative", overflow: "hidden",
    boxShadow: "0 0 0 1px rgba(59,130,246,0.1), 0 8px 40px rgba(29,78,216,0.2)",
  },
  balanceGlow: {
    position: "absolute", top: 0, left: "15%", right: "15%", height: "2px",
    background: "linear-gradient(90deg,transparent,#3b82f6 40%,#22d3ee 60%,transparent)",
  },
  balanceInner: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  balanceLabel: { fontSize: "0.78rem", fontWeight: 700, color: "#5d7aaa", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" },
  balanceValue: {
    fontFamily: "'Bricolage Grotesque',sans-serif",
    fontWeight: 800, fontSize: "2.5rem", letterSpacing: "-0.06em",
    background: "linear-gradient(135deg,#60a5fa,#22d3ee)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    margin: "0 0 0.75rem",
  },
  accountPills: { display: "flex", flexWrap: "wrap", gap: "0.4rem" },
  accountPill: {
    display: "inline-flex", alignItems: "center", gap: "0.35rem",
    fontSize: "0.72rem", fontWeight: 600, color: "#5d7aaa",
    padding: "0.2rem 0.6rem", borderRadius: "999px",
    border: "1px solid", background: "rgba(255,255,255,0.03)",
  },
  accountDot: { width: "6px", height: "6px", borderRadius: "50%" },
  pendingBadge: {
    padding: "0.5rem 1rem", borderRadius: "10px",
    background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
    color: "#fbbf24", fontSize: "0.8rem", fontWeight: 700, alignSelf: "flex-start",
  },

  /* stats row */
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" },
  statCard: {
    background: "#0c1221", border: "1px solid #1a2540",
    borderRadius: "16px", padding: "1.25rem 1.5rem",
    display: "flex", flexDirection: "column", gap: "0.3rem",
  },
  statHeader: { display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" },
  statIcon: { width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" },
  statLabel: { fontSize: "0.75rem", fontWeight: 700, color: "#5d7aaa", textTransform: "uppercase", letterSpacing: "0.04em" },
  statValue: {
    fontFamily: "'Bricolage Grotesque',sans-serif",
    fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.04em",
  },
  statSub: { fontSize: "0.72rem", color: "#5d7aaa" },

  /* row 2 */
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },

  /* cards */
  card: {
    background: "#0c1221", border: "1px solid #1a2540",
    borderRadius: "20px", padding: "1.5rem",
  },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  cardTitle: {
    fontFamily: "'Bricolage Grotesque',sans-serif",
    fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "#e2eeff", margin: 0,
  },
  cardLink: { fontSize: "0.75rem", fontWeight: 700, color: "#3b82f6", textDecoration: "none" },

  /* categories */
  catList: { display: "flex", flexDirection: "column", gap: "0.9rem" },
  catItem: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" },
  catLeft: { display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 },
  catEmoji: { width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 },
  catName: { fontSize: "0.82rem", fontWeight: 700, color: "#e2eeff", margin: 0 },
  catPct:  { fontSize: "0.7rem", color: "#5d7aaa", margin: 0 },
  catRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", minWidth: "90px" },
  catAmount: { fontSize: "0.82rem", fontWeight: 700, color: "#e2eeff", margin: 0 },
  catBarTrack: { width: "80px", height: "3px", background: "#1a2540", borderRadius: "99px", overflow: "hidden" },
  catBar: { height: "100%", borderRadius: "99px", transition: "width 0.5s ease" },

  /* goals */
  goalItem: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  goalHeader: { display: "flex", alignItems: "center", gap: "0.65rem" },
  goalEmoji: { fontSize: "1.3rem", flexShrink: 0 },
  goalName: { fontSize: "0.83rem", fontWeight: 700, color: "#e2eeff", margin: 0 },
  goalSub:  { fontSize: "0.7rem", color: "#5d7aaa", margin: 0 },
  goalPct:  { fontSize: "0.75rem", fontWeight: 800, color: "#60a5fa", marginLeft: "auto" },
  goalBarTrack: { width: "100%", height: "5px", background: "#1a2540", borderRadius: "99px", overflow: "hidden" },
  goalBar: { height: "100%", borderRadius: "99px", transition: "width 0.6s ease" },
  goalRemaining: { fontSize: "0.7rem", color: "#5d7aaa", margin: 0 },
  addGoalBtn: {
    display: "block", textAlign: "center", padding: "0.6rem",
    background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: "10px", fontSize: "0.78rem", fontWeight: 700, color: "#60a5fa",
    textDecoration: "none", marginTop: "0.25rem",
  },

  /* transactions */
  txList: { display: "flex", flexDirection: "column" },
  txItem: {
    display: "flex", alignItems: "center", gap: "0.85rem",
    padding: "0.85rem 0", borderBottom: "1px solid #0f1929",
  },
  txIcon: { width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 },
  txInfo: { flex: 1, minWidth: 0 },
  txDesc: { fontSize: "0.83rem", fontWeight: 700, color: "#e2eeff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  txMeta: { fontSize: "0.7rem", color: "#5d7aaa", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  txRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 },
  txAmount: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "0.9rem", margin: 0 },
  txStatus: { fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "999px" },
};
