"use client";

import { useState, useMemo } from "react";

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

interface Category { id: string; name: string; icon: string; colorHex: string; type: string; }
interface Account  { id: string; name: string; type: string; color: string; balance: number; }
interface CreditCard { id: string; name: string; lastFour?: string; }
interface Transaction {
  id: string; type: string; amount: number; description: string;
  date: string; status: string;
  category?: Category; account?: Account; creditCard?: CreditCard;
}

interface Props {
  initialTransactions: Transaction[];
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  income:   { label: "Receita",    color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  expense:  { label: "Despesa",    color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  transfer: { label: "Transferência", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
};

export default function TransactionsClient({ initialTransactions, accounts, creditCards, categories }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filtros
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (filterStatus !== "all" && tx.status !== filterStatus) return false;
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filterType, filterStatus, search]);

  async function handleNewTransaction(data: any) {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const tx = await res.json();
    setTransactions((prev) => [tx, ...prev]);
    setShowModal(false);
  }

  async function handleToggleStatus(tx: Transaction) {
    const newStatus = tx.status === "paid" ? "pending" : "paid";
    const res = await fetch(`/api/transactions/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? updated : t)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta transação?")) return;
    setDeleting(id);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) setTransactions((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  }

  // Totais do filtro atual
  const totalIncome  = filtered.filter(t => t.type === "income" ).reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div style={s.root}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Transações</h1>
          <p style={s.sub}>Controle de todos os seus lançamentos</p>
        </div>
        <button onClick={() => setShowModal(true)} style={s.newBtn}>+ Nova transação</button>
      </div>

      {/* Resumo rápido */}
      <div style={s.summaryRow}>
        <div style={s.summaryCard}>
          <span style={s.summaryLabel}>📈 Receitas</span>
          <span style={{ ...s.summaryVal, color: "#34d399" }}>{fmt(totalIncome)}</span>
        </div>
        <div style={s.summaryCard}>
          <span style={s.summaryLabel}>📉 Despesas</span>
          <span style={{ ...s.summaryVal, color: "#f87171" }}>{fmt(totalExpense)}</span>
        </div>
        <div style={s.summaryCard}>
          <span style={s.summaryLabel}>💰 Saldo</span>
          <span style={{ ...s.summaryVal, color: totalIncome - totalExpense >= 0 ? "#34d399" : "#f87171" }}>
            {fmt(totalIncome - totalExpense)}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div style={s.filtersRow}>
        <input
          type="text"
          placeholder="🔍 Buscar transação..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={s.searchInput}
        />
        <div style={s.filterGroup}>
          {["all", "income", "expense", "transfer"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{ ...s.filterBtn, ...(filterType === t ? s.filterBtnActive : {}) }}
            >
              {t === "all" ? "Todos" : TYPE_LABELS[t].label}
            </button>
          ))}
        </div>
        <div style={s.filterGroup}>
          {["all", "paid", "pending"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{ ...s.filterBtn, ...(filterStatus === st ? s.filterBtnActive : {}) }}
            >
              {st === "all" ? "Todos status" : st === "paid" ? "✅ Pago" : "⏳ Pendente"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div style={s.listCard}>
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>💳</div>
            <p style={{ fontWeight: 700, color: "#e2eeff", marginBottom: "0.3rem" }}>Nenhuma transação encontrada</p>
            <p style={{ color: "#5d7aaa", fontSize: "0.82rem" }}>Tente mudar os filtros ou adicione uma nova</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho da tabela */}
            <div style={s.tableHead}>
              <span style={{ flex: 2 }}>Descrição</span>
              <span style={{ flex: 1 }}>Categoria</span>
              <span style={{ flex: 1 }}>Conta</span>
              <span style={{ flex: 1 }}>Data</span>
              <span style={{ flex: 1, textAlign: "right" as const }}>Valor</span>
              <span style={{ width: "100px", textAlign: "center" as const }}>Status</span>
              <span style={{ width: "60px" }} />
            </div>

            {filtered.map((tx) => {
              const typeStyle = TYPE_LABELS[tx.type] ?? TYPE_LABELS.expense;
              return (
                <div key={tx.id} style={s.txRow}>
                  {/* Descrição */}
                  <div style={{ flex: 2, display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem",
                      background: tx.category ? tx.category.colorHex + "22" : typeStyle.bg,
                      border: `1px solid ${tx.category?.colorHex ?? "#3b82f6"}33`,
                    }}>
                      {tx.category?.icon ?? (tx.type === "income" ? "📈" : tx.type === "expense" ? "📉" : "🔄")}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={s.txDesc}>{tx.description}</p>
                      <p style={s.txType}>
                        <span style={{ color: typeStyle.color, fontWeight: 700 }}>{typeStyle.label}</span>
                      </p>
                    </div>
                  </div>

                  {/* Categoria */}
                  <div style={{ flex: 1 }}>
                    {tx.category ? (
                      <span style={{
                        ...s.chip,
                        background: tx.category.colorHex + "18",
                        border: `1px solid ${tx.category.colorHex}33`,
                        color: tx.category.colorHex,
                      }}>
                        {tx.category.icon} {tx.category.name}
                      </span>
                    ) : (
                      <span style={{ color: "#38506e", fontSize: "0.75rem" }}>—</span>
                    )}
                  </div>

                  {/* Conta */}
                  <div style={{ flex: 1 }}>
                    {tx.account ? (
                      <span style={{ fontSize: "0.78rem", color: "#5d7aaa", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: tx.account.color, flexShrink: 0, display: "inline-block" }} />
                        {tx.account.name}
                      </span>
                    ) : tx.creditCard ? (
                      <span style={{ fontSize: "0.78rem", color: "#5d7aaa" }}>💎 {tx.creditCard.name}</span>
                    ) : (
                      <span style={{ color: "#38506e", fontSize: "0.75rem" }}>—</span>
                    )}
                  </div>

                  {/* Data */}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.78rem", color: "#5d7aaa" }}>{fmtDate(tx.date)}</span>
                  </div>

                  {/* Valor */}
                  <div style={{ flex: 1, textAlign: "right" as const }}>
                    <span style={{
                      fontFamily: "'Bricolage Grotesque',sans-serif",
                      fontWeight: 700, fontSize: "0.92rem",
                      color: tx.type === "income" ? "#34d399" : tx.type === "expense" ? "#f87171" : "#60a5fa",
                    }}>
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "−" : ""}{fmt(tx.amount)}
                    </span>
                  </div>

                  {/* Status */}
                  <div style={{ width: "100px", display: "flex", justifyContent: "center" }}>
                    <button
                      onClick={() => handleToggleStatus(tx)}
                      style={{
                        ...s.statusBtn,
                        background: tx.status === "paid" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
                        color:      tx.status === "paid" ? "#34d399"               : "#fbbf24",
                        border:     `1px solid ${tx.status === "paid" ? "rgba(52,211,153,0.3)" : "rgba(251,191,36,0.3)"}`,
                      }}
                    >
                      {tx.status === "paid" ? "✅ Pago" : "⏳ Pendente"}
                    </button>
                  </div>

                  {/* Ações */}
                  <div style={{ width: "60px", display: "flex", justifyContent: "center" }}>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={deleting === tx.id}
                      style={s.deleteBtn}
                      title="Remover"
                    >
                      {deleting === tx.id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TransactionModal
          accounts={accounts}
          creditCards={creditCards}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={handleNewTransaction}
        />
      )}
    </div>
  );
}

// ── MODAL DE NOVA TRANSAÇÃO ──────────────────────────────────────────────────

function TransactionModal({ accounts, creditCards, categories, onClose, onSave }: {
  accounts: Account[]; creditCards: CreditCard[]; categories: Category[];
  onClose: () => void; onSave: (data: any) => Promise<void>;
}) {
  const [type, setType]               = useState<"income"|"expense"|"transfer">("expense");
  const [amount, setAmount]           = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate]               = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus]           = useState<"paid"|"pending">("paid");
  const [categoryId, setCategoryId]   = useState<string | null>(null);
  const [accountId, setAccountId]     = useState<string | null>(accounts[0]?.id ?? null);
  const [creditCardId, setCreditCardId] = useState<string | null>(null);
  const [payWith, setPayWith]         = useState<"account"|"card">("account");
  const [catSearch, setCatSearch]     = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const filteredCats = categories.filter(
    (c) => c.type === type && c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  function formatAmt(val: string) {
    const nums = val.replace(/\D/g, "");
    if (!nums) return "";
    const n = parseInt(nums) / 100;
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseAmt(val: string) {
    return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsedAmount = parseAmt(amount);
    if (!parsedAmount) { setError("Informe um valor válido."); return; }
    if (!description.trim()) { setError("Informe uma descrição."); return; }
    setLoading(true);
    await onSave({
      type, amount: parsedAmount, description, date, status,
      categoryId: categoryId || null,
      accountId:  payWith === "account" ? accountId : null,
      creditCardId: payWith === "card" ? creditCardId : null,
    });
    setLoading(false);
  }

  return (
    <div style={m.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={m.modal}>

        {/* Header */}
        <div style={m.modalHead}>
          <h2 style={m.modalTitle}>Nova transação</h2>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>

        {error && <div style={m.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={m.form}>

          {/* Tipo */}
          <div style={m.typeToggle}>
            {(["expense","income","transfer"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategoryId(null); }}
                style={{
                  ...m.typeBtn,
                  ...(type === t ? {
                    background: t === "income" ? "rgba(52,211,153,0.2)" : t === "expense" ? "rgba(248,113,113,0.2)" : "rgba(96,165,250,0.2)",
                    border: `1px solid ${t === "income" ? "rgba(52,211,153,0.5)" : t === "expense" ? "rgba(248,113,113,0.5)" : "rgba(96,165,250,0.5)"}`,
                    color: t === "income" ? "#34d399" : t === "expense" ? "#f87171" : "#60a5fa",
                  } : {}),
                }}
              >
                {t === "expense" ? "📉 Despesa" : t === "income" ? "📈 Receita" : "🔄 Transferência"}
              </button>
            ))}
          </div>

          {/* Valor grande */}
          <div style={m.amountWrap}>
            <span style={m.amountPrefix}>R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatAmt(e.target.value))}
              placeholder="0,00"
              style={m.amountInput}
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div style={m.field}>
            <label style={m.label}>Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Almoço, Salário, Uber..."
              style={m.input}
              required
            />
          </div>

          {/* Categorias — grid colorido */}
          {type !== "transfer" && (
            <div style={m.field}>
              <label style={m.label}>Categoria</label>
              <input
                type="text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="🔍 Buscar categoria..."
                style={{ ...m.input, marginBottom: "0.6rem" }}
              />
              <div style={m.catGrid}>
                {filteredCats.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                    style={{
                      ...m.catBtn,
                      background: categoryId === cat.id ? cat.colorHex + "30" : cat.colorHex + "12",
                      border: `1px solid ${categoryId === cat.id ? cat.colorHex + "80" : cat.colorHex + "30"}`,
                      boxShadow: categoryId === cat.id ? `0 0 0 2px ${cat.colorHex}30` : "none",
                      transform: categoryId === cat.id ? "scale(1.04)" : "scale(1)",
                    }}
                  >
                    <span style={{
                      ...m.catBtnEmoji,
                      background: cat.colorHex + "25",
                      boxShadow: `0 2px 8px ${cat.colorHex}40`,
                    }}>
                      {cat.icon}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: categoryId === cat.id ? cat.colorHex : "#5d7aaa", fontWeight: 700 }}>
                      {cat.name}
                    </span>
                  </button>
                ))}
                {filteredCats.length === 0 && (
                  <p style={{ color: "#38506e", fontSize: "0.78rem", gridColumn: "1/-1", padding: "0.5rem 0" }}>
                    Nenhuma categoria encontrada
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Data e Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={m.field}>
              <label style={m.label}>Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={m.input} />
            </div>
            <div style={m.field}>
              <label style={m.label}>Status</label>
              <div style={m.statusToggle}>
                <button
                  type="button"
                  onClick={() => setStatus("paid")}
                  style={{ ...m.statusBtn, ...(status === "paid" ? m.statusBtnPaid : {}) }}
                >
                  ✅ Pago
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("pending")}
                  style={{ ...m.statusBtn, ...(status === "pending" ? m.statusBtnPending : {}) }}
                >
                  ⏳ Pendente
                </button>
              </div>
            </div>
          </div>

          {/* Conta ou Cartão */}
          <div style={m.field}>
            <label style={m.label}>Pagar com</label>
            <div style={m.payToggle}>
              <button type="button" onClick={() => setPayWith("account")} style={{ ...m.payBtn, ...(payWith === "account" ? m.payBtnActive : {}) }}>
                🏦 Conta
              </button>
              <button type="button" onClick={() => setPayWith("card")} style={{ ...m.payBtn, ...(payWith === "card" ? m.payBtnActive : {}) }}>
                💳 Cartão
              </button>
            </div>

            {payWith === "account" ? (
              <select value={accountId ?? ""} onChange={(e) => setAccountId(e.target.value)} style={m.select}>
                <option value="">Selecionar conta...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name} — {fmt(acc.balance)}</option>
                ))}
              </select>
            ) : (
              <select value={creditCardId ?? ""} onChange={(e) => setCreditCardId(e.target.value)} style={m.select}>
                <option value="">Selecionar cartão...</option>
                {creditCards.map((cc) => (
                  <option key={cc.id} value={cc.id}>{cc.name}{cc.lastFour ? ` •••• ${cc.lastFour}` : ""}</option>
                ))}
              </select>
            )}
          </div>

          {/* Botões */}
          <div style={m.actions}>
            <button type="button" onClick={onClose} style={m.cancelBtn}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ ...m.saveBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Salvando..." : "Salvar transação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1200px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  title: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  sub: { fontSize: "0.82rem", color: "#5d7aaa", marginTop: "0.2rem" },
  newBtn: {
    padding: "0.65rem 1.25rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.85rem",
    boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
  },
  summaryRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" },
  summaryCard: {
    background: "#0c1221", border: "1px solid #1a2540", borderRadius: "14px",
    padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.3rem",
  },
  summaryLabel: { fontSize: "0.75rem", fontWeight: 700, color: "#5d7aaa", textTransform: "uppercase", letterSpacing: "0.04em" },
  summaryVal: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.04em" },
  filtersRow: { display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" },
  searchInput: {
    flex: 1, minWidth: "200px", background: "#0c1221", border: "1px solid #1a2540",
    borderRadius: "10px", padding: "0.65rem 1rem", color: "#e2eeff",
    fontSize: "0.83rem", fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none",
  },
  filterGroup: { display: "flex", gap: "0.35rem", background: "#0c1221", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.3rem" },
  filterBtn: {
    padding: "0.35rem 0.85rem", borderRadius: "7px", border: "none",
    background: "transparent", color: "#5d7aaa", fontSize: "0.78rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s",
  },
  filterBtnActive: { background: "rgba(59,130,246,0.2)", color: "#60a5fa" },
  listCard: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "20px", overflow: "hidden" },
  tableHead: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    padding: "0.75rem 1.25rem", borderBottom: "1px solid #1a2540",
    fontSize: "0.7rem", fontWeight: 700, color: "#38506e", textTransform: "uppercase", letterSpacing: "0.06em",
  },
  txRow: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    padding: "0.9rem 1.25rem", borderBottom: "1px solid #0f1929",
    transition: "background 0.1s",
  },
  txDesc: { fontSize: "0.83rem", fontWeight: 700, color: "#e2eeff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  txType: { fontSize: "0.7rem", margin: 0, marginTop: "0.1rem" },
  chip: { display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "999px" },
  statusBtn: { padding: "0.28rem 0.65rem", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "0.3rem", borderRadius: "6px", opacity: 0.5 },
  empty: { padding: "3rem", textAlign: "center" },
};

const m: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(5,8,16,0.85)",
    backdropFilter: "blur(8px)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
  },
  modal: {
    background: "#0c1221", border: "1px solid #1a2540", borderRadius: "24px",
    padding: "2rem", width: "100%", maxWidth: "520px",
    maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
    position: "relative",
  },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  modalTitle: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#5d7aaa", fontSize: "1.1rem", padding: "0.25rem", borderRadius: "6px" },
  error: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: "10px", padding: "0.75rem 1rem",
    fontSize: "0.83rem", color: "#fca5a5", marginBottom: "1.25rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  typeToggle: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" },
  typeBtn: {
    padding: "0.65rem", borderRadius: "10px", border: "1px solid #1a2540",
    background: "#080d1a", color: "#5d7aaa", fontSize: "0.78rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s",
  },
  amountWrap: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    background: "#080d1a", border: "1px solid #223058",
    borderRadius: "14px", padding: "0.75rem 1.25rem",
  },
  amountPrefix: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#5d7aaa" },
  amountInput: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800,
    fontSize: "2rem", letterSpacing: "-0.05em", color: "#e2eeff",
  },
  field: { display: "flex", flexDirection: "column", gap: "0.45rem" },
  label: { fontSize: "0.78rem", fontWeight: 700, color: "#5d7aaa", letterSpacing: "0.02em" },
  input: {
    background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px",
    padding: "0.7rem 1rem", color: "#e2eeff", fontSize: "0.88rem",
    fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none",
  },
  catGrid: {
    display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.5rem",
    maxHeight: "220px", overflowY: "auto", paddingRight: "0.25rem",
  },
  catBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem",
    padding: "0.6rem 0.4rem", borderRadius: "12px", cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s",
  },
  catBtnEmoji: {
    width: "32px", height: "32px", borderRadius: "9px",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
  },
  statusToggle: { display: "flex", gap: "0.4rem", background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.25rem" },
  statusBtn: {
    flex: 1, padding: "0.45rem", borderRadius: "7px", border: "none", cursor: "pointer",
    fontSize: "0.75rem", fontWeight: 700, background: "transparent", color: "#5d7aaa",
    fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s",
  },
  statusBtnPaid: { background: "rgba(52,211,153,0.15)", color: "#34d399" },
  statusBtnPending: { background: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  payToggle: { display: "flex", gap: "0.4rem", background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.25rem", marginBottom: "0.5rem" },
  payBtn: {
    flex: 1, padding: "0.45rem", borderRadius: "7px", border: "none", cursor: "pointer",
    fontSize: "0.78rem", fontWeight: 700, background: "transparent", color: "#5d7aaa",
    fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s",
  },
  payBtnActive: { background: "rgba(59,130,246,0.18)", color: "#60a5fa" },
  select: {
    background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px",
    padding: "0.7rem 1rem", color: "#e2eeff", fontSize: "0.85rem",
    fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none", width: "100%",
  },
  actions: { display: "flex", gap: "0.75rem", marginTop: "0.25rem" },
  cancelBtn: {
    flex: 1, padding: "0.8rem", background: "transparent", color: "#5d7aaa",
    border: "1px solid #1a2540", borderRadius: "10px", cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "0.88rem",
  },
  saveBtn: {
    flex: 2, padding: "0.8rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.88rem",
    boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
  },
};
