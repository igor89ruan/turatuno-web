"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ── Hook de parallax por scroll ───────────────────────────────────────────
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const handler = () => setY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return y;
}

// ── Hook de intersection observer para reveal ─────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const scrollY = useScrollY();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [billingAnnual, setBillingAnnual] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #050810; color: #c8d8f0; font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }

        ::selection { background: rgba(59,130,246,0.35); color: #e2eeff; }

        @keyframes floatA { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-24px) rotate(3deg); } }
        @keyframes floatB { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-18px) rotate(-2deg); } }
        @keyframes floatC { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-30px); } }
        @keyframes pulse-glow { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.05); } }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes gradShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
        .reveal-delay-5 { transition-delay: 0.5s; }

        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }

        .plan-card:hover .plan-cta { background: linear-gradient(135deg,#60b4ff,#2563eb) !important; }

        .ticker-wrap { overflow: hidden; }
        .ticker-inner { display: flex; width: max-content; animation: ticker 28s linear infinite; }
        .ticker-inner:hover { animation-play-state: paused; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 clamp(1rem, 5vw, 3rem)",
        height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrollY > 40 ? "rgba(5,8,16,0.92)" : "transparent",
        backdropFilter: scrollY > 40 ? "blur(16px)" : "none",
        borderBottom: scrollY > 40 ? "1px solid rgba(255,255,255,0.05)" : "none",
        transition: "all 0.35s ease",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", boxShadow: "0 4px 14px rgba(59,130,246,0.4)" }}>
            💰
          </div>
          <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.04em", color: "#e2eeff" }}>
            TuraTuno
          </span>
        </div>

        {/* Links desktop */}
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }} className="nav-links">
          {["Funcionalidades","Planos","FAQ"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ fontSize: "0.85rem", fontWeight: 600, color: "#7a99c8", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#e2eeff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#7a99c8")}>
              {item}
            </a>
          ))}
        </div>

        {/* CTA nav */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/auth/login" style={{ fontSize: "0.83rem", fontWeight: 700, color: "#7a99c8", textDecoration: "none", padding: "0.45rem 0.85rem" }}>
            Entrar
          </Link>
          <Link href="/auth/register" style={{
            fontSize: "0.83rem", fontWeight: 800, color: "#fff", textDecoration: "none",
            padding: "0.5rem 1.1rem", borderRadius: "8px",
            background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
            boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
          }}>
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8rem clamp(1rem,5vw,3rem) 5rem", position: "relative", overflow: "hidden", textAlign: "center" }}>

        {/* Camadas de parallax */}
        {/* Grade */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)", backgroundSize: "60px 60px", transform: `translateY(${scrollY * 0.12}px)`, pointerEvents: "none" }} />

        {/* Orb grande azul */}
        <div style={{ position: "absolute", top: "15%", left: "10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)", filter: "blur(60px)", transform: `translateY(${scrollY * 0.18}px)`, pointerEvents: "none", animation: "pulse-glow 6s ease-in-out infinite" }} />

        {/* Orb ciano */}
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle,rgba(34,211,238,0.12) 0%,transparent 70%)", filter: "blur(50px)", transform: `translateY(${scrollY * -0.12}px)`, pointerEvents: "none", animation: "pulse-glow 8s ease-in-out infinite 2s" }} />

        {/* Orb roxo */}
        <div style={{ position: "absolute", top: "40%", right: "20%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)", filter: "blur(40px)", transform: `translateY(${scrollY * 0.25}px)`, pointerEvents: "none" }} />

        {/* Ícones flutuantes */}
        <div style={{ position: "absolute", top: "22%", left: "8%", fontSize: "2rem", animation: "floatA 7s ease-in-out infinite", opacity: 0.5, transform: `translateY(${scrollY * 0.2}px)` }}>📊</div>
        <div style={{ position: "absolute", top: "30%", right: "10%", fontSize: "1.8rem", animation: "floatB 9s ease-in-out infinite 1s", opacity: 0.4, transform: `translateY(${scrollY * -0.15}px)` }}>🎯</div>
        <div style={{ position: "absolute", bottom: "28%", left: "12%", fontSize: "1.6rem", animation: "floatC 8s ease-in-out infinite 2s", opacity: 0.35, transform: `translateY(${scrollY * 0.1}px)` }}>💳</div>
        <div style={{ position: "absolute", bottom: "20%", right: "15%", fontSize: "1.5rem", animation: "floatA 10s ease-in-out infinite 3s", opacity: 0.3, transform: `translateY(${scrollY * -0.2}px)` }}>🏦</div>

        {/* Badge trial */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: "999px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", marginBottom: "1.75rem", animation: "fadeUp 0.8s ease both" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#60a5fa" }}>7 dias grátis — sem cartão de crédito</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "clamp(2.8rem,7vw,5.5rem)", lineHeight: 1.05, letterSpacing: "-0.04em", color: "#e2eeff", maxWidth: "800px", animation: "fadeUp 0.9s ease 0.1s both", marginBottom: "1.5rem" }}>
          Finanças que{" "}
          <span style={{ background: "linear-gradient(135deg,#60a5fa,#22d3ee,#34d399)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "gradShift 4s ease infinite" }}>
            fazem sentido
          </span>
          {" "}pra você
        </h1>

        {/* Subtítulo */}
        <p style={{ fontSize: "clamp(1rem,2.5vw,1.25rem)", color: "#5d7aaa", maxWidth: "560px", lineHeight: 1.7, animation: "fadeUp 0.9s ease 0.2s both", marginBottom: "2.25rem" }}>
          Controle contas, cartões e metas em um só lugar.
          Simples, bonito e feito para a realidade brasileira.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap", justifyContent: "center", animation: "fadeUp 0.9s ease 0.3s both", marginBottom: "3.5rem" }}>
          <Link href="/auth/register" style={{
            padding: "0.9rem 2rem", borderRadius: "12px", textDecoration: "none",
            background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff",
            fontWeight: 800, fontSize: "1rem",
            boxShadow: "0 8px 28px rgba(59,130,246,0.45), 0 0 0 1px rgba(255,255,255,0.1) inset",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(59,130,246,0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 28px rgba(59,130,246,0.45)"; }}>
            Criar conta grátis →
          </Link>
          <a href="#funcionalidades" style={{ padding: "0.9rem 2rem", borderRadius: "12px", textDecoration: "none", background: "rgba(255,255,255,0.05)", color: "#e2eeff", fontWeight: 700, fontSize: "1rem", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
            Ver como funciona
          </a>
        </div>

        {/* Social proof */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", animation: "fadeUp 0.9s ease 0.4s both", opacity: 0.7 }}>
          <div style={{ display: "flex" }}>
            {["💜","💙","💚","🧡","❤️"].map((e, i) => (
              <div key={i} style={{ width: "28px", height: "28px", borderRadius: "50%", background: `hsl(${200 + i * 30},70%,40%)`, border: "2px solid #050810", marginLeft: i > 0 ? "-8px" : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>{e}</div>
            ))}
          </div>
          <span style={{ fontSize: "0.8rem", color: "#5d7aaa", fontWeight: 600 }}>+2.400 pessoas controlando melhor as finanças</span>
        </div>

        {/* Mock do dashboard */}
        <div style={{ marginTop: "4rem", width: "100%", maxWidth: "900px", animation: "fadeUp 1s ease 0.5s both", position: "relative" }}>
          {/* Glow atrás */}
          <div style={{ position: "absolute", inset: "-40px", background: "radial-gradient(ellipse at center,rgba(59,130,246,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
          <MockDashboard />
        </div>
      </section>

      {/* ── TICKER ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(59,130,246,0.04)", padding: "0.9rem 0", overflow: "hidden" }}>
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {Array(2).fill(["💰 Controle total","🎯 Metas & Sonhos","💳 Cartões de crédito","🏦 Multi-contas","📊 Relatórios visuais","⚡ Sem planilha","🇧🇷 Feito no Brasil","🔐 Dados seguros","✅ 7 dias grátis","📱 Funciona no celular"]).flat().map((item, i) => (
              <span key={i} style={{ padding: "0 2.5rem", fontSize: "0.8rem", fontWeight: 700, color: "#38506e", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FUNCIONALIDADES ──────────────────────────────────────────────── */}
      <section id="funcionalidades" style={{ padding: "7rem clamp(1rem,5vw,3rem)", maxWidth: "1100px", margin: "0 auto" }}>
        <RevealBlock delay={0}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3b82f6", background: "rgba(59,130,246,0.1)", padding: "0.35rem 0.85rem", borderRadius: "999px", border: "1px solid rgba(59,130,246,0.2)" }}>
              Funcionalidades
            </span>
            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.8rem)", letterSpacing: "-0.04em", color: "#e2eeff", marginTop: "1rem", marginBottom: "0.75rem" }}>
              Tudo que você precisa, nada do que não precisa
            </h2>
            <p style={{ color: "#5d7aaa", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto" }}>
              Sem excesso. Sem curva de aprendizado. Começa em 60 segundos.
            </p>
          </div>
        </RevealBlock>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.25rem" }}>
          {FEATURES.map((f, i) => (
            <RevealBlock key={i} delay={i * 0.08}>
              <div className="card-hover" style={{
                background: "#0c1221", border: "1px solid #1a2540",
                borderRadius: "20px", padding: "1.75rem",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg,transparent,${f.accent}60,transparent)` }} />
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: f.accent + "18", border: `1px solid ${f.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: "1.1rem" }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#e2eeff", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>{f.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "#5d7aaa", lineHeight: 1.65 }}>{f.desc}</p>
                {f.badge && (
                  <span style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: f.accent + "18", color: f.accent, border: `1px solid ${f.accent}30` }}>
                    {f.badge}
                  </span>
                )}
              </div>
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem clamp(1rem,5vw,3rem)", background: "rgba(59,130,246,0.03)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <RevealBlock delay={0}>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.8rem)", letterSpacing: "-0.04em", color: "#e2eeff", marginBottom: "0.75rem" }}>
                Começa em 3 passos
              </h2>
              <p style={{ color: "#5d7aaa" }}>Sem complicação. Promessa.</p>
            </div>
          </RevealBlock>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "2rem" }}>
            {STEPS.map((step, i) => (
              <RevealBlock key={i} delay={i * 0.12}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 1.25rem", boxShadow: "0 8px 24px rgba(59,130,246,0.35)" }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", color: "#3b82f6", marginBottom: "0.5rem" }}>PASSO {i + 1}</div>
                  <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#e2eeff", marginBottom: "0.5rem" }}>{step.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#5d7aaa", lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ──────────────────────────────────────────────────────── */}
      <section id="planos" style={{ padding: "7rem clamp(1rem,5vw,3rem)", maxWidth: "1000px", margin: "0 auto" }}>
        <RevealBlock delay={0}>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3b82f6", background: "rgba(59,130,246,0.1)", padding: "0.35rem 0.85rem", borderRadius: "999px", border: "1px solid rgba(59,130,246,0.2)" }}>
              Planos
            </span>
            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.8rem)", letterSpacing: "-0.04em", color: "#e2eeff", marginTop: "1rem", marginBottom: "0.75rem" }}>
              Preço justo, sem pegadinhas
            </h2>
            <p style={{ color: "#5d7aaa", fontSize: "1.05rem", marginBottom: "1.75rem" }}>
              7 dias grátis em qualquer plano. Cancela quando quiser.
            </p>

            {/* Toggle anual/mensal */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", background: "#0c1221", border: "1px solid #1a2540", borderRadius: "999px", padding: "0.3rem 0.85rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: billingAnnual ? "#38506e" : "#e2eeff" }}>Mensal</span>
              <button onClick={() => setBillingAnnual(!billingAnnual)} style={{ width: "44px", height: "24px", borderRadius: "999px", border: "none", background: billingAnnual ? "#3b82f6" : "#1a2540", cursor: "pointer", position: "relative", transition: "background 0.25s" }}>
                <span style={{ position: "absolute", top: "3px", left: billingAnnual ? "22px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.25s" }} />
              </button>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: billingAnnual ? "#e2eeff" : "#38506e" }}>
                Anual <span style={{ color: "#34d399", fontWeight: 800 }}>−20%</span>
              </span>
            </div>
          </div>
        </RevealBlock>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem", marginTop: "3rem" }}>
          {PLANS.map((plan, i) => (
            <RevealBlock key={i} delay={i * 0.1}>
              <div className="plan-card card-hover" style={{
                background: plan.featured ? "linear-gradient(160deg,rgba(59,130,246,0.12) 0%,#0c1221 50%)" : "#0c1221",
                border: `1px solid ${plan.featured ? "rgba(59,130,246,0.4)" : "#1a2540"}`,
                borderRadius: "24px", padding: "2rem", position: "relative", overflow: "hidden",
              }}>
                {plan.featured && (
                  <>
                    <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: "2px", background: "linear-gradient(90deg,transparent,#3b82f6,#22d3ee,transparent)" }} />
                    <div style={{ position: "absolute", top: "1.25rem", right: "1.25rem", fontSize: "0.65rem", fontWeight: 800, padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(59,130,246,0.2)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)", letterSpacing: "0.06em" }}>
                      MAIS POPULAR
                    </div>
                  </>
                )}

                <div style={{ fontSize: "1.8rem", marginBottom: "0.75rem" }}>{plan.icon}</div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#e2eeff", marginBottom: "0.35rem", letterSpacing: "-0.03em" }}>{plan.name}</h3>
                <p style={{ fontSize: "0.83rem", color: "#5d7aaa", marginBottom: "1.5rem", lineHeight: 1.5 }}>{plan.desc}</p>

                <div style={{ marginBottom: "1.5rem" }}>
                  <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "2.4rem", letterSpacing: "-0.05em", color: "#e2eeff" }}>
                    {billingAnnual ? `R$ ${(plan.price * 0.8).toFixed(0).replace(".",",")}` : `R$ ${plan.price.toFixed(0)}`}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#5d7aaa", fontWeight: 600 }}>,90/mês</span>
                  {billingAnnual && <p style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: 700, marginTop: "0.2rem" }}>cobrado anualmente</p>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.75rem" }}>
                  {plan.features.map((feat, fi) => (
                    <div key={fi} style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem" }}>
                      <span style={{ color: "#34d399", flexShrink: 0, marginTop: "0.05rem" }}>✓</span>
                      <span style={{ fontSize: "0.83rem", color: "#7a99c8", lineHeight: 1.4 }}>{feat}</span>
                    </div>
                  ))}
                </div>

                <Link href="/auth/register" className="plan-cta" style={{
                  display: "block", textAlign: "center", padding: "0.85rem", borderRadius: "12px", textDecoration: "none",
                  background: plan.featured ? "linear-gradient(135deg,#3b82f6,#1d4ed8)" : "rgba(255,255,255,0.06)",
                  color: "#fff", fontWeight: 800, fontSize: "0.9rem",
                  border: plan.featured ? "none" : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: plan.featured ? "0 6px 20px rgba(59,130,246,0.35)" : "none",
                  transition: "all 0.2s",
                }}>
                  Começar 7 dias grátis →
                </Link>
              </div>
            </RevealBlock>
          ))}
        </div>

        {/* Garantia */}
        <RevealBlock delay={0.2}>
          <div style={{ textAlign: "center", marginTop: "2.5rem", padding: "1.25rem", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: "14px", maxWidth: "500px", margin: "2.5rem auto 0" }}>
            <p style={{ fontSize: "0.85rem", color: "#5d7aaa", lineHeight: 1.6 }}>
              🛡️ <strong style={{ color: "#34d399" }}>Garantia de 30 dias.</strong> Não gostou, devolvemos 100% do valor. Sem perguntas.
            </p>
          </div>
        </RevealBlock>
      </section>

      {/* ── DEPOIMENTOS ─────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem clamp(1rem,5vw,3rem)", background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <RevealBlock delay={0}>
            <h2 style={{ textAlign: "center", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,3.5vw,2.4rem)", letterSpacing: "-0.04em", color: "#e2eeff", marginBottom: "3rem" }}>
              Quem usa, não volta para planilha
            </h2>
          </RevealBlock>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1rem" }}>
            {TESTIMONIALS.map((t, i) => (
              <RevealBlock key={i} delay={i * 0.1}>
                <div className="card-hover" style={{ background: "#0c1221", border: "1px solid #1a2540", borderRadius: "18px", padding: "1.5rem", position: "relative" }}>
                  <div style={{ fontSize: "1.1rem", color: "#fbbf24", marginBottom: "0.75rem" }}>{"★".repeat(5)}</div>
                  <p style={{ fontSize: "0.87rem", color: "#7a99c8", lineHeight: 1.7, marginBottom: "1rem" }}>"{t.text}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `hsl(${i * 60 + 200},60%,35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>{t.avatar}</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#e2eeff", margin: 0 }}>{t.name}</p>
                      <p style={{ fontSize: "0.7rem", color: "#38506e", margin: 0 }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: "7rem clamp(1rem,5vw,3rem)", maxWidth: "700px", margin: "0 auto" }}>
        <RevealBlock delay={0}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3b82f6", background: "rgba(59,130,246,0.1)", padding: "0.35rem 0.85rem", borderRadius: "999px", border: "1px solid rgba(59,130,246,0.2)" }}>FAQ</span>
            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.4rem)", letterSpacing: "-0.04em", color: "#e2eeff", marginTop: "1rem" }}>
              Perguntas frequentes
            </h2>
          </div>
        </RevealBlock>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {FAQS.map((faq, i) => (
            <RevealBlock key={i} delay={i * 0.06}>
              <div style={{ background: "#0c1221", border: `1px solid ${activeFaq === i ? "rgba(59,130,246,0.3)" : "#1a2540"}`, borderRadius: "14px", overflow: "hidden", transition: "border-color 0.2s" }}>
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  style={{ width: "100%", padding: "1.1rem 1.25rem", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", textAlign: "left" }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#e2eeff" }}>{faq.q}</span>
                  <span style={{ fontSize: "1rem", color: "#3b82f6", flexShrink: 0, transform: activeFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                </button>
                {activeFaq === i && (
                  <div style={{ padding: "0 1.25rem 1.1rem" }}>
                    <p style={{ fontSize: "0.85rem", color: "#5d7aaa", lineHeight: 1.7 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section style={{ padding: "6rem clamp(1rem,5vw,3rem)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(59,130,246,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />
        <RevealBlock delay={0}>
          <div style={{ maxWidth: "580px", margin: "0 auto", position: "relative" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚀</div>
            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,3rem)", letterSpacing: "-0.04em", color: "#e2eeff", marginBottom: "1rem" }}>
              Pronto para virar o jogo?
            </h2>
            <p style={{ color: "#5d7aaa", fontSize: "1.05rem", marginBottom: "2rem", lineHeight: 1.65 }}>
              Junte-se a milhares de brasileiros que já pararam de perder dinheiro sem saber por quê.
            </p>
            <Link href="/auth/register" style={{
              display: "inline-block", padding: "1rem 2.5rem", borderRadius: "14px", textDecoration: "none",
              background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", fontWeight: 800, fontSize: "1.05rem",
              boxShadow: "0 10px 40px rgba(59,130,246,0.5)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 50px rgba(59,130,246,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 10px 40px rgba(59,130,246,0.5)"; }}>
              Começar grátis por 7 dias →
            </Link>
            <p style={{ fontSize: "0.75rem", color: "#38506e", marginTop: "0.85rem" }}>Sem cartão. Cancela quando quiser. Resultado em minutos.</p>
          </div>
        </RevealBlock>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "2.5rem clamp(1rem,5vw,3rem)", maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>💰</div>
          <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1rem", color: "#e2eeff" }}>TuraTuno</span>
        </div>
        <p style={{ fontSize: "0.75rem", color: "#38506e" }}>© 2025 TuraTuno · Feito com 💙 no Brasil</p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {["Privacidade","Termos","Suporte"].map(l => (
            <a key={l} href="#" style={{ fontSize: "0.75rem", color: "#38506e", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#5d7aaa"}
              onMouseLeave={e => e.currentTarget.style.color = "#38506e"}>
              {l}
            </a>
          ))}
        </div>
      </footer>
    </>
  );
}

// ── MOCK DASHBOARD ─────────────────────────────────────────────────────────

function MockDashboard() {
  return (
    <div style={{
      background: "#0c1221", border: "1px solid rgba(59,130,246,0.2)",
      borderRadius: "20px", padding: "1.5rem", textAlign: "left",
      boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Barra de janela */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {["#f87171","#fbbf24","#34d399"].map((c, i) => (
          <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
        ))}
        <div style={{ flex: 1, height: "24px", background: "#080d1a", borderRadius: "6px", margin: "0 0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "0.65rem", color: "#38506e" }}>app.turatuno.com.br/dashboard</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1rem" }}>
        {/* Sidebar mini */}
        <div style={{ width: "36px", background: "#080d1a", borderRadius: "10px", padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {["⚡","💳","🏦","💎","🎯","📊"].map((icon, i) => (
            <div key={i} style={{ width: "28px", height: "28px", borderRadius: "7px", background: i === 0 ? "rgba(59,130,246,0.3)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>{icon}</div>
          ))}
        </div>

        {/* Main area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Saldo */}
          <div style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.15),rgba(59,130,246,0.05))", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", padding: "1rem" }}>
            <p style={{ fontSize: "0.6rem", color: "#5d7aaa", fontWeight: 700, margin: "0 0 0.3rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Saldo total</p>
            <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "#e2eeff", margin: 0, letterSpacing: "-0.04em" }}>R$ 12.480,00</p>
          </div>

          {/* 3 cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            {[{ label: "Receitas", val: "+R$ 8.200", color: "#34d399" }, { label: "Despesas", val: "-R$ 4.320", color: "#f87171" }, { label: "Metas", val: "3 ativas", color: "#60a5fa" }].map((c, i) => (
              <div key={i} style={{ background: "#080d1a", borderRadius: "8px", padding: "0.6rem" }}>
                <p style={{ fontSize: "0.55rem", color: "#38506e", margin: "0 0 0.2rem" }}>{c.label}</p>
                <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "0.75rem", color: c.color, margin: 0 }}>{c.val}</p>
              </div>
            ))}
          </div>

          {/* Transações mini */}
          {[{ icon: "🍔", desc: "iFood", cat: "Alimentação", val: "-R$ 48,90", color: "#f87171" }, { icon: "💼", desc: "Salário", cat: "Receita", val: "+R$ 5.200", color: "#34d399" }, { icon: "🎮", desc: "Netflix", cat: "Assinaturas", val: "-R$ 55,90", color: "#f87171" }].map((tx, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", background: "#080d1a", borderRadius: "8px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem" }}>{tx.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#e2eeff", margin: 0 }}>{tx.desc}</p>
                <p style={{ fontSize: "0.52rem", color: "#38506e", margin: 0 }}>{tx.cat}</p>
              </div>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: tx.color }}>{tx.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── REVEAL BLOCK ──────────────────────────────────────────────────────────

function RevealBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

// ── DATA ──────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: "🏦", title: "Multi-contas", desc: "Cadastre quantas contas quiser — corrente, poupança, dinheiro, investimento. Tudo centralizado.", accent: "#3b82f6", badge: null },
  { icon: "💳", title: "Cartões de crédito", desc: "Acompanhe a fatura em tempo real, data de fechamento e limite disponível de cada cartão.", accent: "#8b5cf6" , badge: null},
  { icon: "🎯", title: "Metas & Sonhos", desc: "Crie metas com prazo e registre aportes. O TuraTuno calcula quanto você precisa guardar por mês.", accent: "#34d399", badge: "⭐ Exclusivo" },
  { icon: "📊", title: "Relatórios visuais", desc: "Gráficos bonitos de evolução mensal, gastos por categoria e top despesas. Sem tabela feia.", accent: "#f59e0b", badge: null },
  { icon: "🏷️", title: "Categorias personalizadas", desc: "9 categorias padrão já configuradas. Crie as suas com emoji e cor própria.", accent: "#ec4899", badge: null },
  { icon: "⬇️", title: "Exportação CSV", desc: "Exporte todos os seus dados para Excel quando quiser. Seus dados são seus.", accent: "#06b6d4", badge: null },
];

const STEPS = [
  { icon: "✍️", title: "Crie sua conta", desc: "Cadastro em menos de 60 segundos. Só nome, e-mail e senha. Sem burocracia." },
  { icon: "🏦", title: "Configure seu workspace", desc: "Adicione suas contas bancárias com saldo atual. O TuraTuno já vem com categorias prontas." },
  { icon: "💡", title: "Controle e realize", desc: "Lançce transações, acompanhe metas e veja seus relatórios. Tudo em um só lugar." },
];

const PLANS = [
  {
    icon: "⚡", name: "Impulso", featured: false, price: 19,
    desc: "Para quem quer começar a organizar as finanças de uma vez.",
    features: ["Contas ilimitadas", "Até 3 cartões de crédito", "Categorias personalizadas", "Metas & Sonhos (até 5)", "Relatórios mensais", "Exportação CSV"],
  },
  {
    icon: "🎯", name: "Sintonia", featured: true, price: 34,
    desc: "Para quem leva finanças a sério e quer o controle total.",
    features: ["Tudo do Impulso", "Cartões ilimitados", "Metas ilimitadas", "Relatórios avançados", "Importação de CSV/OFX", "Histórico completo", "Suporte prioritário"],
  },
];

const TESTIMONIALS = [
  { avatar: "👩", name: "Mariana S.", role: "Professora · SP", text: "Em 2 semanas descobri que estava gastando R$800/mês com coisas que nem lembrava. Cortei metade e já tô viajando no fio." },
  { avatar: "👨", name: "Carlos M.", role: "Dev freelancer · MG", text: "Tinha medo de organizar as finanças sendo freelancer. O TuraTuno tornou isso simples de verdade. Uso todo dia." },
  { avatar: "👩", name: "Júlia R.", role: "Empreendedora · RJ", text: "A funcionalidade de metas mudou minha vida. Tô guardando pra viagem dos sonhos com data marcada." },
  { avatar: "👨", name: "Pedro A.", role: "Engenheiro · PR", text: "Visual incrível, tudo faz sentido. Tentei 4 apps antes desse. Esse é o que ficou." },
  { avatar: "👩", name: "Ana L.", role: "Médica · DF", text: "Finalmente sei pra onde vai meu dinheiro. Em 30 dias já quitei uma dívida que arrastava há 1 ano." },
  { avatar: "👨", name: "Lucas F.", role: "Designer · RS", text: "Além de funcionar muito bem, é lindo de usar. Adoro abrir o app só pra ver os números bonitos 😂" },
];

const FAQS = [
  { q: "Preciso de cartão de crédito para o trial?", a: "Não! Os 7 dias de trial são completamente gratuitos e sem necessidade de cadastrar cartão. Só pedimos quando você decide continuar." },
  { q: "Meus dados ficam seguros?", a: "Sim. Usamos criptografia de ponta a ponta, conexões HTTPS e armazenamento em nuvem com backups automáticos. Seus dados nunca são compartilhados com terceiros." },
  { q: "Posso cancelar quando quiser?", a: "Sim, a qualquer momento. Sem multa, sem burocracia. Basta ir em Configurações > Plano > Cancelar." },
  { q: "O app funciona no celular?", a: "O TuraTuno funciona em qualquer navegador, inclusive mobile. Em breve lançamos o app nativo para iOS e Android." },
  { q: "Tem versão gratuita permanente?", a: "Oferecemos 7 dias grátis com acesso completo. Após isso, é necessário assinar um dos planos para continuar usando." },
  { q: "Posso importar dados do meu banco?", a: "No plano Sintonia você pode importar extratos em CSV e OFX diretamente, criando as transações automaticamente." },
];
