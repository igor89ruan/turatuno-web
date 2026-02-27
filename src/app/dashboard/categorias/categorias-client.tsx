"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./categorias.module.css";
import navStyles from "../dashboard.module.css"; // Reuse sidebar styles

type Category = {
    id: string;
    name: string;
    type: string;
    icon: string;
    colorHex: string;
    parentId: string | null;
    status: string;
    monthlyBudget: number | null;
    keywords?: string | null;
    currentSpend: number;
    subcategories?: Category[];
};

interface Props {
    userName: string;
    initialCategories: Category[];
    workspaceId: string;
}

type TabType = 'active_cats' | 'archived_cats' | 'active_subcats' | 'archived_subcats';

export default function CategoriasClient({ userName, initialCategories, workspaceId }: Props) {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>('active_cats');

    // Toggles between 'table' and 'cards' just for visual preference (we default to table)
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [isSubmittng, setIsSubmitting] = useState(false);
    const [modalMode, setModalMode] = useState<'category' | 'subcategory'>('category');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const popularEmojis = [
        "🛒", "🍽️", "🥤", "🚗", "🚌", "🚇", "🛫", "🏠", "🏢", "🔧",
        "💊", "🩺", "🎓", "📚", "🎉", "🎈", "💡", "🔌", "📱", "💻",
        "💇‍♀️", "💅", "🐶", "🐱", "🎁", "🛍️", "💼", "📈", "💸", "💳",
        "🏋️", "⚽", "🎮", "🎬", "🎵", "🏖️", "🍔", "🍕", "🥦", "🥩"
    ];

    const [formData, setFormData] = useState({
        name: "",
        type: "expense", // Defaulting to expense internally, but hidden from user
        icon: "💡",
        colorHex: "#6366f1",
        parentId: "",
        monthlyBudget: "",
        keywords: "",
    });

    const presetColors = [
        "#f87171", "#fb923c", "#fbbf24", "#4ade80", "#2dd4bf",
        "#60a5fa", "#818cf8", "#a78bfa", "#f472b6", "#fda4af",
        "#d946ef", "#0ea5e9", "#14b8a6", "#84cc16", "#ef4444"
    ];

    // Extract all subcategories into a flat list for the subcategory tabs
    const allSubcategories = useMemo(() => {
        const subs: Category[] = [];
        categories.forEach(c => {
            if (c.subcategories) {
                subs.push(...c.subcategories);
            }
        });
        return subs;
    }, [categories]);

    // Handle filtering based on active tab and search
    const filteredList = useMemo(() => {
        let list: Category[] = [];

        switch (activeTab) {
            case 'active_cats':
                list = categories.filter(c => c.status === "active");
                break;
            case 'archived_cats':
                list = categories.filter(c => c.status === "arquivado");
                break;
            case 'active_subcats':
                list = allSubcategories.filter(c => c.status === "active");
                break;
            case 'archived_subcats':
                list = allSubcategories.filter(c => c.status === "arquivado");
                break;
        }

        if (search.trim()) {
            list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
        }

        return list;
    }, [categories, allSubcategories, activeTab, search]);

    const openDrawerNew = (isSubcat: boolean = false) => {
        setEditingCat(null);
        setModalMode(isSubcat ? 'subcategory' : 'category');
        setFormData({
            name: "",
            type: "expense", // hidden
            icon: popularEmojis[0], // default emoji
            colorHex: "#6366f1",
            parentId: isSubcat && categories.length > 0 ? categories[0].id : "",
            monthlyBudget: "",
            keywords: ""
        });
        setIsDrawerOpen(true);
        setShowEmojiPicker(false);
    };

    const openDrawerEdit = (cat: Category) => {
        setEditingCat(cat);
        setModalMode(cat.parentId ? 'subcategory' : 'category');
        setFormData({
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            colorHex: cat.colorHex,
            parentId: cat.parentId || "",
            monthlyBudget: cat.monthlyBudget ? cat.monthlyBudget.toString() : "",
            keywords: cat.keywords || ""
        });
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setEditingCat(null);
    };

    const fetchCategories = async () => {
        const res = await fetch("/api/categories");
        if (res.ok) {
            const data = await res.json();
            setCategories(data.categories);
        }
    };

    const handleArchive = async (id: string, name: string) => {
        const isArchivedTab = activeTab.includes('archived');
        const confirmMsg = isArchivedTab
            ? `Deseja excluir DEFINITIVAMENTE a categoria "${name}"? Esta ação não pode ser desfeita.`
            : `Deseja arquivar a categoria "${name}"?`;

        if (!confirm(confirmMsg)) return;

        try {
            await fetch(`/api/categories/${id}${isArchivedTab ? '?force=true' : ''}`, {
                method: "DELETE" // Soft archives if it has txs normally. With ?force=true, we could implement hard delete in the API.
            });
            await fetchCategories();
            router.refresh();
        } catch (e) {
            console.error("Erro ao excluir/arquivar", e);
        }
    };

    const handleRestore = async (id: string, name: string) => {
        if (!confirm(`Deseja restaurar a categoria "${name}" para ativa?`)) return;
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "active" }),
            });
            if (res.ok) {
                await fetchCategories();
                router.refresh();
            }
        } catch (e) {
            console.error("Erro ao restaurar", e);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingCat ? `/api/categories/${editingCat.id}` : "/api/categories";
            const method = editingCat ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchCategories();
                router.refresh();
                closeDrawer();
            } else {
                alert("Erro ao salvar categoria");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableParents = categories.filter(c => !editingCat || c.id !== editingCat.id);

    return (
        <div className={styles.page}>
            <aside className={navStyles.sidebar}>
                <div className={navStyles.sidebarBrand}>
                    <span className={navStyles.brandDot} />
                    <span className={navStyles.brandName}>TuraTuno</span>
                </div>
                <nav className={navStyles.nav}>
                    <Link href="/dashboard" className={navStyles.navItem}><span className={navStyles.navIcon}>📊</span><span>Dashboard</span></Link>
                    <Link href="/dashboard/relatorios" className={navStyles.navItem}><span className={navStyles.navIcon}>📈</span><span>Relatórios</span></Link>
                    <Link href="/dashboard/categorias" className={`${navStyles.navItem} ${navStyles.navActive}`}><span className={navStyles.navIcon}>🏷️</span><span>Categorias</span></Link>
                    <Link href="#" className={navStyles.navItem}><span className={navStyles.navIcon}>🏦</span><span>Contas Bancárias</span></Link>
                    <Link href="#" className={navStyles.navItem}><span className={navStyles.navIcon}>💳</span><span>Cartão de Crédito</span></Link>
                </nav>
            </aside>

            <main className={styles.main}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Gerenciar Categorias Personalizada</h1>
                    <p className={styles.subtitle}>
                        A IA já é capaz de identificar categorias automaticamente. No entanto, se preferir, você pode personalizar as categorias de acordo com suas necessidades.
                    </p>

                    <div className={styles.headerActions}>
                        <button className={styles.addBtn} onClick={() => openDrawerNew(false)}>
                            <span>+</span> Crie sua categoria
                        </button>
                        <button className={styles.addBtn} onClick={() => openDrawerNew(true)}>
                            <span>+</span> Crie sua subcategoria
                        </button>
                    </div>
                </header>

                <div className={styles.tabsNav}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'active_cats' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('active_cats')}
                    >🏷️ Categorias Ativas</button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'archived_cats' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('archived_cats')}
                    >📦 Categorias Arquivadas</button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'active_subcats' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('active_subcats')}
                    >🏷️ Subcategoria Ativas</button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'archived_subcats' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('archived_subcats')}
                    >📦 Subcategoria Arquivadas</button>
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.searchWrap}>
                        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Pesquisar categorias..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className={styles.viewToggles}>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.viewBtnActive : ''}`}
                            onClick={() => setViewMode('cards')}
                        >🪟 Cards</button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
                            onClick={() => setViewMode('table')}
                        >📄 Tabela</button>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <div className={styles.tableContainer}>
                        <div className={styles.tableHeader}>
                            <div>Categoria</div>
                            <div>Progresso / Descrição</div>
                            <div>Cor</div>
                            <div>Ações</div>
                        </div>

                        {filteredList.length === 0 ? (
                            <div className={styles.emptyText}>Nenhuma categoria encontrada nesta aba.</div>
                        ) : (
                            filteredList.map(item => {
                                const hasBudget = item.type === "expense" && item.monthlyBudget && item.monthlyBudget > 0;
                                const percent = hasBudget ? Math.min((item.currentSpend / item.monthlyBudget!) * 100, 100) : 0;

                                let statusColor = '#4ade80'; // green
                                if (percent >= 100) statusColor = '#f87171'; // red
                                else if (percent >= 80) statusColor = '#fbbf24'; // yellow

                                return (
                                    <div key={item.id} className={styles.tableRow}>
                                        <div className={styles.cellCat}>
                                            <span>{item.icon}</span>
                                            {item.name}
                                        </div>
                                        <div className={styles.cellDesc}>
                                            {hasBudget ? (
                                                <div className={styles.progressContainer}>
                                                    <div className={styles.progressTextInfo}>
                                                        <span>R$ {item.currentSpend.toFixed(2)}</span>
                                                        <span style={{ color: 'var(--text-secondary)' }}> / R$ {item.monthlyBudget!.toFixed(2)}</span>
                                                    </div>
                                                    <div className={styles.progressBarBg}>
                                                        <div className={styles.progressBarFill} style={{ width: `${percent}%`, backgroundColor: statusColor }}></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>{item.type === 'income' ? "Receita (Sem Limite)" : "Sem Orçamento Definido"}</span>
                                            )}
                                        </div>
                                        <div className={styles.cellColor}>
                                            <div className={styles.colorDot} style={{ backgroundColor: item.colorHex }}></div>
                                        </div>
                                        <div className={styles.cellActions}>
                                            {activeTab.includes('archived') ? (
                                                <>
                                                    <button className={styles.actionIconBtn} onClick={() => handleRestore(item.id, item.name)} title="Restaurar para Ativa">
                                                        ♻️
                                                    </button>
                                                    <button className={styles.actionIconBtn} onClick={() => handleArchive(item.id, item.name)} title="Excluir Definitivamente">
                                                        ❌
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className={styles.actionIconBtn} onClick={() => openDrawerEdit(item)} title="Editar">
                                                        ✏️
                                                    </button>
                                                    <button className={styles.actionIconBtn} onClick={() => handleArchive(item.id, item.name)} title="Arquivar">
                                                        📦
                                                    </button>
                                                </>
                                            )}
                                            <button className={styles.reportsBtn} onClick={() => router.push('/dashboard/relatorios')}>
                                                ⏱ Relatórios
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className={styles.cardsGrid}>
                        {filteredList.length === 0 ? (
                            <div className={styles.emptyText} style={{ gridColumn: '1 / -1' }}>Nenhuma categoria encontrada.</div>
                        ) : (
                            filteredList.map(item => {
                                const hasBudget = item.type === "expense" && item.monthlyBudget && item.monthlyBudget > 0;
                                const percent = hasBudget ? Math.min((item.currentSpend / item.monthlyBudget!) * 100, 100) : 0;

                                let statusColor = '#4ade80'; // green
                                if (percent >= 100) statusColor = '#f87171'; // red
                                else if (percent >= 80) statusColor = '#fbbf24'; // yellow

                                return (
                                    <div key={item.id} className={styles.catCard}>
                                        <div className={styles.catCardHeader}>
                                            <div className={styles.catCardIconWrap} style={{ backgroundColor: `${item.colorHex}20`, color: item.colorHex }}>
                                                {item.icon}
                                            </div>
                                            <h3 className={styles.catCardTitle}>{item.name}</h3>
                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }} className={styles.cellActions}>
                                                {activeTab.includes('archived') ? (
                                                    <>
                                                        <button className={styles.actionIconBtn} onClick={() => handleRestore(item.id, item.name)} title="Restaurar para Ativa">♻️</button>
                                                        <button className={styles.actionIconBtn} onClick={() => handleArchive(item.id, item.name)} title="Excluir Definitivamente">❌</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className={styles.actionIconBtn} onClick={() => openDrawerEdit(item)} title="Editar">✏️</button>
                                                        <button className={styles.actionIconBtn} onClick={() => handleArchive(item.id, item.name)} title="Arquivar">📦</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.catCardBody}>
                                            {hasBudget ? (
                                                <div className={styles.progressContainer}>
                                                    <div className={styles.progressHeaderCards}>
                                                        <span className={styles.progressAmount}>
                                                            R$ {item.currentSpend.toFixed(2)}
                                                        </span>
                                                        <span className={styles.progressLimit}>de R$ {item.monthlyBudget!.toFixed(2)}</span>
                                                    </div>
                                                    <div className={styles.progressBarBg}>
                                                        <div className={styles.progressBarFill} style={{ width: `${percent}%`, backgroundColor: statusColor }}></div>
                                                    </div>
                                                    <div className={styles.progressFooter}>
                                                        {percent >= 100 ? (
                                                            <span style={{ color: statusColor, fontSize: '0.75rem' }}>Orçamento estourado!</span>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>R$ {(item.monthlyBudget! - item.currentSpend).toFixed(2)} restantes</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={styles.noBudgetCard}>
                                                    {item.type === 'income' ? 'Receita contínua' : 'Nenhum orçamento definido'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

            </main>

            {/* ─── Centered Modal Form ─── */}
            {isDrawerOpen && (
                <div className={styles.modalOverlay} onClick={closeDrawer}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editingCat
                                    ? (modalMode === 'subcategory' ? "Editar Subcategoria" : "Editar Categoria")
                                    : (modalMode === 'subcategory' ? "Adicionar Subcategoria" : "Adicionar Categoria")
                                }
                            </h2>
                            <button className={styles.closeBtn} onClick={closeDrawer}>✕</button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nome e Ícone da Categoria</label>
                                <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                                    <input
                                        type="text"
                                        required
                                        className={styles.input}
                                        style={{ flex: 1 }}
                                        placeholder="Ex: Alimentação"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            type="button"
                                            className={styles.input}
                                            style={{ width: '60px', height: '100%', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', cursor: 'pointer' }}
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        >
                                            {formData.icon}
                                        </button>

                                        {showEmojiPicker && (
                                            <div className={styles.emojiPickerCard}>
                                                <div className={styles.emojiGrid}>
                                                    {popularEmojis.map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            type="button"
                                                            className={styles.emojiBtn}
                                                            onClick={() => {
                                                                setFormData({ ...formData, icon: emoji });
                                                                setShowEmojiPicker(false);
                                                            }}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Ou digite/cole 1 emoji..."
                                                        className={styles.input}
                                                        style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                                                        maxLength={2}
                                                        value={formData.icon}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, icon: e.target.value });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {modalMode === 'subcategory' && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Categoria *</label>
                                    <select
                                        className={styles.select}
                                        value={formData.parentId}
                                        onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                        disabled={!!editingCat && categories.some(c => c.parentId === editingCat.id)}
                                        required
                                    >
                                        <option value="">Selecione uma categoria...</option>
                                        {availableParents.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Cor da Categoria</label>
                                <div className={styles.colorPresetsRow}>
                                    {presetColors.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`${styles.colorPresetDot} ${formData.colorHex === color ? styles.colorPresetActive : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setFormData({ ...formData, colorHex: color })}
                                        />
                                    ))}
                                    <div className={styles.colorPickerWrap} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <label htmlFor="customColor" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Outra cor:</label>
                                        <input
                                            id="customColor"
                                            type="color"
                                            className={styles.colorInput}
                                            value={formData.colorHex}
                                            onChange={e => setFormData({ ...formData, colorHex: e.target.value })}
                                            title="Escolha uma cor personalizada"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Palavras para identificar a categoria (Separadas por vírgula)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Ex: ifood, mc donalds, burger king"
                                    value={formData.keywords}
                                    onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                                    Isso ajudará a IA a categorizar suas transações automaticamente no futuro.
                                </span>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Orçamento Mensal (Opcional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={styles.input}
                                    placeholder="Ex: 500.00"
                                    value={formData.monthlyBudget}
                                    onChange={e => setFormData({ ...formData, monthlyBudget: e.target.value })}
                                />
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={closeDrawer}>Cancelar</button>
                                <button type="submit" className={styles.saveBtn} disabled={isSubmittng}>
                                    {isSubmittng ? "Salvando..." : (modalMode === 'subcategory' ? "Salvar Subcategoria" : "Salvar Categoria")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
