"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ── Hooks ────────────────────────────────────────────────────────────────────
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(26px)",
        transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "🏦", title: "Multi-contas ilimitadas", desc: "Unifica todas as suas contas em um lugar. Nunca mais abrir 4 apps diferentes pra saber quanto você tem no total.", accent: "#3b82f6", badge: null },
  { icon: "💳", title: "Cartões de crédito", desc: "Veja a fatura crescendo em tempo real. Saiba exatamente quanto resta do limite antes de comprar — não depois.", accent: "#8b5cf6", badge: null },
  { icon: "🎯", title: "Metas & Sonhos", desc: "Define o objetivo e o prazo, o app faz a conta de quanto guardar por mês. Progresso visual que motiva a continuar.", accent: "#34d399", badge: "✦ Exclusivo" },
  { icon: "📊", title: "Relatórios que fazem sentido", desc: "Descubra para onde realmente vai seu dinheiro. Os padrões ficam óbvios no gráfico — e a decisão fica fácil.", accent: "#f59e0b", badge: null },
  { icon: "🏷️", title: "Categorias personalizadas", desc: "13 categorias prontas, sem configuração inicial. Se quiser personalizar com emoji e cor, leva 10 segundos.", accent: "#ec4899", badge: null },
  { icon: "⚡", title: "Rápido como você precisa", desc: "Lançar uma transação leva 5 segundos. Se for difícil de usar, você para de usar — então fizemos simples de verdade.", accent: "#06b6d4", badge: null },
];

const STEPS = [
  { n: "1", title: "Cria sua conta", desc: "Nome, e-mail e senha. 60 segundos. Sem cartão, sem CPF, sem burocracia." },
  { n: "2", title: "Configura seu mundo", desc: "Adiciona suas contas com saldo atual. As categorias já vêm prontas — você personaliza o que quiser." },
  { n: "3", title: "Controla e conquista", desc: "Lance transações, acompanhe metas, veja seus relatórios. E finalmente durma tranquilo." },
];

const TESTIMONIALS = [
  { av: "👩", bg: "#3730a3", name: "Mariana S.", role: "Professora · São Paulo", text: "Eu ganhava bem mas nunca sobrava nada. Em 2 semanas no TuraTuno descobri que gastava R$800/mês com coisas que nem lembrava. Agora guardo R$400 todo mês." },
  { av: "👨", bg: "#1e40af", name: "Carlos M.", role: "Dev freelancer · MG", text: "Como freelancer minha renda varia todo mês e eu vivia no vermelho sem entender por quê. O TuraTuno me deu clareza em dias. Agora tenho reserva de emergência pela primeira vez." },
  { av: "👩", bg: "#065f46", name: "Júlia R.", role: "Professora · Rio · plano Sintonia", text: "Meu marido e eu brigávamos por causa de dinheiro todo mês. Com o plano Sintonia cada um vê seus gastos e a gente tem um dashboard junto. Acabaram as brigas." },
  { av: "👨", bg: "#78350f", name: "Pedro A.", role: "Engenheiro · Curitiba", text: "Tentei planilha, tentei outros 3 apps. O TuraTuno foi o único que continuei usando depois de 1 semana. Em 3 meses quitei um cartão que estava acumulando juros." },
  { av: "👩", bg: "#7f1d1d", name: "Ana L.", role: "Médica · Brasília", text: "Em 30 dias descobri que o delivery me custava R$600/mês. Cortei pra R$150 e quitei minha última dívida no terceiro mês." },
  { av: "👨", bg: "#312e81", name: "Lucas F.", role: "Designer · Porto Alegre", text: "Em 4 meses guardei a entrada do meu carro. Nunca achei que seria com um app de finanças — mas aqui foi." },
];

