"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Plan = "impulso" | "sintonia";

export default function RegisterClient() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<Plan>("impulso");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${nome} ${sobrenome}`.trim(), email, password, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar conta.");

      // Auto-login após cadastro
      await signIn("credentials", { identifier: email, password, redirect: false });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 11, padding: ".82rem 1rem",
    fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: ".9rem", color: "#fff", outline: "none",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #0b1120; -webkit-font-smoothing: antialiased; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px rgba(13,21,38,1) inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", alignItems: "stretch" }}>

        {/* ── LEFT: SOCIAL PROOF ── */}
        <div style={{ width: 400, flexShrink: 0, background: "#060c1a", borderRight: "1px solid rgba(255,255,255,.05)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "3rem 2.5rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(5,150,105,.1) 0%,transparent 70%)", filter: "blur(60px)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1, animation: "slideUp .7s ease .15s both" }}>
            <p style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "1.6rem", color: "#fff", lineHeight: 1.15, marginBottom: ".5rem", fontWeight: 400 }}>
              +2.400 brasileiros<br/>já no controle.
            </p>
            <p style={{ fontSize: ".82rem", color: "rgba(255,255,255,.60)", lineHeight: 1.65, marginBottom: "2rem" }}>
              Veja o que estão dizendo após os primeiros 7 dias.
            </p>

            {/* Depoimentos */}
            <div style={{ display: "flex", flexDirection: "column", gap: ".75rem", marginBottom: "2rem" }}>
              {[
                { av: "👩", bg: "#c7d2fe", name: "Mariana S.", role: "Professora · São Paulo", text: '"Em 2 semanas descobri R$800/mês desperdiçados. Cortei metade, agora guardo R$400 todo mês."' },
                { av: "👩", bg: "#d1fae5", name: "Júlia R.", role: "Empreendedora · Rio · plano Sintonia", text: '"Meu marido e eu brigávamos por dinheiro. Com o plano Sintonia acabaram as brigas."' },
              ].map((t, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: ".9rem 1rem" }}>
                  <div style={{ color: "#f59e0b", fontSize: ".7rem", letterSpacing: 1, marginBottom: ".45rem" }}>★★★★★</div>
                  <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,.75)", lineHeight: 1.65, marginBottom: ".6rem" }}>{t.text}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".55rem" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem", flexShrink: 0 }}>{t.av}</div>
                    <div>
                      <div style={{ fontSize: ".72rem", fontWeight: 700, color: "rgba(255,255,255,.85)" }}>{t.name}</div>
                      <div style={{ fontSize: ".62rem", color: "rgba(255,255,255,.55)" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".65rem" }}>
              {[{ v: "2.4k", s: "usuários ativos" }, { v: "4.9★", s: "avaliação média" }, { v: "97%", s: "de satisfação" }, { v: "60s", s: "para começar" }].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: ".75rem .85rem", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-.04em", color: "#fff", lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: ".65rem", color: "rgba(255,255,255,.55)", marginTop: ".2rem", fontWeight: 500 }}>{s.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: FORM ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "3rem clamp(2rem,5vw,5rem)", position: "relative", overflow: "hidden" }}>
          {/* Bg */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)", backgroundSize: "68px 68px", maskImage: "radial-gradient(ellipse at 60% 50%,black 20%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: 500, height: 500, top: -100, right: -120, background: "radial-gradient(circle,rgba(37,99,235,.16) 0%,transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: 300, height: 300, bottom: -70, left: -50, background: "radial-gradient(circle,rgba(5,150,105,.1) 0%,transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1, maxWidth: 480, width: "100%", animation: "slideUp .7s ease both" }}>

            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: ".55rem", marginBottom: "2.75rem", textDecoration: "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(37,99,235,.4)", flexShrink: 0 }}>
                <svg width="18" height="20" viewBox="0 0 120 130" fill="none">
                  <path d="M60 8 L112 118 L88 118 L60 55 L32 118 L8 118 Z" fill="white"/>
                  <path d="M60 55 Q70 78 88 118 L76 118 Q67 93 57 70 Z" fill="rgba(0,0,0,0.28)"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-.03em", color: "#fff" }}>TuraTuno</span>
            </Link>

            {/* Trial badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: ".45rem", fontSize: ".72rem", fontWeight: 700, color: "#6ee7b7", padding: ".32rem .85rem", borderRadius: 999, border: "1px solid rgba(5,150,105,.25)", background: "rgba(5,150,105,.08)", marginBottom: "1.5rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 7px #10b981", flexShrink: 0, display: "inline-block", animation: "blink 2s ease-in-out infinite" }}/>
              7 dias grátis · sem cartão · cancele quando quiser
            </div>

            <h1 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "2.2rem", color: "#fff", lineHeight: 1.12, marginBottom: ".6rem", fontWeight: 400 }}>
              Crie sua conta<br/>e comece <em style={{ fontStyle: "italic", background: "linear-gradient(130deg,#93c5fd,#a5f3fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>agora.</em>
            </h1>
            <p style={{ fontSize: ".88rem", color: "rgba(255,255,255,.65)", marginBottom: "2rem", lineHeight: 1.65 }}>Menos de 60 segundos. Sem CPF, sem cartão, sem burocracia.</p>

            {error && (
              <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, padding: ".75rem 1rem", marginBottom: "1rem", fontSize: ".82rem", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>

              {/* Nome / Sobrenome */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".85rem" }}>
                {[
                  { label: "Nome", val: nome, set: setNome, ph: "Seu nome", ac: "given-name" },
                  { label: "Sobrenome", val: sobrenome, set: setSobrenome, ph: "Sobrenome", ac: "family-name" },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: ".38rem" }}>
                    <label style={{ fontSize: ".75rem", fontWeight: 700, color: "rgba(255,255,255,.70)", letterSpacing: ".02em" }}>{f.label}</label>
                    <input type="text" value={f.val} onChange={e => f.set(e.target.value)} required placeholder={f.ph} autoComplete={f.ac} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = "rgba(37,99,235,.6)"; e.target.style.background = "rgba(37,99,235,.06)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,.1)"; e.target.style.background = "rgba(255,255,255,.05)"; }}
                    />
                  </div>
                ))}
              </div>

              {/* E-mail */}
              <div style={{ display: "flex", flexDirection: "column", gap: ".38rem" }}>
                <label style={{ fontSize: ".75rem", fontWeight: 700, color: "rgba(255,255,255,.70)", letterSpacing: ".02em" }}>E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" autoComplete="email" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "rgba(37,99,235,.6)"; e.target.style.background = "rgba(37,99,235,.06)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,.1)"; e.target.style.background = "rgba(255,255,255,.05)"; }}
                />
              </div>

              {/* Senha */}
              <div style={{ display: "flex", flexDirection: "column", gap: ".38rem" }}>
                <label style={{ fontSize: ".75rem", fontWeight: 700, color: "rgba(255,255,255,.70)", letterSpacing: ".02em" }}>Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mín. 8 caracteres" autoComplete="new-password" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "rgba(37,99,235,.6)"; e.target.style.background = "rgba(37,99,235,.06)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,.1)"; e.target.style.background = "rgba(255,255,255,.05)"; }}
                />
              </div>

              {/* Plano */}
              <div style={{ display: "flex", flexDirection: "column", gap: ".38rem" }}>
                <label style={{ fontSize: ".75rem", fontWeight: 700, color: "rgba(255,255,255,.70)", letterSpacing: ".02em" }}>Escolha seu plano</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".65rem" }}>
                  {([
                    { id: "impulso" as Plan, icon: "⚡", name: "Impulso", price: "R$19,90/mês · 1 usuário", tag: null },
                    { id: "sintonia" as Plan, icon: "🎯", name: "Sintonia", price: "R$34,90/mês · 2 usuários", tag: "+ Turabot IA" },
                  ]).map(p => (
                    <div key={p.id} onClick={() => setPlan(p.id)} style={{ border: `1.5px solid ${plan === p.id ? "#2563eb" : "rgba(255,255,255,.1)"}`, borderRadius: 12, padding: ".85rem", cursor: "pointer", position: "relative", background: plan === p.id ? "rgba(37,99,235,.1)" : "rgba(255,255,255,.03)", transition: "all .2s" }}>
                      {plan === p.id && <div style={{ position: "absolute", top: ".5rem", right: ".65rem", fontSize: ".7rem", fontWeight: 800, color: "#2563eb" }}>✓</div>}
                      <div style={{ fontSize: "1.2rem", marginBottom: ".3rem" }}>{p.icon}</div>
                      <div style={{ fontSize: ".82rem", fontWeight: 800, color: "#fff", marginBottom: ".15rem", letterSpacing: "-.02em" }}>{p.name}</div>
                      <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.35)" }}>{p.price}</div>
                      {p.tag && <div style={{ fontSize: ".58rem", fontWeight: 800, color: "#6ee7b7", background: "rgba(5,150,105,.15)", border: "1px solid rgba(5,150,105,.2)", borderRadius: 999, padding: ".1rem .4rem", display: "inline-block", marginTop: ".2rem" }}>{p.tag}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, padding: ".9rem", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: ".95rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1, boxShadow: "0 4px 18px rgba(37,99,235,.35)", letterSpacing: "-.01em", transition: "all .22s" }}>
                {loading ? "Criando conta..." : "Criar conta gratuita — 7 dias grátis →"}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
                <span style={{ fontSize: ".7rem", color: "rgba(255,255,255,.50)", fontWeight: 600 }}>ou</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
              </div>

              <button type="button" onClick={handleGoogle} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 11, padding: ".78rem", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: ".83rem", fontWeight: 600, color: "rgba(255,255,255,.62)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: ".55rem", transition: "all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.09)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.62)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Criar conta com Google
              </button>

              <p style={{ fontSize: ".74rem", color: "rgba(255,255,255,.52)", lineHeight: 1.55, textAlign: "center", marginTop: ".25rem" }}>
                Ao criar sua conta você concorda com os{" "}
                <Link href="/terms" style={{ color: "rgba(37,99,235,.8)", textDecoration: "none" }}>Termos de Uso</Link>
                {" "}e a{" "}
                <Link href="/privacy" style={{ color: "rgba(37,99,235,.8)", textDecoration: "none" }}>Política de Privacidade</Link>.
              </p>
            </form>

            <p style={{ textAlign: "center", fontSize: ".78rem", color: "rgba(255,255,255,.58)", marginTop: "1.25rem" }}>
              Já tem conta?{" "}
              <Link href="/login" style={{ color: "rgba(37,99,235,.9)", fontWeight: 700, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#60a5fa"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(37,99,235,.9)"}
              >Entrar →</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
