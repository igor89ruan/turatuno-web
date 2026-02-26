"use client";

import { useState } from "react";
import styles from "./transaction-modal.module.css";

// ── Types ──────────────────────────────────────────────────────
interface Category { id: string; name: string; icon: string; colorHex: string; type: string; }
interface Account { id: string; name: string; }

interface Props {
    type: "income" | "expense";
    workspaceId: string;
    categories: Category[];
    accounts: Account[];
    userName: string;
    transactionToEdit?: any; // Add transactionToEdit prop
    onClose: () => void;
    onSaved: () => void;
}

// ── Toggle Switch ──────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            className={`${styles.toggle} ${on ? styles.toggleOn : ""}`}
            onClick={() => onChange(!on)}
            aria-checked={on}
            role="switch"
        >
            <span className={styles.toggleThumb} />
        </button>
    );
}

// ── Section heading ────────────────────────────────────────────
function Section({ label, color }: { label: string; color: string }) {
    return (
        <div className={styles.section}>
            <span className={styles.sectionDot} style={{ background: color }} />
            <span className={styles.sectionLabel}>{label}</span>
        </div>
    );
}

// ── Config row (icon + title + subtitle + optional toggle/child) ──
function ConfigRow({
    icon, color, title, subtitle, right, children,
}: {
    icon: string; color: string; title: string; subtitle: string;
    right?: React.ReactNode; children?: React.ReactNode;
}) {
    return (
        <div className={styles.configCard}>
            <div className={styles.configTop}>
                <div className={styles.configIcon} style={{ background: `${color}20`, color }}>
                    {icon}
                </div>
                <div className={styles.configText}>
                    <p className={styles.configTitle}>{title}</p>
                    <p className={styles.configSub}>{subtitle}</p>
                </div>
                {right && <div className={styles.configRight}>{right}</div>}
            </div>
            {children && <div className={styles.configChild}>{children}</div>}
        </div>
    );
}

