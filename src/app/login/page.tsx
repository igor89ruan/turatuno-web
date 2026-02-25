"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

// ── Translations ─────────────────────────────────────────────
const LANGS = {
    PT: {
        title: "Acesse sua conta",
        subtitle: "Controle financeiro inteligente",
        phone: "📱 Telefone",
        email: "✉️ E-mail",
        labelPhone: "Número de Telefone",
        labelEmail: "E-mail",
        labelPassword: "Senha",
        forgot: "Esqueci a senha",
        phonePlaceholder: "(11) 99999-9999",
        emailPlaceholder: "voce@exemplo.com",
        passwordPlaceholder: "••••••••",
        loginBtn: "Entrar",
        orWith: "ou entre com",
        noAccount: "Não tem conta?",
        register: "Criar conta gratuita →",
        searchCountry: "Buscar país...",
        noCountry: "Nenhum país encontrado",
        errInvalid: "Senha incorreta. Tente novamente.",
        errGeneric: "Erro ao fazer login. Tente novamente.",
        errNotFound: "Nenhuma conta encontrada com este e-mail/telefone.",
        notFoundHint: "Deseja criar uma conta?   ",
        notFoundCta: "Cadastrar agora →",
        googleComingSoon: "Login com Google em breve.",
        appleComingSoon: "Login com Apple em breve.",
    },
    EN: {
        title: "Welcome back",
        subtitle: "Smart financial control",
        phone: "📱 Phone",
        email: "✉️ E-mail",
        labelPhone: "Phone Number",
        labelEmail: "E-mail",
        labelPassword: "Password",
        forgot: "Forgot password",
        phonePlaceholder: "(11) 99999-9999",
        emailPlaceholder: "you@example.com",
        passwordPlaceholder: "••••••••",
        loginBtn: "Sign in",
        orWith: "or continue with",
        noAccount: "Don't have an account?",
        register: "Create free account →",
        searchCountry: "Search country...",
        noCountry: "No countries found",
        errInvalid: "Wrong password. Please try again.",
        errGeneric: "Login error. Please try again.",
        errNotFound: "No account found with this email/phone.",
        notFoundHint: "Want to create an account?   ",
        notFoundCta: "Register now →",
        googleComingSoon: "Google login coming soon.",
        appleComingSoon: "Apple login coming soon.",
    },
    ES: {
        title: "Bienvenido de nuevo",
        subtitle: "Control financiero inteligente",
        phone: "📱 Teléfono",
        email: "✉️ Correo",
        labelPhone: "Número de Teléfono",
        labelEmail: "Correo electrónico",
        labelPassword: "Contraseña",
        forgot: "Olvidé mi contraseña",
        phonePlaceholder: "(11) 99999-9999",
        emailPlaceholder: "tu@ejemplo.com",
        passwordPlaceholder: "••••••••",
        loginBtn: "Iniciar sesión",
        orWith: "o continúa con",
        noAccount: "¿No tienes cuenta?",
        register: "Crear cuenta gratuita →",
        searchCountry: "Buscar país...",
        noCountry: "Ningún país encontrado",
        errInvalid: "Contraseña incorrecta. Inténtalo de nuevo.",
        errGeneric: "Error al iniciar sesión. Inténtalo de nuevo.",
        errNotFound: "No se encontró ninguna cuenta con este correo/teléfono.",
        notFoundHint: "¿Deseas crear una cuenta?   ",
        notFoundCta: "Registrarse ahora →",
        googleComingSoon: "Login con Google próximamente.",
        appleComingSoon: "Login con Apple próximamente.",
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
    { code: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴" },
    { code: "CL", name: "Chile", dial: "+56", flag: "🇨🇱" },
    { code: "JP", name: "日本", dial: "+81", flag: "🇯🇵" },
    { code: "CN", name: "中国", dial: "+86", flag: "🇨🇳" },
    { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
    { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
    { code: "AO", name: "Angola", dial: "+244", flag: "🇦🇴" },
    { code: "MZ", name: "Moçambique", dial: "+258", flag: "🇲🇿" },
];

type LoginMode = "phone" | "email";
type Theme = "dark" | "light";

function LoginContent() {
    const router = useRouter();

    const [mode, setMode] = useState<LoginMode>("email");
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [theme, setTheme] = useState<Theme>("dark");
    const [lang, setLang] = useState<LangKey>("PT");

    // Form state
    const [identifier, setIdentifier] = useState(""); // email or phone
    const [phone, setPhone] = useState("");  // raw phone number
    const [password, setPassword] = useState("");

    // API state
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false); // user doesn't exist

    const dropdownRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const t = LANGS[lang];

    // Parallax
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            if (bgRef.current) bgRef.current.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
            if (gridRef.current) gridRef.current.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        function close(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false); setSearch("");
            }
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setLangMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const filtered = COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
    );

    // The identifier sent to NextAuth: either typed email, or dial+phone for phone mode
    const loginIdentifier = mode === "email"
        ? identifier
        : `${selectedCountry.dial}${phone}`;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setApiError(null);
        setNotFound(false);
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                redirect: false,
                identifier: loginIdentifier,
                password,
            });

            if (result?.error === "USER_NOT_FOUND") {
                // User doesn't exist → highlight register link or auto-redirect
                setNotFound(true);
            } else if (result?.error) {
                setApiError(t.errInvalid);
            } else if (result?.ok) {
                router.push("/dashboard");
            }
        } catch {
            setApiError(t.errGeneric);
        } finally {
            setLoading(false);
        }
    }

    function handleGoogleSignIn() {
        const googleConfigured = !!(process.env.NEXT_PUBLIC_GOOGLE_CONFIGURED);
        if (!googleConfigured) {
            // Google not yet configured — open register page with pre-filled email
            const dest = identifier
                ? `/register?email=${encodeURIComponent(identifier)}`
                : "/register";
            router.push(dest);
        } else {
            signIn("google", { callbackUrl: "/dashboard" });
        }
    }

    function handleAppleSignIn() {
        const appleConfigured = !!(process.env.NEXT_PUBLIC_APPLE_CONFIGURED);
        if (!appleConfigured) {
            // Apple not yet configured — open register page with pre-filled email
            const dest = identifier
                ? `/register?email=${encodeURIComponent(identifier)}`
                : "/register";
            router.push(dest);
        } else {
            signIn("apple", { callbackUrl: "/dashboard" });
        }
    }

    return (
        <div className={`${styles.page} ${theme === "light" ? styles.light : ""}`}>
            {/* ── Parallax scene ── */}
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

            {/* ── Top-right control bar ── */}
            <div className={styles.topBar}>
                {/* Language switcher */}
                <div ref={langRef} className={styles.langWrapper}>
                    <button
                        className={styles.controlBtn}
                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                        title="Idioma / Language"
                    >
                        🌐 <span>{lang}</span>
                        <svg className={`${styles.chevron} ${langMenuOpen ? styles.chevronUp : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {langMenuOpen && (
                        <div className={styles.langMenu}>
                            {(["PT", "EN", "ES"] as LangKey[]).map((l) => (
                                <button
                                    key={l}
                                    className={`${styles.langOption} ${lang === l ? styles.langActive : ""}`}
                                    onClick={() => { setLang(l); setLangMenuOpen(false); }}
                                >
                                    {l === "PT" && "🇧🇷"} {l === "EN" && "🇺🇸"} {l === "ES" && "🇪🇸"} {l}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme toggle */}
                <button
                    className={styles.themeBtn}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    title={theme === "dark" ? "Tema claro" : "Tema escuro"}
                >
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

            {/* ── Login card ── */}
            <div className={styles.card}>
                {/* Brand */}
                <div className={styles.brand}>
                    <span className={styles.brandDot} />
                    <span className={styles.brandName}>TuraTuno</span>
                    <span className={styles.brandTag}>FINANCE OS</span>
                </div>

                <h1 className={styles.title}>{t.title}</h1>
                <p className={styles.subtitle}>{t.subtitle}</p>

                {/* Mode Toggle */}
                <div className={styles.toggle}>
                    <button className={`${styles.toggleBtn} ${mode === "phone" ? styles.active : ""}`} onClick={() => setMode("phone")}>{t.phone}</button>
                    <button className={`${styles.toggleBtn} ${mode === "email" ? styles.active : ""}`} onClick={() => setMode("email")}>{t.email}</button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {/* Phone field */}
                    {mode === "phone" && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>{t.labelPhone}</label>
                            <div className={styles.phoneRow}>
                                <div ref={dropdownRef} className={styles.countrySelector}>
                                    <button type="button" className={styles.countryBtn} onClick={() => { setDropdownOpen(!dropdownOpen); setSearch(""); }}>
                                        <span className={styles.flagEmoji}>{selectedCountry.flag}</span>
                                        <span className={styles.dialCode}>{selectedCountry.dial}</span>
                                        <svg className={`${styles.chevron} ${dropdownOpen ? styles.chevronUp : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {dropdownOpen && (
                                        <div className={styles.dropdown}>
                                            <div className={styles.searchWrapper}>
                                                <input autoFocus type="text" placeholder={t.searchCountry} className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
                                            </div>
                                            <ul className={styles.countryList}>
                                                {filtered.map((c) => (
                                                    <li key={c.code}>
                                                        <button type="button" className={`${styles.countryOption} ${c.code === selectedCountry.code ? styles.selectedOption : ""}`}
                                                            onClick={() => { setSelectedCountry(c); setDropdownOpen(false); setSearch(""); }}>
                                                            <span className={styles.flagEmoji}>{c.flag}</span>
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
                                <input
                                    type="tel"
                                    placeholder={t.phonePlaceholder}
                                    className={styles.phoneInput}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Email field */}
                    {mode === "email" && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>{t.labelEmail}</label>
                            <input
                                type="email"
                                placeholder={t.emailPlaceholder}
                                className={styles.input}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* Password */}
                    <div className={styles.fieldGroup}>
                        <div className={styles.labelRow}>
                            <label className={styles.label}>{t.labelPassword}</label>
                            <a href="#" className={styles.forgot}>{t.forgot}</a>
                        </div>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t.passwordPlaceholder}
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {/* Error feedback */}
                    {apiError && (
                        <div className={styles.errorBanner}>⚠️ {apiError}</div>
                    )}

                    {/* Not-found: user has no account — redirect to register */}
                    {notFound && (
                        <div className={styles.notFoundBanner}>
                            <span>{
                                (t as typeof LANGS["PT"]).errNotFound
                            }</span>
                            <a
                                href={`/register${mode === "email" && identifier ? `?email=${encodeURIComponent(identifier)}` : ""}`}
                                className={styles.notFoundCta}
                            >
                                {(t as typeof LANGS["PT"]).notFoundCta}
                            </a>
                        </div>
                    )}

                    <button type="submit" className={styles.loginBtn} disabled={loading}>
                        {loading ? (
                            <span className={styles.spinner} />
                        ) : (
                            <>
                                <span>{t.loginBtn}</span>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.divider}><span>{t.orWith}</span></div>

                <div className={styles.socialRow}>
                    <button
                        type="button"
                        className={styles.socialBtn}
                        onClick={handleGoogleSignIn}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button
                        type="button"
                        className={styles.socialBtn}
                        onClick={handleAppleSignIn}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        Apple
                    </button>
                </div>

                <p className={`${styles.registerText} ${notFound ? styles.registerHighlight : ""}`}>
                    {t.noAccount}{" "}
                    <a href="/register" className={styles.registerLink}>{t.register}</a>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className={styles.page}>Carregando...</div>}>
            <LoginContent />
        </Suspense>
    );
}
