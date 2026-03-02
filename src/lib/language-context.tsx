"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "./translations";

export type Lang = "pt" | "en" | "es";
type TranslationKey = keyof typeof translations.pt;

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}>({ lang: "pt", setLang: () => {}, t: (k) => k as string });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const stored = localStorage.getItem("tt-lang") as Lang | null;
    if (stored === "pt" || stored === "en" || stored === "es") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("tt-lang", l);
  };

  const t = (key: TranslationKey): string => translations[lang][key] ?? translations.pt[key] ?? key as string;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
