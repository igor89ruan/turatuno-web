"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMOJIS = ["💰", "🏦", "💎", "🚀", "🌟", "🎯", "💡", "🔥", "🌈", "⚡", "🏠", "🎪"];

const PROFILE_TYPES = [
  {
    value: "personal",
    emoji: "👤",
    label: "Pessoal",
    desc: "Só para mim",
  },
  {
    value: "business",
    emoji: "💼",
    label: "Negócios",
    desc: "Empresa ou freela",
  },
];

export default function OnboardingWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [profileType, setProfileType] = useState("personal");
  const [iconEmoji, setIconEmoji] = useState("💰");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/onboarding/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, profileType, iconEmoji }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erro ao criar workspace.");
      return;
    }

    router.push("/onboarding/account");
  }

  return (
    <div style={s.root}>
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.grid} />

      <div style={s.wrap}>
        {/* Logo */}
        <div style={s.logo}>TuraTuno</div>

        {/* Progress */}
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressBar, width: "50%" }} />
          </div>
          <span style={s.progressLabel}>Passo 1 de 2</span>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.stepBadge}>🏗️ Configuração inicial</div>
            <h1 style={s.title}>Vamos criar seu workspace</h1>
            <p style={s.subtitle}>
              O workspace é o seu espaço financeiro. Você pode personalizá-lo como quiser!
            </p>
          </div>

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>

            {/* Emoji picker */}
            <div style={s.field}>
              <label style={s.label}>Escolha um ícone</label>
              <div style={s.emojiGrid}>
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIconEmoji(e)}
                    style={{
                      ...s.emojiBtn,
                      ...(iconEmoji === e ? s.emojiBtnActive : {}),
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome do workspace */}
            <div style={s.field}>
              <label style={s.label}>Nome do workspace</label>
              <div style={{ position: "relative" }}>
                <span style={s.inputPrefix}>{iconEmoji}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Minhas Finanças, Família Silva..."
                  style={{ ...s.input, paddingLeft: "2.75rem" }}
                  required
                  maxLength={80}
                />
              </div>
            </div>

            {/* Tipo de perfil */}
            <div style={s.field}>
              <label style={s.label}>Tipo de perfil</label>
              <div style={s.typeGrid}>
                {PROFILE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setProfileType(t.value)}
                    style={{
                      ...s.typeCard,
                      ...(profileType === t.value ? s.typeCardActive : {}),
                    }}
                  >
                    <span style={s.typeEmoji}>{t.emoji}</span>
                    <span style={s.typeLabel}>{t.label}</span>
                    <span style={s.typeDesc}>{t.desc}</span>
                  </button>
                ))}
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
              {loading ? "Criando..." : "Continuar →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#050810",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1.5rem",
    position: "relative",
    overflow: "hidden",
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
    bottom: "-150px", right: "-80px",
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
    position: "relative", zIndex: 1,
    width: "100%", maxWidth: "480px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem",
  },
  logo: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.04em",
    background: "linear-gradient(135deg, #60a5fa, #22d3ee)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  progressWrap: {
    width: "100%", display: "flex", flexDirection: "column", gap: "0.4rem",
  },
  progressTrack: {
    width: "100%", height: "4px", background: "#1a2540", borderRadius: "99px", overflow: "hidden",
  },
  progressBar: {
    height: "100%", borderRadius: "99px",
    background: "linear-gradient(90deg, #3b82f6, #22d3ee)",
    transition: "width 0.4s ease",
  },
  progressLabel: {
    fontSize: "0.72rem", color: "#5d7aaa", fontWeight: 600, textAlign: "right" as const,
  },
  card: {
    width: "100%", background: "#0c1221",
    border: "1px solid #1a2540", borderRadius: "24px",
    padding: "2rem 1.75rem",
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
  emojiGrid: {
    display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.4rem",
  },
  emojiBtn: {
    padding: "0.6rem", borderRadius: "10px", border: "1px solid #1a2540",
    background: "#080d1a", fontSize: "1.2rem", cursor: "pointer",
    transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center",
  },
  emojiBtnActive: {
    border: "1px solid rgba(59,130,246,0.5)",
    background: "rgba(59,130,246,0.12)",
    boxShadow: "0 0 0 2px rgba(59,130,246,0.2)",
    transform: "scale(1.1)",
  },
  inputPrefix: {
    position: "absolute", left: "0.85rem", top: "50%",
    transform: "translateY(-50%)", fontSize: "1rem", pointerEvents: "none",
  },
  input: {
    width: "100%", background: "#080d1a",
    border: "1px solid #1a2540", borderRadius: "10px",
    padding: "0.75rem 1rem", color: "#e2eeff",
    fontSize: "0.88rem", fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: "none", boxSizing: "border-box" as const,
  },
  typeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  typeCard: {
    padding: "1rem", borderRadius: "12px", border: "1px solid #1a2540",
    background: "#080d1a", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
    transition: "all 0.15s", fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  typeCardActive: {
    border: "1px solid rgba(59,130,246,0.4)",
    background: "rgba(59,130,246,0.08)",
    boxShadow: "0 0 0 1px rgba(59,130,246,0.15)",
  },
  typeEmoji: { fontSize: "1.5rem" },
  typeLabel: { fontSize: "0.85rem", fontWeight: 700, color: "#e2eeff" },
  typeDesc:  { fontSize: "0.72rem", color: "#5d7aaa" },
  btnPrimary: {
    width: "100%", padding: "0.875rem",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "#fff", border: "none", borderRadius: "10px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 800, fontSize: "0.92rem", cursor: "pointer",
    boxShadow: "0 6px 24px rgba(59,130,246,0.4)",
    transition: "all 0.2s", marginTop: "0.25rem",
  },
};
