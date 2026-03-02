"use client";
import { useLanguage, type Lang } from "@/lib/language-context";

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: "pt", flag: "🇧🇷", label: "PT" },
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
];

export default function LanguageSelector({ collapsed }: { collapsed?: boolean }) {
  const { lang, setLang } = useLanguage();

  return (
    <div style={{ display: "flex", gap: "0.4rem" }}>
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.label}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
            padding: "0.5rem 0.2rem",
            borderRadius: 10,
            border: lang === l.code ? "1px solid var(--accent-color)" : "1px solid var(--border-main)",
            background: lang === l.code ? "var(--accent-active)" : "transparent",
            color: lang === l.code ? "var(--text-primary)" : "var(--text-secondary)",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
          onMouseEnter={e => {
            if (lang !== l.code) {
              (e.currentTarget as HTMLElement).style.background = "var(--accent-light)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-active)";
            }
          }}
          onMouseLeave={e => {
            if (lang !== l.code) {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-main)";
            }
          }}
        >
          <span style={{ fontSize: collapsed ? "0.85rem" : "1.1rem", lineHeight: 1 }}>{l.flag}</span>
        </button>
      ))}
    </div>
  );
}
