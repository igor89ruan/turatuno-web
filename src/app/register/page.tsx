"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./register.module.css";

// ── Translations ──────────────────────────────────────────────
const LANGS = {
    PT: {
        title: "Crie sua conta",
        subtitle: "Comece a controlar suas finanças hoje",
        labelName: "Nome completo",
        namePlaceholder: "João da Silva",
        loginMethod: "Método de acesso",
        phone: "📱 Telefone",
        email: "✉️ E-mail",
        labelPhone: "Número de Telefone",
        phonePlaceholder: "(11) 99999-9999",
        labelEmail: "E-mail",
        emailPlaceholder: "voce@exemplo.com",
        labelPassword: "Senha",
        passwordPlaceholder: "Mínimo 8 caracteres",
        labelConfirm: "Confirmar senha",
        confirmPlaceholder: "Repita a senha",
        profileType: "Tipo de perfil",
        personal: "🏠 Pessoal",
        business: "🏢 Empresarial",
        terms: "Concordo com os",
        termsLink: "termos de uso",
        and: "e a",
        privacyLink: "política de privacidade",
        registerBtn: "Criar conta",
        hasAccount: "Já tem uma conta?",
        login: "Entrar →",
        searchCountry: "Buscar país...",
        noCountry: "Nenhum país encontrado",
        weak: "Fraca", fair: "Razoável", good: "Boa", strong: "Forte",
    },
    EN: {
        title: "Create your account", subtitle: "Start controlling your finances today",
        labelName: "Full name", namePlaceholder: "John Smith",
        loginMethod: "Access method", phone: "📱 Phone", email: "✉️ E-mail",
        labelPhone: "Phone Number", phonePlaceholder: "(11) 99999-9999",
        labelEmail: "E-mail", emailPlaceholder: "you@example.com",
        labelPassword: "Password", passwordPlaceholder: "Minimum 8 characters",
        labelConfirm: "Confirm password", confirmPlaceholder: "Repeat password",
        profileType: "Profile type", personal: "🏠 Personal", business: "🏢 Business",
        terms: "I agree to the", termsLink: "terms of service", and: "and the", privacyLink: "privacy policy",
        registerBtn: "Create account", hasAccount: "Already have an account?", login: "Sign in →",
        searchCountry: "Search country...", noCountry: "No countries found",
        weak: "Weak", fair: "Fair", good: "Good", strong: "Strong",
    },
    ES: {
        title: "Crea tu cuenta", subtitle: "Empieza a controlar tus finanzas hoy",
        labelName: "Nombre completo", namePlaceholder: "Juan García",
        loginMethod: "Método de acceso", phone: "📱 Teléfono", email: "✉️ Correo",
        labelPhone: "Número de Teléfono", phonePlaceholder: "(11) 99999-9999",
        labelEmail: "Correo electrónico", emailPlaceholder: "tu@ejemplo.com",
        labelPassword: "Contraseña", passwordPlaceholder: "Mínimo 8 caracteres",
        labelConfirm: "Confirmar contraseña", confirmPlaceholder: "Repite la contraseña",
        profileType: "Tipo de perfil", personal: "🏠 Personal", business: "🏢 Empresarial",
        terms: "Acepto los", termsLink: "términos de servicio", and: "y la", privacyLink: "política de privacidad",
        registerBtn: "Crear cuenta", hasAccount: "¿Ya tienes cuenta?", login: "Iniciar sesión →",
        searchCountry: "Buscar país...", noCountry: "Ningún país encontrado",
        weak: "Débil", fair: "Regular", good: "Buena", strong: "Fuerte",
    },
} as const;

type LangKey = keyof typeof LANGS;

