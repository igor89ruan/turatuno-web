"use client";

import { useState } from "react";

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtDay(d: string) { return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); }

const NETWORKS: Record<string, { label: string; color: string }> = {
  visa:       { label: "Visa",       color: "#1a1f71" },
  mastercard: { label: "Mastercard", color: "#eb001b" },
  elo:        { label: "Elo",        color: "#ffcb00" },
  hipercard:  { label: "Hipercard",  color: "#e3001b" },
};

const CARD_COLORS = [
  "#6366f1","#8b5cf6","#3b82f6","#10b981",
  "#f43f5e","#f59e0b","#06b6d4","#ec4899",
];

interface Account { id: string; name: string; color: string; }
interface CreditCard {
  id: string; name: string; limit: number; closingDay: number; dueDay: number;
  color: string; network?: string | null; lastFour?: string | null;
  currentInvoice: number; usagePercent: number; available: number; dueDate: string;
  account?: Account | null;
  _count?: { transactions: number };
}

export default function CreditCardsClient({
  initialCards, accounts,
}: { initialCards: CreditCard[]; accounts: Account[] }) {
  const [cards, setCards] = useState<CreditCard[]>(initialCards);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalLimit   = cards.reduce((s, c) => s + c.limit, 0);
  const totalInvoice = cards.reduce((s, c) => s + c.currentInvoice, 0);

  async function handleSave(data: any) {
    if (editing) {
      const res = await fetch(`/api/credit-cards/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setCards((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...updated } : c));
    } else {
      const res = await fetch("/api/credit-cards", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const created = await res.json();
      setCards((prev) => [...prev, { ...created, currentInvoice: 0, usagePercent: 0, available: created.limit }]);
    }
    setShowModal(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este cartão? As transações vinculadas serão desassociadas.")) return;
    setDeleting(id);
    const res = await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
    if (res.ok) setCards((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Cartões de Crédito</h1>
          <p style={s.sub}>Controle de faturas e limites disponíveis</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} style={s.newBtn}>+ Novo cartão</button>
      </div>

      {/* Resumo */}
      <div style={s.summaryRow}>
        <div style={s.summaryCard}>
          <span style={s.summaryLabel}>💳 Limite total</span>
          <span style={{ ...s.summaryVal, color: "#60a5fa" }}>{fmt(totalLimit)}</span>
        </div>
        <div style={s.summaryCard}>
          <span style={s.summaryLabel}>📄 Fatura total</span>
          <span style={{ ...s.summaryVal, color: "#f87171" }}>{fmt(totalInvoice)}</span>
        </div>
        <div style={s.summaryCard}>
          <span style={s.summaryLabel}>✅ Disponível total</span>
          <span style={{ ...s.summaryVal, color: "#34d399" }}>{fmt(totalLimit - totalInvoice)}</span>
        </div>
      </div>

      {/* Grid de cartões */}
      {cards.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💎</div>
          <p style={{ fontWeight: 700, color: "#e2eeff", marginBottom: "0.4rem" }}>Nenhum cartão cadastrado</p>
          <p style={{ color: "#5d7aaa", fontSize: "0.83rem", marginBottom: "1.25rem" }}>Adicione seus cartões para controlar as faturas!</p>
          <button onClick={() => setShowModal(true)} style={s.newBtn}>+ Novo cartão</button>
        </div>
      ) : (
        <div style={s.grid}>
          {cards.map((card) => {
            const usagePct = card.usagePercent;
            const usageColor = usagePct >= 90 ? "#f87171" : usagePct >= 70 ? "#fbbf24" : "#34d399";
            const networkInfo = card.network ? NETWORKS[card.network] : null;

            return (
              <div key={card.id} style={s.cardWrap}>
                {/* Frente do cartão — visual */}
                <div style={{ ...s.creditCard, background: `linear-gradient(135deg, ${card.color}, ${card.color}aa)` }}>
                  <div style={s.ccShine} />
                  <div style={s.ccTop}>
                    <span style={s.ccName}>{card.name}</span>
                    <div style={s.ccActions}>
                      <button onClick={() => { setEditing(card); setShowModal(true); }} style={s.ccActionBtn}>✏️</button>
                      <button onClick={() => handleDelete(card.id)} disabled={deleting === card.id} style={s.ccActionBtn}>
                        {deleting === card.id ? "..." : "🗑️"}
                      </button>
                    </div>
                  </div>

                  <div style={s.ccChip}>
                    <div style={s.ccChipInner} />
                  </div>

                  <div style={s.ccBottom}>
                    <div>
                      <p style={s.ccNumberLabel}>•••• •••• ••••</p>
                      <p style={s.ccNumber}>{card.lastFour ?? "????"}  </p>
                    </div>
                    {networkInfo && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#fff", opacity: 0.9, letterSpacing: "0.06em" }}>
                        {networkInfo.label.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info abaixo do cartão */}
                <div style={s.cardInfo}>
                  {/* Uso do limite */}
                  <div style={s.usageRow}>
                    <div>
                      <p style={s.usageLabel}>Fatura atual</p>
                      <p style={{ ...s.usageValue, color: "#f87171" }}>{fmt(card.currentInvoice)}</p>
                    </div>
                    <div style={{ textAlign: "right" as const }}>
                      <p style={s.usageLabel}>Disponível</p>
                      <p style={{ ...s.usageValue, color: "#34d399" }}>{fmt(card.available)}</p>
                    </div>
                  </div>

                  {/* Barra de uso */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <span style={{ fontSize: "0.7rem", color: "#5d7aaa", fontWeight: 700 }}>Uso do limite</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: usageColor }}>{usagePct}%</span>
                    </div>
                    <div style={s.limitTrack}>
                      <div style={{ ...s.limitBar, width: `${usagePct}%`, background: usageColor }} />
                    </div>
                    <p style={{ fontSize: "0.68rem", color: "#38506e", marginTop: "0.3rem" }}>
                      Limite: {fmt(card.limit)}
                    </p>
                  </div>

                  {/* Datas */}
                  <div style={s.datesRow}>
                    <div style={s.dateItem}>
                      <span style={s.dateLabel}>✂️ Fechamento</span>
                      <span style={s.dateVal}>dia {card.closingDay}</span>
                    </div>
                    <div style={s.dateDivider} />
                    <div style={s.dateItem}>
                      <span style={s.dateLabel}>📅 Vencimento</span>
                      <span style={s.dateVal}>dia {card.dueDay}</span>
                    </div>
                    <div style={s.dateDivider} />
                    <div style={s.dateItem}>
                      <span style={s.dateLabel}>🧾 Transações</span>
                      <span style={s.dateVal}>{card._count?.transactions ?? 0}</span>
                    </div>
                  </div>

                  {/* Conta vinculada */}
                  {card.account && (
                    <div style={s.linkedAccount}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: card.account.color, flexShrink: 0, display: "inline-block" }} />
                      <span style={{ fontSize: "0.72rem", color: "#5d7aaa" }}>Vinculado a <strong style={{ color: "#e2eeff" }}>{card.account.name}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CardModal
          initial={editing}
          accounts={accounts}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function CardModal({ initial, accounts, onClose, onSave }: {
  initial: CreditCard | null; accounts: Account[];
  onClose: () => void; onSave: (data: any) => Promise<void>;
}) {
  const [name, setName]             = useState(initial?.name ?? "");
  const [limit, setLimit]           = useState(initial ? String(Math.round(initial.limit * 100)) : "");
  const [closingDay, setClosingDay] = useState(initial?.closingDay ?? 1);
  const [dueDay, setDueDay]         = useState(initial?.dueDay ?? 10);
  const [color, setColor]           = useState(initial?.color ?? "#6366f1");
  const [network, setNetwork]       = useState<string>(initial?.network ?? "");
  const [lastFour, setLastFour]     = useState(initial?.lastFour ?? "");
  const [accountId, setAccountId]   = useState(initial?.account?.id ?? "");
  const [loading, setLoading]       = useState(false);

  function formatAmt(raw: string) {
    const nums = raw.replace(/\D/g, "");
    if (!nums) return "";
    return (parseInt(nums) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const rawNums = limit.replace(/\D/g, "");
    await onSave({
      name, closingDay, dueDay, color,
      limit: rawNums ? parseInt(rawNums) / 100 : 0,
      network: network || null,
      lastFour: lastFour.length === 4 ? lastFour : null,
      accountId: accountId || null,
    });
    setLoading(false);
  }

  return (
    <div style={m.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={m.modal}>
        <div style={m.head}>
          <h2 style={m.title}>{initial ? "Editar cartão" : "Novo cartão"}</h2>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>

        {/* Preview do cartão */}
        <div style={{ ...m.previewCard, background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
          <div style={s.ccShine} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff", letterSpacing: "-0.02em" }}>
              {name || "Meu Cartão"}
            </span>
            {network && <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#fff", opacity: 0.9, letterSpacing: "0.06em" }}>{NETWORKS[network]?.label.toUpperCase()}</span>}
          </div>
          <div style={{ marginTop: "auto" }}>
            <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", margin: "0 0 0.1rem" }}>•••• •••• ••••</p>
            <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#fff", letterSpacing: "0.12em", margin: 0 }}>{lastFour || "????"}  </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={m.form}>
          {/* Nome */}
          <div style={m.field}>
            <label style={m.label}>Nome do cartão</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank Roxinho, Itaú Visa..." style={m.input} required />
          </div>

          {/* Limite */}
          <div style={m.field}>
            <label style={m.label}>Limite</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.75rem 1rem" }}>
              <span style={{ color: "#5d7aaa", fontWeight: 700, fontSize: "1.1rem" }}>R$</span>
              <input
                type="text" inputMode="numeric"
                value={limit ? formatAmt(limit) : ""}
                onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
                placeholder="0,00" required
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.03em", color: "#e2eeff" }}
              />
            </div>
          </div>

          {/* Fechamento e vencimento */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={m.field}>
              <label style={m.label}>✂️ Fechamento (dia)</label>
              <input type="number" min={1} max={31} value={closingDay} onChange={(e) => setClosingDay(Number(e.target.value))} style={m.input} />
            </div>
            <div style={m.field}>
              <label style={m.label}>📅 Vencimento (dia)</label>
              <input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} style={m.input} />
            </div>
          </div>

          {/* Bandeira */}
          <div style={m.field}>
            <label style={m.label}>Bandeira</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["", "visa", "mastercard", "elo", "hipercard"] as const).map((n) => (
                <button key={n} type="button" onClick={() => setNetwork(n)}
                  style={{ padding: "0.45rem 0.75rem", borderRadius: "8px", border: `1px solid ${network === n ? "#3b82f6" : "#1a2540"}`, background: network === n ? "rgba(59,130,246,0.15)" : "#080d1a", color: network === n ? "#60a5fa" : "#5d7aaa", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {n === "" ? "Nenhuma" : NETWORKS[n].label}
                </button>
              ))}
            </div>
          </div>

          {/* Últimos 4 dígitos */}
          <div style={m.field}>
            <label style={m.label}>Últimos 4 dígitos (opcional)</label>
            <input
              type="text" inputMode="numeric" maxLength={4}
              value={lastFour} onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234" style={m.input}
            />
          </div>

          {/* Cor */}
          <div style={m.field}>
            <label style={m.label}>Cor do cartão</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
              {CARD_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: "none", cursor: "pointer", transition: "all 0.2s", boxShadow: color === c ? `0 0 0 3px #050810, 0 0 0 5px ${c}` : "none", transform: color === c ? "scale(1.15)" : "scale(1)" }} />
              ))}
            </div>
          </div>

          {/* Conta vinculada */}
          {accounts.length > 0 && (
            <div style={m.field}>
              <label style={m.label}>Conta para pagamento da fatura (opcional)</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={m.select}>
                <option value="">Nenhuma</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={m.actions}>
            <button type="button" onClick={onClose} style={m.cancelBtn}>Cancelar</button>
            <button type="submit" disabled={loading || !name.trim()} style={{ ...m.saveBtn, opacity: loading || !name.trim() ? 0.7 : 1 }}>
              {loading ? "Salvando..." : initial ? "Salvar alterações" : "Criar cartão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1000px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  title: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  sub: { fontSize: "0.82rem", color: "#5d7aaa", marginTop: "0.2rem" },
  newBtn: { padding: "0.65rem 1.25rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.85rem", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" },
  summaryRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" },
  summaryCard: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "14px", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.3rem" },
  summaryLabel: { fontSize: "0.75rem", fontWeight: 700, color: "#5d7aaa", textTransform: "uppercase", letterSpacing: "0.04em" },
  summaryVal: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.04em" },
  empty: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "20px", padding: "4rem 2rem", textAlign: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1.25rem" },
  cardWrap: { display: "flex", flexDirection: "column", gap: "0" },
  creditCard: { borderRadius: "16px 16px 0 0", padding: "1.25rem 1.5rem", minHeight: "160px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
  ccShine: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg,rgba(255,255,255,0.08) 0%,transparent 100%)", pointerEvents: "none" },
  ccTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  ccName: { fontWeight: 800, fontSize: "0.95rem", color: "#fff", letterSpacing: "-0.02em" },
  ccActions: { display: "flex", gap: "0.2rem" },
  ccActionBtn: { background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", fontSize: "0.8rem", padding: "0.2rem 0.35rem", borderRadius: "6px" },
  ccChip: { width: "32px", height: "24px", background: "rgba(255,215,0,0.7)", borderRadius: "5px", marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" },
  ccChipInner: { width: "22px", height: "16px", borderRadius: "3px", border: "1px solid rgba(255,180,0,0.5)", background: "rgba(255,215,0,0.4)" },
  ccBottom: { marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  ccNumberLabel: { fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", margin: "0 0 0.1rem" },
  ccNumber: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#fff", letterSpacing: "0.12em", margin: 0 },
  cardInfo: { background: "#0c1221", border: "1px solid #1a2540", borderTop: "none", borderRadius: "0 0 16px 16px", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" },
  usageRow: { display: "flex", justifyContent: "space-between" },
  usageLabel: { fontSize: "0.7rem", fontWeight: 700, color: "#5d7aaa", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 0.2rem" },
  usageValue: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.03em", margin: 0 },
  limitTrack: { width: "100%", height: "5px", background: "#1a2540", borderRadius: "99px", overflow: "hidden" },
  limitBar: { height: "100%", borderRadius: "99px", transition: "width 0.5s ease" },
  datesRow: { display: "flex", gap: "0" },
  dateItem: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" },
  dateLabel: { fontSize: "0.65rem", color: "#38506e", fontWeight: 600 },
  dateVal: { fontSize: "0.8rem", fontWeight: 800, color: "#e2eeff" },
  dateDivider: { width: "1px", background: "#1a2540", margin: "0 0.25rem" },
  linkedAccount: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "#080d1a", borderRadius: "8px", border: "1px solid #1a2540" },
};

const m: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(5,8,16,0.85)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
  modal: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "24px", padding: "2rem", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  title: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#5d7aaa", fontSize: "1.1rem" },
  previewCard: { borderRadius: "12px", padding: "1.1rem 1.3rem", minHeight: "120px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", marginBottom: "1.5rem", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.45rem" },
  label: { fontSize: "0.78rem", fontWeight: 700, color: "#5d7aaa", letterSpacing: "0.02em" },
  input: { background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.75rem 1rem", color: "#e2eeff", fontSize: "0.88rem", fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none" },
  select: { background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.75rem 1rem", color: "#e2eeff", fontSize: "0.85rem", fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none" },
  actions: { display: "flex", gap: "0.75rem", marginTop: "0.25rem" },
  cancelBtn: { flex: 1, padding: "0.8rem", background: "transparent", color: "#5d7aaa", border: "1px solid #1a2540", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "0.88rem" },
  saveBtn: { flex: 2, padding: "0.8rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.88rem", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" },
};
