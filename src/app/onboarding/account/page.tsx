"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ACCOUNT_TYPES = [
  { value: "checking", emoji: "🏦", label: "Conta Corrente", desc: "Nubank, C6, BB..." },
  { value: "savings",  emoji: "🐷", label: "Poupança",       desc: "Reserva de emergência" },
  { value: "cash",     emoji: "💵", label: "Dinheiro",       desc: "Dinheiro físico" },
  { value: "investment",emoji: "📈",label: "Investimento",   desc: "Corretora, CDB..." },
];

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#f43f5e", "#06b6d4", "#6366f1", "#ec4899",
];

const BANK_SUGGESTIONS = [
  "Nubank", "Itaú", "Bradesco", "Santander",
  "C6 Bank", "Inter", "Caixa", "BTG", "XP",
];

export default function OnboardingAccountPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function formatBalance(val: string) {
    const numbers = val.replace(/\D/g, "");
    const amount = (parseInt(numbers || "0") / 100).toFixed(2);
    return amount.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function handleBalanceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    setBalance(raw);
  }

  function getBalanceFloat() {
    return parseFloat((parseInt(balance || "0") / 100).toFixed(2));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/onboarding/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        balance: getBalanceFloat(),
        color,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erro ao criar conta.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const displayBalance = balance
    ? `R$ ${formatBalance(balance)}`
    : "R$ 0,00";

  return (
    <div style={s.root}>
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.grid} />

      <div style={s.wrap}>
        <div style={s.logo}>TuraTuno</div>

        {/* Progress */}
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressBar, width: "100%" }} />
          </div>
          <span style={s.progressLabel}>Passo 2 de 2 — Quase lá! 🎉</span>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.stepBadge}>🏦 Primeira conta</div>
            <h1 style={s.title}>Adicione sua conta principal</h1>
            <p style={s.subtitle}>
              Pode adicionar mais contas depois. Por agora, só a principal já está ótimo!
            </p>
          </div>

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>

            {/* Tipo de conta */}
            <div style={s.field}>
              <label style={s.label}>Tipo de conta</label>
              <div style={s.typeGrid}>
                {ACCOUNT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    style={{
                      ...s.typeCard,
                      ...(type === t.value ? s.typeCardActive : {}),
                    }}
                  >
                    <span style={s.typeEmoji}>{t.emoji}</span>
                    <span style={s.typeLabel}>{t.label}</span>
                    <span style={s.typeDesc}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nome da conta */}
            <div style={s.field}>
              <label style={s.label}>Nome da conta</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Nubank, Carteira, Poupança..."
                style={s.input}
                required
                maxLength={80}
              />
              {/* Sugestões rápidas */}
              <div style={s.suggestions}>
                {BANK_SUGGESTIONS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setName(b)}
                    style={s.suggestionChip}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Saldo inicial */}
            <div style={s.field}>
              <label style={s.label}>Saldo atual</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={balance ? `R$ ${formatBalance(balance)}` : ""}
                  onChange={handleBalanceChange}
                  placeholder="R$ 0,00"
                  style={{ ...s.input, fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em" }}
                />
              </div>
              <span style={s.hint}>
                💡 Coloque o saldo que você tem agora. Pode ser R$ 0,00 também!
              </span>
            </div>

            {/* Cor */}
            <div style={s.field}>
              <label style={s.label}>Cor da conta</label>
              <div style={s.colorGrid}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      ...s.colorBtn,
                      background: c,
                      boxShadow: color === c
                        ? `0 0 0 3px #050810, 0 0 0 5px ${c}`
                        : "none",
                      transform: color === c ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Preview da conta */}
            <div style={{ ...s.preview, borderColor: color + "44" }}>
              <div style={{ ...s.previewDot, background: color }} />
              <div style={s.previewInfo}>
                <span style={s.previewName}>
                  {ACCOUNT_TYPES.find(t => t.value === type)?.emoji}{" "}
                  {name || "Minha Conta"}
                </span>
                <span style={s.previewBalance}>{displayBalance}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                ...s.btnPrimary,
                opacity: loading || !name.trim() ? 0.6 : 1,
              }}
            >
              {loading ? "Criando..." : "Entrar no dashboard 🚀"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              style={s.skipBtn}
            >
              Pular por agora
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh", background: "#050810",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "2rem 1.5rem", position: "relative", overflow: "hidden",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  orb1: {
    position: "fixed", width: "700px", height: "700px", borderRadius: "50%",
    top: "-250px", left: "50%", transform: "translateX(-50%)",
    background: "radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%)",
    filter: "blur(90px)", pointerEvents: "none",
  },
  orb2: {
    position: "fixed", width: "400px", height: "400px", borderRadius: "50%",
    bottom: "-150px", left: "-80px",
    background: "radial-gradient(circle, rgba(37,211,102,0.1) 0%, transparent 70%)",
    filter: "blur(80px)", pointerEvents: "none",
  },
  grid: {
    position: "fixed", inset: 0,
    backgroundImage: "linear-gradient(rgba(59,130,246,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.035) 1px,transparent 1px)",
    backgroundSize: "52px 52px",
    maskImage: "radial-gradient(ellipse 100% 50% at 50% 0%,black 20%,transparent 100%)",
    pointerEvents: "none",
  },
  wrap: {
    position: "relative", zIndex: 1, width: "100%", maxWidth: "480px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem",
  },
  logo: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.04em",
    background: "linear-gradient(135deg, #60a5fa, #22d3ee)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  progressWrap: { width: "100%", display: "flex", flexDirection: "column", gap: "0.4rem" },
  progressTrack: { width: "100%", height: "4px", background: "#1a2540", borderRadius: "99px", overflow: "hidden" },
  progressBar: {
    height: "100%", borderRadius: "99px",
    background: "linear-gradient(90deg, #3b82f6, #22d3ee)", transition: "width 0.4s ease",
  },
  progressLabel: { fontSize: "0.72rem", color: "#5d7aaa", fontWeight: 600, textAlign: "right" as const },
  card: {
    width: "100%", background: "#0c1221",
    border: "1px solid #1a2540", borderRadius: "24px", padding: "2rem 1.75rem",
    boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
  },
  cardHeader: { marginBottom: "1.75rem" },
  stepBadge: {
    display: "inline-flex", alignItems: "center", gap: "0.35rem",
    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const,
    padding: "0.25rem 0.7rem", borderRadius: "999px",
    background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)",
    color: "#60a5fa", marginBottom: "0.75rem",
  },
  title: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.04em",
    color: "#e2eeff", marginBottom: "0.4rem",
  },
  subtitle: { fontSize: "0.83rem", color: "#5d7aaa", lineHeight: 1.6 },
  errorBox: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: "10px", padding: "0.75rem 1rem",
    fontSize: "0.83rem", color: "#fca5a5", marginBottom: "1.25rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: { fontSize: "0.78rem", fontWeight: 700, color: "#5d7aaa", letterSpacing: "0.02em" },
  input: {
    width: "100%", background: "#080d1a",
    border: "1px solid #1a2540", borderRadius: "10px",
    padding: "0.75rem 1rem", color: "#e2eeff",
    fontSize: "0.88rem", fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: "none", boxSizing: "border-box" as const,
  },
  suggestions: { display: "flex", flexWrap: "wrap" as const, gap: "0.4rem" },
  suggestionChip: {
    padding: "0.25rem 0.65rem", borderRadius: "999px",
    border: "1px solid #1a2540", background: "#080d1a",
    color: "#5d7aaa", fontSize: "0.72rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: "all 0.15s",
  },
  hint: { fontSize: "0.72rem", color: "#5d7aaa", lineHeight: 1.5 },
  typeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" },
  typeCard: {
    padding: "0.85rem 0.6rem", borderRadius: "12px", border: "1px solid #1a2540",
    background: "#080d1a", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
    transition: "all 0.15s", fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  typeCardActive: {
    border: "1px solid rgba(59,130,246,0.4)",
    background: "rgba(59,130,246,0.08)",
    boxShadow: "0 0 0 1px rgba(59,130,246,0.15)",
  },
  typeEmoji: { fontSize: "1.3rem" },
  typeLabel: { fontSize: "0.78rem", fontWeight: 700, color: "#e2eeff" },
  typeDesc:  { fontSize: "0.66rem", color: "#5d7aaa" },
  colorGrid: { display: "flex", gap: "0.6rem", flexWrap: "wrap" as const },
  colorBtn: {
    width: "28px", height: "28px", borderRadius: "50%",
    border: "none", cursor: "pointer", transition: "all 0.2s",
  },
  preview: {
    display: "flex", alignItems: "center", gap: "0.85rem",
    background: "#080d1a", border: "1px solid",
    borderRadius: "12px", padding: "0.9rem 1rem",
  },
  previewDot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  previewInfo: { display: "flex", flexDirection: "column", gap: "0.15rem", flex: 1 },
  previewName: { fontSize: "0.83rem", fontWeight: 700, color: "#e2eeff" },
  previewBalance: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.03em", color: "#34d399",
  },
  btnPrimary: {
    width: "100%", padding: "0.875rem",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "#fff", border: "none", borderRadius: "10px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 800, fontSize: "0.92rem", cursor: "pointer",
    boxShadow: "0 6px 24px rgba(59,130,246,0.4)", transition: "all 0.2s",
  },
  skipBtn: {
    width: "100%", padding: "0.7rem",
    background: "transparent", color: "#5d7aaa",
    border: "none", borderRadius: "10px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
  },
};