const FAQS = [
  { q: "Preciso de cartão de crédito para o trial?", a: "Não. Os 7 dias de trial são completamente gratuitos. Só pedimos dados de pagamento quando você decide assinar — e você escolhe se quer continuar." },
  { q: "Meus dados financeiros ficam seguros?", a: "Sim. Usamos criptografia, HTTPS e armazenamento em nuvem com backups automáticos. Seus dados nunca são compartilhados com terceiros." },
  { q: "Posso cancelar quando quiser?", a: "Sim, a qualquer momento. Sem multa, sem burocracia, sem ligação de retenção. Configurações → Plano → Cancelar. Simples assim." },
  { q: "Funciona no celular?", a: "Funciona em qualquer navegador, incluindo mobile. App nativo para iOS e Android está no roadmap." },
  { q: "Posso importar meu extrato bancário?", a: "No plano Sintonia você importa extratos em CSV e OFX — as transações são criadas automaticamente com categorização inteligente." },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const scrollY = useScrollY();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0b1120; color: #fff; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        ::selection { background: rgba(37,99,235,.2); }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes tk { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gp { 0%,100%{opacity:.8;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        .ticker-inner { display:flex; width:max-content; animation:tk 28s linear infinite; }
        .ticker-inner:hover { animation-play-state:paused; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 66,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(1.25rem,4vw,3rem)",
        background: scrollY > 55 ? "rgba(255,255,255,.94)" : "transparent",
        backdropFilter: scrollY > 55 ? "blur(18px) saturate(180%)" : "none",
        boxShadow: scrollY > 55 ? "0 1px 0 #e2e8f0" : "none",
        transition: "all .35s",
      }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:".55rem", textDecoration:"none" }}>
          <svg width="28" height="30" viewBox="0 0 120 130" fill="none">
            <path d="M60 8 L112 118 L88 118 L60 55 L32 118 L8 118 Z" fill={scrollY > 55 ? "#0f172a" : "white"}/>
            <path d="M60 55 Q70 78 88 118 L76 118 Q67 93 57 70 Z" fill={scrollY > 55 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.28)"}/>
          </svg>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.15rem", letterSpacing:"-.03em", color: scrollY > 55 ? "#0f172a" : "#fff", transition:"color .3s" }}>TuraTuno</span>
        </Link>

        <div style={{ display:"flex", gap:"2rem" }}>
          {[["#funcionalidades","Funcionalidades"],["#planos","Planos"],["#depoimentos","Histórias"],["#faq","FAQ"]].map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize:".83rem", fontWeight:600, color: scrollY > 55 ? "#64748b" : "rgba(255,255,255,.5)", textDecoration:"none", transition:"color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#2563eb"}
              onMouseLeave={e => e.currentTarget.style.color = scrollY > 55 ? "#64748b" : "rgba(255,255,255,.5)"}
            >{label}</a>
          ))}
        </div>

        <div style={{ display:"flex", gap:".6rem", alignItems:"center" }}>
          <Link href="/login" style={{ fontSize:".83rem", fontWeight:600, color: scrollY > 55 ? "#64748b" : "rgba(255,255,255,.5)", padding:".38rem .8rem", textDecoration:"none", transition:"color .2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#2563eb"}
            onMouseLeave={e => e.currentTarget.style.color = scrollY > 55 ? "#64748b" : "rgba(255,255,255,.5)"}
          >Entrar</Link>
          <Link href="/register" style={{ display:"inline-flex", alignItems:"center", gap:".3rem", background:"#2563eb", color:"#fff", fontWeight:700, fontSize:".88rem", padding:".6rem 1.2rem", borderRadius:10, textDecoration:"none", boxShadow:"0 4px 14px rgba(37,99,235,.32)", transition:"all .22s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="#1d4ed8"; (e.currentTarget as HTMLElement).style.transform="translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="#2563eb"; (e.currentTarget as HTMLElement).style.transform=""; }}
          >Começar grátis</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"9rem clamp(1.25rem,4vw,3rem) 0", textAlign:"center", position:"relative", overflow:"hidden", background:"#0b1120" }}>
        {/* Grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)", backgroundSize:"70px 70px", maskImage:"radial-gradient(ellipse at 50% 30%,black 15%,transparent 72%)", pointerEvents:"none" }}/>
        {/* Glows */}
        <div style={{ position:"absolute", width:680, height:680, top:-220, left:"50%", transform:"translateX(-50%)", background:"radial-gradient(circle,rgba(37,99,235,.2) 0%,transparent 70%)", filter:"blur(90px)", animation:"gp 9s ease-in-out infinite", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", width:360, height:360, bottom:0, right:-60, background:"radial-gradient(circle,rgba(5,150,105,.09) 0%,transparent 70%)", filter:"blur(80px)", pointerEvents:"none" }}/>

        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:1100, margin:"0 auto" }}>
          {/* Badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:".5rem", padding:".38rem 1rem", borderRadius:999, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", marginBottom:"2rem", animation:"fadeUp .7s ease both" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 9px #10b981", display:"inline-block", animation:"blink 2.5s ease-in-out infinite" }}/>
            <span style={{ fontSize:".75rem", fontWeight:700, color:"rgba(255,255,255,.5)", letterSpacing:".02em" }}>7 dias grátis em todos os planos · sem cartão · cancele quando quiser</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"clamp(3rem,7.5vw,5.8rem)", lineHeight:1.06, color:"#fff", maxWidth:760, margin:"0 auto 1.4rem", animation:"fadeUp .85s ease .08s both", fontWeight:400 }}>
            Pare de perder dinheiro<br/>
            <em style={{ fontStyle:"italic", background:"linear-gradient(130deg,#93c5fd,#60a5fa,#a5f3fc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>sem saber pra onde vai.</em>
          </h1>

          <p style={{ fontSize:"clamp(.98rem,1.8vw,1.12rem)", color:"rgba(255,255,255,.4)", maxWidth:500, margin:"0 auto 2.4rem", lineHeight:1.78, animation:"fadeUp .85s ease .16s both" }}>
            Você sabe que ganha bem, mas no fim do mês sobra pouco. O TuraTuno te mostra exatamente onde o dinheiro some — e o que fazer pra mudar isso.
          </p>

          {/* CTAs */}
          <div style={{ display:"flex", gap:".8rem", justifyContent:"center", flexWrap:"wrap", marginBottom:"3rem", animation:"fadeUp .85s ease .24s both" }}>
            <Link href="/register" style={{ background:"#2563eb", color:"#fff", fontWeight:700, fontSize:".97rem", padding:".9rem 2rem", borderRadius:13, textDecoration:"none", boxShadow:"0 4px 18px rgba(37,99,235,.36)", transition:"all .22s", display:"inline-flex", alignItems:"center", gap:".35rem" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="#1d4ed8"; (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="#2563eb"; (e.currentTarget as HTMLElement).style.transform=""; }}
            >Criar conta gratuita →</Link>
            <a href="#funcionalidades" style={{ background:"rgba(255,255,255,.08)", color:"rgba(255,255,255,.78)", fontWeight:700, fontSize:".9rem", padding:".9rem 1.8rem", borderRadius:13, border:"1px solid rgba(255,255,255,.14)", textDecoration:"none", transition:"background .2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.13)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.08)"}
            >Ver como funciona</a>
          </div>

          {/* Social proof */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"1rem", animation:"fadeUp .85s ease .3s both", marginBottom:"4rem" }}>
            <div style={{ display:"flex" }}>
              {["#3730a3","#1e40af","#065f46","#78350f","#4c1d95"].map((bg, i) => (
                <div key={i} style={{ width:30, height:30, borderRadius:"50%", background:bg, border:"2px solid #0b1120", marginLeft: i > 0 ? -8 : 0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".85rem" }}>
                  {["👩","👨","👩","👨","👩"][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{ color:"#fbbf24", fontSize:".73rem", letterSpacing:1 }}>★★★★★</div>
              <div style={{ fontSize:".77rem", color:"rgba(255,255,255,.36)", fontWeight:500 }}><strong style={{ color:"rgba(255,255,255,.65)", fontWeight:700 }}>+2.400 brasileiros</strong> no controle</div>
            </div>
            <div style={{ width:1, height:20, background:"rgba(255,255,255,.1)" }}/>
            <div style={{ fontSize:".77rem", color:"rgba(255,255,255,.36)" }}>Nota <strong style={{ color:"rgba(255,255,255,.65)", fontWeight:700 }}>4.9/5</strong></div>
          </div>

          {/* Mock Dashboard */}
          <MockDashboard />
        </div>
      </section>

      {/* Hero → light transition */}
      <div style={{ height:75, background:"linear-gradient(to bottom,#0b1120,#fff)" }}/>

      {/* ── TRUST BAR ── */}
      <div style={{ padding:"2.25rem 0", borderBottom:"1px solid #e2e8f0" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 clamp(1.25rem,4vw,3rem)", display:"flex", alignItems:"center", justifyContent:"center", gap:"2.75rem", flexWrap:"wrap" }}>
          {["🔐 Dados criptografados","☁️ Backup automático","🇧🇷 Feito no Brasil","📱 Funciona no celular","🚫 Sem anúncios"].map(t => (
            <div key={t} style={{ fontSize:".8rem", fontWeight:600, color:"#64748b", display:"flex", alignItems:"center", gap:".45rem" }}>{t}</div>
          ))}
        </div>
      </div>

      {/* ── TICKER ── */}
      <div style={{ padding:".9rem 0", overflow:"hidden", background:"#f7f9fc", borderTop:"1px solid #e2e8f0", borderBottom:"1px solid #e2e8f0" }}>
        <div className="ticker-inner">
          {Array(2).fill(["Contas ilimitadas","Metas & Sonhos","Cartões de crédito","Relatórios visuais","Categorias personalizadas","7 dias grátis","Cancele quando quiser"]).flat().map((item, i) => (
            <span key={i} style={{ padding:"0 2.25rem", fontSize:".7rem", fontWeight:700, color:"#94a3b8", letterSpacing:".1em", textTransform:"uppercase", whiteSpace:"nowrap", flexShrink:0 }}>
              <span style={{ display:"inline-block", width:4, height:4, borderRadius:"50%", background:"#2563eb", marginRight:"0.6rem", verticalAlign:"middle" }}/>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── NÚMEROS ── */}
      <section style={{ padding:"3rem 0" }}>
        <Reveal>
          <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 clamp(1.25rem,4vw,3rem)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", border:"1px solid #e2e8f0", borderRadius:22, overflow:"hidden", background:"#fff", boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
              {[{v:"2.400",s:"+",l:"usuários ativos"},{v:"R$48",s:"M",l:"gerenciados/mês"},{v:"97",s:"%",l:"de satisfação"},{v:"60",s:"s",l:"para começar"}].map((n, i) => (
                <div key={i} style={{ padding:"2.25rem 1.75rem", textAlign:"center", borderRight: i < 3 ? "1px solid #e2e8f0" : "none" }}>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"2.6rem", letterSpacing:"-.04em", color:"#0f172a", lineHeight:1, marginBottom:".35rem" }}>
                    {n.v}<span style={{ color:"#2563eb" }}>{n.s}</span>
                  </div>
                  <div style={{ fontSize:".78rem", color:"#64748b", fontWeight:500 }}>{n.l}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" style={{ padding:"6.5rem 0", background:"#f7f9fc" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 clamp(1.25rem,4vw,3rem)" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:"3.25rem" }}>
              <span style={{ fontSize:".7rem", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:"#2563eb", background:"rgba(37,99,235,.06)", padding:".28rem .8rem", borderRadius:999, border:"1px solid rgba(37,99,235,.18)" }}>Funcionalidades</span>
              <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"clamp(2.2rem,4.5vw,3.2rem)", lineHeight:1.1, color:"#0f172a", marginTop:".9rem", marginBottom:".6rem", fontWeight:400 }}>
                Ferramentas que<br/><em style={{ fontStyle:"italic", color:"#94a3b8" }}>resolvem de verdade.</em>
              </h2>
              <p style={{ fontSize:"1rem", color:"#64748b", lineHeight:1.75, maxWidth:480, margin:"0 auto" }}>Cada funcionalidade existe para resolver um problema real que você já enfrentou — ou vai enfrentar.</p>
            </div>
          </Reveal>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.15rem" }}>
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:18, padding:"1.85rem", position:"relative", overflow:"hidden", cursor:"default", transition:"all .28s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform="translateY(-4px)"; el.style.boxShadow="0 10px 36px rgba(0,0,0,.08)"; el.style.borderColor="rgba(37,99,235,.2)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform=""; el.style.boxShadow=""; el.style.borderColor="#e2e8f0"; }}
                >
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:f.accent, opacity:0, transition:"opacity .28s" }}/>
                  <div style={{ width:46, height:46, borderRadius:13, background:`${f.accent}15`, border:`1px solid ${f.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", marginBottom:"1.1rem" }}>{f.icon}</div>
                  <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:"1rem", color:"#0f172a", marginBottom:".45rem", letterSpacing:"-.02em" }}>{f.title}</h3>
                  <p style={{ fontSize:".85rem", color:"#64748b", lineHeight:1.68 }}>{f.desc}</p>
                  {f.badge && <span style={{ display:"inline-block", marginTop:".8rem", fontSize:".66rem", fontWeight:800, padding:".18rem .55rem", borderRadius:999, background:"rgba(5,150,105,.08)", color:"#059669", border:"1px solid rgba(5,150,105,.18)", letterSpacing:".04em" }}>{f.badge}</span>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section style={{ padding:"6.5rem 0" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 clamp(1.25rem,4vw,3rem)" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:"3.5rem" }}>
              <span style={{ fontSize:".7rem", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:"#2563eb", background:"rgba(37,99,235,.06)", padding:".28rem .8rem", borderRadius:999, border:"1px solid rgba(37,99,235,.18)" }}>Como funciona</span>
              <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"clamp(2.2rem,4.5vw,3.2rem)", lineHeight:1.1, color:"#0f172a", marginTop:".9rem", fontWeight:400 }}>
                Do caos à clareza<br/><em style={{ fontStyle:"italic", color:"#94a3b8" }}>em 3 passos.</em>
              </h2>
            </div>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"2.25rem" }}>
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:50, height:50, borderRadius:14, background:"#2563eb", color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.15rem", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.15rem", boxShadow:"0 5px 18px rgba(37,99,235,.28)", transition:"all .28s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-3px) scale(1.06)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=""; }}
                  >{s.n}</div>
                  <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:"1rem", color:"#0f172a", marginBottom:".48rem", letterSpacing:"-.02em" }}>{s.title}</h3>
                  <p style={{ fontSize:".85rem", color:"#64748b", lineHeight:1.7 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="depoimentos" style={{ padding:"6.5rem 0", background:"#f7f9fc" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 clamp(1.25rem,4vw,3rem)" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:"3.25rem" }}>
              <span style={{ fontSize:".7rem", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:"#2563eb", background:"rgba(37,99,235,.06)", padding:".28rem .8rem", borderRadius:999, border:"1px solid rgba(37,99,235,.18)" }}>Histórias reais</span>
              <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"clamp(2.2rem,4.5vw,3.2rem)", lineHeight:1.1, color:"#0f172a", marginTop:".9rem", fontWeight:400 }}>
                Resultados reais de<br/><em style={{ fontStyle:"italic", color:"#94a3b8" }}>pessoas como você.</em>
              </h2>
            </div>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem" }}>
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:18, padding:"1.65rem", transition:"all .28s", height:"100%" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 10px 36px rgba(0,0,0,.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=""; (e.currentTarget as HTMLElement).style.boxShadow=""; }}
                >
                  <div style={{ color:"#f59e0b", fontSize:".82rem", letterSpacing:1, marginBottom:".9rem" }}>★★★★★</div>
                  <p style={{ fontSize:".865rem", color:"#475569", lineHeight:1.72, marginBottom:"1.15rem" }}>{t.text}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:".7rem" }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".95rem", flexShrink:0 }}>{t.av}</div>
                    <div>
                      <div style={{ fontSize:".83rem", fontWeight:700, color:"#0f172a" }}>{t.name}</div>
                      <div style={{ fontSize:".7rem", color:"#64748b" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section id="planos" style={{ padding:"6.5rem 0", textAlign:"center" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 clamp(1.25rem,4vw,3rem)" }}>
          <Reveal>
            <span style={{ fontSize:".7rem", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:"#2563eb", background:"rgba(37,99,235,.06)", padding:".28rem .8rem", borderRadius:999, border:"1px solid rgba(37,99,235,.18)" }}>Planos</span>
            <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"clamp(2.2rem,4.5vw,3.2rem)", lineHeight:1.1, color:"#0f172a", marginTop:".9rem", marginBottom:".6rem", fontWeight:400 }}>
              Escolha seu plano.<br/><em style={{ fontStyle:"italic", color:"#94a3b8" }}>Comece grátis por 7 dias.</em>
            </h2>
            <p style={{ fontSize:"1rem", color:"#64748b", lineHeight:1.75, maxWidth:480, margin:"0 auto" }}>Sem cartão para começar. Sem multa para cancelar. Acesso completo desde o primeiro dia.</p>

            {/* Toggle */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:".8rem", padding:".28rem .28rem .28rem .95rem", background:"#fff", border:"1px solid #e2e8f0", borderRadius:999, margin:"1.6rem auto 2.75rem", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
              <span style={{ fontSize:".82rem", fontWeight:700, color: annual ? "#94a3b8" : "#0f172a" }}>Mensal</span>
              <div style={{ width:42, height:23, borderRadius:999, background: annual ? "#2563eb" : "#e2e8f0", position:"relative", cursor:"pointer", transition:"background .28s", flexShrink:0 }} onClick={() => setAnnual(!annual)}>
                <div style={{ position:"absolute", top:2.5, left: annual ? 21.5 : 2.5, width:18, height:18, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.14)", transition:"left .25s cubic-bezier(.22,1,.36,1)" }}/>
              </div>
              <span style={{ fontSize:".82rem", fontWeight:700, color: annual ? "#0f172a" : "#94a3b8" }}>
                Anual <span style={{ fontSize:".7rem", fontWeight:800, padding:".2rem .6rem", borderRadius:999, background:"rgba(5,150,105,.09)", color:"#059669", border:"1px solid rgba(5,150,105,.18)", marginLeft:".3rem" }}>−20%</span>
              </span>
            </div>
          </Reveal>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1.15rem", maxWidth:780, margin:"0 auto" }}>
            {/* Impulso */}
            <Reveal delay={0.05}>
              <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:22, padding:"2.1rem", textAlign:"left", transition:"all .28s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 20px 70px rgba(0,0,0,.11)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=""; (e.currentTarget as HTMLElement).style.boxShadow=""; }}
              >
                <div style={{ fontSize:"1.9rem", marginBottom:".7rem" }}>⚡</div>
                <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.4rem", letterSpacing:"-.03em", color:"#0f172a", marginBottom:".38rem" }}>Impulso</h3>
                <p style={{ fontSize:".81rem", color:"#64748b", marginBottom:"1.4rem", lineHeight:1.55 }}>Para quem quer dar o primeiro grande passo e ter controle total das próprias finanças.</p>
                <div style={{ marginBottom:"1.65rem" }}>
                  <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"2.6rem", letterSpacing:"-.05em", color:"#0f172a" }}>R$ {annual ? "15" : "19"}</span>
                  <span style={{ fontSize:".8rem", color:"#64748b" }}>,90/mês · 1 usuário · cancele quando quiser</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:".55rem", marginBottom:"1.85rem" }}>
                  {["Contas ilimitadas","Até 3 cartões de crédito","Categorias personalizadas","Até 5 Metas & Sonhos","Relatórios mensais","Exportação CSV"].map(f => (
                    <div key={f} style={{ display:"flex", alignItems:"flex-start", gap:".55rem", fontSize:".83rem", color:"#475569" }}>
                      <span style={{ color:"#059669", flexShrink:0 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <Link href="/register" style={{ display:"block", textAlign:"center", padding:".88rem", borderRadius:12, background:"transparent", color:"#0f172a", fontWeight:700, fontSize:".88rem", border:"1.5px solid #e2e8f0", textDecoration:"none", transition:"all .22s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="#2563eb"; (e.currentTarget as HTMLElement).style.color="#2563eb"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="#e2e8f0"; (e.currentTarget as HTMLElement).style.color="#0f172a"; }}
                >Começar 7 dias grátis →</Link>
              </div>
            </Reveal>

            {/* Sintonia */}
            <Reveal delay={0.12}>
              <div style={{ background:"#0b1120", border:"1px solid rgba(255,255,255,.07)", borderRadius:22, padding:"2.1rem", textAlign:"left", position:"relative", overflow:"hidden", boxShadow:"0 16px 55px rgba(11,17,32,.2)", transition:"all .28s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 26px 75px rgba(11,17,32,.32)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=""; (e.currentTarget as HTMLElement).style.boxShadow="0 16px 55px rgba(11,17,32,.2)"; }}
              >
                {/* Top glow line */}
                <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:2, background:"linear-gradient(90deg,transparent,#3b82f6,#22d3ee,transparent)" }}/>
                <div style={{ position:"absolute", top:0, right:0, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.14) 0%,transparent 70%)", filter:"blur(30px)", pointerEvents:"none" }}/>

                <div style={{ position:"absolute", top:"1.35rem", right:"1.35rem", fontSize:".62rem", fontWeight:800, letterSpacing:".07em", padding:".22rem .6rem", borderRadius:999, background:"rgba(37,99,235,.14)", color:"#93c5fd", border:"1px solid rgba(37,99,235,.22)" }}>MAIS POPULAR</div>

                <div style={{ fontSize:"1.9rem", marginBottom:".7rem", position:"relative" }}>🎯</div>
                <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.4rem", letterSpacing:"-.03em", color:"#fff", marginBottom:".38rem", position:"relative" }}>Sintonia</h3>
                <p style={{ fontSize:".81rem", color:"rgba(255,255,255,.36)", marginBottom:"1.4rem", lineHeight:1.55, position:"relative" }}>Para casais e duplas que querem estar em sintonia — cada um com sua própria interface e login.</p>
                <div style={{ marginBottom:"1.65rem", position:"relative" }}>
                  <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"2.6rem", letterSpacing:"-.05em", color:"#fff" }}>R$ {annual ? "27" : "34"}</span>
                  <span style={{ fontSize:".8rem", color:"rgba(255,255,255,.35)" }}>,90/mês · 2 usuários · cancele quando quiser</span>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:".55rem", marginBottom:"1.85rem", position:"relative" }}>
                  {/* Tudo do Impulso */}
                  <div style={{ display:"flex", alignItems:"flex-start", gap:".55rem", fontSize:".83rem", color:"rgba(255,255,255,.56)" }}>
                    <span style={{ color:"#60a5fa", flexShrink:0 }}>✓</span>Tudo do Impulso
                  </div>

                  {/* 2 Usuários box */}
                  <div style={{ background:"rgba(37,99,235,.1)", border:"1px solid rgba(37,99,235,.22)", borderRadius:10, padding:".75rem 1rem", margin:".1rem 0" }}>
                    <div style={{ fontSize:".68rem", fontWeight:800, color:"#93c5fd", letterSpacing:".04em", marginBottom:".45rem" }}>👥 2 USUÁRIOS INCLUSOS</div>
                    {["Cada um com sua própria interface e login","Visão separada dos próprios lançamentos","Dashboard consolidado compartilhado","Alertas individuais de vencimento"].map(item => (
                      <div key={item} style={{ fontSize:".75rem", color:"rgba(255,255,255,.48)", display:"flex", gap:".4rem", marginBottom:".22rem" }}>
                        <span style={{ color:"#60a5fa", flexShrink:0 }}>·</span>{item}
                      </div>
                    ))}
                  </div>

                  {/* Turabot box */}
                  <div style={{ background:"rgba(5,150,105,.09)", border:"1px solid rgba(5,150,105,.25)", borderRadius:12, padding:".8rem 1rem", margin:".1rem 0" }}>
                    <div style={{ fontSize:".68rem", fontWeight:800, color:"#6ee7b7", letterSpacing:".05em", marginBottom:".6rem", display:"flex", alignItems:"center", gap:".4rem" }}>🤖 TURABOT — IA no WhatsApp</div>
                    {/* Chat mock */}
                    <div style={{ background:"rgba(0,0,0,.3)", borderRadius:10, padding:".65rem .75rem", display:"flex", flexDirection:"column", gap:".38rem" }}>
                      <div style={{ display:"flex", justifyContent:"flex-end" }}>
                        <div style={{ background:"rgba(37,99,235,.6)", color:"#e0f2fe", fontSize:".68rem", padding:".32rem .6rem", borderRadius:"10px 10px 2px 10px", maxWidth:"82%", lineHeight:1.4 }}>Gastei 45 no Uber 🚗</div>
                      </div>
                      <div style={{ display:"flex", gap:".38rem", alignItems:"flex-end" }}>
                        <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(5,150,105,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".6rem", flexShrink:0 }}>🤖</div>
                        <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.68)", fontSize:".67rem", padding:".32rem .6rem", borderRadius:"10px 10px 10px 2px", lineHeight:1.45 }}>
                          ✅ <strong>R$45 em Transporte</strong> · C6 Bank<br/><span style={{ color:"#6ee7b7" }}>Você já gastou R$180 em Uber esse mês 📊</span>
                        </div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"flex-end" }}>
                        <div style={{ background:"rgba(37,99,235,.6)", color:"#e0f2fe", fontSize:".68rem", padding:".32rem .6rem", borderRadius:"10px 10px 2px 10px" }}>Quanto sobra pro mês?</div>
                      </div>
                      <div style={{ display:"flex", gap:".38rem", alignItems:"flex-end" }}>
                        <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(5,150,105,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".6rem", flexShrink:0 }}>🤖</div>
                        <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.68)", fontSize:".67rem", padding:".32rem .6rem", borderRadius:"10px 10px 10px 2px", lineHeight:1.45 }}>
                          Você tem <strong style={{ color:"#6ee7b7" }}>R$1.840 livres</strong> até dia 30 🎯
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize:".63rem", color:"rgba(255,255,255,.28)", marginTop:".45rem", textAlign:"center" }}>Registre por texto, áudio ou foto — sem abrir o app</div>
                  </div>

                  {["Cartões ilimitados","Metas ilimitadas","Relatórios avançados","Importação CSV/OFX","Histórico completo","Suporte prioritário"].map(f => (
                    <div key={f} style={{ display:"flex", alignItems:"flex-start", gap:".55rem", fontSize:".83rem", color:"rgba(255,255,255,.56)" }}>
                      <span style={{ color:"#60a5fa", flexShrink:0 }}>✓</span>{f}
                    </div>
                  ))}
                </div>

                <Link href="/register" style={{ display:"block", textAlign:"center", padding:".88rem", borderRadius:12, background:"#2563eb", color:"#fff", fontWeight:700, fontSize:".88rem", textDecoration:"none", boxShadow:"0 4px 16px rgba(37,99,235,.36)", transition:"all .22s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="#1d4ed8"; (e.currentTarget as HTMLElement).style.transform="translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="#2563eb"; (e.currentTarget as HTMLElement).style.transform=""; }}
                >🚀 Começar 7 dias grátis</Link>
              </div>
            </Reveal>
          </div>

          {/* Trial info */}
          <Reveal delay={0.15}>
            <div style={{ display:"flex", alignItems:"center", gap:".7rem", maxWidth:480, margin:"1.85rem auto 0", padding:"1rem 1.4rem", background:"rgba(37,99,235,.05)", border:"1px solid rgba(37,99,235,.14)", borderRadius:13, fontSize:".83rem", color:"#64748b", lineHeight:1.55 }}>
              <span style={{ fontSize:"1.3rem" }}>🎁</span>
              <div><strong style={{ color:"#2563eb" }}>7 dias grátis, acesso completo.</strong> Sem cobrança nos primeiros 7 dias. Cancele quando quiser — sem perguntas, sem burocracia.</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding:"6.5rem 0", background:"#f7f9fc", textAlign:"center" }}>
        <div style={{ maxWidth:650, margin:"0 auto", padding:"0 clamp(1.25rem,4vw,3rem)" }}>
          <Reveal>
            <span style={{ fontSize:".7rem", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:"#2563eb", background:"rgba(37,99,235,.06)", padding:".28rem .8rem", borderRadius:999, border:"1px solid rgba(37,99,235,.18)" }}>FAQ</span>
            <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"clamp(1.8rem,3.5vw,2.5rem)", lineHeight:1.1, color:"#0f172a", marginTop:".9rem", marginBottom:"2.75rem", fontWeight:400 }}>Perguntas frequentes</h2>
          </Reveal>
          {FAQS.map((f, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div style={{ borderBottom:"1px solid #e2e8f0", ...(i === 0 ? { borderTop:"1px solid #e2e8f0" } : {}), overflow:"hidden" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width:"100%", padding:"1.15rem 0", background:"none", border:"none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"1rem", textAlign:"left" }}>
                  <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:".9rem", color:"#0f172a", letterSpacing:"-.01em" }}>{f.q}</span>
                  <span style={{ fontSize:"1.1rem", color: openFaq === i ? "#2563eb" : "#94a3b8", flexShrink:0, transform: openFaq === i ? "rotate(45deg)" : "none", transition:"transform .28s, color .28s", lineHeight:1 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ paddingBottom:"1.15rem", textAlign:"left" }}>
                    <p style={{ fontSize:".86rem", color:"#64748b", lineHeight:1.72 }}>{f.a}</p>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background:"#0b1120", padding:"7.5rem clamp(1.25rem,4vw,3rem)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%,rgba(37,99,235,.17) 0%,transparent 60%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)", backgroundSize:"70px 70px", maskImage:"radial-gradient(ellipse at 50% 50%,black 20%,transparent 75%)", pointerEvents:"none" }}/>
        <Reveal>
          <div style={{ position:"relative", zIndex:1 }}>
            <span style={{ fontSize:".7rem", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:"rgba(255,255,255,.42)", background:"rgba(255,255,255,.05)", padding:".28rem .8rem", borderRadius:999, border:"1px solid rgba(255,255,255,.1)" }}>Comece hoje</span>
            <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"clamp(2.2rem,5vw,3.8rem)", color:"#fff", lineHeight:1.1, maxWidth:640, margin:"1.15rem auto 1.15rem", fontWeight:400 }}>
              Você merece saber<br/>
              pra onde vai <em style={{ fontStyle:"italic", color:"#93c5fd" }}>cada real.</em>
            </h2>
            <p style={{ fontSize:"1rem", color:"rgba(255,255,255,.37)", maxWidth:420, margin:"0 auto 2.25rem", lineHeight:1.72 }}>
              Chega de fim de mês com saldo negativo e sem entender o que aconteceu. Controle real começa em 60 segundos.
            </p>
            <div style={{ display:"flex", gap:".8rem", justifyContent:"center", flexWrap:"wrap" }}>
              <Link href="/register" style={{ background:"#2563eb", color:"#fff", fontWeight:700, fontSize:".97rem", padding:".9rem 2rem", borderRadius:13, textDecoration:"none", boxShadow:"0 4px 18px rgba(37,99,235,.36)", transition:"all .22s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="#1d4ed8"; (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="#2563eb"; (e.currentTarget as HTMLElement).style.transform=""; }}
              >Criar conta gratuita →</Link>
              <a href="#planos" style={{ background:"rgba(255,255,255,.08)", color:"rgba(255,255,255,.78)", fontWeight:700, fontSize:".9rem", padding:".9rem 1.8rem", borderRadius:13, border:"1px solid rgba(255,255,255,.14)", textDecoration:"none" }}>Ver os planos</a>
            </div>
            <p style={{ fontSize:".71rem", color:"rgba(255,255,255,.2)", marginTop:"1.15rem" }}>7 dias grátis · sem cartão · cancele quando quiser</p>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"#0d1526", borderTop:"1px solid rgba(255,255,255,.05)", padding:"2.25rem 0" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 clamp(1.25rem,4vw,3rem)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1.15rem" }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:".55rem", textDecoration:"none" }}>
            <svg width="22" height="24" viewBox="0 0 120 130" fill="none">
              <path d="M60 8 L112 118 L88 118 L60 55 L32 118 L8 118 Z" fill="white" opacity="0.85"/>
              <path d="M60 55 Q70 78 88 118 L76 118 Q67 93 57 70 Z" fill="rgba(0,0,0,0.3)"/>
            </svg>
            <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1rem", color:"rgba(255,255,255,.78)", letterSpacing:"-.02em" }}>TuraTuno</span>
          </Link>
          <p style={{ fontSize:".73rem", color:"rgba(255,255,255,.2)" }}>© 2025 TuraTuno · Feito com 💙 no Brasil</p>
          <div style={{ display:"flex", gap:"1.4rem" }}>
            {["Privacidade","Termos","Suporte"].map(l => (
              <a key={l} href="#" style={{ fontSize:".73rem", color:"rgba(255,255,255,.26)", textDecoration:"none", transition:"color .2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,.68)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,.26)"}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}

// ── Mock Dashboard ────────────────────────────────────────────────────────────
function MockDashboard() {
  return (
    <div style={{ position:"relative", width:"100%", maxWidth:900, margin:"0 auto" }}>
      <div style={{ position:"absolute", bottom:-35, left:"12%", right:"12%", height:55, background:"radial-gradient(ellipse,rgba(37,99,235,.32) 0%,transparent 70%)", filter:"blur(18px)" }}/>
      <div style={{ background:"#0d1526", border:"1px solid rgba(255,255,255,.07)", borderRadius:"18px 18px 0 0", overflow:"hidden", boxShadow:"0 0 0 1px rgba(255,255,255,.04) inset,0 36px 90px rgba(0,0,0,.55)" }}>
        {/* Window bar */}
        <div style={{ padding:".8rem 1.2rem", background:"rgba(255,255,255,.03)", borderBottom:"1px solid rgba(255,255,255,.04)", display:"flex", alignItems:"center", gap:".45rem" }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:"#ef4444" }}/>
          <div style={{ width:10, height:10, borderRadius:"50%", background:"#f59e0b" }}/>
          <div style={{ width:10, height:10, borderRadius:"50%", background:"#10b981" }}/>
          <div style={{ flex:1, margin:"0 .7rem", background:"rgba(255,255,255,.05)", borderRadius:6, padding:".27rem .7rem", textAlign:"center" }}>
            <span style={{ fontSize:".6rem", color:"rgba(255,255,255,.2)" }}>app.turatuno.com.br/dashboard</span>
          </div>
        </div>
        {/* Body */}
        <div style={{ display:"grid", gridTemplateColumns:"46px 1fr", minHeight:300 }}>
          {/* Sidebar */}
          <div style={{ background:"rgba(0,0,0,.22)", borderRight:"1px solid rgba(255,255,255,.04)", padding:".8rem .55rem", display:"flex", flexDirection:"column", gap:".38rem", alignItems:"center" }}>
            {["⚡","💳","🏦","🎯","📊","⚙️"].map((ic, i) => (
              <div key={i} style={{ width:30, height:30, borderRadius:8, background: i===0 ? "rgba(37,99,235,.28)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem" }}>{ic}</div>
            ))}
          </div>
          {/* Main */}
          <div style={{ padding:"1.15rem", display:"flex", flexDirection:"column", gap:".8rem" }}>
            <div style={{ background:"linear-gradient(135deg,rgba(37,99,235,.18) 0%,rgba(37,99,235,.05) 100%)", border:"1px solid rgba(37,99,235,.18)", borderRadius:13, padding:".95rem 1.15rem", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:"linear-gradient(90deg,transparent,rgba(37,99,235,.75),transparent)" }}/>
              <div style={{ fontSize:".52rem", color:"rgba(255,255,255,.28)", fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", marginBottom:".22rem" }}>Patrimônio total</div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.5rem", color:"#fff", letterSpacing:"-.03em" }}>R$ 12.480,00</div>
              <div style={{ fontSize:".55rem", color:"rgba(255,255,255,.26)", marginTop:".12rem" }}>Atualizado agora · 3 contas</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:".45rem" }}>
              {[{l:"📈 Receitas",v:"+R$8.200",c:"#10b981"},{l:"📉 Gastos",v:"-R$3.460",c:"#ef4444"},{l:"🎯 Metas",v:"3 ativas",c:"#60a5fa"}].map((s, i) => (
                <div key={i} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.05)", borderRadius:9, padding:".55rem .7rem" }}>
                  <div style={{ fontSize:".5rem", color:"rgba(255,255,255,.26)", marginBottom:".18rem", fontWeight:700 }}>{s.l}</div>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:".78rem", fontWeight:800, color:s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
            {[{ic:"💼",d:"Salário mensal",c:"Receita · hoje",v:"+R$5.200",vc:"#10b981",bg:"rgba(16,185,129,.15)"},{ic:"🛒",d:"Supermercado",c:"Alimentação · ontem",v:"-R$284,50",vc:"#ef4444",bg:"rgba(239,68,68,.12)"},{ic:"⛽",d:"Combustível",c:"Transporte · 2 dias",v:"-R$180,00",vc:"#ef4444",bg:"rgba(245,158,11,.12)"}].map((tx, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:".55rem", padding:".48rem .6rem", background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.04)", borderRadius:8 }}>
                <div style={{ width:24, height:24, borderRadius:7, background:tx.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".68rem", flexShrink:0 }}>{tx.ic}</div>
                <div><div style={{ fontSize:".6rem", fontWeight:700, color:"#fff" }}>{tx.d}</div><div style={{ fontSize:".5rem", color:"rgba(255,255,255,.27)" }}>{tx.c}</div></div>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:".68rem", fontWeight:800, color:tx.vc, marginLeft:"auto" }}>{tx.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
