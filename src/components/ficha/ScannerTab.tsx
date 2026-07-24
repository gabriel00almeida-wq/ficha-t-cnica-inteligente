import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Camera, Image as ImageIcon, Sparkles, Check, X, TrendingUp, TrendingDown } from "lucide-react";
import { extractInvoice, type OcrItem } from "@/lib/ocr.functions";
import {
  type Ingredient,
  type Unit,
  formatBRL,
  uid,
  withPriceUpdate,
} from "@/lib/store";

type Props = {
  ingredients: Ingredient[];
  onUpsert: (i: Ingredient) => void;
};

type RowStatus = "needs_confirm" | "confirmed_link" | "new" | "skip";

type Row = OcrItem & {
  linkedTo: string; // ingredient id, or "" when new
  baseUnit: Unit;
  basePricePerUnit: number;
  status: RowStatus;
  suggestedId?: string; // id of the auto-detected match, if any
};

// Convert receipt unit to base unit per-unit price
function normalize(item: OcrItem): { baseUnit: Unit; basePricePerUnit: number } {
  const u = (item.unit || "").toLowerCase().trim();
  const perUnitOrig = item.unitPrice || (item.quantity > 0 ? item.totalPrice / item.quantity : 0);
  if (u === "kg") return { baseUnit: "g", basePricePerUnit: perUnitOrig / 1000 };
  if (u === "g") return { baseUnit: "g", basePricePerUnit: perUnitOrig };
  if (u === "l" || u === "lt") return { baseUnit: "ml", basePricePerUnit: perUnitOrig / 1000 };
  if (u === "ml") return { baseUnit: "ml", basePricePerUnit: perUnitOrig };
  return { baseUnit: "un", basePricePerUnit: perUnitOrig };
}

// Normaliza para matching: minúsculas, sem acentos, sem pontuação
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(["de", "do", "da", "com", "sem", "e", "para", "kg", "g", "un", "ml", "l"]);

function tokens(s: string): string[] {
  return norm(s).split(" ").filter((t) => t.length > 1 && !STOP.has(t));
}

/** Retorna ingrediente sugerido para um item da NF, ou undefined. */
function findMatch(itemName: string, ingredients: Ingredient[]): Ingredient | undefined {
  const nItem = norm(itemName);
  if (!nItem) return undefined;
  const tItem = new Set(tokens(itemName));

  let best: { ing: Ingredient; score: number } | undefined;
  for (const ing of ingredients) {
    const nIng = norm(ing.name);
    if (!nIng) continue;
    let score = 0;
    if (nItem === nIng) score = 1000;
    else if (nItem.includes(nIng) || nIng.includes(nItem)) score = 500;
    else {
      const tIng = tokens(ing.name);
      const shared = tIng.filter((t) => tItem.has(t)).length;
      if (shared > 0) score = shared * 100 + (shared === tIng.length ? 50 : 0);
    }
    if (score > 0 && (!best || score > best.score)) best = { ing, score };
  }
  return best?.score && best.score >= 100 ? best.ing : undefined;
}

