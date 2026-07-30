import { createServerFn } from "@tanstack/react-start";
import { SYSTEM_PROMPT, buildComboContext } from "./analysis.server";

export type PlatformSnapshot = {
  label: string;
  price: number;
  cmv: number;
  profit: number;
  margin: number;
};

export type ComboSnapshot = {
  name: string;
  cost: number;
  avgProfit: number;
  avgMargin: number;
  avgCmv: number;
  platforms: PlatformSnapshot[];
};

export type AiAnalysis = {
  status: "bom" | "atencao" | "critico";
  diagnostico: string;
  sangramento: string;
  plano: string[];
};

export const analyzeCombo = createServerFn({ method: "POST" })
  .inputValidator((data: { combo: ComboSnapshot }) => {
    if (!data?.combo?.name) throw new Error("Dados do combinado ausentes.");
    return data;
  })
  .handler(async ({ data }): Promise<AiAnalysis> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente no servidor.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildComboContext(data.combo) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429)
      throw new Error("Muitas análises seguidas. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
    if (!res.ok) throw new Error(`Falha na análise (${res.status}): ${await res.text()}`);

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    let parsed: Partial<AiAnalysis> = {};
    try {
      parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
    } catch {
      throw new Error("A IA respondeu em formato inesperado. Tente novamente.");
    }

    return {
      status:
        parsed.status === "bom" || parsed.status === "critico"
          ? parsed.status
          : "atencao",
      diagnostico: parsed.diagnostico ?? "",
      sangramento: parsed.sangramento ?? "",
      plano: Array.isArray(parsed.plano) ? parsed.plano.slice(0, 6) : [],
    };
  });
