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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY ausente no servidor.");

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            { role: "user", parts: [{ text: buildComboContext(data.combo) }] },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );

    if (res.status === 429)
      throw new Error("Muitas análises seguidas. Tente novamente em instantes.");
    if (res.status === 402 || res.status === 403)
      throw new Error("Chave da Gemini inválida ou sem cota disponível.");
    if (!res.ok) throw new Error(`Falha na análise (${res.status}): ${await res.text()}`);

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const raw =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

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
