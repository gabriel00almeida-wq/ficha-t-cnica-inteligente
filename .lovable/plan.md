
## Resposta rápida

**Sim, já funciona parcialmente.** Hoje o scanner (`ScannerTab`) faz `upsert` no ingrediente vinculado com o novo `pricePerUnit`, e o custo dos combinados é calculado dinamicamente (`comboCost` lê `pricePerUnit` na hora), então os combinados **já refletem o novo preço automaticamente** assim que a nota é aplicada.

O que **falta** e vou implementar:
1. Uma confirmação explícita ("esse item corresponde a X do seu estoque?") em vez do select silencioso atual.
2. Histórico de preços por ingrediente com gráfico de flutuação ao longo do tempo.

---

## Escopo

### 1. Confirmação item-a-item no scanner
Em `src/components/ficha/ScannerTab.tsx`:
- Melhorar a heurística de match: além de nome exato, usar similaridade (normalização + inclusão de substrings, ex.: "salmão fresco" ↔ "salmão").
- Quando houver um match sugerido, exibir um bloco de confirmação destacado por linha:
  - "Este item **{nome da NF}** corresponde a **{ingrediente sugerido}**?"
  - Botões **Sim, atualizar preço** / **Não, é outro item** (abre o select) / **Criar novo** / **Ignorar**.
- Mostrar comparativo: preço antigo → preço novo, com % de variação e cor (verde queda, vermelho alta).
- Sem match: já cai em "Criar novo" como hoje, mas com o mesmo layout.

### 2. Histórico de preços
Em `src/lib/store.ts`:
- Adicionar tipo `PricePoint = { date: string; pricePerUnit: number; source: "manual" | "scanner"; note?: string }`.
- Adicionar campo opcional `priceHistory?: PricePoint[]` em `Ingredient`.
- No `upsertIngredient`, quando o `pricePerUnit` mudar em relação ao valor anterior, empurrar um novo `PricePoint` automaticamente (mantém últimos ~50 pontos).
- Migração leve: `load()` inicializa `priceHistory: []` se ausente.

### 3. Visualização da flutuação
Duas superfícies:
- **Na aba Ingredientes** (`IngredientsTab.tsx`): botão de "📈 Histórico" por ingrediente que abre um `Popover`/`Collapsible` com:
  - Mini gráfico `LineChart` (recharts, já no projeto) do preço ao longo do tempo.
  - Última variação em % e diferença em R$.
  - Lista compacta das últimas 10 mudanças (data, valor, fonte).
- **Badge de tendência** no card do ingrediente (▲/▼ + % vs. preço anterior) quando houver ≥ 2 pontos.

### 4. Fluxo de aplicação do scanner
Ajustar `applyAll` para:
- Rejeitar linhas ainda não confirmadas (mostrar aviso "confirme X itens antes de aplicar").
- Registrar `source: "scanner"` e `note: nome da loja + data da NF` no `PricePoint` criado.

---

## Detalhes técnicos

- Nenhuma mudança no backend/OCR (`ocr.functions.ts`) — a IA já retorna preços, o histórico é registrado no client ao aplicar.
- Cálculo de custo dos combinados continua idêntico (já é reativo).
- Persistência via `localStorage` (chave existente `ficha-sushi:v1`).
- Bibliotecas: `recharts` (já usada em `RankingTab`), `date-fns` para formatação leve se necessário (senão `Intl.DateTimeFormat`).

## Fora do escopo
- Sem alertas/notificações automáticos de alta de preço.
- Sem exportação do histórico.
- Sem sincronização entre dispositivos (segue single-user local).