const COUNTRIES = [
    { code: "BR", name: "Brasil", dial: "+55", flag: "🇧🇷" },
    { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
    { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
    { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
    { code: "ES", name: "España", dial: "+34", flag: "🇪🇸" },
    { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
    { code: "DE", name: "Deutschland", dial: "+49", flag: "🇩🇪" },
    { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
    { code: "IT", name: "Italia", dial: "+39", flag: "🇮🇹" },
    { code: "MX", name: "México", dial: "+52", flag: "🇲🇽" },
    { code: "JP", name: "日本", dial: "+81", flag: "🇯🇵" },
    { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
    { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
    { code: "AO", name: "Angola", dial: "+244", flag: "🇦🇴" },
];

type Mode = "phone" | "email";
type Theme = "dark" | "light";
type Profile = "personal" | "business";

function getStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s as 0 | 1 | 2 | 3 | 4;
}

function RegisterForm() {
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<Mode>("email");
    const [profile, setProfile] = useState<Profile>("personal");
    const [selectedCountry, setCountry] = useState(COUNTRIES[0]);
    const [dropdownOpen, setDropdown] = useState(false);
    const [langMenuOpen, setLangMenu] = useState(false);
    const [search, setSearch] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);
    const [theme, setTheme] = useState<Theme>("dark");
    const [lang, setLang] = useState<LangKey>("PT");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const preEmail = searchParams.get("email");
        if (preEmail) {
            setEmail(preEmail);
            setMode("email");
        }
    }, [searchParams]);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const t = LANGS[lang];
    const strength = getStrength(password);
    const strengthLabels = [t.weak, t.fair, t.good, t.strong];
    const strengthColors = ["#ef4444", "#f59e0b", "#10b981", "#6366f1"];

    useEffect(() => {
        const fn = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            if (bgRef.current) bgRef.current.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
            if (gridRef.current) gridRef.current.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        };
        window.addEventListener("mousemove", fn);
        return () => window.removeEventListener("mousemove", fn);
    }, []);

    useEffect(() => {
        const fn = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) { setDropdown(false); setSearch(""); }
            if (langRef.current && !langRef.current.contains(e.target as Node)) setLangMenu(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    const filtered = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
    );

    return (
        <div className={`${styles.page} ${theme === "light" ? styles.light : ""}`}>
            <div className={styles.sceneWrapper}>
                <div ref={gridRef} className={styles.grid} />
                <div ref={bgRef} className={styles.orbs}>
                    <div className={styles.orb1} />
                    <div className={styles.orb2} />
                    <div className={styles.orb3} />
                </div>
                <div className={styles.watermark} aria-hidden>TuraTuno</div>
                <div className={styles.scanlines} />
            </div>

            <div className={styles.topBar}>
                <div ref={langRef} className={styles.langWrapper}>
                    <button className={styles.controlBtn} onClick={() => setLangMenu(!langMenuOpen)}>
                        🌐 <span>{lang}</span>
                        <svg className={`${styles.chevron} ${langMenuOpen ? styles.chevronUp : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {langMenuOpen && (
                        <div className={styles.langMenu}>
                            {(["PT", "EN", "ES"] as LangKey[]).map(l => (
                                <button key={l} className={`${styles.langOption} ${lang === l ? styles.langActive : ""}`}
                                    onClick={() => { setLang(l); setLangMenu(false); }}>
                                    {l === "PT" && "🇧🇷"} {l === "EN" && "🇺🇸"} {l === "ES" && "🇪🇸"} {l}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button className={styles.themeBtn} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </button>
            </div>

            <div className={styles.card}>
                <div className={styles.brand}>
                    <span className={styles.brandDot} />
                    <span className={styles.brandName}>TuraTuno</span>
                    <span className={styles.brandTag}>FINANCE OS</span>
                </div>

                <h1 className={styles.title}>{t.title}</h1>
                <p className={styles.subtitle}>{t.subtitle}</p>

                <form className={styles.form} onSubmit={async (e) => {
                    e.preventDefault();
                    setApiError(null);
                    if (password !== confirm) { setApiError("As senhas não coincidem."); return; }
                    setLoading(true);
                    try {
                        const res = await fetch("/api/auth/register", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name,
                                email: mode === "email" ? email : undefined,
                                phone: mode === "phone" ? `${selectedCountry.dial}${phone}` : undefined,
                                password,
                                profileType: profile,
                            }),
                        });
                        const data = await res.json();
                        if (!res.ok) { setApiError(data.error || "Erro ao criar conta."); return; }
                        setSuccess(true);
                        setTimeout(() => { window.location.href = "/login"; }, 2000);
                    } catch {
                        setApiError("Erro de conexão. Verifique sua rede.");
                    } finally {
                        setLoading(false);
                    }
                }}>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t.labelName}</label>
                        <div className={styles.inputIcon}>
                            <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                            <input type="text" placeholder={t.namePlaceholder} className={styles.input}
                                value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t.profileType}</label>
                        <div className={styles.profileToggle}>
                            <button type="button"
                                className={`${styles.profileBtn} ${profile === "personal" ? styles.profileActive : ""}`}
                                onClick={() => setProfile("personal")}>
                                {t.personal}
                            </button>
                            <button type="button"
                                className={`${styles.profileBtn} ${profile === "business" ? styles.profileActive : ""}`}
                                onClick={() => setProfile("business")}>
                                {t.business}
                            </button>
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t.loginMethod}</label>
                        <div className={styles.toggle}>
                            <button type="button" className={`${styles.toggleBtn} ${mode === "phone" ? styles.active : ""}`} onClick={() => setMode("phone")}>{t.phone}</button>
                            <button type="button" className={`${styles.toggleBtn} ${mode === "email" ? styles.active : ""}`} onClick={() => setMode("email")}>{t.email}</button>
                        </div>
                    </div>

                    {mode === "phone" && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>{t.labelPhone}</label>
                            <div className={styles.phoneRow}>
                                <div ref={dropdownRef} className={styles.countrySelector}>
                                    <button type="button" className={styles.countryBtn} onClick={() => { setDropdown(!dropdownOpen); setSearch(""); }}>
                                        <span>{selectedCountry.flag}</span>
                                        <span className={styles.dialCode}>{selectedCountry.dial}</span>
                                        <svg className={`${styles.chevron} ${dropdownOpen ? styles.chevronUp : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {dropdownOpen && (
                                        <div className={styles.dropdown}>
                                            <div className={styles.searchWrapper}>
                                                <input autoFocus type="text" placeholder={t.searchCountry} className={styles.searchInput}
                                                    value={search} onChange={e => setSearch(e.target.value)} />
                                            </div>
                                            <ul className={styles.countryList}>
                                                {filtered.map(c => (
                                                    <li key={c.code}>
                                                        <button type="button"
                                                            className={`${styles.countryOption} ${c.code === selectedCountry.code ? styles.selectedOption : ""}`}
                                                            onClick={() => { setCountry(c); setDropdown(false); setSearch(""); }}>
                                                            <span>{c.flag}</span>
                                                            <span className={styles.countryName}>{c.name}</span>
                                                            <span className={styles.dialSmall}>{c.dial}</span>
                                                        </button>
                                                    </li>
                                                ))}
                                                {filtered.length === 0 && <li className={styles.noResults}>{t.noCountry}</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <input type="tel" placeholder={t.phonePlaceholder} className={styles.phoneInput}
                                    value={phone} onChange={e => setPhone(e.target.value)} required />
                            </div>
                        </div>
                    )}

                    {mode === "email" && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>{t.labelEmail}</label>
                            <div className={styles.inputIcon}>
                                <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                                </svg>
                                <input type="email" placeholder={t.emailPlaceholder} className={styles.input}
                                    value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                        </div>
                    )}

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t.labelPassword}</label>
                        <div className={styles.passwordWrapper}>
                            <div className={styles.inputIcon}>
                                <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input type={showPw ? "text" : "password"} placeholder={t.passwordPlaceholder}
                                    className={styles.input} value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>{showPw ? "🙈" : "👁️"}</button>
                        </div>
                        {password.length > 0 && (
                            <div className={styles.strengthWrapper}>
                                <div className={styles.strengthBars}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={styles.strengthBar}
                                            style={{ background: i <= strength ? strengthColors[strength - 1] : undefined }} />
                                    ))}
                                </div>
                                <span className={styles.strengthLabel} style={{ color: strengthColors[strength - 1] }}>
                                    {strengthLabels[strength - 1]}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t.labelConfirm}</label>
                        <div className={styles.passwordWrapper}>
                            <div className={styles.inputIcon}>
                                <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                                </svg>
                                <input type={showCf ? "text" : "password"} placeholder={t.confirmPlaceholder} className={styles.input}
                                    value={confirm} onChange={e => setConfirm(e.target.value)} required />
                            </div>
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowCf(!showCf)}>{showCf ? "🙈" : "👁️"}</button>
                        </div>
                    </div>

                    {apiError && (
                        <div className={styles.errorBanner}>
                            ⚠️ {apiError}
                        </div>
                    )}

                    {success && (
                        <div className={styles.successBanner}>
                            ✅ Conta criada! Redirecionando para o login...
                        </div>
                    )}

                    <label className={styles.termsRow}>
                        <input type="checkbox" className={styles.checkbox} checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                        <span className={styles.termsText}>
                            {t.terms}{" "}
                            <a href="#" className={styles.termsLink}>{t.termsLink}</a>{" "}
                            {t.and}{" "}
                            <a href="#" className={styles.termsLink}>{t.privacyLink}</a>
                        </span>
                    </label>

                    <button type="submit" className={styles.registerBtn} disabled={!agreed || loading || success}>
                        {loading ? (
                            <span className={styles.spinner} />
                        ) : (
                            <>
                                <span>{t.registerBtn}</span>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <p className={styles.loginText}>
                    {t.hasAccount}{" "}
                    <a href="/login" className={styles.loginLink}>{t.login}</a>
                </p>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white', fontFamily: 'sans-serif' }}>
                Carregando formulário...
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}