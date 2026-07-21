import { useState } from "react";
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
import { Trash2, Plus, Package, Scissors, X, Pencil } from "lucide-react";
import {
  type Ingredient,
  type Unit,
  formatBRL,
  uid,
  effectivePricePerUnit,
} from "@/lib/store";

type Props = {
  ingredients: Ingredient[];
  onUpsert: (i: Ingredient) => void;
  onRemove: (id: string) => void;
};

const UNIT_LABEL: Record<Unit, string> = {
  g: "por grama",
  kg: "por quilo",
  ml: "por ml",
  L: "por litro",
  un: "por unidade",
};

type YieldMode = "percent" | "weights";

function parseNum(v: string) {
  return parseFloat(v.replace(",", ".")) || 0;
}

export function IngredientsTab({ ingredients, onUpsert, onRemove }: Props) {
  const [mode, setMode] = useState<"direct" | "package">("direct");

  const [name, setName] = useState("");
  const [unit, setUnit] = useState<Unit>("g");
  const [price, setPrice] = useState("");

  // Package mode
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgUnits, setPkgUnits] = useState("");

  const [hasYield, setHasYield] = useState(false);
  const [yieldMode, setYieldMode] = useState<YieldMode>("percent");
  const [yieldPct, setYieldPct] = useState("");
  const [gross, setGross] = useState("");
  const [net, setNet] = useState("");

  const [editingYieldId, setEditingYieldId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function computeYield(): number | undefined {
    if (!hasYield) return undefined;
    if (yieldMode === "percent") {
      const p = parseNum(yieldPct);
      return p > 0 && p < 100 ? p : undefined;
    }
    const g = parseNum(gross);
    const n = parseNum(net);
    if (g > 0 && n > 0 && n < g) return (n / g) * 100;
    return undefined;
  }

  const packagePerUnit = (() => {
    const p = parseNum(pkgPrice);
    const u = parseNum(pkgUnits);
    return p > 0 && u > 0 ? p / u : 0;
  })();

  function add() {
    if (!name.trim()) return;
    let finalUnit: Unit = unit;
    let finalPrice = 0;
    if (mode === "package") {
      if (packagePerUnit <= 0) return;
      finalUnit = "un";
      finalPrice = packagePerUnit;
    } else {
      finalPrice = parseNum(price);
      if (!isFinite(finalPrice) || finalPrice <= 0) return;
    }
    onUpsert({
      id: uid(),
      name: name.trim(),
      unit: finalUnit,
      pricePerUnit: finalPrice,
      lastUpdated: new Date().toISOString(),
      yieldPercent: computeYield(),
    });
    setName("");
    setPrice("");
    setPkgPrice("");
    setPkgUnits("");
    setHasYield(false);
    setYieldPct("");
    setGross("");
    setNet("");
  }

  return (
    <div className="space-y-6">
      <Card className="card-paper p-5">
        <h3 className="font-display text-lg mb-4">Adicionar ingrediente</h3>

        <div className="flex gap-2 text-xs mb-4">
          <button
            type="button"
            onClick={() => setMode("direct")}
            className={`px-3 py-1.5 rounded-md border ${
              mode === "direct"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border"
            }`}
          >
            Preço direto
          </button>
          <button
            type="button"
            onClick={() => setMode("package")}
            className={`px-3 py-1.5 rounded-md border ${
              mode === "package"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border"
            }`}
          >
            Pacote → unidades
          </button>
        </div>

        {mode === "direct" ? (
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: salmão bruto"
              />
            </div>
            <div>
              <Label className="text-xs">Unidade base</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">grama (g)</SelectItem>
                  <SelectItem value="kg">quilo (kg)</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="L">litro (L)</SelectItem>
                  <SelectItem value="un">unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Preço {UNIT_LABEL[unit]}</Label>
              <Input
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={add} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome do produto</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: camarão eviscerado, alga nori"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Preço do pacote (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={pkgPrice}
                  onChange={(e) => setPkgPrice(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label className="text-xs">Rende quantas unidades?</Label>
                <Input
                  inputMode="decimal"
                  value={pkgUnits}
                  onChange={(e) => setPkgUnits(e.target.value)}
                  placeholder="ex: 210, 100"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={add} className="w-full">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-secondary/40 rounded-md p-2 space-y-1">
              <div>
                💡 Ex: pacote 3kg de camarão que rende 70/kg → informe <b>210</b> unidades.
              </div>
              <div>
                💡 Ex: 50 folhas de alga cortadas ao meio → informe <b>100</b> unidades.
              </div>
              {packagePerUnit > 0 && (
                <div className="pt-1 border-t mt-1 text-foreground">
                  Custo por unidade: <b>{formatBRL(packagePerUnit)}</b>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasYield}
              onChange={(e) => setHasYield(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <Scissors className="w-4 h-4 text-muted-foreground" />
            <span>Este ingrediente tem limpeza/perda (proteína, peixe...)</span>
          </label>

          {hasYield && (
            <div className="mt-3 space-y-3 pl-6">
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setYieldMode("percent")}
                  className={`px-3 py-1.5 rounded-md border ${
                    yieldMode === "percent"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  % de aproveitamento
                </button>
                <button
                  type="button"
                  onClick={() => setYieldMode("weights")}
                  className={`px-3 py-1.5 rounded-md border ${
                    yieldMode === "weights"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  Bruto → limpo
                </button>
              </div>

              {yieldMode === "percent" ? (
                <div className="grid gap-2 sm:grid-cols-[180px_1fr] items-end">
                  <div>
                    <Label className="text-xs">Rendimento (%)</Label>
                    <Input
                      inputMode="decimal"
                      value={yieldPct}
                      onChange={(e) => setYieldPct(e.target.value)}
                      placeholder="ex: 55"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground pb-2">
                    Ex: 55 → de cada 100g bruto sobram 55g limpos.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-3 items-end">
                  <div>
                    <Label className="text-xs">Peso bruto</Label>
                    <Input
                      inputMode="decimal"
                      value={gross}
                      onChange={(e) => setGross(e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Peso limpo</Label>
                    <Input
                      inputMode="decimal"
                      value={net}
                      onChange={(e) => setNet(e.target.value)}
                      placeholder="550"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground pb-2">
                    {(() => {
                      const g = parseNum(gross);
                      const n = parseNum(net);
                      if (g > 0 && n > 0 && n < g)
                        return `Rendimento: ${((n / g) * 100).toFixed(1)}%`;
                      return "Informe ambos na mesma unidade.";
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>


      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="w-4 h-4" />
          {ingredients.length} ingrediente{ingredients.length === 1 ? "" : "s"} cadastrado{ingredients.length === 1 ? "" : "s"}
        </div>
        {ingredients.length === 0 && (
          <Card className="card-paper p-8 text-center text-muted-foreground">
            Nenhum ingrediente ainda. Adicione manualmente acima ou use o Scanner de NF.
          </Card>
        )}
        {ingredients.map((ing) => {
          const effective = effectivePricePerUnit(ing);
          const hasLoss = ing.yieldPercent && ing.yieldPercent > 0 && ing.yieldPercent < 100;
          return (
            <Card key={ing.id} className="card-paper p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {ing.name}
                    {hasLoss && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/25 text-accent-foreground font-semibold">
                        {ing.yieldPercent!.toFixed(0)}% rend.
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Atualizado {new Date(ing.lastUpdated).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-base leading-tight">
                    {formatBRL(ing.pricePerUnit)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {UNIT_LABEL[ing.unit]}
                  </div>
                  {hasLoss && (
                    <div className="text-[11px] text-primary font-semibold mt-0.5">
                      líquido: {formatBRL(effective)}
                    </div>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setEditingId(editingId === ing.id ? null : ing.id)
                  }
                  aria-label="Editar ingrediente"
                  title="Editar ingrediente"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setEditingYieldId(editingYieldId === ing.id ? null : ing.id)
                  }
                  aria-label="Editar rendimento"
                  title="Editar rendimento"
                >
                  <Scissors className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(ing.id)}
                  aria-label="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {editingId === ing.id && (
                <IngredientEditor
                  ingredient={ing}
                  onSave={(updated) => {
                    onUpsert({ ...updated, lastUpdated: new Date().toISOString() });
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )}

              {editingYieldId === ing.id && (
                <YieldEditor
                  ingredient={ing}
                  onSave={(yieldPercent) => {
                    onUpsert({ ...ing, yieldPercent, lastUpdated: new Date().toISOString() });
                    setEditingYieldId(null);
                  }}
                  onClear={() => {
                    onUpsert({ ...ing, yieldPercent: undefined, lastUpdated: new Date().toISOString() });
                    setEditingYieldId(null);
                  }}
                  onCancel={() => setEditingYieldId(null)}
                />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function YieldEditor({
  ingredient,
  onSave,
  onClear,
  onCancel,
}: {
  ingredient: Ingredient;
  onSave: (yieldPercent: number) => void;
  onClear: () => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<YieldMode>("percent");
  const [pct, setPct] = useState(
    ingredient.yieldPercent ? String(ingredient.yieldPercent) : ""
  );
  const [gross, setGross] = useState("");
  const [net, setNet] = useState("");

  function save() {
    let y = 0;
    if (mode === "percent") y = parseNum(pct);
    else {
      const g = parseNum(gross);
      const n = parseNum(net);
      if (g > 0 && n > 0 && n < g) y = (n / g) * 100;
    }
    if (y > 0 && y < 100) onSave(y);
  }

  return (
    <div className="mt-3 pt-3 border-t space-y-3 bg-secondary/20 -mx-3 -mb-3 px-3 pb-3 rounded-b-lg">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode("percent")}
            className={`px-2.5 py-1 rounded-md border ${
              mode === "percent" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
            }`}
          >
            %
          </button>
          <button
            type="button"
            onClick={() => setMode("weights")}
            className={`px-2.5 py-1 rounded-md border ${
              mode === "weights" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
            }`}
          >
            Bruto → limpo
          </button>
        </div>
        <Button size="icon" variant="ghost" onClick={onCancel} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {mode === "percent" ? (
        <div>
          <Label className="text-xs">Rendimento (%)</Label>
          <Input
            inputMode="decimal"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="ex: 55"
          />
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-2">
          <div>
            <Label className="text-xs">Peso bruto</Label>
            <Input inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} placeholder="1000" />
          </div>
          <div>
            <Label className="text-xs">Peso limpo</Label>
            <Input inputMode="decimal" value={net} onChange={(e) => setNet(e.target.value)} placeholder="550" />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={save} className="flex-1">Salvar rendimento</Button>
        {ingredient.yieldPercent && (
          <Button size="sm" variant="outline" onClick={onClear}>
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}

function IngredientEditor({
  ingredient,
  onSave,
  onCancel,
}: {
  ingredient: Ingredient;
  onSave: (updated: Ingredient) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"direct" | "package">("direct");
  const [name, setName] = useState(ingredient.name);
  const [unit, setUnit] = useState<Unit>(ingredient.unit);
  const [price, setPrice] = useState(String(ingredient.pricePerUnit).replace(".", ","));
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgUnits, setPkgUnits] = useState("");

  const packagePerUnit = (() => {
    const p = parseNum(pkgPrice);
    const u = parseNum(pkgUnits);
    return p > 0 && u > 0 ? p / u : 0;
  })();

  function save() {
    if (!name.trim()) return;
    let finalUnit: Unit = unit;
    let finalPrice = 0;
    if (mode === "package") {
      if (packagePerUnit <= 0) return;
      finalUnit = "un";
      finalPrice = packagePerUnit;
    } else {
      finalPrice = parseNum(price);
      if (!isFinite(finalPrice) || finalPrice <= 0) return;
    }
    onSave({ ...ingredient, name: name.trim(), unit: finalUnit, pricePerUnit: finalPrice });
  }

  return (
    <div className="mt-3 pt-3 border-t space-y-3 bg-secondary/20 -mx-3 -mb-3 px-3 pb-3 rounded-b-lg">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode("direct")}
            className={`px-2.5 py-1 rounded-md border ${
              mode === "direct" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
            }`}
          >
            Preço direto
          </button>
          <button
            type="button"
            onClick={() => setMode("package")}
            className={`px-2.5 py-1 rounded-md border ${
              mode === "package" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
            }`}
          >
            Pacote → unidades
          </button>
        </div>
        <Button size="icon" variant="ghost" onClick={onCancel} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div>
        <Label className="text-xs">Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {mode === "direct" ? (
        <div className="grid gap-2 grid-cols-2">
          <div>
            <Label className="text-xs">Unidade base</Label>
            <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="g">grama (g)</SelectItem>
                <SelectItem value="kg">quilo (kg)</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="L">litro (L)</SelectItem>
                <SelectItem value="un">unidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Preço {UNIT_LABEL[unit]}</Label>
            <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 grid-cols-2">
            <div>
              <Label className="text-xs">Preço do pacote (R$)</Label>
              <Input inputMode="decimal" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label className="text-xs">Rende quantas unidades?</Label>
              <Input inputMode="decimal" value={pkgUnits} onChange={(e) => setPkgUnits(e.target.value)} placeholder="ex: 100" />
            </div>
          </div>
          {packagePerUnit > 0 && (
            <div className="text-xs text-muted-foreground">
              Custo por unidade: <b className="text-foreground">{formatBRL(packagePerUnit)}</b>
            </div>
          )}
        </div>
      )}

      <Button size="sm" onClick={save} className="w-full">Salvar alterações</Button>
    </div>
  );
}
