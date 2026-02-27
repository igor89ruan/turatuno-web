# Documentação Técnica: Módulo de Categorias (TuraTuno)

## 1. Visão Geral
O Módulo de Categorias foi refatorado para ir além de uma simples lista de nomes, transformando-se em um **Mini-Dashboard de Saúde Financeira (Budgeting)**. Agora, os usuários podem definir limites de gastos mensais para suas despesas, e a interface exibe visualmente o progresso desse gasto através de "Cards Inteligentes".

---

## 2. Estrutura do Banco de Dados (Prisma)
O modelo `Category` no `prisma/schema.prisma` foi atualizado para suportar a hierarquia (Subcategorias), o arquivamento (Soft Delete) e, agora, o Orçamento Mensal.

### Schema
```prisma
model Category {
  id             String        @id @default(cuid())
  workspaceId    String
  name           String
  type           String        @default("expense") // 'expense' ou 'income'
  icon           String        @default("💰")
  colorHex       String        @default("#6366f1")
  monthlyBudget  Float?        // NOVO: Limite de gasto mensal estipulado (apenas Despesas)
  parentId       String?       // NOVO: ID da categoria pai (para subcategorias)
  status         String        @default("active")  // 'active' ou 'arquivado'
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  workspace      Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  parent         Category?     @relation("CategoryToSubcategory", fields: [parentId], references: [id])
  subcategories  Category[]    @relation("CategoryToSubcategory")
  transactions   Transaction[]
}
```

---

## 3. Lógica de Backend (API Routes)

As rotas da API foram criadas no diretório `src/app/api/categories/`. 

### `GET /api/categories`
- Busca as categorias ativas do Workspace atual do usuário (verificado via NextAuth e a tabela `WorkspaceUser`).
- Para alimentar os Cards Inteligentes com a barra de progresso, a rota agora calcula o `currentSpend`:
  - A API (no Server Component da página) busca as transações (tipo `expense`) **apenas do mês atual** que pertencem ao workspace.
  - Soma o valor de todas essas transações agrupando pelo `categoryId`.
  - Anexa o total gasto (`currentSpend`) no objeto retornado para o Frontend.

### `POST /api/categories`
- Cria uma nova categoria.
- **Campos esperados no body**: `name`, `type`, `colorHex`, `icon`, `parentId` (opcional), `monthlyBudget` (opcional), `keywords` (opcional).
- O campo `type` é preenchido como "expense" por padrão, tornando a categoria unificada (agnóstica).
- Se `monthlyBudget` for providenciado, é convertido para `Float` no banco.

### `PUT /api/categories/[id]`
- Atualiza as propriedades de uma categoria específica (cor, nome, ícone).
- Utilizado tanto para edição normal quanto para o arquivamento (se `status` for alterado para "arquivado").
- Suporta a edição do `monthlyBudget`.

### `DELETE /api/categories/[id]`
- Apaga permanentemente (Hard Delete) se a flag `?force=true` for enviada.
- Caso contrário, executa um **Soft Delete** (alterando `status` para "arquivado"), preservando a integridade do histórico financeiro.
- A exclusão forçada (`Hard Delete`) é impedida pelo backend caso a categoria possua transações atreladas, garantindo segurança na base de dados.

---

## 4. Estrutura do Frontend (React Client Components)

### 4.1. Layout Inteligente (Cards e Table)
A interface de listagem (`categorias-client.tsx`) adotou um estado de alternância de visualização (`viewMode`):
- **Cards (Padrão para Despesas)**: Apresenta a categoria como um mini-dashboard. Quando um `monthlyBudget` existe, exibe uma Barra de Progresso (`ProgressBar`) indicando o percentual consumido.
- **Tabela**: Layout minimalista para visualização rápida (ainda exibe um mini-progresso em texto/visual).

### 4.2. Lógica da Barra de Progresso e Cores (Health Status)
A cor da barra reage matematicamente ao tanto que já foi consumido:
```javascript
const percent = hasBudget ? Math.min((currentSpend / monthlyBudget) * 100, 100) : 0;
let statusColor = '#4ade80'; // Verde (Tranquilo)
if (percent >= 100) statusColor = '#f87171'; // Vermelho (Orçamento Estourado)
else if (percent >= 80) statusColor = '#fbbf24'; // Amarelo (Atenção, > 80%)
```

### 4.3. Modal Centralizado (Formulário)
Foi implementado um novo design de Modal Centralizado moderno, com tema "Zinc-950" (fundo ultra-escuro para evitar vazamento de transparência), substituindo a antiga gaveta (Slide-over).
- **Categorias Agnósticas**: O usuário não precisa mais selecionar se a categoria é Receita ou Despesa, unificando a categorização nas telas.
- **Seletor de Emoji (Emoji Picker)**: Substituindo a digitação manual, um Grid dinâmico foi construído contendo 40 emojis pré-selecionados para os casos de uso mais comuns em finanças, com suporte a inserção customizada.
- **Palavras-Chave (Keywords)**: Adicionado um campo text onde o usuário pode listar palavras identificadoras (ex: "ifood, mc donalds, burger king"). O objetivo é futuramente alimentar um motor de **Inteligência Artificial**.
- **Color Presets**: 15 botões circulares rápidos com paleta moderna e um Color Picker nativo reposicionado de forma elegante.
- O input de **"Orçamento Mensal"** aparece como opcional.

### 4.4 Lógica de Arquivamento nas Abas
A tabela principal suporta sub-abas (Ativas vs Arquivadas). O comportamento dos botões de ação muda baseado na aba atual:
- **Abas Ativas**: Mostram a opção de **Arquivar**.
- **Abas Arquivadas**: Mostram as opções de **Restaurar** (retorna o status para "active") e de **Excluir Definitivamente** (aciona o endpoint `DELETE` com parâmetro `?force=true`).

## 5. Próximos Passos Sugeridos para o Futuro
1. **Histórico de Orçamentos**: Atualmente o `monthlyBudget` é fixo para todos os meses passados. No futuro, pode-se criar uma tabela `CategoryBudeget` para definir orçamentos variáveis por mês.
2. **Alertas Globais**: O Dashboard Principal pode puxar categorias que estouraram o orçamento e gerar Notificações estilo push ("Atenção: A categoria Lazer atingiu 90% do previsto").
