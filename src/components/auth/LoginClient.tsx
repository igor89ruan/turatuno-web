"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      identifier: email, password, redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("E-mail ou senha incorretos. Tente novamente.");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #0b1120; -webkit-font-smoothing: antialiased; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px rgba(13,21,38,1) inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", alignItems:"stretch" }}>

        {/* ── LEFT: FORM ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"3rem clamp(2rem,5vw,5rem)", position:"relative", overflow:"hidden" }}>
          {/* Grid bg */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)", backgroundSize:"68px 68px", maskImage:"radial-gradient(ellipse at 40% 50%,black 20%,transparent 70%)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", width:500, height:500, top:-100, left:-100, background:"radial-gradient(circle,rgba(37,99,235,.18) 0%,transparent 70%)", filter:"blur(70px)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", width:350, height:350, bottom:-80, right:-60, background:"radial-gradient(circle,rgba(5,150,105,.1) 0%,transparent 70%)", filter:"blur(60px)", pointerEvents:"none" }}/>

          <div style={{ position:"relative", zIndex:1, maxWidth:460, width:"100%", animation:"slideUp .7s ease both" }}>
            {/* Logo */}
            <Link href="/" style={{ display:"flex", alignItems:"center", gap:".55rem", marginBottom:"3.5rem", textDecoration:"none" }}>
              <div style={{ width:38, height:38, borderRadius:11, background:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(37,99,235,.4)", flexShrink:0 }}>
                <svg width="18" height="20" viewBox="0 0 120 130" fill="none">
                  <path d="M60 8 L112 118 L88 118 L60 55 L32 118 L8 118 Z" fill="white"/>
                  <path d="M60 55 Q70 78 88 118 L76 118 Q67 93 57 70 Z" fill="rgba(0,0,0,0.28)"/>
                </svg>
              </div>
              <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.2rem", letterSpacing:"-.03em", color:"#fff" }}>TuraTuno</span>
            </Link>

            <h1 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"2.4rem", color:"#fff", lineHeight:1.12, marginBottom:".6rem", fontWeight:400 }}>
              Bem-vindo<br/>de <em style={{ fontStyle:"italic", background:"linear-gradient(130deg,#93c5fd,#a5f3fc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>volta.</em>
            </h1>
            <p style={{ fontSize:".9rem", color:"rgba(255,255,255,.65)", marginBottom:"2.25rem", lineHeight:1.65 }}>Entre na sua conta e retome o controle das suas finanças onde parou.</p>

            {error && (
              <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:10, padding:".75rem 1rem", marginBottom:"1rem", fontSize:".82rem", color:"#fca5a5" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:".4rem" }}>
                <label style={{ fontSize:".78rem", fontWeight:700, color:"rgba(255,255,255,.72)", letterSpacing:".02em" }}>E-mail</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                  placeholder="seu@email.com"
                  style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:11, padding:".85rem 1rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:".92rem", color:"#fff", outline:"none" }}
                  onFocus={e => { e.target.style.borderColor="rgba(37,99,235,.6)"; e.target.style.background="rgba(37,99,235,.07)"; }}
                  onBlur={e => { e.target.style.borderColor="rgba(255,255,255,.1)"; e.target.style.background="rgba(255,255,255,.05)"; }}
                />
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:".4rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <label style={{ fontSize:".78rem", fontWeight:700, color:"rgba(255,255,255,.72)", letterSpacing:".02em" }}>Senha</label>
                  <Link href="/auth/forgot-password" style={{ fontSize:".75rem", color:"rgba(255,255,255,.58)", fontWeight:600, textDecoration:"none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color="rgba(37,99,235,.9)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,.35)"}
                  >Esqueci a senha</Link>
                </div>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                  placeholder="••••••••"
                  style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:11, padding:".85rem 1rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:".92rem", color:"#fff", outline:"none" }}
                  onFocus={e => { e.target.style.borderColor="rgba(37,99,235,.6)"; e.target.style.background="rgba(37,99,235,.07)"; }}
                  onBlur={e => { e.target.style.borderColor="rgba(255,255,255,.1)"; e.target.style.background="rgba(255,255,255,.05)"; }}
                />
              </div>

              <button type="submit" disabled={loading} style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:12, padding:".9rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:".95rem", cursor:loading ? "not-allowed" : "pointer", opacity:loading ? .7 : 1, boxShadow:"0 4px 18px rgba(37,99,235,.35)", letterSpacing:"-.01em", marginTop:".25rem", transition:"all .22s" }}>
                {loading ? "Entrando..." : "Entrar na minha conta →"}
              </button>

              <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,.08)" }}/>
                <span style={{ fontSize:".72rem", color:"rgba(255,255,255,.52)", fontWeight:600 }}>ou continue com</span>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,.08)" }}/>
              </div>

              <button type="button" onClick={handleGoogle} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:11, padding:".8rem", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:".85rem", fontWeight:600, color:"rgba(255,255,255,.65)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:".55rem", transition:"all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.09)"; (e.currentTarget as HTMLElement).style.color="#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.05)"; (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,.65)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Entrar com Google
              </button>
            </form>

            <p style={{ textAlign:"center", fontSize:".8rem", color:"rgba(255,255,255,.58)", marginTop:"1.5rem" }}>
              Não tem conta?{" "}
              <Link href="/register" style={{ color:"rgba(37,99,235,.9)", fontWeight:700, textDecoration:"none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color="#60a5fa"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color="rgba(37,99,235,.9)"}
              >Criar conta grátis →</Link>
            </p>
          </div>
        </div>

        {/* ── RIGHT: PREVIEW ── */}
        <div style={{ width:440, flexShrink:0, background:"#060c1a", borderLeft:"1px solid rgba(255,255,255,.05)", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"3rem 2.5rem", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.1) 0%,transparent 70%)", filter:"blur(60px)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
          <div style={{ position:"relative", zIndex:1, width:"100%", animation:"slideUp .7s ease .15s both" }}>
            <p style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:"1.35rem", color:"#fff", marginBottom:".4rem", fontWeight:400, textAlign:"center" }}>Seu dinheiro,<br/>organizado.</p>
            <p style={{ fontSize:".78rem", color:"rgba(255,255,255,.58)", textAlign:"center", marginBottom:"2rem", lineHeight:1.55 }}>Veja tudo em um lugar. Contas, cartões, metas e relatórios — sempre à mão.</p>

            {/* Mini dashboard */}
            <div style={{ background:"#0d1526", border:"1px solid rgba(255,255,255,.07)", borderRadius:16, overflow:"hidden", boxShadow:"0 24px 70px rgba(0,0,0,.6)" }}>
              <div style={{ padding:".65rem 1rem", background:"rgba(255,255,255,.03)", borderBottom:"1px solid rgba(255,255,255,.04)", display:"flex", alignItems:"center", gap:".4rem" }}>
                {["#ef4444","#f59e0b","#10b981"].map((c, i) => <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:c }}/>)}
              </div>
              <div style={{ padding:"1rem", display:"flex", flexDirection:"column", gap:".65rem" }}>
                <div style={{ background:"linear-gradient(135deg,rgba(37,99,235,.2),rgba(37,99,235,.05))", border:"1px solid rgba(37,99,235,.18)", borderRadius:11, padding:".85rem 1rem" }}>
                  <div style={{ fontSize:".5rem", color:"rgba(255,255,255,.3)", fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", marginBottom:".2rem" }}>Patrimônio total</div>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"1.35rem", color:"#fff", letterSpacing:"-.03em" }}>R$ 12.480,00</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".45rem" }}>
                  {[{l:"Receitas",v:"+R$8.200",c:"#10b981"},{l:"Gastos",v:"-R$3.460",c:"#ef4444"}].map((s, i) => (
                    <div key={i} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.05)", borderRadius:9, padding:".55rem .7rem" }}>
                      <div style={{ fontSize:".48rem", color:"rgba(255,255,255,.28)", marginBottom:".18rem", fontWeight:700 }}>{s.l}</div>
                      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:".75rem", fontWeight:800, color:s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {[{ic:"💼",d:"Salário",c:"hoje",v:"+R$5.200",vc:"#10b981"},{ic:"🛒",d:"Mercado",c:"ontem",v:"-R$284",vc:"#ef4444"},{ic:"⛽",d:"Combustível",c:"2 dias",v:"-R$180",vc:"#ef4444"}].map((tx, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:".45rem", padding:".42rem .55rem", background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.04)", borderRadius:7 }}>
                    <div style={{ width:22, height:22, borderRadius:6, background:"rgba(37,99,235,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".62rem", flexShrink:0 }}>{tx.ic}</div>
                    <div>
                      <div style={{ fontSize:".58rem", fontWeight:700, color:"#fff" }}>{tx.d}</div>
                      <div style={{ fontSize:".48rem", color:"rgba(255,255,255,.28)" }}>{tx.c}</div>
                    </div>
                    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:".62rem", fontWeight:800, color:tx.vc, marginLeft:"auto" }}>{tx.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", gap:".65rem", marginTop:"1.25rem", flexWrap:"wrap", justifyContent:"center" }}>
              {[{bg:"rgba(16,185,129,.08)",bc:"rgba(16,185,129,.18)",c:"#6ee7b7",t:"🔐 Criptografado"},{bg:"rgba(37,99,235,.08)",bc:"rgba(37,99,235,.18)",c:"#93c5fd",t:"🚫 Sem anúncios"},{bg:"rgba(245,158,11,.08)",bc:"rgba(245,158,11,.18)",c:"#fcd34d",t:"🇧🇷 Feito no Brasil"}].map((b, i) => (
                <div key={i} style={{ background:b.bg, border:`1px solid ${b.bc}`, borderRadius:8, padding:".35rem .7rem", fontSize:".68rem", color:b.c, fontWeight:700 }}>{b.t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
