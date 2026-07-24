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
import { Trash2, Plus, Package, Scissors, X, Pencil, LineChart as LineChartIcon, TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
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

const CATEGORIES = [
  "Proteínas",
  "Grãos",
  "Farináceos",
  "Vegetais & Frutas",
  "Molhos & Temperos",
  "Laticínios",
  "Bebidas",
  "Embalagens & Descartáveis",
  "Outros",
] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_KEYWORDS: Record<Exclude<Category, "Outros">, string[]> = {
  "Proteínas": [
    "salmão", "salmao", "atum", "peixe", "tilápia", "tilapia", "camarão", "camarao",
    "polvo", "lula", "kani", "surimi", "frango", "peito de frango", "carne", "boi",
    "filé", "file mignon", "picanha", "bacon", "linguiça", "linguica", "presunto",
    "ovo", "ovos", "tilápia", "pescada", "peixe branco",
  ],
  "Grãos": [
    "arroz", "shari", "feijão", "feijao", "gergelim", "quinoa", "lentilha", "grão", "grao",
    "aveia",
  ],
  "Farináceos": [
    "farinha", "panko", "tempurá", "tempura", "pão", "pao", "massa", "wonton",
    "harumaki", "gyoza", "gioza", "guioza", "amido", "polvilho", "trigo",
  ],
  "Vegetais & Frutas": [
    "alga", "nori", "pepino", "cebolinha", "cebola", "cenoura", "manga", "abacate",
    "morango", "kiwi", "gengibre", "wasabi", "alho", "limão", "limao", "tomate",
    "pimenta", "acelga", "rúcula", "rucula", "alface", "brócolis", "brocolis",
    "cogumelo", "shitake", "shimeji", "champignon", "cream cheese", "cream",
    "cream-cheese",
  ],
  "Molhos & Temperos": [
    "shoyu", "tare", "tarê", "molho", "vinagre", "sakê", "sake", "mirim", "sal",
    "açúcar", "acucar", "azeite", "óleo", "oleo", "maionese", "ketchup", "mostarda",
    "tempero", "sriracha", "teriyaki", "ponzu", "dashi", "missô", "misso",
  ],
  "Laticínios": [
    "queijo", "cream cheese", "creamcheese", "requeijão", "requeijao", "manteiga",
    "leite", "iogurte", "muçarela", "mucarela", "mussarela", "parmesão", "parmesao",
    "philadelphia",
  ],
  "Bebidas": [
    "refrigerante", "coca", "coca-cola", "guaraná", "guarana", "suco", "água",
    "agua", "cerveja", "chá", "cha", "energético", "energetico", "fanta", "sprite",
    "h2o",
  ],
  "Embalagens & Descartáveis": [
    "hashi", "adaptador", "saco", "sacola", "kraft", "embalagem", "pote", "tampa",
    "guardanapo", "papel", "filme", "plástico", "plastico", "caixa", "bandeja",
    "copo", "canudo", "talher", "garfo", "faca", "colher", "etiqueta", "lacre",
    "sachê", "sache", "descartável", "descartavel",
  ],
};

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function categorize(ing: Ingredient): Category {
  const name = normalizeText(ing.name);
  for (const cat of Object.keys(CATEGORY_KEYWORDS) as Array<keyof typeof CATEGORY_KEYWORDS>) {
    const keys = CATEGORY_KEYWORDS[cat];
    if (keys.some((k) => name.includes(normalizeText(k)))) return cat;
  }
  return "Outros";
}

const CATEGORY_ORDER: Category[] = [...CATEGORIES];


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
  const [historyId, setHistoryId] = useState<string | null>(null);

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
          const history = ing.priceHistory ?? [];
          const prev = history.length >= 2 ? history[history.length - 2] : undefined;
          const trend = prev
            ? ((ing.pricePerUnit - prev.pricePerUnit) / prev.pricePerUnit) * 100
            : 0;
          const showTrend = !!prev && Math.abs(trend) >= 0.5;
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
                    {showTrend && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                          trend > 0
                            ? "text-destructive"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                        title={`Preço anterior: ${formatBRL(prev!.pricePerUnit)}`}
                      >
                        {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend > 0 ? "+" : ""}
                        {trend.toFixed(1)}%
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
                    setHistoryId(historyId === ing.id ? null : ing.id)
                  }
                  aria-label="Ver histórico de preços"
                  title="Histórico de preços"
                  disabled={history.length < 1}
                >
                  <LineChartIcon className="w-4 h-4" />
                </Button>
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

              {historyId === ing.id && <PriceHistoryPanel ingredient={ing} />}

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

function PriceHistoryPanel({ ingredient }: { ingredient: Ingredient }) {
  const history = ingredient.priceHistory ?? [];
  if (history.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground italic">
        Nenhum histórico registrado ainda. As mudanças de preço a partir de agora ficarão salvas aqui.
      </div>
    );
  }
  const data = history.map((p) => ({
    date: new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    price: Number(p.pricePerUnit.toFixed(4)),
    source: p.source,
    note: p.note,
    fullDate: p.date,
  }));
  const min = Math.min(...history.map((p) => p.pricePerUnit));
  const max = Math.max(...history.map((p) => p.pricePerUnit));
  const first = history[0].pricePerUnit;
  const last = history[history.length - 1].pricePerUnit;
  const totalPct = first > 0 ? ((last - first) / first) * 100 : 0;
  const recent = [...history].reverse().slice(0, 10);

  return (
    <div className="mt-3 pt-3 border-t space-y-3 bg-secondary/20 -mx-3 -mb-3 px-3 pb-3 rounded-b-lg">
      <div className="flex flex-wrap gap-3 text-xs">
        <div>
          <div className="text-muted-foreground">Mínimo</div>
          <div className="font-semibold">{formatBRL(min)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Máximo</div>
          <div className="font-semibold">{formatBRL(max)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Variação total</div>
          <div
            className={`font-semibold ${
              totalPct > 0
                ? "text-destructive"
                : totalPct < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : ""
            }`}
          >
            {totalPct > 0 ? "+" : ""}
            {totalPct.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Registros</div>
          <div className="font-semibold">{history.length}</div>
        </div>
      </div>

      {history.length >= 2 ? (
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => formatBRL(Number(v)).replace("R$", "")}
                width={60}
              />
              <Tooltip
                formatter={(v: number) => [formatBRL(v), "Preço"]}
                labelFormatter={(l) => `Data: ${l}`}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic">
          Só há 1 registro por enquanto — o gráfico aparece a partir de 2 atualizações de preço.
        </div>
      )}

      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Últimas atualizações
        </div>
        {recent.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0"
          >
            <div>
              <div>{new Date(p.date).toLocaleDateString("pt-BR")}</div>
              {p.note && <div className="text-[10px] text-muted-foreground">{p.note}</div>}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatBRL(p.pricePerUnit)}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  p.source === "scanner"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {p.source === "scanner" ? "NF" : "manual"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
