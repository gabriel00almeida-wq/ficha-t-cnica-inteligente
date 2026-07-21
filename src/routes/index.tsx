import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { IngredientsTab } from "@/components/ficha/IngredientsTab";
import { RecipesTab } from "@/components/ficha/RecipesTab";
import { CombosTab } from "@/components/ficha/CombosTab";
import { PlatformsTab } from "@/components/ficha/PlatformsTab";
import { ScannerTab } from "@/components/ficha/ScannerTab";
import { RankingTab } from "@/components/ficha/RankingTab";
import { Package, ChefHat, Store, ScanLine, BookOpen, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ficha Técnica Inteligente · Sushi" },
      {
        name: "description",
        content:
          "Ficha técnica com IA para combinados de sushi. Escaneie notas fiscais, atualize custos e calcule o lucro em 99Food, iFood e Anota AI.",
      },
      { property: "og:title", content: "Ficha Técnica Inteligente · Sushi" },
      {
        property: "og:description",
        content:
          "Escaneie notas fiscais e recalcule custos de combinados automaticamente com preços em 99Food, iFood e Anota AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const {
    state,
    hydrated,
    upsertIngredient,
    removeIngredient,
    upsertRecipe,
    removeRecipe,
    upsertCombo,
    removeCombo,
    setPlatforms,
  } = useAppStore();
  const [tab, setTab] = useState("scanner");

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-xl">
            寿
          </div>
          <div>
            <h1 className="font-display text-2xl leading-tight">Ficha Técnica</h1>
            <p className="text-xs text-muted-foreground">
              Custos e precificação inteligente para seus combinados
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="scanner" className="flex-col gap-1 py-2 text-[11px]">
              <ScanLine className="w-4 h-4" />
              <span>Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="flex-col gap-1 py-2 text-[11px]">
              <Package className="w-4 h-4" />
              <span>Ingredientes</span>
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex-col gap-1 py-2 text-[11px]">
              <BookOpen className="w-4 h-4" />
              <span>Receitas</span>
            </TabsTrigger>
            <TabsTrigger value="combos" className="flex-col gap-1 py-2 text-[11px]">
              <ChefHat className="w-4 h-4" />
              <span>Combinados</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex-col gap-1 py-2 text-[11px]">
              <TrendingUp className="w-4 h-4" />
              <span>Ranking</span>
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex-col gap-1 py-2 text-[11px]">
              <Store className="w-4 h-4" />
              <span>Plataformas</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="scanner">
              <ScannerTab ingredients={state.ingredients} onUpsert={upsertIngredient} />
            </TabsContent>
            <TabsContent value="ingredients">
              <IngredientsTab
                ingredients={state.ingredients}
                onUpsert={upsertIngredient}
                onRemove={removeIngredient}
              />
            </TabsContent>
            <TabsContent value="recipes">
              <RecipesTab
                recipes={state.recipes}
                ingredients={state.ingredients}
                onUpsert={upsertRecipe}
                onRemove={removeRecipe}
              />
            </TabsContent>
            <TabsContent value="combos">
              <CombosTab
                combos={state.combos}
                ingredients={state.ingredients}
                recipes={state.recipes}
                platforms={state.platforms}
                onUpsert={upsertCombo}
                onRemove={removeCombo}
              />
            </TabsContent>
            <TabsContent value="ranking">
              <RankingTab
                combos={state.combos}
                ingredients={state.ingredients}
                recipes={state.recipes}
                platforms={state.platforms}
              />
            </TabsContent>
            <TabsContent value="platforms">
              <PlatformsTab platforms={state.platforms} onChange={setPlatforms} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
