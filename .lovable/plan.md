## Objetivo
Permitir mover ingredientes entre categorias diretamente na lista, corrigindo classificações automáticas erradas.

## Mudanças

### 1. `src/lib/store.ts`
- Adicionar campo opcional `category?: IngredientCategory` em `Ingredient`.
- Exportar o tipo `IngredientCategory` (as mesmas chaves já usadas hoje: `proteinas`, `graos`, `farinaceos`, `vegetais`, `molhos`, `laticinios`, `bebidas`, `embalagens`, `outros`) e a lista ordenada de labels.

### 2. `src/components/ficha/IngredientsTab.tsx`
- Mover o mapa de categorias + labels + função `detectCategory` para usarem o tipo compartilhado.
- Ao agrupar: usar `ing.category ?? detectCategory(ing.name)` como categoria efetiva. Assim itens sem override continuam automáticos; itens editados ficam fixos.
- No card de cada ingrediente, adicionar um pequeno `Select` inline (ícone `Tag` + label curto da categoria atual) entre o preço e os botões de ação. Trocar a categoria dispara `onUpsert({ ...ing, category: novaCategoria, lastUpdated: ... })` e o item pula para o grupo certo instantaneamente.
- Incluir uma opção "Automático" no seletor que limpa o override (`category: undefined`), voltando à detecção por nome.
- Manter o layout responsivo: no mobile (384px) o seletor entra como uma linha secundária abaixo do nome para não espremer os ícones.

## Fora do escopo
- Criar/renomear/excluir categorias próprias.
- Drag-and-drop entre grupos.
- Edição em massa.