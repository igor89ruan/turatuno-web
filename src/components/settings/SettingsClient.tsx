"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

const EMOJIS_WORKSPACE = ["💰","🏦","💎","🚀","🌟","🎯","💡","🔥","🌈","⚡","🏠","🎪"];
const CAT_EMOJIS = ["🍔","🚗","🏠","🎮","💊","📚","👗","💻","📦","✈️","🎸","🐕","☕","🍕","🛒","💈","🎬","🏋️","🌎","🎓","💼","📈","💰","🎁"];
const CAT_COLORS = ["#f43f5e","#3b82f6","#10b981","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#6366f1","#64748b","#ef4444","#22c55e","#0ea5e9"];

interface User      { id: string; name: string; email?: string; phone?: string; createdAt: string; }
interface Workspace { id: string; name: string; iconEmoji?: string; profileType: string; }
interface Category  { id: string; name: string; icon: string; colorHex: string; type: string; isDefault: boolean; _count?: { transactions: number }; }

interface Props {
  user: User; workspace: Workspace;
  categories: Category[]; isOwner: boolean;
}

type Tab = "profile" | "workspace" | "categories";

export default function SettingsClient({ user, workspace, categories: initialCategories, isOwner }: Props) {
  const [tab, setTab] = useState<Tab>("profile");
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "profile",    label: "Perfil",      emoji: "👤" },
    { id: "workspace",  label: "Workspace",   emoji: "🏗️" },
    { id: "categories", label: "Categorias",  emoji: "🏷️" },
  ];

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>⚙️ Configurações</h1>
          <p style={s.sub}>Personalize sua experiência no TuraTuno</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabsBar}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...s.tabBtn, ...(tab === t.id ? s.tabBtnActive : {}) }}>
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={s.content}>
        {tab === "profile"    && <ProfileTab    user={user} />}
        {tab === "workspace"  && <WorkspaceTab  workspace={workspace} isOwner={isOwner} />}
        {tab === "categories" && (
          <CategoriesTab
            categories={categories}
            setCategories={setCategories}
          />
        )}
      </div>
    </div>
  );
}

// ── ABA PERFIL ─────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: User }) {
  const [name, setName]             = useState(user.name);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass]       = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [msgName, setMsgName]       = useState("");
  const [msgPass, setMsgPass]       = useState("");
  const [showPass, setShowPass]     = useState(false);

  const initials = user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const memberSince = new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setLoadingName(true); setMsgName("");
    const res = await fetch("/api/settings/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoadingName(false);
    setMsgName(res.ok ? "✅ Nome atualizado!" : "❌ Erro ao atualizar.");
  }

  async function savePass(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirmPass) { setMsgPass("❌ As senhas não coincidem."); return; }
    setLoadingPass(true); setMsgPass("");
    const res = await fetch("/api/settings/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
    });
    const data = await res.json();
    setLoadingPass(false);
    if (res.ok) { setMsgPass("✅ Senha alterada com sucesso!"); setCurrentPass(""); setNewPass(""); setConfirmPass(""); }
    else setMsgPass(`❌ ${data.error}`);
  }

  return (
    <div style={s.tabContent}>
      {/* Avatar */}
      <div style={s.avatarSection}>
        <div style={s.avatarBig}>{initials}</div>
        <div>
          <p style={s.avatarName}>{user.name}</p>
          <p style={s.avatarMeta}>{user.email ?? user.phone}</p>
          <p style={s.avatarSince}>Membro desde {memberSince}</p>
        </div>
      </div>

      {/* Nome */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Informações pessoais</h3>
        <form onSubmit={saveName} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} style={s.input} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>{user.email ? "E-mail" : "Celular"}</label>
            <input value={user.email ?? user.phone ?? ""} style={{ ...s.input, opacity: 0.5, cursor: "not-allowed" }} disabled />
            <span style={s.hint}>Não é possível alterar o {user.email ? "e-mail" : "celular"} pelo app.</span>
          </div>
          {msgName && <p style={{ fontSize: "0.8rem", color: msgName.startsWith("✅") ? "#34d399" : "#f87171" }}>{msgName}</p>}
          <button type="submit" disabled={loadingName || !name.trim()} style={s.saveBtn}>
            {loadingName ? "Salvando..." : "Salvar nome"}
          </button>
        </form>
      </div>

      {/* Senha */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Alterar senha</h3>
        <form onSubmit={savePass} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Senha atual</label>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} value={currentPass} onChange={e => setCurrentPass(e.target.value)}
                style={{ ...s.input, paddingRight: "3rem" }} required />
              <button type="button" onClick={() => setShowPass(!showPass)} style={s.eyeBtn}>{showPass ? "🙈" : "👁️"}</button>
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Nova senha</label>
            <input type={showPass ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)}
              style={s.input} minLength={8} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Confirmar nova senha</label>
            <input type={showPass ? "text" : "password"} value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
              style={{ ...s.input, borderColor: confirmPass && confirmPass !== newPass ? "rgba(239,68,68,0.5)" : confirmPass && confirmPass === newPass ? "rgba(52,211,153,0.4)" : "#1a2540" }}
              required />
          </div>
          {msgPass && <p style={{ fontSize: "0.8rem", color: msgPass.startsWith("✅") ? "#34d399" : "#f87171" }}>{msgPass}</p>}
          <button type="submit" disabled={loadingPass || !currentPass || !newPass} style={s.saveBtn}>
            {loadingPass ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
      </div>

      {/* Sair */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Sessão</h3>
        <button onClick={() => signOut({ callbackUrl: "/auth/login" })} style={s.dangerBtn}>
          ↩ Sair da conta
        </button>
      </div>
    </div>
  );
}