// ── Main Modal ─────────────────────────────────────────────────
export default function TransactionModal({
    type, workspaceId, categories, accounts, userName, transactionToEdit, onClose, onSaved,
}: Props) {
    const isIncome = type === "income";
    const accent = isIncome ? "#22c55e" : "#ef4444";
    const isEditing = !!transactionToEdit;

    // Form state pre-filled safely
    const [amount, setAmount] = useState(transactionToEdit ? Math.abs(transactionToEdit.amount).toString() : "");
    const [description, setDescription] = useState(transactionToEdit?.description || "");
    const [categoryId, setCategoryId] = useState(transactionToEdit?.category?.id || transactionToEdit?.categoryId || "");
    const [accountId, setAccountId] = useState(transactionToEdit?.accountId || accounts[0]?.id || "");
    const [notPaid, setNotPaid] = useState(transactionToEdit ? transactionToEdit.status === "pending" : true);

    // Safely parse date and competence date
    const tDate = transactionToEdit?.date ? new Date(transactionToEdit.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const [dueDate, setDueDate] = useState(tDate);
    const [competDate, setCompetDate] = useState(tDate);

    // Other states
    const [isFixed, setIsFixed] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [isCreditCard, setIsCreditCard] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter categories by type
    const filtered = categories.filter(c => c.type === type || c.type === "both");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!amount || !description) { setError("Preencha valor e descrição."); return; }
        setError(null);
        setLoading(true);
        try {
            const url = isEditing ? `/api/transactions/${transactionToEdit.id}` : "/api/transactions";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workspaceId,
                    amount: parseFloat(amount.replace(",", ".")),
                    type,
                    description,
                    categoryId: categoryId || null,
                    accountId: accountId || null,
                    status: notPaid ? "pending" : (isIncome ? "received" : "paid"),
                    date: dueDate,
                    competenceDate: competDate,
                    isFixed,
                    isCreditCard,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Erro ao salvar."); return; }
            onSaved();
        } catch {
            setError("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Accent bar */}
                <div className={styles.accentBar} style={{ background: accent }} />

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerIcon} style={{ background: `${accent}20`, color: accent }}>
                        {isIncome ? "↗" : "↘"}
                    </div>
                    <h2 className={styles.headerTitle}>
                        {isEditing ? (isIncome ? "Editar Receita" : "Editar Despesa") : (isIncome ? "Adicionar Receita" : "Adicionar Despesa")}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form className={styles.body} onSubmit={handleSubmit}>

                    {/* ── Informações Básicas ── */}
                    <Section label="Informações Básicas" color="#22c55e" />

                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>Valor</label>
                        <input
                            className={`${styles.fieldInput} ${styles.valueInput}`}
                            placeholder="Digite o valor"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            inputMode="decimal"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>Descrição</label>
                        <input
                            className={styles.fieldInput}
                            placeholder="Ex: Compra no supermercado"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>Categoria</label>
                        <div className={styles.selectWrap}>
                            <select className={styles.fieldSelect} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                                <option value="">Escolha uma categoria</option>
                                {filtered.map(c => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                ))}
                            </select>
                            <svg className={styles.chevron} width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 12 12">
                                <path d="M2 4l4 4 4-4" />
                            </svg>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>Subcategoria</label>
                        <div className={styles.selectWrap}>
                            <select className={styles.fieldSelect} disabled={!categoryId}>
                                <option>{categoryId ? "— nenhuma —" : "Selecione uma categoria primeiro"}</option>
                            </select>
                            <svg className={styles.chevron} width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 12 12">
                                <path d="M2 4l4 4 4-4" />
                            </svg>
                        </div>
                    </div>

                    {/* ── Tipo do lançamento (expense only) ── */}
                    {!isIncome && (
                        <>
                            <Section label="Tipo do lançamento" color="#3b82f6" />
                            <ConfigRow
                                icon="💳" color="#3b82f6"
                                title="Cartão de Crédito"
                                subtitle="Ative se a despesa foi feita no cartão de crédito"
                                right={<Toggle on={isCreditCard} onChange={setIsCreditCard} />}
                            />
                        </>
                    )}

                    {/* ── Configurações de Transação ── */}
                    <Section label="Configurações de Transação" color="#8b5cf6" />

                    <ConfigRow
                        icon={isIncome ? "↗" : "↘"}
                        color={accent}
                        title={isIncome ? "Não Foi Recebida" : "Não Foi Pago"}
                        subtitle="Status do pagamento/recebimento"
                        right={<Toggle on={notPaid} onChange={setNotPaid} />}
                    />

                    <ConfigRow
                        icon="📅" color="#f59e0b"
                        title="Data de Vencimento"
                        subtitle="Quando a transação deve ser paga/recebida"
                    >
                        <input
                            type="date"
                            className={styles.dateInput}
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                        />
                    </ConfigRow>

                    <ConfigRow
                        icon="🏦" color="#22c55e"
                        title="Conta"
                        subtitle="Escolha a conta para esta transação"
                    >
                        <div className={styles.selectWrap}>
                            <select className={styles.fieldSelect} value={accountId} onChange={e => setAccountId(e.target.value)}>
                                {accounts.length === 0 && <option value="">— sem contas —</option>}
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                <option value="cash">Dinheiro físico</option>
                            </select>
                            <svg className={styles.chevron} width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 12 12">
                                <path d="M2 4l4 4 4-4" />
                            </svg>
                        </div>
                    </ConfigRow>

                    <ConfigRow
                        icon="🔁" color="#8b5cf6"
                        title={isIncome ? "Receita Fixa" : "Despesa Fixa"}
                        subtitle={`Classifica como uma ${isIncome ? "receita" : "despesa"} fixa`}
                        right={<Toggle on={isFixed} onChange={setIsFixed} />}
                    />

                    <ConfigRow
                        icon="↺" color="#6366f1"
                        title="Repetir Transação"
                        subtitle="Criar múltiplas transações automaticamente"
                        right={<Toggle on={isRecurring} onChange={setIsRecurring} />}
                    />

                    <ConfigRow
                        icon="👤" color="#06b6d4"
                        title="Pessoa Responsável"
                        subtitle="Identifique alguém"
                    >
                        <div className={styles.selectWrap}>
                            <select className={styles.fieldSelect} defaultValue={userName}>
                                <option>{userName}</option>
                            </select>
                            <svg className={styles.chevron} width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 12 12">
                                <path d="M2 4l4 4 4-4" />
                            </svg>
                        </div>
                    </ConfigRow>

                    <ConfigRow
                        icon="📋" color="#22c55e"
                        title="Data de Competência"
                        subtitle="Data de aquisição ou emissão do produto ou serviço"
                    >
                        <input
                            type="date"
                            className={styles.dateInput}
                            value={competDate}
                            onChange={e => setCompetDate(e.target.value)}
                        />
                    </ConfigRow>

                    {/* Error */}
                    {error && <p className={styles.errorMsg}>⚠️ {error}</p>}

                    {/* Actions */}
                    <div className={styles.actions}>
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            style={{ background: accent, boxShadow: `0 4px 20px ${accent}40` }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className={styles.spinner} />
                            ) : (
                                <>{isEditing ? (isIncome ? "↗ Salvar Edição" : "↘ Salvar Edição") : (isIncome ? "↗ Salvar Receita" : "↘ Salvar Despesa")}</>
                            )}
                        </button>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancelar
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
