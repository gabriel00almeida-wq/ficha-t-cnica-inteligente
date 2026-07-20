import { createServerFn } from "@tanstack/react-start";

export type OcrItem = {
  name: string;
  quantity: number;
  unit: string; // as read from receipt, e.g. "kg", "g", "un", "L", "ml"
  totalPrice: number; // BRL total for this line
  unitPrice: number; // BRL per unit (as unit above)
};

export type OcrResult = {
  items: OcrItem[];
  storeName?: string;
  date?: string;
  raw?: string;
};

export const extractInvoice = createServerFn({ method: "POST" })
  .inputValidator((data: { imageDataUrl: string }) => {
    if (!data?.imageDataUrl?.startsWith("data:image/")) {
      throw new Error("Envie uma imagem válida.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<OcrResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente no servidor.");

    const system = `Você é um extrator de dados de notas fiscais brasileiras (NF-e / cupom fiscal). Extraia CADA item comprado com:
- name: nome do produto normalizado em minúsculas e sem códigos (ex: "salmão fresco", "arroz para sushi")
- quantity: quantidade numérica
- unit: unidade original ("kg", "g", "L", "ml", "un")
- totalPrice: valor total pago pelo item em reais (número)
- unitPrice: preço por unidade em reais (número). Se não estiver explícito, calcule totalPrice/quantity.

Responda APENAS um objeto JSON válido no formato:
{"storeName": "...", "date": "YYYY-MM-DD", "items": [{"name":"...","quantity":0,"unit":"kg","totalPrice":0,"unitPrice":0}]}
Sem texto adicional, sem markdown.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia os itens desta nota fiscal." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos ao workspace.");
      throw new Error(`Falha na IA [${res.status}]: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";

    let parsed: OcrResult = { items: [] };
    try {
      const obj = JSON.parse(content);
      parsed = {
        storeName: obj.storeName,
        date: obj.date,
        items: Array.isArray(obj.items)
          ? obj.items.map((it: OcrItem) => ({
              name: String(it.name ?? ""),
              quantity: Number(it.quantity) || 0,
              unit: String(it.unit ?? "un"),
              totalPrice: Number(it.totalPrice) || 0,
              unitPrice:
                Number(it.unitPrice) ||
                (Number(it.quantity) > 0
                  ? Number(it.totalPrice) / Number(it.quantity)
                  : 0),
            }))
          : [],
      };
    } catch {
      parsed = { items: [], raw: content };
    }
    return parsed;
  });
