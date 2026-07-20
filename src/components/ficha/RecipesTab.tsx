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
import { Trash2, Plus, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import {
  type Recipe,
  type Ingredient,
  recipeCost,
  recipeUnitCost,
  effectivePricePerUnit,
  formatBRL,
  uid,
} from "@/lib/store";

type Props = {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onUpsert: (r: Recipe) => void;
  onRemove: (id: string) => void;
};

export function RecipesTab({ recipes, ingredients, onUpsert, onRemove }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function addNew() {
    const r: Recipe = {
      id: uid(),
      name: "Nova receita",
      items: [],
      yieldUnits: 1,
      yieldLabel: "porções",
    };
    onUpsert(r);
    setExpanded(r.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          {recipes.length} receita{recipes.length === 1 ? "" : "s"}
        </p>
        <Button onClick={addNew}>
          <Plus className="w-4 h-4 mr-1" /> Nova receita
        </Button>
      </div>

      {recipes.length === 0 && (
        <Card className="card-paper p-8 text-center text-muted-foreground text-sm">
          Nenhuma receita cadastrada. Crie preparos como <b>shari</b>, <b>molho tarê</b> ou <b>maionese temperada</b> para usar dentro dos combinados.
        </Card>
      )}

      {recipes.map((r) => (
        <RecipeCard
          key={r.id}
          recipe={r}
          ingredients={ingredients}
          expanded={expanded === r.id}
          onToggle={() => setExpanded((e) => (e === r.id ? null : r.id))}
          onChange={onUpsert}
          onRemove={() => onRemove(r.id)}
        />
      ))}
    </div>
  );
}

function RecipeCard({
  recipe,
  ingredients,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  recipe: Recipe;
  ingredients: Ingredient[];
  expanded: boolean;
  onToggle: () => void;
  onChange: (r: Recipe) => void;
  onRemove: () => void;
}) {
  const total = useMemo(() => recipeCost(recipe, ingredients), [recipe, ingredients]);
  const perUnit = useMemo(() => recipeUnitCost(recipe, ingredients), [recipe, ingredients]);

  function setName(name: string) {
    onChange({ ...recipe, name });
  }
  function setYieldUnits(v: string) {
    const n = parseFloat(v.replace(",", ".")) || 0;
    onChange({ ...recipe, yieldUnits: n });
  }
  function setYieldLabel(v: string) {
    onChange({ ...recipe, yieldLabel: v });
  }
  function addItem() {
    const first = ingredients[0];
    if (!first) return;
    onChange({
      ...recipe,
      items: [...recipe.items, { ingredientId: first.id, quantity: 0 }],
    });
  }
  function updateItem(idx: number, patch: Partial<{ ingredientId: string; quantity: number }>) {
    const items = recipe.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ ...recipe, items });
  }
  function removeItem(idx: number) {
    onChange({ ...recipe, items: recipe.items.filter((_, i) => i !== idx) });
  }

  return (
    <Card className="card-paper overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg truncate">{recipe.name}</div>
          <div className="text-xs text-muted-foreground">
            Custo total: <span className="font-medium text-foreground">{formatBRL(total)}</span>
            {recipe.yieldUnits > 0 && (
              <>
                {" · "}
                {formatBRL(perUnit)}/{recipe.yieldLabel || "un"}
              </>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {expanded && (
        <div className="border-t p-4 space-y-5 bg-secondary/20">
          <div className="grid gap-3 sm:grid-cols-[2fr_auto]">
            <div>
              <Label className="text-xs">Nome da receita</Label>
              <Input value={recipe.name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={onRemove} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-1" /> Remover
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Rendimento</Label>
              <Input
                inputMode="decimal"
                value={recipe.yieldUnits || ""}
                onChange={(e) => setYieldUnits(e.target.value)}
                placeholder="ex: 10"
              />
            </div>
            <div>
              <Label className="text-xs">Unidade do rendimento</Label>
              <Input
                value={recipe.yieldLabel || ""}
                onChange={(e) => setYieldLabel(e.target.value)}
                placeholder="ex: sushis, porções, g"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Ingredientes</Label>
              <Button size="sm" variant="ghost" onClick={addItem} disabled={ingredients.length === 0}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            {ingredients.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Cadastre ingredientes primeiro na aba Ingredientes.
              </p>
            )}
            <div className="space-y-2">
              {recipe.items.map((it, idx) => {
                const ing = ingredients.find((i) => i.id === it.ingredientId);
                const lineCost = ing ? effectivePricePerUnit(ing) * it.quantity : 0;
                return (
                  <div key={idx} className="grid gap-2 grid-cols-[1fr_90px_auto_auto] items-center">
                    <Select
                      value={it.ingredientId}
                      onValueChange={(v) => updateItem(idx, { ingredientId: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ingredients.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} ({i.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      inputMode="decimal"
                      value={it.quantity || ""}
                      onChange={(e) =>
                        updateItem(idx, {
                          quantity: parseFloat(e.target.value.replace(",", ".")) || 0,
                        })
                      }
                      placeholder="qtd"
                    />
                    <span className="text-xs text-muted-foreground min-w-[70px] text-right">
                      {formatBRL(lineCost)}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo total do preparo</span>
              <span className="font-medium">{formatBRL(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Custo por {recipe.yieldLabel || "unidade"} (rende {recipe.yieldUnits || 0})
              </span>
              <span className="font-display text-base">{formatBRL(perUnit)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
