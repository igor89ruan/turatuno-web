"use client";

import { useState, useEffect } from "react";

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function monthsLeft(targetDate: string) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(0, diff);
}

const EMOJIS = ["🎯","🏠","🚗","✈️","💎","📚","💻","🎮","🏖️","💍","👶","🐕","🎸","🏋️","🌎","🚀","💰","🎓","🏄","🎨"];

interface Account { id: string; name: string; color: string; }
interface Goal {
  id: string; name: string; emoji: string;
  targetAmount: number; currentAmount: number;
  targetDate: string; status: string;
  account?: Account | null;
}

export default function GoalsClient({
  initialGoals, accounts,
}: { initialGoals: Goal[]; accounts: Account[] }) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [celebrating, setCelebrating] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed" | "paused">("all");

  const active    = goals.filter(g => g.status === "active");
  const completed = goals.filter(g => g.status === "completed");
  const paused    = goals.filter(g => g.status === "paused");

  const totalTarget  = active.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved   = active.reduce((s, g) => s + g.currentAmount, 0);
  const overallPct   = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const filtered = goals.filter(g => filterStatus === "all" || g.status === filterStatus);

  async function handleSave(data: any) {
    if (editing) {
      const res = await fetch(`/api/goals/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setGoals(prev => prev.map(g => g.id === editing.id ? updated : g));
    } else {
      const res = await fetch("/api/goals", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const created = await res.json();
      setGoals(prev => [created, ...prev]);
    }
    setShowModal(false);
    setEditing(null);
  }

  async function handleDeposit(goalId: string, amount: number) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const res = await fetch(`/api/goals/${goalId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deposit: amount }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
    setDepositGoal(null);

    // Celebra se completou!
    if (updated.status === "completed" && goal.status !== "completed") {
      setCelebrating(updated);
    }
  }

  async function handleTogglePause(goal: Goal) {
    const newStatus = goal.status === "paused" ? "active" : "paused";
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setGoals(prev => prev.map(g => g.id === goal.id ? updated : g));
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta meta?")) return;
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) setGoals(prev => prev.filter(g => g.id !== id));
  }

  return (
    <div style={s.root}>

      {/* Celebração 🎉 */}
      {celebrating && (
        <CelebrationModal goal={celebrating} onClose={() => setCelebrating(null)} />
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>🎯 Metas & Sonhos</h1>
          <p style={s.sub}>Transforme seus sonhos em objetivos concretos</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} style={s.newBtn}>
          + Nova meta
        </button>
      </div>

      {/* Resumo geral */}
      <div style={s.overviewCard}>
        <div style={s.overviewGlow} />
        <div style={s.overviewGrid}>
          <div>
            <p style={s.overviewLabel}>Progresso geral</p>
            <p style={s.overviewValue}>{overallPct}%</p>
            <p style={s.overviewSub}>de {fmt(totalTarget)} em metas ativas</p>
          </div>
          <div>
            <p style={s.overviewLabel}>Já guardado</p>
            <p style={{ ...s.overviewValue, color: "#34d399" }}>{fmt(totalSaved)}</p>
            <p style={s.overviewSub}>em {active.length} meta{active.length !== 1 ? "s" : ""} ativa{active.length !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <p style={s.overviewLabel}>Falta guardar</p>
            <p style={{ ...s.overviewValue, color: "#f87171" }}>{fmt(Math.max(0, totalTarget - totalSaved))}</p>
            <p style={s.overviewSub}>{completed.length} meta{completed.length !== 1 ? "s" : ""} concluída{completed.length !== 1 ? "s" : ""} ✅</p>
          </div>
        </div>
        {/* Barra geral */}
        <div style={{ marginTop: "1.25rem" }}>
          <div style={s.overviewBarTrack}>
            <div style={{
              ...s.overviewBarFill,
              width: `${overallPct}%`,
              background: overallPct >= 100
                ? "linear-gradient(90deg,#34d399,#10b981)"
                : "linear-gradient(90deg,#3b82f6,#22d3ee)",
            }} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={s.filters}>
        {(["all","active","completed","paused"] as const).map((f) => {
          const labels = { all: `Todas (${goals.length})`, active: `✅ Ativas (${active.length})`, completed: `🏆 Concluídas (${completed.length})`, paused: `⏸️ Pausadas (${paused.length})` };
          return (
            <button key={f} onClick={() => setFilterStatus(f)}
              style={{ ...s.filterBtn, ...(filterStatus === f ? s.filterBtnActive : {}) }}>
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* Grid de metas */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
          <p style={{ fontWeight: 700, color: "#e2eeff", marginBottom: "0.4rem" }}>
            {filterStatus === "all" ? "Nenhuma meta criada ainda" : `Nenhuma meta ${filterStatus === "completed" ? "concluída" : filterStatus === "paused" ? "pausada" : "ativa"}`}
          </p>
          <p style={{ color: "#5d7aaa", fontSize: "0.83rem", marginBottom: "1.25rem" }}>
            {filterStatus === "all" && "Crie sua primeira meta e comece a realizar seus sonhos!"}
          </p>
          {filterStatus === "all" && (
            <button onClick={() => setShowModal(true)} style={s.newBtn}>+ Criar primeira meta</button>
          )}
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => { setEditing(goal); setShowModal(true); }}
              onDeposit={() => setDepositGoal(goal)}
              onTogglePause={() => handleTogglePause(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {showModal && (
        <GoalModal
          initial={editing}
          accounts={accounts}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {/* Modal de aporte */}
      {depositGoal && (
        <DepositModal
          goal={depositGoal}
          onClose={() => setDepositGoal(null)}
          onDeposit={handleDeposit}
        />
      )}
    </div>
  );
}

// ── GOAL CARD ──────────────────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onDeposit, onTogglePause, onDelete }: {
  goal: Goal;
  onEdit: () => void;
  onDeposit: () => void;
  onTogglePause: () => void;
  onDelete: () => void;
}) {
  const pct = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;
  const remaining  = Math.max(0, goal.targetAmount - goal.currentAmount);
  const months     = monthsLeft(goal.targetDate);
  const monthlySug = months > 0 ? remaining / months : remaining;
  const isCompleted = goal.status === "completed";
  const isPaused    = goal.status === "paused";

  const barColor = isCompleted
    ? "linear-gradient(90deg,#34d399,#10b981)"
    : isPaused
    ? "linear-gradient(90deg,#5d7aaa,#38506e)"
    : pct >= 80
    ? "linear-gradient(90deg,#34d399,#22d3ee)"
    : "linear-gradient(90deg,#3b82f6,#8b5cf6)";

  return (
    <div style={{ ...s.goalCard, opacity: isPaused ? 0.75 : 1 }}>
      {/* Completado badge */}
      {isCompleted && (
        <div style={s.completedBadge}>🏆 Concluída!</div>
      )}
      {isPaused && (
        <div style={s.pausedBadge}>⏸️ Pausada</div>
      )}

      {/* Topo */}
      <div style={s.goalCardTop}>
        <div style={s.goalEmojiBig}>{goal.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={s.goalName}>{goal.name}</p>
          {goal.account && (
            <p style={s.goalAccount}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: goal.account.color, display: "inline-block", marginRight: "0.35rem" }} />
              {goal.account.name}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.2rem", flexShrink: 0 }}>
          <button onClick={onEdit} style={s.cardActionBtn} title="Editar">✏️</button>
          <button onClick={onDelete} style={s.cardActionBtn} title="Remover">🗑️</button>
        </div>
      </div>

      {/* Valores */}
      <div style={s.goalValues}>
        <div>
          <p style={s.goalValLabel}>Guardado</p>
          <p style={{ ...s.goalValNum, color: "#34d399" }}>{fmt(goal.currentAmount)}</p>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <p style={s.goalValLabel}>Meta</p>
          <p style={s.goalValNum}>{fmt(goal.targetAmount)}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
          <span style={{ fontSize: "0.72rem", color: "#5d7aaa", fontWeight: 700 }}>Progresso</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: isCompleted ? "#34d399" : "#60a5fa" }}>{pct.toFixed(0)}%</span>
        </div>
        <div style={s.goalBarTrack}>
          <div style={{ ...s.goalBarFill, width: `${pct}%`, background: barColor }} />
        </div>
      </div>

      {/* Infos */}
      <div style={s.goalMeta}>
        <div style={s.goalMetaItem}>
          <span style={s.goalMetaLabel}>📅 Prazo</span>
          <span style={s.goalMetaVal}>{fmtDate(goal.targetDate)}</span>
        </div>
        {!isCompleted && months > 0 && (
          <div style={s.goalMetaItem}>
            <span style={s.goalMetaLabel}>⏰ Faltam</span>
            <span style={s.goalMetaVal}>{months} {months === 1 ? "mês" : "meses"}</span>
          </div>
        )}
        {!isCompleted && monthlySug > 0 && months > 0 && (
          <div style={{ ...s.goalMetaItem, gridColumn: "1/-1" }}>
            <span style={s.goalMetaLabel}>💡 Aporte sugerido</span>
            <span style={{ ...s.goalMetaVal, color: "#60a5fa" }}>{fmt(monthlySug)}/mês</span>
          </div>
        )}
      </div>

      {/* Ações */}
      {!isCompleted && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={onDeposit} style={s.depositBtn}>
            💰 Registrar aporte
          </button>
          <button onClick={onTogglePause} style={s.pauseBtn} title={isPaused ? "Retomar" : "Pausar"}>
            {isPaused ? "▶️" : "⏸️"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── MODAL DE APORTE ────────────────────────────────────────────────────────

function DepositModal({ goal, onClose, onDeposit }: {
  goal: Goal; onClose: () => void; onDeposit: (id: string, amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const remaining = goal.targetAmount - goal.currentAmount;

  function formatAmt(raw: string) {
    const nums = raw.replace(/\D/g, "");
    if (!nums) return "";
    return (parseInt(nums) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nums = amount.replace(/\D/g, "");
    const val  = nums ? parseInt(nums) / 100 : 0;
    if (!val) return;
    setLoading(true);
    await onDeposit(goal.id, val);
    setLoading(false);
  }

  const pctAfter = goal.targetAmount > 0
    ? Math.min(((goal.currentAmount + (parseInt(amount.replace(/\D/g,"")) / 100 || 0)) / goal.targetAmount) * 100, 100)
    : 0;

  return (
    <div style={m.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={m.modal}>
        <div style={m.head}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.8rem" }}>{goal.emoji}</span>
            <div>
              <h2 style={m.title}>Registrar aporte</h2>
              <p style={{ fontSize: "0.78rem", color: "#5d7aaa", margin: 0 }}>{goal.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>

        {/* Status atual */}
        <div style={{ background: "#080d1a", border: "1px solid #1a2540", borderRadius: "12px", padding: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#5d7aaa", fontWeight: 700 }}>
              {fmt(goal.currentAmount)} / {fmt(goal.targetAmount)}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#60a5fa" }}>
              {((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}% → {pctAfter.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: "6px", background: "#1a2540", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: "99px", width: `${pctAfter}%`, background: "linear-gradient(90deg,#3b82f6,#22d3ee)", transition: "width 0.3s ease" }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={m.label}>Valor do aporte</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#080d1a", border: "1px solid #223058", borderRadius: "14px", padding: "0.85rem 1.25rem", marginTop: "0.4rem" }}>
              <span style={{ color: "#5d7aaa", fontWeight: 700, fontSize: "1.2rem" }}>R$</span>
              <input
                type="text" inputMode="numeric" autoFocus
                value={amount ? formatAmt(amount) : ""}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g,""))}
                placeholder="0,00"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "2rem", letterSpacing: "-0.05em", color: "#e2eeff" }}
              />
            </div>
          </div>

          {/* Sugestões rápidas */}
          <div>
            <p style={{ fontSize: "0.72rem", color: "#5d7aaa", fontWeight: 700, marginBottom: "0.4rem" }}>Sugestões rápidas</p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const }}>
              {[50, 100, 200, 500, Math.round(remaining)].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i).map((val) => (
                <button key={val} type="button"
                  onClick={() => setAmount(String(val * 100))}
                  style={{ padding: "0.35rem 0.75rem", borderRadius: "999px", border: "1px solid #1a2540", background: "#080d1a", color: val === Math.round(remaining) ? "#34d399" : "#5d7aaa", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {val === Math.round(remaining) ? `✅ ${fmt(val)} (completar)` : fmt(val)}
                </button>
              ))}
            </div>
          </div>

          <div style={m.actions}>
            <button type="button" onClick={onClose} style={m.cancelBtn}>Cancelar</button>
            <button type="submit" disabled={loading || !amount} style={{ ...m.saveBtn, opacity: loading || !amount ? 0.7 : 1 }}>
              {loading ? "Salvando..." : "💰 Registrar aporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MODAL CELEBRAÇÃO ───────────────────────────────────────────────────────

function CelebrationModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{ ...m.overlay, zIndex: 200, background: "rgba(5,8,16,0.92)" }}>
      <div style={{ ...m.modal, textAlign: "center", maxWidth: "400px", border: "1px solid rgba(52,211,153,0.4)", boxShadow: "0 0 80px rgba(52,211,153,0.2)" }}>
        <div style={{ fontSize: "4rem", marginBottom: "0.75rem", animation: "bounce 0.6s ease infinite alternate" }}>
          {goal.emoji}
        </div>
        <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }`}</style>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉🏆🎊</div>
        <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.04em", color: "#34d399", marginBottom: "0.5rem" }}>
          Meta concluída!
        </h2>
        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e2eeff", marginBottom: "0.4rem" }}>{goal.name}</p>
        <p style={{ fontSize: "0.85rem", color: "#5d7aaa", marginBottom: "1.5rem" }}>
          Você guardou {fmt(goal.targetAmount)}!<br />
          Parabéns por realizar esse sonho! 🌟
        </p>
        <button onClick={onClose} style={{ ...m.saveBtn, width: "100%" }}>
          🎯 Criar nova meta
        </button>
      </div>
    </div>
  );
}

// ── MODAL CRIAR/EDITAR ─────────────────────────────────────────────────────

function GoalModal({ initial, accounts, onClose, onSave }: {
  initial: Goal | null; accounts: Account[];
  onClose: () => void; onSave: (data: any) => Promise<void>;
}) {
  const [name, setName]               = useState(initial?.name ?? "");
  const [emoji, setEmoji]             = useState(initial?.emoji ?? "🎯");
  const [targetAmount, setTargetAmount] = useState(initial ? String(Math.round(initial.targetAmount * 100)) : "");
  const [currentAmount, setCurrentAmount] = useState(initial ? String(Math.round(initial.currentAmount * 100)) : "");
  const [targetDate, setTargetDate]   = useState(initial?.targetDate?.slice(0,10) ?? "");
  const [accountId, setAccountId]     = useState(initial?.account?.id ?? "");
  const [loading, setLoading]         = useState(false);

  function formatAmt(raw: string) {
    const nums = raw.replace(/\D/g, "");
    if (!nums) return "";
    return (parseInt(nums) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  const targetNum  = targetAmount  ? parseInt(targetAmount.replace(/\D/g,""))  / 100 : 0;
  const currentNum = currentAmount ? parseInt(currentAmount.replace(/\D/g,"")) / 100 : 0;
  const pct = targetNum > 0 ? Math.min((currentNum / targetNum) * 100, 100) : 0;

  const months = targetDate ? monthsLeft(targetDate) : 0;
  const monthlySug = months > 0 && targetNum > currentNum ? (targetNum - currentNum) / months : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSave({
      name, emoji,
      targetAmount:  targetNum,
      currentAmount: currentNum,
      targetDate,
      accountId: accountId || null,
    });
    setLoading(false);
  }

  return (
    <div style={m.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...m.modal, maxWidth: "520px" }}>
        <div style={m.head}>
          <h2 style={m.title}>{initial ? "Editar meta" : "Nova meta"}</h2>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={m.form}>
          {/* Emoji */}
          <div style={m.field}>
            <label style={m.label}>Escolha um emoji para sua meta</label>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.4rem" }}>
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  style={{ width: "38px", height: "38px", borderRadius: "10px", border: `1px solid ${emoji === e ? "rgba(59,130,246,0.5)" : "#1a2540"}`, background: emoji === e ? "rgba(59,130,246,0.15)" : "#080d1a", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", transform: emoji === e ? "scale(1.1)" : "scale(1)" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div style={m.field}>
            <label style={m.label}>Nome da meta</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }}>{emoji}</span>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Viagem para Europa, Novo iPhone..."
                style={{ ...m.input, paddingLeft: "2.75rem" }} required />
            </div>
          </div>

          {/* Valor alvo */}
          <div style={m.field}>
            <label style={m.label}>Quanto você quer guardar?</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.75rem 1rem" }}>
              <span style={{ color: "#5d7aaa", fontWeight: 700, fontSize: "1.1rem" }}>R$</span>
              <input type="text" inputMode="numeric"
                value={targetAmount ? formatAmt(targetAmount) : ""}
                onChange={(e) => setTargetAmount(e.target.value.replace(/\D/g,""))}
                placeholder="0,00"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1.3rem", letterSpacing: "-0.03em", color: "#e2eeff" }}
                required />
            </div>
          </div>

          {/* Já guardou? */}
          <div style={m.field}>
            <label style={m.label}>Já guardou algum valor? (opcional)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.65rem 1rem" }}>
              <span style={{ color: "#5d7aaa", fontWeight: 700 }}>R$</span>
              <input type="text" inputMode="numeric"
                value={currentAmount ? formatAmt(currentAmount) : ""}
                onChange={(e) => setCurrentAmount(e.target.value.replace(/\D/g,""))}
                placeholder="0,00"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#34d399" }} />
            </div>
          </div>

          {/* Prazo */}
          <div style={m.field}>
            <label style={m.label}>Prazo para realizar</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={m.input} required />
          </div>

          {/* Preview / sugestão */}
          {targetNum > 0 && months > 0 && (
            <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: 700 }}>
                  {emoji} {name || "Sua meta"}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: 700 }}>{pct.toFixed(0)}%</span>
              </div>
              <div style={{ height: "4px", background: "#1a2540", borderRadius: "99px", overflow: "hidden", marginBottom: "0.6rem" }}>
                <div style={{ height: "100%", borderRadius: "99px", width: `${pct}%`, background: "linear-gradient(90deg,#3b82f6,#22d3ee)", transition: "width 0.3s" }} />
              </div>
              {monthlySug > 0 && (
                <p style={{ fontSize: "0.78rem", color: "#5d7aaa", margin: 0 }}>
                  💡 Guardando <strong style={{ color: "#60a5fa" }}>{fmt(monthlySug)}/mês</strong> você alcança em <strong style={{ color: "#60a5fa" }}>{months} {months === 1 ? "mês" : "meses"}</strong>
                </p>
              )}
            </div>
          )}

          {/* Conta vinculada */}
          {accounts.length > 0 && (
            <div style={m.field}>
              <label style={m.label}>Conta de destino (opcional)</label>
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
            <button type="submit" disabled={loading || !name.trim() || !targetAmount} style={{ ...m.saveBtn, opacity: loading || !name.trim() || !targetAmount ? 0.7 : 1 }}>
              {loading ? "Salvando..." : initial ? "Salvar alterações" : "🎯 Criar meta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1000px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  title: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  sub: { fontSize: "0.82rem", color: "#5d7aaa", marginTop: "0.2rem" },
  newBtn: { padding: "0.65rem 1.25rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.85rem", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" },
  overviewCard: { borderRadius: "20px", border: "1px solid rgba(59,130,246,0.25)", background: "linear-gradient(135deg,rgba(59,130,246,0.1) 0%,#0c1221 60%)", padding: "1.75rem 2rem", position: "relative", overflow: "hidden" },
  overviewGlow: { position: "absolute", top: 0, left: "15%", right: "15%", height: "2px", background: "linear-gradient(90deg,transparent,#3b82f6 40%,#22d3ee 60%,transparent)" },
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem" },
  overviewLabel: { fontSize: "0.72rem", fontWeight: 700, color: "#5d7aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" },
  overviewValue: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.7rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  overviewSub: { fontSize: "0.72rem", color: "#5d7aaa", marginTop: "0.25rem" },
  overviewBarTrack: { height: "6px", background: "#1a2540", borderRadius: "99px", overflow: "hidden" },
  overviewBarFill: { height: "100%", borderRadius: "99px", transition: "width 0.5s ease" },
  filters: { display: "flex", gap: "0.4rem", flexWrap: "wrap" as const, background: "#0c1221", border: "1px solid #1a2540", borderRadius: "12px", padding: "0.3rem", alignSelf: "flex-start" },
  filterBtn: { padding: "0.4rem 0.9rem", borderRadius: "8px", border: "none", background: "transparent", color: "#5d7aaa", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s" },
  filterBtnActive: { background: "rgba(59,130,246,0.2)", color: "#60a5fa" },
  empty: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "20px", padding: "4rem 2rem", textAlign: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" },
  goalCard: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "20px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", position: "relative", transition: "transform 0.2s" },
  completedBadge: { position: "absolute", top: "1rem", right: "1rem", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" },
  pausedBadge: { position: "absolute", top: "1rem", right: "1rem", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(93,122,170,0.15)", border: "1px solid rgba(93,122,170,0.3)", color: "#5d7aaa" },
  goalCardTop: { display: "flex", alignItems: "flex-start", gap: "0.75rem" },
  goalEmojiBig: { fontSize: "1.8rem", flexShrink: 0, lineHeight: 1 },
  goalName: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "#e2eeff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  goalAccount: { fontSize: "0.7rem", color: "#5d7aaa", margin: "0.2rem 0 0", display: "flex", alignItems: "center" },
  cardActionBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: "0.25rem", borderRadius: "6px", opacity: 0.5 },
  goalValues: { display: "flex", justifyContent: "space-between" },
  goalValLabel: { fontSize: "0.68rem", fontWeight: 700, color: "#5d7aaa", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 0.2rem" },
  goalValNum: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.03em", color: "#e2eeff", margin: 0 },
  goalBarTrack: { height: "6px", background: "#1a2540", borderRadius: "99px", overflow: "hidden" },
  goalBarFill: { height: "100%", borderRadius: "99px", transition: "width 0.5s ease" },
  goalMeta: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" },
  goalMetaItem: { display: "flex", flexDirection: "column", gap: "0.15rem" },
  goalMetaLabel: { fontSize: "0.65rem", fontWeight: 700, color: "#38506e" },
  goalMetaVal: { fontSize: "0.8rem", fontWeight: 700, color: "#e2eeff" },
  depositBtn: { flex: 1, padding: "0.6rem", background: "linear-gradient(135deg,rgba(52,211,153,0.15),rgba(52,211,153,0.08))", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "10px", color: "#34d399", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" },
  pauseBtn: { padding: "0.6rem 0.8rem", background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", cursor: "pointer", fontSize: "0.9rem" },
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
  select: { background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.75rem 1rem", color: "#e2eeff", fontSize: "0.85rem", fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none" },
  actions: { display: "flex", gap: "0.75rem", marginTop: "0.25rem" },
  cancelBtn: { flex: 1, padding: "0.8rem", background: "transparent", color: "#5d7aaa", border: "1px solid #1a2540", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "0.88rem" },
  saveBtn: { flex: 2, padding: "0.8rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.88rem", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" },
};
