import { useEffect, useState, useCallback } from "react";

export type Unit = "g" | "kg" | "ml" | "L" | "un";

export type Ingredient = {
  id: string;
  name: string;
  unit: Unit; // base unit used in recipes
  pricePerUnit: number; // BRL per base unit as PURCHASED (gross, before cleaning)
  lastUpdated: string;
  /**
   * Rendimento líquido em % (0-100). Ex: salmão bruto com 55% de aproveitamento.
   * Quando definido, o custo efetivo por unidade utilizável = pricePerUnit / (yieldPercent/100).
   * Se ausente ou 100, considera-se que não há perda.
   */
  yieldPercent?: number;
};

export type ComboItem = {
  ingredientId: string;
  quantity: number;
  /**
   * "ingredient" (padrão) → ingredientId é um Ingredient e quantity está na unidade base dele.
   * "recipe" → ingredientId aponta para uma Recipe e quantity está em unidades da receita.
   */
  kind?: "ingredient" | "recipe";
};

export type Recipe = {
  id: string;
  name: string;
  items: ComboItem[]; // apenas ingredientes
  yieldUnits: number; // rende quantas unidades (ex: 10 sushis, 500 = 500g de shari)
  yieldLabel?: string; // rótulo livre, ex: "sushis", "porções", "g"
};

export type Combo = {
  id: string;
  name: string;
  items: ComboItem[];
  prices: {
    food99: number;
    ifood: number;
    anotai: number;
  };
};

export type PlatformFees = {
  feePercent: number;
  fixedFee: number;
};

export type Platforms = {
  food99: PlatformFees;
  ifood: PlatformFees;
  anotai: PlatformFees;
};

export type AppState = {
  ingredients: Ingredient[];
  recipes: Recipe[];
  combos: Combo[];
  platforms: Platforms;
};

const STORAGE_KEY = "ficha-sushi:v1";

const defaultState: AppState = {
  ingredients: [],
  recipes: [],
  combos: [],
  platforms: {
    food99: { feePercent: 18, fixedFee: 0 },
    ifood: { feePercent: 23, fixedFee: 0 },
    anotai: { feePercent: 5, fixedFee: 0 },
  },
};

function load(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ingredients: parsed.ingredients ?? [],
      recipes: parsed.recipes ?? [],
      combos: parsed.combos ?? [],
      platforms: { ...defaultState.platforms, ...(parsed.platforms ?? {}) },
    };
  } catch {
    return defaultState;
  }
}

function save(state: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) save(state);
  }, [state, hydrated]);

  const upsertIngredient = useCallback((ing: Ingredient) => {
    setState((s) => {
      const idx = s.ingredients.findIndex((i) => i.id === ing.id);
      const next = [...s.ingredients];
      if (idx >= 0) next[idx] = ing;
      else next.push(ing);
      return { ...s, ingredients: next };
    });
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      ingredients: s.ingredients.filter((i) => i.id !== id),
      recipes: s.recipes.map((r) => ({
        ...r,
        items: r.items.filter((it) => it.ingredientId !== id),
      })),
      combos: s.combos.map((c) => ({
        ...c,
        items: c.items.filter(
          (it) => it.kind === "recipe" || it.ingredientId !== id,
        ),
      })),
    }));
  }, []);

  const upsertRecipe = useCallback((recipe: Recipe) => {
    setState((s) => {
      const idx = s.recipes.findIndex((r) => r.id === recipe.id);
      const next = [...s.recipes];
      if (idx >= 0) next[idx] = recipe;
      else next.push(recipe);
      return { ...s, recipes: next };
    });
  }, []);

  const removeRecipe = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      recipes: s.recipes.filter((r) => r.id !== id),
      combos: s.combos.map((c) => ({
        ...c,
        items: c.items.filter(
          (it) => !(it.kind === "recipe" && it.ingredientId === id),
        ),
      })),
    }));
  }, []);

  const upsertCombo = useCallback((combo: Combo) => {
    setState((s) => {
      const idx = s.combos.findIndex((c) => c.id === combo.id);
      const next = [...s.combos];
      if (idx >= 0) next[idx] = combo;
      else next.push(combo);
      return { ...s, combos: next };
    });
  }, []);

  const removeCombo = useCallback((id: string) => {
    setState((s) => ({ ...s, combos: s.combos.filter((c) => c.id !== id) }));
  }, []);

  const setPlatforms = useCallback((platforms: Platforms) => {
    setState((s) => ({ ...s, platforms }));
  }, []);

  return {
    state,
    hydrated,
    upsertIngredient,
    removeIngredient,
    upsertRecipe,
    removeRecipe,
    upsertCombo,
    removeCombo,
    setPlatforms,
  };
}

export function effectivePricePerUnit(ing: Ingredient): number {
  const y = ing.yieldPercent;
  if (!y || y <= 0 || y >= 100) return ing.pricePerUnit;
  return ing.pricePerUnit / (y / 100);
}

export function comboCost(combo: Combo, ingredients: Ingredient[]): number {
  return combo.items.reduce((sum, it) => {
    const ing = ingredients.find((i) => i.id === it.ingredientId);
    if (!ing) return sum;
    return sum + effectivePricePerUnit(ing) * it.quantity;
  }, 0);
}

export function platformResult(
  price: number,
  cost: number,
  fees: PlatformFees,
) {
  const feeAmount = (price * fees.feePercent) / 100 + fees.fixedFee;
  const profit = price - feeAmount - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  return { feeAmount, profit, margin };
}

export function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(isFinite(n) ? n : 0);
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
