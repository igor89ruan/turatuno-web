"use client";

import { useState, useRef } from "react";
import { useLanguage } from "@/lib/language-context";

interface Props {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  onClose: () => void;
  onUpdated: (name: string, avatarUrl: string | null) => void;
}

function resizeImage(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileModal({ userId, name, email, phone, avatarUrl, onClose, onUpdated }: Props) {
  const { t } = useLanguage();
  const [nameVal, setNameVal] = useState(name);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(avatarUrl);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [avatarMsg, setAvatarMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleNameSave() {
    if (nameVal.trim().length < 2) return;
    setSavingName(true);
    setNameMsg("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameVal.trim() }),
      });
      if (res.ok) {
        setNameMsg(t("saved"));
        onUpdated(nameVal.trim(), previewAvatar);
        setTimeout(() => setNameMsg(""), 2000);
      } else {
        const d = await res.json();
        setNameMsg(d.error || "Erro");
      }
    } finally {
      setSavingName(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await resizeImage(file, 400);
      setPreviewAvatar(b64);
      setPendingAvatar(b64);
      setAvatarMsg("");
    } catch {
      setAvatarMsg("Erro ao processar imagem.");
    }
  }

  async function handleAvatarSave() {
    if (!pendingAvatar) return;
    setSavingAvatar(true);
    setAvatarMsg("");
    try {
      const res = await fetch("/api/user/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: pendingAvatar }),
      });
      if (res.ok) {
        setAvatarMsg(t("saved"));
        setPendingAvatar(null);
        onUpdated(nameVal.trim(), previewAvatar);
        setTimeout(() => setAvatarMsg(""), 2000);
      } else {
        const d = await res.json();
        setAvatarMsg(d.error || "Erro");
      }
    } finally {
      setSavingAvatar(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.7rem 0.9rem",
    background: "var(--bg-input)",
    border: "1px solid var(--border-main)",
    borderRadius: 10,
    color: "var(--text-primary)",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--text-secondary)",
    marginBottom: "0.35rem",
    display: "block",
    letterSpacing: "0.02em",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--modal-bg)",
          border: "1px solid var(--border-main)",
          borderRadius: 20,
          padding: "1.75rem",
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            {t("editProfile")}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", padding: "4px 6px", borderRadius: 6 }}
          >✕</button>
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: previewAvatar ? "transparent" : "linear-gradient(135deg, #2563eb, #06b6d4)",
              border: "3px solid var(--accent-color)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: 800,
              color: "#fff",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onClick={() => fileRef.current?.click()}
          >
            {previewAvatar
              ? <img src={previewAvatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : name[0]?.toUpperCase()
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--accent-color)",
              background: "var(--accent-light)",
              border: "1px solid var(--border-active)",
              borderRadius: 8,
              padding: "0.35rem 0.85rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("changePhoto")}
          </button>
          {pendingAvatar && (
            <button
              onClick={handleAvatarSave}
              disabled={savingAvatar}
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#fff",
                background: "#2563eb",
                border: "none",
                borderRadius: 8,
                padding: "0.4rem 1rem",
                cursor: savingAvatar ? "not-allowed" : "pointer",
                opacity: savingAvatar ? 0.7 : 1,
                fontFamily: "inherit",
              }}
            >
              {savingAvatar ? t("saving") : t("save") + " foto"}
            </button>
          )}
          {avatarMsg && (
            <span style={{ fontSize: "0.75rem", color: avatarMsg === t("saved") ? "#10b981" : "#ef4444" }}>
              {avatarMsg}
            </span>
          )}
        </div>

        {/* Name field */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={labelStyle}>{t("name")}</label>
          <input
            style={inputStyle}
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onFocus={e => { e.target.style.borderColor = "rgba(37,99,235,.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,.1)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border-main)"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Email (read-only) */}
        {email && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={labelStyle}>
              {t("email")} <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>({t("notEditable")})</span>
            </label>
            <input style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} value={email} readOnly />
          </div>
        )}

        {/* Phone (read-only) */}
        {phone && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={labelStyle}>
              {t("phone")} <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>({t("notEditable")})</span>
            </label>
            <input style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} value={phone} readOnly />
          </div>
        )}

        {/* Save name actions */}
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button
            onClick={handleNameSave}
            disabled={savingName || nameVal.trim().length < 2}
            style={{
              flex: 1,
              padding: "0.8rem",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: "0.9rem",
              fontWeight: 800,
              cursor: savingName || nameVal.trim().length < 2 ? "not-allowed" : "pointer",
              opacity: savingName || nameVal.trim().length < 2 ? 0.6 : 1,
              fontFamily: "inherit",
              boxShadow: "0 4px 14px rgba(37,99,235,.35)",
              transition: "all .2s",
            }}
          >
            {savingName ? t("saving") : t("save")}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "0.8rem 1.25rem",
              background: "transparent",
              border: "1px solid var(--border-main)",
              borderRadius: 12,
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("cancel")}
          </button>
        </div>

        {nameMsg && (
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: nameMsg === t("saved") ? "#10b981" : "#ef4444", margin: 0 }}>
            {nameMsg}
          </p>
        )}
      </div>
    </div>
  );
}
