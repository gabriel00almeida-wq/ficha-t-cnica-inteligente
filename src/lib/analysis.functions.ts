import { createServerFn } from "@tanstack/react-start";

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

const SYSTEM_PROMPT = `Você é um consultor financeiro especialista em delivery de sushi no Brasil.
Analise a ficha técnica de UM combinado e responda de forma direta, prática e em português do Brasil.

Regras de leitura:
- CMV saudável em delivery de sushi: até 30%. Entre 30% e 40% é atenção. Acima de 40% é crítico.
- Margem líquida saudável: acima de 15%. Entre 5% e 15% é atenção. Abaixo de 5% é crítico.
- Considere que taxas de plataforma, entrega e promoções já estão descontadas no lucro informado.

Responda APENAS um objeto JSON válido:
{
  "status": "bom" | "atencao" | "critico",
  "diagnostico": "2 a 4 frases em markdown resumindo a saúde financeira do item e comparando as plataformas",
  "sangramento": "1 parágrafo em markdown apontando exatamente onde o dinheiro está sendo perdido (plataforma, taxa, preço baixo, custo de insumo, promoção)",
  "plano": ["3 a 5 ações objetivas em markdown, com números concretos (ex: 'suba o preço no iFood de R$ 49,90 para R$ 56,90 para atingir 18% de margem')"]
}
Sem texto fora do JSON, sem blocos de código.`;

export const analyzeCombo = createServerFn({ method: "POST" })
  .inputValidator((data: { combo: ComboSnapshot }) => {
    if (!data?.combo?.name) throw new Error("Dados do combinado ausentes.");
    return data;
  })
  .handler(async ({ data }): Promise<AiAnalysis> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente no servidor.");

    const c = data.combo;
    const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
    const userContent = [
      `Combinado: ${c.name}`,
      `Custo total dos insumos: ${brl(c.cost)}`,
      `Lucro médio: ${brl(c.avgProfit)}`,
      `Margem média: ${c.avgMargin.toFixed(1)}%`,
      `CMV médio: ${c.avgCmv.toFixed(1)}%`,
      "",
      "Por plataforma:",
      ...c.platforms.map((p) =>
        p.price > 0
          ? `- ${p.label}: preço ${brl(p.price)} | CMV ${p.cmv.toFixed(1)}% | lucro ${brl(p.profit)} | margem ${p.margin.toFixed(1)}%`
          : `- ${p.label}: sem preço cadastrado`,
      ),
    ].join("\n");

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
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Muitas análises seguidas. Tente novamente em instantes.");
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
        parsed.status === "bom" || parsed.status === "critico" ? parsed.status : "atencao",
      diagnostico: parsed.diagnostico ?? "",
      sangramento: parsed.sangramento ?? "",
      plano: Array.isArray(parsed.plano) ? parsed.plano.slice(0, 6) : [],
    };
  });
