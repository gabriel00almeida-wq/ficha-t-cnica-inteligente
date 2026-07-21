import type { Combo } from "./store";
import { uid } from "./store";

type SeedCombo = {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
};

const NO_IMAGE = "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png";

const SEEDS: SeedCombo[] = [
  // Novidades
  { name: "Combo 12 Peças Irresistíveis", description: "2 uramakis de salmão, 2 jyos com cream cheese, 2 jyos com cebolinha e gergelim, 6 hot rolls mix.", price: 32.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202410231424_8U62_blob" },
  { name: "Combo 40 peças + sunomono + sobremesa", description: "40 peças (6 sashimi, 4 jyo, 4 niguiri, 8 uramaki, 8 hossomaki, 10 hot roll) + sunomono 210g + 6 harumakis de doce de leite.", price: 104.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1781131275337blob" },
  { name: "2 Temakis salmão completo + 12 hot roll", description: "2 temakis de salmão com cream cheese e cebolinha + 12 hot rolls de salmão com cream cheese e mix de crispys.", price: 64.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742440135744blob" },
  { name: "Combo Prime 27 peças", description: "4 sashimis, 5 uramakis, 5 hossomakis com cream cheese, 5 baterás e 8 jyos variados de salmão.", price: 69.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202410231413_H04I_blob" },
  { name: "Combinado do chef 18 peças - uramaki maçaricado", description: "10 uramakis skin com salmão maçaricado + 10 jyos variados (alho, doritos, couve, tradicional).", price: 55.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307240945_1UF4_iblob" },
  { name: "Combo sushi grelhado 30 peças", description: "5 uramakis grelhados com tomate seco, 5 uramakis com tarê, 5 hot rolls alho poró, 5 hot rolls couve, 6 jyos maçaricados e 4 guiozas.", price: 67.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307241011_V331_iblob" },
  { name: "Dois Temaki Hot", description: "2 temakis de salmão grelhado com cream cheese empanado e frito.", price: 49.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1781130844071blob" },
  { name: "Double temaki de salmão grelhado", description: "2 unidades de temaki de salmão grelhado.", price: 49.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307241045_X1LX_iblob" },

  // Tradicionais da Casa
  { name: "Combinado 20 peças", description: "4 sashimis, 4 niguiris, 4 hot rolls, 4 jyos e 4 uramakis de salmão.", price: 49.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202206231749_K866_iblob" },
  { name: "Combinado 30 peças", description: "6 sashimis, 4 niguiris, 4 hot rolls, 4 jyos, 4 hossomakis e 8 uramakis de salmão.", price: 67.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202206231752_GBFD_iblob" },
  { name: "Combinado 40 peças", description: "6 sashimis, 4 niguiris, 10 hot rolls, 4 jyos, 8 uramakis e 8 hossomakis de salmão.", price: 83.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202207051626_KR78_iblob" },
  { name: "Combinado 50 peças", description: "8 sashimis, 8 niguiris, 10 hot rolls, 6 jyos, 8 hossomakis e 10 uramakis de salmão.", price: 109.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202207051627_5TK1_iblob" },
  { name: "Combinado 72 peças", description: "10 sashimis, 6 jyos, 10 uramakis, 30 hot rolls mix e 16 hossomakis.", price: 149.99, imageUrl: NO_IMAGE },
  { name: "Combo + Temaki Skin", description: "2 baterá, 2 niguiri, 4 hot roll, 6 sashimi + 1 temaki skin.", price: 44.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202202011119_X521_iblob" },

  // Hot Roll
  { name: "Hot Roll 10 unidades", description: "10 unidades de hot roll de salmão.", price: 26.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307261740_8ONB_iblob" },
  { name: "Hot Roll 20 unidades", description: "20 unidades de hot roll de salmão.", price: 37.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202106111000_5N41_iblob" },
  { name: "Hot Roll 50 unidades", description: "50 unidades de hot roll de salmão.", price: 72.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202107272206_486S_iblob" },

  // Combinado Mix
  { name: "Combo individual", description: "2 camarão empanado, 4 niguiri skin, 3 guioza suína, 4 hossomaki cream cheese, 4 hossomaki doritos.", price: 43.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202211131752_nHRE_blob" },
  { name: "Combo Casal", description: "4 sashimi, 4 jyo de camarão, 4 niguiri skin, 4 guioza, 4 hossomaki cream cheese, 4 hossomaki doritos, 6 hot roll.", price: 75.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742440282906blob" },
  { name: "Combo Família", description: "4 sashimis, 4 jyos de camarão, 6 niguiri skin, 4 uramakis, 8 hossomakis variados, 4 guioza, 4 camarões empanados e 16 hot rolls mix.", price: 104.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202203151151_4S5O_iblob" },

  // Peças a lá Carte
  { name: "Jyo Tradicional", description: "8 unidades de jyo com cream cheese, tataki com cebolinha e gergelim moído.", price: 26.99, imageUrl: NO_IMAGE },
  { name: "Jyo Geleia de Pimenta", description: "8 unidades de jyo com cream cheese e geleia de pimenta.", price: 26.99, imageUrl: NO_IMAGE },
  { name: "Jyo Nin'Niku", description: "8 unidades jyo de salmão ao alho, maçaricado e finalizado com raspas de limão.", price: 27.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742438373568blob" },
  { name: "Baterá", description: "6 unidades de sushi prensado com arroz e tataki de salmão temperado.", price: 23.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202202011125_WX6Q_iblob" },
  { name: "Uramaki de Salmão", description: "10 uramakis de salmão.", price: 27.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307271418_2181_iblob" },
  { name: "Uramaki Salmão com Cream Cheese", description: "8 unidades de uramaki de salmão com cream cheese.", price: 27.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742438727159blob" },
  { name: "Uramaki Salmão grelhado", description: "10 unidades de uramaki de salmão grelhado.", price: 26.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1784218526499blob" },
  { name: "Uramaki de Camarão", description: "Uramaki de camarão com cream cheese.", price: 26.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742438784214blob" },
  { name: "Uramaki Salmão Skin", description: "8 uramakis salmão skin com cream cheese.", price: 19.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742440463829blob" },
  { name: "Niguiri de Salmão", description: "6 unidades de niguiri de salmão.", price: 24.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742439147536blob" },
  { name: "Niguiri de Camarão Empanado", description: "6 unidades de niguiri de camarão empanado e frito.", price: 26.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742439034813blob" },
  { name: "Niguiri Skin", description: "6 unidades de niguiri skin.", price: 18.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742439264524blob" },
  { name: "Hossomaki Tradicional", description: "10 unidades.", price: 23.99, imageUrl: NO_IMAGE },

  // Carpaccio
  { name: "Carpaccio de Salmão 10 lâminas", description: "10 lâminas de carpaccio de salmão com molho ponzu, cebolinha e gergelim.", price: 28.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202205271746_c6jK_dblob" },
  { name: "Carpaccio de salmão 16 lâminas", description: "16 lâminas de carpaccio de salmão com molho ponzu, cebolinha e gergelim.", price: 38.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202205271709_uxle_dblob" },

  // Sashimi
  { name: "Sashimi 5 unidades", description: "5 fatias de salmão fresco.", price: 17.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/-1742438201466blob" },
  { name: "Sashimi de Salmão 10 unidades", description: "10 unidades de salmão fatiado.", price: 29.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307271506_NE4H_iblob" },

  // Temaki
  { name: "Temaki Hot", description: "Temaki de salmão grelhado com cream cheese empanado e frito.", price: 27.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307291530_J8EG_iblob" },
  { name: "Temaki Salmão Skin", description: "Temaki skin com cream cheese e molho tarê.", price: 14.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307291533_MT4X_iblob" },
  { name: "Temaki de Salmão Grelhado", description: "Temaki de salmão grelhado com cream cheese.", price: 26.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307291531_6A12_iblob" },
  { name: "Temaki de Salmão completo", description: "Temaki de salmão fresco em cubos com cream cheese e cebolinha.", price: 26.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307281010_6K0C_iblob" },
  { name: "Temaki de Salmão", description: "Temaki de salmão em cubos.", price: 26.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307281014_18I8_iblob" },
  { name: "Temaki e Salmão e Cream cheese", description: "Temaki de salmão em cubos com cream cheese.", price: 26.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202307281017_0JR4_iblob" },
  { name: "Temaki de Camarão", description: "Temaki de camarão empanado com cream cheese.", price: 29.99, imageUrl: NO_IMAGE },

  // Monte seu combinado
  { name: "Monte seu combinado", description: "Monte o combinado do seu jeito. Recomendamos 16 a 22 peças por porção individual.", price: 16.00, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202206231757_4V75_iblob" },

  // Guioza
  { name: "Guioza Suíno 5 unidades", description: "Guioza frito de carne suína.", price: 14.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202206251635_6KUE_iblob" },
  { name: "Guioza suíno 10 unidades", description: "Guioza frito de carne suína.", price: 24.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202206251634_B236_iblob" },

  // Refrigerantes
  { name: "Coca cola Lata", description: "Coca-Cola lata 310ml.", price: 6.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202105051226_T6E7_blob" },
  { name: "Guaraná Antártica", description: "Guaraná Antártica lata 350ml.", price: 6.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202105051230_26N6_blob" },
  { name: "Fanta Laranja Lata", description: "Fanta laranja lata 350ml.", price: 6.99, imageUrl: "https://client-assets.anota.ai/produtos/67d324498f5b8f00127d3bfa/202105051229_PGE7_blob" },
  { name: "Refrigerante Original Coca Cola 2l", description: "Garrafa 2l.", price: 15.99, imageUrl: NO_IMAGE },
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
