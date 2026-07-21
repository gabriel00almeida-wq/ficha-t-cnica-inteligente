import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  type Combo,
  type Ingredient,
  type Recipe,
  type Platforms,
  comboCost,
  platformResult,
  formatBRL,
} from "@/lib/store";

type Props = {
  combos: Combo[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  platforms: Platforms;
};

const PLATFORM_LABELS: Record<"food99" | "ifood" | "anotai", string> = {
  food99: "99Food",
  ifood: "iFood",
  anotai: "Anota AI",
};

export function RankingTab({ combos, ingredients, recipes, platforms }: Props) {
  const rows = useMemo(() => {
    return combos.map((c) => {
      const cost = comboCost(c, ingredients, recipes);
      const perPlatform = (["food99", "ifood", "anotai"] as const).map((k) => {
        const price = c.prices[k];
        const r = platformResult(price, cost, platforms[k]);
        return { key: k, label: PLATFORM_LABELS[k], price, ...r };
      });
      const active = perPlatform.filter((p) => p.price > 0);
      const avgProfit = active.length
        ? active.reduce((s, p) => s + p.profit, 0) / active.length
        : 0;
      const avgMargin = active.length
        ? active.reduce((s, p) => s + p.margin, 0) / active.length
        : 0;
      const bestMargin = active.reduce<null | (typeof perPlatform)[number]>(
        (best, p) => (best === null || p.margin > best.margin ? p : best),
        null,
      );
      return { combo: c, cost, perPlatform, avgProfit, avgMargin, bestMargin };
    });
  }, [combos, ingredients, recipes, platforms]);

  const ranked = useMemo(
    () => [...rows].sort((a, b) => b.avgMargin - a.avgMargin),
    [rows],
  );

  const chartData = ranked.map((r) => ({
    name: r.combo.name,
    custo: Number(r.cost.toFixed(2)),
    lucro: Number(r.avgProfit.toFixed(2)),
    margem: Number(r.avgMargin.toFixed(1)),
  }));

  if (combos.length === 0) {
    return (
      <Card className="card-paper p-8 text-center text-muted-foreground">
        Cadastre combinados para ver o ranking de rentabilidade.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Ranking dos combinados ordenados pela margem média de lucro (considerando taxas, entrega e promoções das plataformas com preço definido).
      </p>

      <Card className="card-paper p-4">
        <h3 className="font-display text-base mb-3">Margem média de lucro (%)</h3>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                formatter={(v: number) => `${v.toFixed(1)}%`}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="margem" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.margem >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="card-paper p-4">
        <h3 className="font-display text-base mb-3">Custo vs. lucro médio (R$)</h3>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="custo" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lucro" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-3">
        {ranked.map((r, idx) => (
          <Card key={r.combo.id} className="card-paper p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg truncate">{r.combo.name}</div>
                <div className="text-xs text-muted-foreground">
                  Custo {formatBRL(r.cost)} · Lucro médio{" "}
                  <span className={r.avgProfit >= 0 ? "text-foreground font-medium" : "text-destructive font-medium"}>
                    {formatBRL(r.avgProfit)}
                  </span>{" "}
                  · Margem {r.avgMargin.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="grid gap-1 text-xs">
              {r.perPlatform.map((p) => (
                <div key={p.key} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {p.label} {p.price > 0 ? `· ${formatBRL(p.price)}` : "· sem preço"}
                  </span>
                  <span className={p.profit >= 0 ? "" : "text-destructive"}>
                    {p.price > 0 ? `${formatBRL(p.profit)} (${p.margin.toFixed(1)}%)` : "—"}
                  </span>
                </div>
              ))}
            </div>
            {r.bestMargin && (
              <div className="mt-2 text-[11px] text-muted-foreground">
                Melhor plataforma: <span className="text-foreground font-medium">{r.bestMargin.label}</span> ({r.bestMargin.margin.toFixed(1)}%)
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
