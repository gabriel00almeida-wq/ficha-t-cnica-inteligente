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
import { Loader2, Upload, Sparkles, Check, X } from "lucide-react";
import { extractInvoice, type OcrItem } from "@/lib/ocr.functions";
import {
  type Ingredient,
  type Unit,
  formatBRL,
  uid,
} from "@/lib/store";

type Props = {
  ingredients: Ingredient[];
  onUpsert: (i: Ingredient) => void;
};

type Row = OcrItem & {
  linkedTo: string | "__new__" | "__skip__";
  baseUnit: Unit;
  basePricePerUnit: number;
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

export function ScannerTab({ ingredients, onUpsert }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
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
          const norm = normalize(it);
          // Try to guess match by fuzzy name
          const match = ingredients.find(
            (ing) => ing.name.toLowerCase() === it.name.toLowerCase(),
          );
          return {
            ...it,
            ...norm,
            linkedTo: match ? match.id : "__new__",
          };
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

  function applyAll() {
    let applied = 0;
    rows.forEach((row) => {
      if (row.linkedTo === "__skip__") return;
      if (row.linkedTo === "__new__") {
        onUpsert({
          id: uid(),
          name: row.name,
          unit: row.baseUnit,
          pricePerUnit: row.basePricePerUnit,
          lastUpdated: new Date().toISOString(),
        });
        applied++;
      } else {
        const existing = ingredients.find((i) => i.id === row.linkedTo);
        if (existing) {
          onUpsert({
            ...existing,
            unit: row.baseUnit,
            pricePerUnit: row.basePricePerUnit,
            lastUpdated: new Date().toISOString(),
          });
          applied++;
        }
      }
    });
    setRows([]);
    setImagePreview(null);
    setMeta(null);
    if (applied > 0) {
      alert(`${applied} ingrediente(s) atualizado(s). Os custos dos combinados foram recalculados automaticamente.`);
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
              Envie uma foto da NF. A IA extrai cada item e atualiza os preços dos seus ingredientes — e os custos de todos os combinados que os usam são recalculados na hora.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            variant="outline"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            {loading ? "Analisando..." : "Escolher foto"}
          </Button>
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
          <div className="flex items-center justify-between">
            <h4 className="font-display text-base">Revisar itens extraídos</h4>
            <Button onClick={applyAll}>
              <Check className="w-4 h-4 mr-1" /> Aplicar tudo
            </Button>
          </div>
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={idx} className="rounded-md border p-3 bg-background">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.quantity} {row.unit} · {formatBRL(row.totalPrice)}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => updateRow(idx, { linkedTo: "__skip__" })}
                    className={row.linkedTo === "__skip__" ? "text-destructive" : ""}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {row.linkedTo !== "__skip__" ? (
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
                    <div>
                      <Label className="text-[10px] uppercase">Vincular</Label>
                      <Select
                        value={row.linkedTo}
                        onValueChange={(v) => updateRow(idx, { linkedTo: v })}
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
                      <Select
                        value={row.baseUnit}
                        onValueChange={(v) => updateRow(idx, { baseUnit: v as Unit })}
                      >
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
                          updateRow(idx, {
                            basePricePerUnit: parseFloat(e.target.value.replace(",", ".")) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic flex items-center gap-2">
                    Ignorado
                    <button
                      className="underline"
                      onClick={() => updateRow(idx, { linkedTo: "__new__" })}
                    >
                      desfazer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
