import type { Combo } from "./store";
import { uid } from "./store";

type SeedCombo = {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
};

const SEEDS: SeedCombo[] = [
  { name: "Combinado 40 peças", description: "6 sashimis, 4 niguiris, 10 hot rolls, 4 jyos, 8 uramakis e 8 hossomakis de salmão.", price: 83.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202207051626_KR78_iblob" },
  { name: "Combinado 20 peças", description: "4 sashimis, 4 niguiris, 4 hot rolls, 4 jyos e 4 uramakis de salmão.", price: 49.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202206231749_K866_iblob" },
  { name: "Combinado 30 peças", description: "6 sashimis, 4 niguiris, 4 hot rolls, 4 jyos, 4 hossomakis e 8 uramakis de salmão.", price: 67.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202206231752_GBFD_iblob" },
  { name: "Combinado 50 peças", description: "8 sashimis, 8 niguiris, 10 hot rolls, 6 jyos, 8 hossomakis e 10 uramakis de salmão.", price: 109.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202207051627_5TK1_iblob" },
  { name: "Combinado 72 peças", description: "10 sashimis, 6 jyos, 10 uramakis, 30 hot rolls mix e 16 hossomakis.", price: 149.99 },
  { name: "Combo + Temaki Skin", description: "2 baterá, 2 niguiri, 4 hot roll, 6 sashimi + 1 temaki skin.", price: 44.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202202011119_X521_iblob" },
  { name: "Combo 12 Peças Irresistíveis", description: "2 uramakis de salmão, 2 jyos com cream cheese, 2 jyos com cebolinha e gergelim, 6 hot rolls mix.", price: 32.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202410231424_8U62_blob" },
  { name: "Combo 40 peças + sunomono + sobremesa", description: "40 peças (6 sashimi, 4 jyo, 4 niguiri, 8 uramaki, 8 hossomaki, 10 hot roll) + sunomono 210g + 6 harumakis de doce de leite.", price: 104.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1781131275337blob" },
  { name: "2 Temakis salmão completo + 12 hot roll", description: "2 temakis de salmão com cream cheese e cebolinha + 12 hot rolls de salmão com cream cheese e mix de crispys.", price: 64.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742440135744blob" },
  { name: "Combo Prime 27 peças", description: "4 sashimis, 5 uramakis, 5 hossomakis, 5 baterás e 8 jyos variados de salmão.", price: 69.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202410231413_H04I_blob" },
  { name: "Combinado do chef 18 peças - uramaki maçaricado", description: "10 uramakis skin com salmão maçaricado + 10 jyos variados (alho, doritos, couve, tradicional).", price: 55.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307240945_1UF4_iblob" },
  { name: "Combo sushi grelhado 30 peças", description: "5 uramakis grelhados com tomate seco, 5 uramakis com tarê, 5 hot rolls alho poró, 5 hot rolls couve, 6 jyos maçaricados e 4 guiozas.", price: 67.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307241011_V331_iblob" },
  { name: "Dois Temaki Hot", description: "2 temakis de salmão grelhado com cream cheese empanado e frito.", price: 49.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1781130844071blob" },
  { name: "Double temaki de salmão grelhado", description: "2 unidades de temaki de salmão grelhado.", price: 49.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307241045_X1LX_iblob" },
  { name: "Combo individual", description: "2 camarão empanado, 4 niguiri skin, 3 guioza suína, 4 hossomaki cream cheese, 4 hossomaki doritos.", price: 43.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202211131752_nHRE_blob" },
  { name: "Combo Casal", description: "4 sashimi, 4 jyo de camarão, 4 niguiri skin, 4 guioza, 4 hossomaki cream cheese, 4 hossomaki doritos, 6 hot roll.", price: 75.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742440282906blob" },
  { name: "Combo Família", description: "4 sashimis, 4 jyos de camarão, 6 niguiri skin, 4 uramakis, 8 hossomakis variados, 4 guioza, 4 camarões empanados e 16 hot rolls mix.", price: 104.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202203151151_4S5O_iblob" },
  { name: "Hot Roll 10 unidades", description: "10 unidades de hot roll de salmão.", price: 26.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307261740_8ONB_iblob" },
  { name: "Hot Roll 20 unidades", description: "20 unidades de hot roll de salmão.", price: 37.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202106111000_5N41_iblob" },
  { name: "Hot Roll 50 unidades", description: "50 unidades de hot roll de salmão.", price: 72.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202107272206_486S_iblob" },
];

export function buildItadakimasuCombos(): Combo[] {
  return SEEDS.map((s) => ({
    id: uid(),
    name: s.name,
    description: s.description,
    imageUrl: s.imageUrl,
    items: [],
    prices: { food99: 0, ifood: 0, anotai: s.price },
  }));
}

export const ITADAKIMASU_COMBO_NAMES = SEEDS.map((s) => s.name);
