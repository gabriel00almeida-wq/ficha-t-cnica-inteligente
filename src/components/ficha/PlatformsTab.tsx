import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Platforms, PlatformFees } from "@/lib/store";

type Props = {
  platforms: Platforms;
  onChange: (p: Platforms) => void;
};

const ROWS: { key: keyof Platforms; label: string; hint: string }[] = [
  { key: "food99", label: "99Food", hint: "Taxa média do 99Food" },
  { key: "ifood", label: "iFood", hint: "Taxa média do iFood" },
  { key: "anotai", label: "Anota AI", hint: "Taxa média do Anota AI" },
];

export function PlatformsTab({ platforms, onChange }: Props) {
  function updateNum(
    key: keyof Platforms,
    field: "feePercent" | "fixedFee" | "avgDeliveryCost" | "promoValue",
    value: string,
  ) {
    const n = parseFloat(value.replace(",", ".")) || 0;
    onChange({ ...platforms, [key]: { ...platforms[key], [field]: n } });
  }

  function updatePromoType(key: keyof Platforms, promoType: PlatformFees["promoType"]) {
    onChange({ ...platforms, [key]: { ...platforms[key], promoType } });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure a comissão, o custo médio de entrega e as promoções de cada plataforma. Esses valores entram no cálculo de lucro dos combinados.
      </p>
      {ROWS.map((row) => {
        const p = platforms[row.key];
        return (
          <Card key={row.key} className="card-paper p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg">{row.label}</h3>
              <span className="text-xs text-muted-foreground">{row.hint}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Comissão (%)</Label>
                <Input
                  inputMode="decimal"
                  value={p.feePercent || ""}
                  onChange={(e) => updateNum(row.key, "feePercent", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs">Taxa fixa por pedido (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={p.fixedFee || ""}
                  onChange={(e) => updateNum(row.key, "fixedFee", e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Custo médio por entrega (R$)</Label>
              <Input
                inputMode="decimal"
                value={p.avgDeliveryCost || ""}
                onChange={(e) => updateNum(row.key, "avgDeliveryCost", e.target.value)}
                placeholder="Ex: 5,89"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Valor médio que você paga (ou banca) por entrega nessa plataforma.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Custo médio de promoções</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={p.promoType === "percent" ? "default" : "outline"}
                    className="h-7 px-2 text-xs"
                    onClick={() => updatePromoType(row.key, "percent")}
                  >
                    %
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={p.promoType === "brl" ? "default" : "outline"}
                    className="h-7 px-2 text-xs"
                    onClick={() => updatePromoType(row.key, "brl")}
                  >
                    R$
                  </Button>
                </div>
              </div>
              <Input
                inputMode="decimal"
                value={p.promoValue || ""}
                onChange={(e) => updateNum(row.key, "promoValue", e.target.value)}
                placeholder={p.promoType === "percent" ? "Ex: 10" : "Ex: 3,00"}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {p.promoType === "percent"
                  ? "Percentual médio de desconto aplicado no preço de venda."
                  : "Valor médio em reais descontado por pedido em promoções."}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