export function ScannerTab({ ingredients, onUpsert }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<{ storeName?: string; date?: string } | null>(null);

  const extract = useServerFn(extractInvoice);

  async function handleFile(file: File) {
    setError(null);
    setRows([]);
    setMeta(null);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setImagePreview(dataUrl);
    setLoading(true);
    try {
      const result = await extract({ data: { imageDataUrl: dataUrl } });
      setMeta({ storeName: result.storeName, date: result.date });
      setRows(
        result.items.map((it) => {
          const nrm = normalize(it);
          const match = findMatch(it.name, ingredients);
          return {
            ...it,
            ...nrm,
            linkedTo: match?.id ?? "",
            suggestedId: match?.id,
            status: match ? "needs_confirm" : "new",
          } as Row;
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao processar imagem");
    } finally {
      setLoading(false);
    }
  }

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  const pending = rows.filter((r) => r.status === "needs_confirm").length;

  function applyAll() {
    if (pending > 0) {
      setError(`Confirme os ${pending} item(ns) pendente(s) antes de aplicar.`);
      return;
    }
    setError(null);
    const note = [meta?.storeName, meta?.date].filter(Boolean).join(" · ") || "Scanner NF";
    let applied = 0;
    rows.forEach((row) => {
      if (row.status === "skip") return;
      if (row.status === "new" || !row.linkedTo) {
        const seed: Ingredient = {
          id: uid(),
          name: row.name,
          unit: row.baseUnit,
          pricePerUnit: 0, // será sobrescrito por withPriceUpdate
          lastUpdated: new Date().toISOString(),
          priceHistory: [],
        };
        const withHist = withPriceUpdate(seed, row.basePricePerUnit, "scanner", note);
        onUpsert(withHist);
        applied++;
      } else if (row.status === "confirmed_link") {
        const existing = ingredients.find((i) => i.id === row.linkedTo);
        if (existing) {
          const updated = withPriceUpdate(
            { ...existing, unit: row.baseUnit, lastUpdated: new Date().toISOString() },
            row.basePricePerUnit,
            "scanner",
            note,
          );
          onUpsert(updated);
          applied++;
        }
      }
    });
    setRows([]);
    setImagePreview(null);
    setMeta(null);
    if (applied > 0) {
      alert(`${applied} ingrediente(s) atualizado(s). Os custos dos combinados foram recalculados e a variação foi registrada no histórico.`);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="card-paper p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg">Scanner de nota fiscal</h3>
            <p className="text-sm text-muted-foreground">
              Envie uma foto da NF. A IA extrai cada item e, ao confirmar, atualiza o preço dos ingredientes vinculados — o custo dos combinados é recalculado automaticamente e a variação fica salva no histórico.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={loading}
            className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors py-6 px-4 flex flex-col items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Analisando com IA...</span>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8" />
                <span className="font-medium">Abrir câmera e tirar foto</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={loading}
            className="w-full rounded-lg border border-border hover:bg-muted transition-colors py-3 px-4 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Escolher da galeria</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
      </Card>

      {imagePreview && (
        <Card className="card-paper p-4">
          <div className="flex gap-4">
            <img
              src={imagePreview}
              alt="Nota fiscal"
              className="w-24 h-32 object-cover rounded-md border"
            />
            <div className="text-sm">
              {meta?.storeName && (
                <div><span className="text-muted-foreground">Loja:</span> {meta.storeName}</div>
              )}
              {meta?.date && (
                <div><span className="text-muted-foreground">Data:</span> {meta.date}</div>
              )}
              {loading && <div className="text-muted-foreground">Extraindo itens...</div>}
            </div>
          </div>
        </Card>
      )}

      {rows.length > 0 && (
        <Card className="card-paper p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-display text-base">Revisar itens extraídos</h4>
              {pending > 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  {pending} item(ns) aguardando confirmação
                </div>
              )}
            </div>
            <Button onClick={applyAll} disabled={pending > 0}>
              <Check className="w-4 h-4 mr-1" /> Aplicar tudo
            </Button>
          </div>
          <div className="space-y-2">
            {rows.map((row, idx) => {
              const suggested = row.suggestedId
                ? ingredients.find((i) => i.id === row.suggestedId)
                : undefined;
              return (
                <div key={idx} className="rounded-md border p-3 bg-background">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{row.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.quantity} {row.unit} · {formatBRL(row.totalPrice)}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateRow(idx, { status: "skip" })}
                      className={row.status === "skip" ? "text-destructive" : ""}
                      title="Ignorar este item"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {row.status === "skip" ? (
                    <div className="text-xs text-muted-foreground italic flex items-center gap-2">
                      Ignorado
                      <button
                        className="underline"
                        onClick={() =>
                          updateRow(idx, {
                            status: row.suggestedId ? "needs_confirm" : "new",
                            linkedTo: row.suggestedId ?? "",
                          })
                        }
                      >
                        desfazer
                      </button>
                    </div>
                  ) : row.status === "needs_confirm" && suggested ? (
                    <ConfirmMatchBlock
                      row={row}
                      suggested={suggested}
                      onYes={() =>
                        updateRow(idx, { status: "confirmed_link", linkedTo: suggested.id })
                      }
                      onNo={() =>
                        updateRow(idx, { status: "new", linkedTo: "", suggestedId: undefined })
                      }
                      onEditPrice={(v) => updateRow(idx, { basePricePerUnit: v })}
                      onEditUnit={(u) => updateRow(idx, { baseUnit: u })}
                    />
                  ) : (
                    <LinkedEditor
                      row={row}
                      ingredients={ingredients}
                      onLinkChange={(v) => {
                        if (v === "__new__") {
                          updateRow(idx, { status: "new", linkedTo: "" });
                        } else {
                          updateRow(idx, { status: "confirmed_link", linkedTo: v });
                        }
                      }}
                      onUnit={(u) => updateRow(idx, { baseUnit: u })}
                      onPrice={(v) => updateRow(idx, { basePricePerUnit: v })}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function priceDeltaBadge(oldP: number, newP: number) {
  if (!oldP || oldP <= 0) return null;
  const diff = newP - oldP;
  const pct = (diff / oldP) * 100;
  const up = diff > 0;
  const flat = Math.abs(pct) < 0.5;
  const color = flat
    ? "text-muted-foreground"
    : up
      ? "text-destructive"
      : "text-emerald-600 dark:text-emerald-400";
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${color}`}>
      {!flat && <Icon className="w-3 h-3" />}
      {pct > 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function ConfirmMatchBlock({
  row,
  suggested,
  onYes,
  onNo,
  onEditPrice,
  onEditUnit,
}: {
  row: Row;
  suggested: Ingredient;
  onYes: () => void;
  onNo: () => void;
  onEditPrice: (v: number) => void;
  onEditUnit: (u: Unit) => void;
}) {
  return (
    <div className="space-y-3 bg-primary/5 border border-primary/20 rounded-md p-3">
      <div className="text-sm">
        Esse item corresponde a{" "}
        <b>{suggested.name}</b> do seu estoque?
      </div>
      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          Preço atual: <b className="text-foreground">{formatBRL(suggested.pricePerUnit)}</b>/{suggested.unit}
        </span>
        <span>→</span>
        <span>
          Novo: <b className="text-foreground">{formatBRL(row.basePricePerUnit)}</b>/{row.baseUnit}
        </span>
        {priceDeltaBadge(suggested.pricePerUnit, row.basePricePerUnit)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onYes} className="flex-1 min-w-[140px]">
          <Check className="w-4 h-4 mr-1" /> Sim, atualizar preço
        </Button>
        <Button size="sm" variant="outline" onClick={onNo} className="flex-1 min-w-[120px]">
          Não, é outro item
        </Button>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ajustar unidade ou preço antes de aplicar
        </summary>
        <div className="grid gap-2 sm:grid-cols-2 mt-2">
          <div>
            <Label className="text-[10px] uppercase">Unidade base</Label>
            <Select value={row.baseUnit} onValueChange={(v) => onEditUnit(v as Unit)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="L">L</SelectItem>
                <SelectItem value="un">un</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase">Preço por {row.baseUnit}</Label>
            <Input
              inputMode="decimal"
              value={row.basePricePerUnit || ""}
              onChange={(e) =>
                onEditPrice(parseFloat(e.target.value.replace(",", ".")) || 0)
              }
            />
          </div>
        </div>
      </details>
    </div>
  );
}

function LinkedEditor({
  row,
  ingredients,
  onLinkChange,
  onUnit,
  onPrice,
}: {
  row: Row;
  ingredients: Ingredient[];
  onLinkChange: (v: string) => void;
  onUnit: (u: Unit) => void;
  onPrice: (v: number) => void;
}) {
  const linked = row.linkedTo
    ? ingredients.find((i) => i.id === row.linkedTo)
    : undefined;
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
        <div>
          <Label className="text-[10px] uppercase">Vincular</Label>
          <Select
            value={row.linkedTo || "__new__"}
            onValueChange={onLinkChange}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__new__">➕ Criar novo</SelectItem>
              {ingredients.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase">Unidade base</Label>
          <Select value={row.baseUnit} onValueChange={(v) => onUnit(v as Unit)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="g">g</SelectItem>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="ml">ml</SelectItem>
              <SelectItem value="L">L</SelectItem>
              <SelectItem value="un">un</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase">Preço por {row.baseUnit}</Label>
          <Input
            inputMode="decimal"
            value={row.basePricePerUnit || ""}
            onChange={(e) =>
              onPrice(parseFloat(e.target.value.replace(",", ".")) || 0)
            }
          />
        </div>
      </div>
      {linked && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>
            Atual: {formatBRL(linked.pricePerUnit)}/{linked.unit} → novo {formatBRL(row.basePricePerUnit)}/{row.baseUnit}
          </span>
          {priceDeltaBadge(linked.pricePerUnit, row.basePricePerUnit)}
        </div>
      )}
    </div>
  );
}