// ── ABA WORKSPACE ──────────────────────────────────────────────────────────

function WorkspaceTab({ workspace, isOwner }: { workspace: Workspace; isOwner: boolean }) {
  const [name, setName]             = useState(workspace.name);
  const [emoji, setEmoji]           = useState(workspace.iconEmoji ?? "💰");
  const [profileType, setProfileType] = useState(workspace.profileType);
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg("");
    const res = await fetch("/api/settings/workspace", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, iconEmoji: emoji, profileType }),
    });
    setLoading(false);
    setMsg(res.ok ? "✅ Workspace atualizado!" : "❌ Erro ao atualizar.");
  }

  return (
    <div style={s.tabContent}>
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Informações do workspace</h3>
        {!isOwner && (
          <div style={s.infoBanner}>ℹ️ Somente o owner pode editar as configurações do workspace.</div>
        )}
        <form onSubmit={handleSave} style={s.form}>
          {/* Emoji */}
          <div style={s.field}>
            <label style={s.label}>Ícone</label>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.4rem" }}>
              {EMOJIS_WORKSPACE.map(e => (
                <button key={e} type="button" disabled={!isOwner} onClick={() => setEmoji(e)}
                  style={{ width: "38px", height: "38px", borderRadius: "10px", border: `1px solid ${emoji === e ? "rgba(59,130,246,0.5)" : "#1a2540"}`, background: emoji === e ? "rgba(59,130,246,0.15)" : "#080d1a", fontSize: "1.2rem", cursor: isOwner ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div style={s.field}>
            <label style={s.label}>Nome do workspace</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", fontSize: "1rem" }}>{emoji}</span>
              <input value={name} onChange={e => setName(e.target.value)}
                style={{ ...s.input, paddingLeft: "2.75rem" }}
                disabled={!isOwner} required />
            </div>
          </div>

          {/* Tipo */}
          <div style={s.field}>
            <label style={s.label}>Tipo de perfil</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {[{ v: "personal", e: "👤", l: "Pessoal" }, { v: "business", e: "💼", l: "Negócios" }].map(opt => (
                <button key={opt.v} type="button" disabled={!isOwner} onClick={() => setProfileType(opt.v)}
                  style={{ flex: 1, padding: "0.85rem", borderRadius: "12px", border: `1px solid ${profileType === opt.v ? "rgba(59,130,246,0.4)" : "#1a2540"}`, background: profileType === opt.v ? "rgba(59,130,246,0.1)" : "#080d1a", cursor: isOwner ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <span style={{ fontSize: "1.5rem" }}>{opt.e}</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: profileType === opt.v ? "#60a5fa" : "#5d7aaa" }}>{opt.l}</span>
                </button>
              ))}
            </div>
          </div>

          {msg && <p style={{ fontSize: "0.8rem", color: msg.startsWith("✅") ? "#34d399" : "#f87171" }}>{msg}</p>}
          {isOwner && (
            <button type="submit" disabled={loading} style={s.saveBtn}>
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

// ── ABA CATEGORIAS ─────────────────────────────────────────────────────────

function CategoriesTab({ categories, setCategories }: {
  categories: Category[];
  setCategories: (cats: Category[]) => void;
}) {
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Category | null>(null);
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");

  const expense = categories.filter(c => c.type === "expense");
  const income  = categories.filter(c => c.type === "income");
  const filtered = filterType === "all" ? categories : categories.filter(c => c.type === filterType);

  async function handleSave(data: any) {
    if (editing) {
      const res = await fetch(`/api/categories/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setCategories(categories.map(c => c.id === editing.id ? { ...c, ...updated } : c));
    } else {
      const res = await fetch("/api/categories", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const created = await res.json();
      setCategories([...categories, created]);
    }
    setShowModal(false); setEditing(null);
  }

  async function handleDelete(id: string) {
    const cat = categories.find(c => c.id === id);
    if (cat?.isDefault) { alert("Categorias padrão não podem ser removidas."); return; }
    if (!confirm("Remover esta categoria?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) setCategories(categories.filter(c => c.id !== id));
  }

  return (
    <div style={s.tabContent}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: "0.35rem", background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.25rem" }}>
          {(["all","expense","income"] as const).map(f => (
            <button key={f} onClick={() => setFilterType(f)}
              style={{ ...s.filterBtn, ...(filterType === f ? s.filterBtnActive : {}) }}>
              {f === "all" ? `Todas (${categories.length})` : f === "expense" ? `📉 Despesas (${expense.length})` : `📈 Receitas (${income.length})`}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} style={s.saveBtn}>
          + Nova categoria
        </button>
      </div>

      {/* Grid */}
      <div style={s.catGrid}>
        {filtered.map(cat => (
          <div key={cat.id} style={{ ...s.catCard, borderColor: cat.colorHex + "44" }}>
            <div style={{ ...s.catCardIcon, background: cat.colorHex + "20", border: `1px solid ${cat.colorHex}44` }}>
              {cat.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={s.catCardName}>{cat.name}</p>
              <p style={{ fontSize: "0.68rem", color: "#5d7aaa", margin: 0 }}>
                {cat._count?.transactions ?? 0} transações
                {cat.isDefault && " · padrão"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.2rem" }}>
              <button onClick={() => { setEditing(cat); setShowModal(true); }} style={s.actionBtn}>✏️</button>
              {!cat.isDefault && (
                <button onClick={() => handleDelete(cat.id)} style={s.actionBtn}>🗑️</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <CategoryModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ── MODAL CATEGORIA ────────────────────────────────────────────────────────

function CategoryModal({ initial, onClose, onSave }: {
  initial: Category | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [name, setName]       = useState(initial?.name ?? "");
  const [type, setType]       = useState(initial?.type ?? "expense");
  const [icon, setIcon]       = useState(initial?.icon ?? "📦");
  const [color, setColor]     = useState(initial?.colorHex ?? "#64748b");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSave({ name, type, icon, colorHex: color });
    setLoading(false);
  }

  return (
    <div style={m.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={m.modal}>
        <div style={m.head}>
          <h2 style={m.title}>{initial ? "Editar categoria" : "Nova categoria"}</h2>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>

        {/* Preview */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", background: "#080d1a", borderRadius: "12px", border: `1px solid ${color}44`, marginBottom: "1.25rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: color + "25", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
            {icon}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#e2eeff", margin: 0 }}>{name || "Minha Categoria"}</p>
            <p style={{ fontSize: "0.7rem", color: color, fontWeight: 700, margin: 0 }}>{type === "expense" ? "📉 Despesa" : "📈 Receita"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={m.form}>
          {/* Tipo — só para nova categoria */}
          {!initial && (
            <div style={m.field}>
              <label style={m.label}>Tipo</label>
              <div style={{ display: "flex", gap: "0.5rem", background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.25rem" }}>
                {(["expense","income"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "0.8rem", transition: "all 0.15s",
                      background: type === t ? (t === "expense" ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)") : "transparent",
                      color: type === t ? (t === "expense" ? "#f87171" : "#34d399") : "#5d7aaa",
                    }}>
                    {t === "expense" ? "📉 Despesa" : "📈 Receita"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nome */}
          <div style={m.field}>
            <label style={m.label}>Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Alimentação, Salário..." style={m.input} required />
          </div>

          {/* Emoji */}
          <div style={m.field}>
            <label style={m.label}>Ícone</label>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.35rem" }}>
              {CAT_EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setIcon(e)}
                  style={{ width: "36px", height: "36px", borderRadius: "9px", border: `1px solid ${icon === e ? "rgba(59,130,246,0.5)" : "#1a2540"}`, background: icon === e ? "rgba(59,130,246,0.15)" : "#080d1a", fontSize: "1.1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transform: icon === e ? "scale(1.1)" : "scale(1)", transition: "all 0.15s" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div style={m.field}>
            <label style={m.label}>Cor</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
              {CAT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: "none", cursor: "pointer", transition: "all 0.2s", boxShadow: color === c ? `0 0 0 3px #050810, 0 0 0 5px ${c}` : "none", transform: color === c ? "scale(1.15)" : "scale(1)" }} />
              ))}
            </div>
          </div>

          <div style={m.actions}>
            <button type="button" onClick={onClose} style={m.cancelBtn}>Cancelar</button>
            <button type="submit" disabled={loading || !name.trim()} style={{ ...m.saveBtn, opacity: loading || !name.trim() ? 0.7 : 1 }}>
              {loading ? "Salvando..." : initial ? "Salvar" : "Criar categoria"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  sub: { fontSize: "0.82rem", color: "#5d7aaa", marginTop: "0.2rem" },
  tabsBar: { display: "flex", gap: "0.35rem", background: "#0c1221", border: "1px solid #1a2540", borderRadius: "14px", padding: "0.35rem" },
  tabBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.6rem 1rem", borderRadius: "10px", border: "none", background: "transparent", color: "#5d7aaa", fontSize: "0.83rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s" },
  tabBtnActive: { background: "rgba(59,130,246,0.15)", color: "#60a5fa", boxShadow: "0 0 0 1px rgba(59,130,246,0.2)" },
  content: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "20px", overflow: "hidden" },
  tabContent: { padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.75rem" },
  avatarSection: { display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem", background: "linear-gradient(135deg,rgba(59,130,246,0.08),transparent)", borderRadius: "14px", border: "1px solid rgba(59,130,246,0.15)" },
  avatarBig: { width: "60px", height: "60px", borderRadius: "16px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 800, color: "#fff", flexShrink: 0 },
  avatarName: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#e2eeff", margin: 0 },
  avatarMeta: { fontSize: "0.78rem", color: "#5d7aaa", margin: "0.2rem 0" },
  avatarSince: { fontSize: "0.7rem", color: "#38506e", margin: 0 },
  section: { display: "flex", flexDirection: "column", gap: "1rem" },
  sectionTitle: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#e2eeff", margin: 0, paddingBottom: "0.75rem", borderBottom: "1px solid #1a2540" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.78rem", fontWeight: 700, color: "#5d7aaa", letterSpacing: "0.02em" },
  input: { background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.75rem 1rem", color: "#e2eeff", fontSize: "0.88rem", fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none" },
  hint: { fontSize: "0.7rem", color: "#38506e" },
  eyeBtn: { position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" },
  saveBtn: { padding: "0.75rem 1.5rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.85rem", alignSelf: "flex-start", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" },
  dangerBtn: { padding: "0.7rem 1.25rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "0.85rem", alignSelf: "flex-start" },
  infoBanner: { padding: "0.75rem 1rem", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "10px", fontSize: "0.8rem", color: "#60a5fa" },
  filterBtn: { padding: "0.35rem 0.85rem", borderRadius: "7px", border: "none", background: "transparent", color: "#5d7aaa", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" },
  filterBtnActive: { background: "rgba(59,130,246,0.2)", color: "#60a5fa" },
  catGrid: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  catCard: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "#080d1a", border: "1px solid", borderRadius: "12px" },
  catCardIcon: { width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 },
  catCardName: { fontWeight: 700, fontSize: "0.85rem", color: "#e2eeff", margin: 0 },
  actionBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: "0.25rem", borderRadius: "6px", opacity: 0.5 },
};

const m: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(5,8,16,0.85)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
  modal: { background: "#0c1221", border: "1px solid #1a2540", borderRadius: "24px", padding: "2rem", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  title: { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.04em", color: "#e2eeff", margin: 0 },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#5d7aaa", fontSize: "1.1rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.45rem" },
  label: { fontSize: "0.78rem", fontWeight: 700, color: "#5d7aaa", letterSpacing: "0.02em" },
  input: { background: "#080d1a", border: "1px solid #1a2540", borderRadius: "10px", padding: "0.75rem 1rem", color: "#e2eeff", fontSize: "0.88rem", fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none" },
  actions: { display: "flex", gap: "0.75rem", marginTop: "0.25rem" },
  cancelBtn: { flex: 1, padding: "0.8rem", background: "transparent", color: "#5d7aaa", border: "1px solid #1a2540", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "0.88rem" },
  saveBtn: { flex: 2, padding: "0.8rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "0.88rem", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" },
};
