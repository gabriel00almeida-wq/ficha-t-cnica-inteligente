export const SYSTEM_PROMPT = `Você é um consultor financeiro especialista em delivery de sushi no Brasil.
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

type PlatformLike = {
  label: string;
  price: number;
  cmv: number;
  profit: number;
  margin: number;
};

type ComboLike = {
  name: string;
  cost: number;
  avgProfit: number;
  avgMargin: number;
  avgCmv: number;
  platforms: PlatformLike[];
};

export function buildComboContext(c: ComboLike): string {
  const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
  return [
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
}
