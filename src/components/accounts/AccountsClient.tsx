"use client";

import { useState } from "react";

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

const ACCOUNT_TYPES: Record<string, { label: string; emoji: string }> = {
  checking:   { label: "Conta Corrente", emoji: "🏦" },
  savings:    { label: "Poupança",       emoji: "🐷" },
  cash:       { label: "Dinheiro",       emoji: "💵" },
  investment: { label: "Investimento",   emoji: "📈" },
};

const COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#f43f5e","#06b6d4","#6366f1","#ec4899"];
const BANKS  = ["Nubank","Itaú","Bradesco","Santander","C6 Bank","Inter","Caixa","BTG","XP","Carteira"];

interface Account {
  id: string; name: string; type: string; balance: number; color: string;
  _count?: { transactions: number };
}

export default function AccountsClient({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  async function handleSave(data: any) {
    if (editing) {
      const res = await fetch(`/api/accounts/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setAccounts((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...updated } : a));
    } else {
      const res = await fetch("/api/accounts", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const created = await res.json();
      setAccounts((prev) => [...prev, created]);
    }
    setShowModal(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta conta? As transações vinculadas serão desassociadas.")) return;
    setDeleting(id);
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (res.ok) setAccounts((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Contas</h1>
          <p style={s.sub}>Gerencie suas contas bancárias e carteiras</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} style={s.newBtn}>+ Nova conta</button>
      </div>

      {/* Total */}
      <div style={s.totalCard}>
        <div style={s.totalGlow} />
        <p style={s.totalLabel}>Patrimônio total</p>
        <p style={s.totalValue}>{fmt(totalBalance)}</p>
        <p style={s.totalSub}>{accounts.length} conta{accounts.length !== 1 ? "s" : ""} cadastrada{accounts.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Grid de contas */}
      {accounts.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏦</div>
          <p style={{ fontWeight: 700, color: "#e2eeff", marginBottom: "0.4rem" }}>Nenhuma conta cadastrada</p>
          <p style={{ color: "#5d7aaa", fontSize: "0.83rem", marginBottom: "1.25rem" }}>Adicione sua primeira conta para começar!</p>
          <button onClick={() => setShowModal(true)} style={s.newBtn}>+ Nova conta</button>
        </div>
      ) : (
        <div style={s.grid}>
          {accounts.map((acc) => {
            const typeInfo = ACCOUNT_TYPES[acc.type] ?? { label: acc.type, emoji: "💳" };
            const pct = totalBalance > 0 ? (acc.balance / totalBalance) * 100 : 0;
            return (
              <div key={acc.id} style={{ ...s.card, borderColor: acc.color + "44" }}>
                <div style={{ ...s.cardGlow, background: acc.color + "15" }} />

                <div style={s.cardHeader}>
                  <div style={{ ...s.cardIcon, background: acc.color + "22", border: `1px solid ${acc.color}44` }}>
                    {typeInfo.emoji}
                  </div>
                  <div style={s.cardActions}>
                    <button onClick={() => { setEditing(acc); setShowModal(true); }} style={s.actionBtn} title="Editar">✏️</button>
                    <button onClick={() => handleDelete(acc.id)} disabled={deleting === acc.id} style={s.actionBtn} title="Remover">
                      {deleting === acc.id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>

                <div style={s.cardBody}>
                  <p style={s.cardName}>{acc.name}</p>
                  <span style={{ ...s.cardType, color: acc.color, background: acc.color + "18", border: `1px solid ${acc.color}33` }}>
                    {typeInfo.label}
                  </span>
                </div>

                <div style={s.cardBalance}>
                  <span style={s.cardBalanceLabel}>Saldo</span>
                  <span style={{ ...s.cardBalanceValue, color: acc.balance >= 0 ? "#34d399" : "#f87171" }}>
                    {fmt(acc.balance)}
                  </span>
                </div>

                {/* Barra de participação */}
                <div style={s.cardBar}>
                  <div style={{ ...s.cardBarFill, width: `${pct}%`, background: acc.color }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem" }}>
                  <span style={s.cardMeta}>{acc._count?.transactions ?? 0} transações</span>
                  <span style={s.cardMeta}>{pct.toFixed(1)}% do total</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AccountModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function AccountModal({ initial, onClose, onSave }: {
  initial: Account | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [name, setName]       = useState(initial?.name ?? "");
  const [type, setType]       = useState(initial?.type ?? "checking");
  const [balance, setBalance] = useState(initial ? String(Math.round(initial.balance * 100)) : "");
  const [color, setColor]     = useState(initial?.color ?? "#3b82f6");
  const [loading, setLoading] = useState(false);

  function formatAmt(raw: string) {
    const nums = raw.replace(/\D/g, "");
    if (!nums) return "";
    return (parseInt(nums) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const rawNums = balance.replace(/\D/g, "");
    await onSave({ name, type, balance: rawNums ? parseInt(rawNums) / 100 : 0, color });
    setLoading(false);
  }

  return (
    <div style={m.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={m.modal}>
        <div style={m.head}>
          <h2 style={m.title}>{initial ? "Editar conta" : "Nova conta"}</h2>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={m.form}>
          {/* Tipo */}
          <div style={m.field}>
            <label style={m.label}>Tipo de conta</label>
            <div style={m.typeGrid}>
              {Object.entries(ACCOUNT_TYPES).map(([val, info]) => (
                <button key={val} type="button" onClick={() => setType(val)}
                  style={{ ...m.typeBtn, ...(type === val ? { borderColor: color, background: color + "18" } : {}) }}>
                  <span style={{ fontSize: "1.4rem" }}>{info.emoji}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: type === val ? color : "#5d7aaa" }}>{info.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Nome */}
          <div style={m.field}>
            <label style={m.label}>Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank, Carteira..." style={m.input} required />
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.35rem", marginTop: "0.35rem" }}>
              {BANKS.map((b) => (
                <button key={b} type="button" onClick={() => setName(b)}
                  style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", border: "1px solid #1a2540", background: "#080d1a", color: "#5d7aaa", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          {/* Saldo */}
          <div style={m.field}>
            <label style={m.label}>Saldo atual</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.75rem 1rem" }}>
              <span style={{ color: "#5d7aaa", fontWeight: 700, fontSize: "1.1rem" }}>R$</span>
              <input
                type="text" inputMode="numeric"
                value={balance ? formatAmt(balance) : ""}
                onChange={(e) => setBalance(e.target.value.replace(/\D/g, ""))}
                placeholder="0,00"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.03em", color: "#e2eeff" }}
              />
            </div>
          </div>
          {/* Cor */}
          <div style={m.field}>
            <label style={m.label}>Cor</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: "none", cursor: "pointer", transition: "all 0.2s", boxShadow: color === c ? `0 0 0 3px #050810, 0 0 0 5px ${c}` : "none", transform: color === c ? "scale(1.15)" : "scale(1)" }} />
              ))}
            </div>
          </div>
          {/* Preview */}
          <div style={{ padding: "0.85rem 1rem", borderRadius: "12px", background: "#080d1a", border: `1px solid ${color}44`, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontWeight: 700, fontSize: "0.85rem", color: "#e2eeff" }}>
              {ACCOUNT_TYPES[type]?.emoji} {name || "Minha Conta"}
            </span>
            <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#34d399" }}>
              R$ {balance ? (parseInt(balance.replace(/\D/g,"")) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
            </span>
          </div>
          <div style={m.actions}>
            <button type="button" onClick={onClose} style={m.cancelBtn}>Cancelar</button>
            <button type="submit" disabled={loading || !name.trim()} style={{ ...m.saveBtn, opacity: loading || !name.trim() ? 0.7 : 1 }}>
              {loading ? "Salvando..." : initial ? "Salvar alterações" : "Criar conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "900px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  title: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  sub: { fontSize: "0.82rem", color: "#5d7aaa", marginTop: "0.2rem" },
  newBtn: { padding: "0.65rem 1.25rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.85rem", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" },
  totalCard: { borderRadius: "20px", border: "1px solid rgba(59,130,246,0.3)", background: "linear-gradient(135deg,rgba(59,130,246,0.1) 0%,#0c1221 60%)", padding: "1.75rem 2rem", position: "relative", overflow: "hidden" },
  totalGlow: { position: "absolute", top: 0, left: "15%", right: "15%", height: "2px", background: "linear-gradient(90deg,transparent,#3b82f6 40%,#22d3ee 60%,transparent)" },
  totalLabel: { fontSize: "0.75rem", fontWeight: 700, color: "#5d7aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" },
  totalValue: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "2.5rem", letterSpacing: "-0.06em", background: "linear-gradient(135deg,#60a5fa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", margin: "0 0 0.35rem" },
  totalSub: { fontSize: "0.78rem", color: "#5d7aaa", margin: 0 },
  empty: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "20px", padding: "4rem 2rem", textAlign: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1rem" },
  card: { background: "#0c1221", border: "1px solid", borderRadius: "20px", padding: "1.5rem", position: "relative", overflow: "hidden", transition: "transform 0.2s", display: "flex", flexDirection: "column", gap: "0.75rem" },
  cardGlow: { position: "absolute", inset: 0, pointerEvents: "none" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardIcon: { width: "42px", height: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" },
  cardActions: { display: "flex", gap: "0.25rem" },
  actionBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: "0.3rem", borderRadius: "6px", opacity: 0.5 },
  cardBody: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  cardName: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.03em", color: "#e2eeff", margin: 0 },
  cardType: { display: "inline-flex", alignSelf: "flex-start", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px" },
  cardBalance: { display: "flex", flexDirection: "column", gap: "0.15rem" },
  cardBalanceLabel: { fontSize: "0.7rem", fontWeight: 700, color: "#5d7aaa", textTransform: "uppercase", letterSpacing: "0.06em" },
  cardBalanceValue: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.04em" },
  cardBar: { height: "3px", background: "#1a2540", borderRadius: "99px", overflow: "hidden" },
  cardBarFill: { height: "100%", borderRadius: "99px", transition: "width 0.5s ease" },
  cardMeta: { fontSize: "0.68rem", color: "#38506e" },
};

const m: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(5,8,16,0.85)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
  modal: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "24px", padding: "2rem", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  title: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#5d7aaa", fontSize: "1.1rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.45rem" },
  label: { fontSize: "0.78rem", fontWeight: 700, color: "#5d7aaa", letterSpacing: "0.02em" },
  input: { background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.75rem 1rem", color: "#e2eeff", fontSize: "0.88rem", fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none" },
  typeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" },
  typeBtn: { padding: "0.85rem 0.6rem", borderRadius: "12px", border: "1px solid #1a2540", background: "#080d1a", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s" },
  actions: { display: "flex", gap: "0.75rem", marginTop: "0.25rem" },
  cancelBtn: { flex: 1, padding: "0.8rem", background: "transparent", color: "#5d7aaa", border: "1px solid #1a2540", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "0.88rem" },
  saveBtn: { flex: 2, padding: "0.8rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.88rem", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" },
};
