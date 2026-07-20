import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import {
  type Combo,
  type Ingredient,
  type Recipe,
  type Platforms,
  comboCost,
  effectivePricePerUnit,
  recipeUnitCost,
  platformResult,
  formatBRL,
  uid,
} from "@/lib/store";

type Props = {
  combos: Combo[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  platforms: Platforms;
  onUpsert: (c: Combo) => void;
  onRemove: (id: string) => void;
};

export function CombosTab({ combos, ingredients, recipes, platforms, onUpsert, onRemove }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function addNew() {
    const c: Combo = {
      id: uid(),
      name: "Novo combinado",
      items: [],
      prices: { food99: 0, ifood: 0, anotai: 0 },
    };
    onUpsert(c);
    setExpanded(c.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {combos.length} combinado{combos.length === 1 ? "" : "s"}
        </p>
        <Button onClick={addNew}>
          <Plus className="w-4 h-4 mr-1" /> Novo combinado
        </Button>
      </div>

      {combos.length === 0 && (
        <Card className="card-paper p-8 text-center text-muted-foreground">
          Nenhum combinado cadastrado. Clique em "Novo combinado".
        </Card>
      )}

      {combos.map((combo) => (
        <ComboCard
          key={combo.id}
          combo={combo}
          ingredients={ingredients}
          recipes={recipes}
          platforms={platforms}
          expanded={expanded === combo.id}
          onToggle={() => setExpanded((e) => (e === combo.id ? null : combo.id))}
          onChange={onUpsert}
          onRemove={() => onRemove(combo.id)}
        />
      ))}
    </div>
  );
}

function ComboCard({
  combo,
  ingredients,
  recipes,
  platforms,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  combo: Combo;
  ingredients: Ingredient[];
  recipes: Recipe[];
  platforms: Platforms;
  expanded: boolean;
  onToggle: () => void;
  onChange: (c: Combo) => void;
  onRemove: () => void;
}) {
  const cost = useMemo(
    () => comboCost(combo, ingredients, recipes),
    [combo, ingredients, recipes],
  );

  const platformRows = [
    { key: "food99" as const, label: "99Food", fees: platforms.food99, price: combo.prices.food99 },
    { key: "ifood" as const, label: "iFood", fees: platforms.ifood, price: combo.prices.ifood },
    { key: "anotai" as const, label: "Anota AI", fees: platforms.anotai, price: combo.prices.anotai },
  ];

  function setName(name: string) {
    onChange({ ...combo, name });
  }
  function addIngredientItem() {
    const first = ingredients[0];
    if (!first) return;
    onChange({
      ...combo,
      items: [...combo.items, { ingredientId: first.id, quantity: 0, kind: "ingredient" }],
    });
  }
  function addRecipeItem() {
    const first = recipes[0];
    if (!first) return;
    onChange({
      ...combo,
      items: [...combo.items, { ingredientId: first.id, quantity: 0, kind: "recipe" }],
    });
  }
  function updateItem(
    idx: number,
    patch: Partial<{ ingredientId: string; quantity: number; kind: "ingredient" | "recipe" }>,
  ) {
    const items = combo.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ ...combo, items });
  }
  function removeItem(idx: number) {
    onChange({ ...combo, items: combo.items.filter((_, i) => i !== idx) });
  }
  function setPrice(key: "food99" | "ifood" | "anotai", value: string) {
    const n = parseFloat(value.replace(",", ".")) || 0;
    onChange({ ...combo, prices: { ...combo.prices, [key]: n } });
  }

  return (
    <Card className="card-paper overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg truncate">{combo.name}</div>
          <div className="text-xs text-muted-foreground">
            Custo: <span className="font-medium text-foreground">{formatBRL(cost)}</span> · {combo.items.length} ingredientes
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {expanded && (
        <div className="border-t p-4 space-y-5 bg-secondary/20">
          <div className="grid gap-3 sm:grid-cols-[2fr_auto]">
            <div>
              <Label className="text-xs">Nome do combinado</Label>
              <Input value={combo.name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={onRemove} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-1" /> Remover
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <Label className="text-xs">Itens do combinado</Label>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={addIngredientItem} disabled={ingredients.length === 0}>
                  <Plus className="w-4 h-4 mr-1" /> Ingrediente
                </Button>
                <Button size="sm" variant="ghost" onClick={addRecipeItem} disabled={recipes.length === 0}>
                  <Plus className="w-4 h-4 mr-1" /> Receita
                </Button>
              </div>
            </div>
            {ingredients.length === 0 && recipes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Cadastre ingredientes ou receitas antes de montar o combinado.
              </p>
            )}
            <div className="space-y-2">
              {combo.items.map((it, idx) => {
                const isRecipe = it.kind === "recipe";
                const list = isRecipe ? recipes : ingredients;
                const found = list.find((x) => x.id === it.ingredientId);
                let lineCost = 0;
                let unitLabel = "";
                if (isRecipe && found) {
                  const r = found as Recipe;
                  lineCost = recipeUnitCost(r, ingredients) * it.quantity;
                  unitLabel = r.yieldLabel || "un";
                } else if (!isRecipe && found) {
                  const ing = found as Ingredient;
                  lineCost = effectivePricePerUnit(ing) * it.quantity;
                  unitLabel = ing.unit;
                }
                return (
                  <div key={idx} className="space-y-1">
                    <div className="grid gap-2 grid-cols-[1fr_90px_auto_auto] items-center">
                      <Select
                        value={it.ingredientId}
                        onValueChange={(v) => updateItem(idx, { ingredientId: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {list.map((x) => (
                            <SelectItem key={x.id} value={x.id}>
                              {isRecipe
                                ? `${x.name} (receita)`
                                : `${(x as Ingredient).name} (${(x as Ingredient).unit})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        inputMode="decimal"
                        value={it.quantity || ""}
                        onChange={(e) =>
                          updateItem(idx, { quantity: parseFloat(e.target.value.replace(",", ".")) || 0 })
                        }
                        placeholder={unitLabel || "qtd"}
                      />
                      <span className="text-xs text-muted-foreground min-w-[70px] text-right">
                        {formatBRL(lineCost)}
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground pl-1">
                      {isRecipe ? "receita" : "ingrediente"} {unitLabel && `· qtd em ${unitLabel}`}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Custo total do combinado</span>
              <span className="font-display text-base">{formatBRL(cost)}</span>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Preço de venda por plataforma</Label>
            <div className="space-y-2">
              {platformRows.map((row) => {
                const r = platformResult(row.price, cost, row.fees);
                const profitPositive = r.profit >= 0;
                return (
                  <div key={row.key} className="grid gap-2 sm:grid-cols-[100px_1fr_1fr_1fr] items-center text-sm">
                    <div className="font-medium">{row.label}</div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Preço</div>
                      <Input
                        inputMode="decimal"
                        value={row.price || ""}
                        onChange={(e) => setPrice(row.key, e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Taxa ({row.fees.feePercent}%)</div>
                      <div className="h-9 flex items-center px-3 rounded-md bg-muted text-muted-foreground text-sm">
                        -{formatBRL(r.feeAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">
                        Lucro ({r.margin.toFixed(1)}%)
                      </div>
                      <div
                        className={`h-9 flex items-center px-3 rounded-md text-sm font-semibold ${
                          profitPositive
                            ? "bg-accent/25 text-accent-foreground"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {formatBRL(r.profit)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
