import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Platforms } from "@/lib/store";

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
  function update(
    key: keyof Platforms,
    field: "feePercent" | "fixedFee",
    value: string,
  ) {
    const n = parseFloat(value.replace(",", ".")) || 0;
    onChange({ ...platforms, [key]: { ...platforms[key], [field]: n } });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure a comissão de cada plataforma. Esses valores são descontados automaticamente do preço de venda para calcular seu lucro real.
      </p>
      {ROWS.map((row) => (
        <Card key={row.key} className="card-paper p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-display text-lg">{row.label}</h3>
            <span className="text-xs text-muted-foreground">{row.hint}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Comissão (%)</Label>
              <Input
                inputMode="decimal"
                value={platforms[row.key].feePercent || ""}
                onChange={(e) => update(row.key, "feePercent", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Taxa fixa por pedido (R$)</Label>
              <Input
                inputMode="decimal"
                value={platforms[row.key].fixedFee || ""}
                onChange={(e) => update(row.key, "fixedFee", e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
