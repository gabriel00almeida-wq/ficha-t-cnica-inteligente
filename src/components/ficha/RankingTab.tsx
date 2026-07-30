import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Loader2,
  AlertTriangle,
  ListChecks,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import {
  analyzeCombo,
  type AiAnalysis,
  type ComboSnapshot,
} from "@/lib/analysis.functions";

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
import { cn } from "@/lib/utils";

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
  const [openId, setOpenId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTarget, setAiTarget] = useState<string>("");
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);

  async function runAnalysis(snapshot: ComboSnapshot) {
    setAiTarget(snapshot.name);
    setAnalysis(null);
    setAiOpen(true);
    setAiLoading(true);
    try {
      const result = await analyzeCombo({ data: { combo: snapshot } });
      setAnalysis(result);
    } catch (e) {
      setAiOpen(false);
      toast.error(e instanceof Error ? e.message : "Não foi possível analisar agora.");
    } finally {
      setAiLoading(false);
    }
  }


  const rows = useMemo(() => {
    return combos.map((c) => {
      const cost = comboCost(c, ingredients, recipes);
      const perPlatform = (["food99", "ifood", "anotai"] as const).map((k) => {
        const price = c.prices[k];
        const r = platformResult(price, cost, platforms[k]);
        const cmv = price > 0 ? (cost / price) * 100 : 0;
        return { key: k, label: PLATFORM_LABELS[k], price, cmv, ...r };
      });
      const active = perPlatform.filter((p) => p.price > 0);
      const avgProfit = active.length
        ? active.reduce((s, p) => s + p.profit, 0) / active.length
        : 0;
      const avgMargin = active.length
        ? active.reduce((s, p) => s + p.margin, 0) / active.length
        : 0;
      const avgPrice = active.length
        ? active.reduce((s, p) => s + p.price, 0) / active.length
        : 0;
      const avgCmv = avgPrice > 0 ? (cost / avgPrice) * 100 : 0;
      const bestMargin = active.reduce<null | (typeof perPlatform)[number]>(
        (best, p) => (best === null || p.margin > best.margin ? p : best),
        null,
      );
      return { combo: c, cost, perPlatform, avgProfit, avgMargin, avgCmv, bestMargin };
    });
  }, [combos, ingredients, recipes, platforms]);

  const ranked = useMemo(
    () => [...rows].sort((a, b) => b.avgMargin - a.avgMargin),
    [rows],
  );

  if (combos.length === 0) {
    return (
      <Card className="card-paper p-8 text-center text-muted-foreground">
        Cadastre combinados para ver o ranking de rentabilidade.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ordenado pela margem média de lucro. Toque em <span className="font-medium text-foreground">Ver gráfico</span> para
        detalhar cada combinado.
      </p>

      <div className="space-y-3">
        {ranked.map((r, idx) => {
          const isOpen = openId === r.combo.id;
          const cmvTone =
            r.avgCmv <= 30
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              : r.avgCmv <= 45
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                : "bg-destructive/15 text-destructive border-destructive/30";

          const chartData = r.perPlatform.map((p) => ({
            name: p.label,
            preço: Number(p.price.toFixed(2)),
            custo: Number(r.cost.toFixed(2)),
            lucro: Number(p.profit.toFixed(2)),
            margem: Number(p.margin.toFixed(1)),
            cmv: Number(p.cmv.toFixed(1)),
          }));

          return (
            <Card key={r.combo.id} className="card-paper overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-display text-lg leading-tight truncate">
                        {r.combo.name}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 font-mono text-[11px]", cmvTone)}
                      >
                        CMV {r.avgCmv.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Custo {formatBRL(r.cost)} · Lucro médio{" "}
                      <span
                        className={
                          r.avgProfit >= 0
                            ? "text-foreground font-medium"
                            : "text-destructive font-medium"
                        }
                      >
                        {formatBRL(r.avgProfit)}
                      </span>{" "}
                      · Margem{" "}
                      <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                        {r.avgMargin >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-destructive" />
                        )}
                        {r.avgMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-1 text-xs">
                  {r.perPlatform.map((p) => (
                    <div
                      key={p.key}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-muted-foreground truncate">
                        {p.label}{" "}
                        {p.price > 0 ? `· ${formatBRL(p.price)}` : "· sem preço"}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        {p.price > 0 && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            CMV {p.cmv.toFixed(0)}%
                          </span>
                        )}
                        <span className={p.profit >= 0 ? "" : "text-destructive"}>
                          {p.price > 0
                            ? `${formatBRL(p.profit)} (${p.margin.toFixed(1)}%)`
                            : "—"}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                {r.bestMargin && (
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    Melhor plataforma:{" "}
                    <span className="text-foreground font-medium">
                      {r.bestMargin.label}
                    </span>{" "}
                    ({r.bestMargin.margin.toFixed(1)}%)
                  </div>
                )}

                <Separator className="my-3" />

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-8 px-2 text-xs"
                  onClick={() => setOpenId(isOpen ? null : r.combo.id)}
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5" />
                    {isOpen ? "Ocultar gráfico" : "Ver gráfico"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </Button>
              </div>

              {isOpen && (
                <div className="border-t border-border/60 bg-muted/30 p-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      Margem por plataforma (%)
                    </h4>
                    <div className="w-full h-40">
                      <ResponsiveContainer>
                        <BarChart
                          data={chartData}
                          margin={{ top: 5, right: 8, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} unit="%" />
                          <Tooltip
                            formatter={(v: number) => `${v.toFixed(1)}%`}
                            contentStyle={{ fontSize: 12 }}
                          />
                          <Bar dataKey="margem" radius={[6, 6, 0, 0]}>
                            {chartData.map((d, i) => (
                              <Cell
                                key={i}
                                fill={
                                  d.margem >= 0
                                    ? "hsl(var(--primary))"
                                    : "hsl(var(--destructive))"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      Custo vs. lucro (R$)
                    </h4>
                    <div className="w-full h-40">
                      <ResponsiveContainer>
                        <BarChart
                          data={chartData}
                          margin={{ top: 5, right: 8, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(v: number) => formatBRL(v)}
                            contentStyle={{ fontSize: 12 }}
                          />
                          <Bar
                            dataKey="custo"
                            fill="hsl(var(--muted-foreground))"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="lucro"
                            fill="hsl(var(--accent))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
