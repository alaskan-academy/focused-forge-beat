// Catálogo da lojinha de móveis da casa. Nomes e descrições em inglês (com tradução), preço em 🪙,
// nível mínimo por faixa e pontos de conforto (usados na Etapa 3). Os preços e níveis precisam ser
// iguais aos da tabela coffee_shop_catalog (migration coffee_house) — um teste confere.

// Sprite: peças do pacote Kenney (ids da folha, linha a linha, w×h) ou desenho próprio (art/furniture.ts).
export type CustomSprite =
  | 'cactus'
  | 'cushion'
  | 'basket'
  | 'teddy'
  | 'clock'
  | 'calendar'
  | 'poster'
  | 'trash'
  | 'fan'
  | 'smallRug'
  | 'beanbag'
  | 'coffeeMaker'
  | 'recordPlayer'
  | 'guitar'
  | 'catBed'
  | 'phone'
  | 'desk'
  | 'stringLights'
  | 'tv'
  | 'computer'
  | 'aquarium'
  | 'scratcher'
  | 'monstera'
  | 'chessTable'
  | 'fireplace'
  | 'catTree'
  | 'pendulumClock';
export type Sprite = { k: number[] } | { c: CustomSprite; color?: string };

export type Tier = 'basic' | 'good' | 'special' | 'legendary';
// floor: bloqueia a passagem · rug: tapete (dá para pisar, fica embaixo) · wall: na parede do fundo
export type Placement = 'floor' | 'rug' | 'wall';
export type Category = 'seat' | 'table' | 'storage' | 'decor' | 'plant' | 'light' | 'kitchen' | 'fun' | 'rug' | 'wall' | 'pet';
// estações de estudo (Etapa 4)
export type Station = 'pc' | 'desk' | 'phone' | 'bookshelf' | 'tv' | 'gametable' | 'aquarium';

export type Variant = { en: string; pt: string; sprite: Sprite };

export type Furniture = {
  id: string;
  en: string; // nome em inglês (o que aparece grande na loja)
  pt: string;
  desc: string; // uma frase curta em inglês
  descPt: string;
  tier: Tier;
  price: number;
  comfort: number;
  w: number;
  h: number;
  place: Placement;
  category: Category;
  variants: Variant[];
  station?: Station;
};

export const TIER_INFO: Record<Tier, { pt: string; minLevel: number; color: string }> = {
  basic: { pt: 'Básico', minLevel: 1, color: '#8a6a4a' },
  good: { pt: 'Bom', minLevel: 3, color: '#4f8a5b' },
  special: { pt: 'Especial', minLevel: 5, color: '#5b6ea8' },
  legendary: { pt: 'Lendário', minLevel: 8, color: '#c4554d' },
};

export const minLevelOf = (f: Furniture) => TIER_INFO[f.tier].minLevel;

const k = (...ids: number[]): Sprite => ({ k: ids });
const c = (name: CustomSprite, color?: string): Sprite => ({ c: name, color });
const v = (en: string, pt: string, sprite: Sprite): Variant => ({ en, pt, sprite });
const one = (sprite: Sprite) => [v('', '', sprite)];
const colors = (name: CustomSprite) => [
  v('red', 'vermelho', c(name, '#d9694a')),
  v('blue', 'azul', c(name, '#5b6ea8')),
  v('green', 'verde', c(name, '#6aa36f')),
  v('yellow', 'amarelo', c(name, '#e8b64c')),
];

type Base = Omit<Furniture, 'w' | 'h' | 'place'> & Partial<Pick<Furniture, 'w' | 'h' | 'place'>>;
const item = (b: Base): Furniture => ({ w: 1, h: 1, place: 'floor', ...b });

export const FURNITURE: Furniture[] = [
  // ── Básico (qualquer nível) ───────────────────────────────────────────────
  item({ id: 'potted_plant', en: 'potted plant', pt: 'vaso de planta', desc: 'A little green friend for any corner.', descPt: 'Um amiguinho verde para qualquer canto.', tier: 'basic', price: 12, comfort: 1, category: 'plant', variants: [v('leafy', 'folhosa', k(16)), v('fern', 'samambaia', k(17))] }),
  item({ id: 'cactus', en: 'cactus', pt: 'cacto', desc: 'It needs water once a month. Easy!', descPt: 'Precisa de água uma vez por mês. Fácil!', tier: 'basic', price: 10, comfort: 1, category: 'plant', variants: one(c('cactus')) }),
  item({ id: 'floor_cushion', en: 'floor cushion', pt: 'almofada de chão', desc: 'Sit down and relax.', descPt: 'Sente e relaxe.', tier: 'basic', price: 10, comfort: 1, category: 'seat', variants: colors('cushion') }),
  item({ id: 'stool', en: 'stool', pt: 'banquinho', desc: 'Small, simple and useful.', descPt: 'Pequeno, simples e útil.', tier: 'basic', price: 12, comfort: 1, category: 'seat', variants: one(k(97)) }),
  item({ id: 'ottoman', en: 'ottoman', pt: 'pufe', desc: 'Put your feet up after work.', descPt: 'Ponha os pés para cima depois do trabalho.', tier: 'basic', price: 15, comfort: 1, category: 'seat', variants: one(k(98)) }),
  item({ id: 'barrel', en: 'barrel', pt: 'barril', desc: 'Rustic storage for anything.', descPt: 'Um jeito rústico de guardar qualquer coisa.', tier: 'basic', price: 15, comfort: 1, category: 'storage', variants: [v('wood', 'madeira', k(130)), v('water', 'com água', k(129))] }),
  item({ id: 'chair', en: 'chair', pt: 'cadeira', desc: 'A classic wooden chair.', descPt: 'Uma cadeira clássica de madeira.', tier: 'basic', price: 18, comfort: 1, category: 'seat', variants: [v('cushioned', 'com almofada', k(54)), v('plain', 'simples', k(108))] }),
  item({ id: 'side_chair', en: 'side chair', pt: 'cadeira lateral', desc: 'Turn it to face the table.', descPt: 'Vire para ficar de frente para a mesa.', tier: 'basic', price: 18, comfort: 1, category: 'seat', variants: one(k(56)) }),
  item({ id: 'side_table', en: 'side table', pt: 'mesinha de canto', desc: 'Perfect next to the bed or the sofa.', descPt: 'Perfeita ao lado da cama ou do sofá.', tier: 'basic', price: 20, comfort: 1, category: 'table', variants: one(k(115)) }),
  item({ id: 'round_table', en: 'round table', pt: 'mesa redonda', desc: 'Good for coffee for two.', descPt: 'Boa para um café a dois.', tier: 'basic', price: 25, comfort: 2, category: 'table', variants: one(k(7)) }),
  item({ id: 'small_rug', en: 'small rug', pt: 'tapetinho', desc: 'Soft under your feet.', descPt: 'Macio debaixo dos pés.', tier: 'basic', price: 15, comfort: 1, category: 'rug', place: 'rug', variants: colors('smallRug') }),
  item({ id: 'laundry_basket', en: 'laundry basket', pt: 'cesto de roupa', desc: 'Clothes go here, not on the floor!', descPt: 'A roupa vai aqui, não no chão!', tier: 'basic', price: 10, comfort: 1, category: 'storage', variants: one(c('basket')) }),
  item({ id: 'teddy_bear', en: 'teddy bear', pt: 'ursinho de pelúcia', desc: 'A soft hug when you need one.', descPt: 'Um abraço macio quando você precisar.', tier: 'basic', price: 20, comfort: 2, category: 'fun', variants: one(c('teddy')) }),
  item({ id: 'trash_can', en: 'trash can', pt: 'lixeira', desc: 'Not cute, but very necessary.', descPt: 'Não é fofa, mas é muito necessária.', tier: 'basic', price: 10, comfort: 1, category: 'kitchen', variants: one(c('trash')) }),
  item({ id: 'fan', en: 'fan', pt: 'ventilador', desc: 'For hot summer nights.', descPt: 'Para as noites quentes de verão.', tier: 'basic', price: 25, comfort: 2, category: 'fun', variants: one(c('fan')) }),
  item({ id: 'wall_clock', en: 'wall clock', pt: 'relógio de parede', desc: "Don't be late for work!", descPt: 'Não se atrase para o trabalho!', tier: 'basic', price: 20, comfort: 1, category: 'wall', place: 'wall', variants: one(c('clock')) }),
  item({ id: 'calendar', en: 'calendar', pt: 'calendário', desc: 'Mark the important dates.', descPt: 'Marque as datas importantes.', tier: 'basic', price: 10, comfort: 1, category: 'wall', place: 'wall', variants: one(c('calendar')) }),
  item({ id: 'poster', en: 'poster', pt: 'pôster', desc: 'Show what you love.', descPt: 'Mostre o que você ama.', tier: 'basic', price: 15, comfort: 1, category: 'wall', place: 'wall', variants: colors('poster') }),
  item({ id: 'picture_frames', en: 'picture frames', pt: 'porta-retratos', desc: 'Your favorite memories on the wall.', descPt: 'Suas memórias favoritas na parede.', tier: 'basic', price: 20, comfort: 1, category: 'wall', place: 'wall', variants: [v('green', 'verde', k(340)), v('orange', 'laranja', k(341)), v('teal', 'azul-petróleo', k(342))] }),
  item({ id: 'wall_lamp', en: 'wall lamp', pt: 'arandela', desc: 'Warm light on the wall.', descPt: 'Luz quentinha na parede.', tier: 'basic', price: 25, comfort: 1, category: 'light', place: 'wall', variants: [v('short', 'curta', k(21)), v('long', 'longa', k(48))] }),

  // ── Bom (nível 3) ─────────────────────────────────────────────────────────
  item({ id: 'armchair', en: 'armchair', pt: 'poltrona', desc: 'The best seat in the house.', descPt: 'O melhor lugar da casa.', tier: 'good', price: 60, comfort: 4, category: 'seat', variants: [v('orange', 'laranja', k(257)), v('green', 'verde', k(311))] }),
  item({ id: 'reading_chair', en: 'reading chair', pt: 'cadeira de leitura', desc: 'Grab a book and stay a while.', descPt: 'Pegue um livro e fique um pouco.', tier: 'good', price: 50, comfort: 3, category: 'seat', variants: [v('orange', 'laranja', k(284)), v('green', 'verde', k(338))] }),
  item({ id: 'coffee_table', en: 'coffee table', pt: 'mesa de centro', desc: 'Goes in front of the sofa.', descPt: 'Fica na frente do sofá.', tier: 'good', price: 45, comfort: 3, category: 'table', w: 2, variants: one(k(3, 4)) }),
  item({ id: 'dining_table', en: 'dining table', pt: 'mesa de jantar', desc: 'Dinner is ready!', descPt: 'O jantar está pronto!', tier: 'good', price: 70, comfort: 4, category: 'table', w: 3, variants: one(k(0, 1, 2)) }),
  item({ id: 'bench', en: 'bench', pt: 'banco', desc: 'Room for two.', descPt: 'Cabem dois.', tier: 'good', price: 40, comfort: 2, category: 'seat', w: 2, variants: [v('cushioned', 'com almofada', k(193, 196)), v('wood', 'madeira', k(220, 223))] }),
  item({ id: 'bookshelf', en: 'bookshelf', pt: 'estante', desc: 'Full of stories in English.', descPt: 'Cheia de histórias em inglês.', tier: 'good', price: 60, comfort: 4, category: 'storage', station: 'bookshelf', variants: [v('classic', 'clássica', k(478)), v('colorful', 'colorida', k(479)), v('full', 'cheia', k(480))] }),
  item({ id: 'dresser', en: 'dresser', pt: 'cômoda', desc: 'Drawers for socks and secrets.', descPt: 'Gavetas para meias e segredos.', tier: 'good', price: 55, comfort: 3, category: 'storage', variants: [v('small', 'pequena', k(141)), v('wide', 'larga', k(140))] }),
  item({ id: 'floor_lamp', en: 'floor lamp', pt: 'luminária de chão', desc: 'Cozy light for the evening.', descPt: 'Luz aconchegante para a noite.', tier: 'good', price: 45, comfort: 3, category: 'light', variants: [v('silver', 'prata', k(154)), v('gold', 'dourada', k(155))] }),
  item({ id: 'candelabra', en: 'candelabra', pt: 'candelabro', desc: 'Very elegant, very dramatic.', descPt: 'Muito elegante, muito dramático.', tier: 'good', price: 50, comfort: 3, category: 'light', variants: [v('silver', 'prata', k(19)), v('gold', 'dourado', k(20))] }),
  item({ id: 'mirror', en: 'mirror', pt: 'espelho', desc: 'Looking good today!', descPt: 'Arrasando hoje!', tier: 'good', price: 50, comfort: 3, category: 'wall', place: 'wall', variants: one(k(400)) }),
  item({ id: 'painting', en: 'painting', pt: 'quadro', desc: 'A real piece of art.', descPt: 'Uma verdadeira obra de arte.', tier: 'good', price: 60, comfort: 4, category: 'wall', place: 'wall', variants: [v('green', 'verde', k(343)), v('orange', 'laranja', k(370)), v('teal', 'azul-petróleo', k(397))] }),
  item({ id: 'oval_rug', en: 'oval rug', pt: 'tapete oval', desc: 'It ties the room together.', descPt: 'Deixa o cômodo completo.', tier: 'good', price: 55, comfort: 4, category: 'rug', place: 'rug', w: 2, variants: [v('orange', 'laranja', k(235, 236)), v('green', 'verde', k(289, 290))] }),
  item({ id: 'beanbag', en: 'beanbag', pt: 'puff', desc: 'You sit down and never get up.', descPt: 'Você senta e nunca mais levanta.', tier: 'good', price: 45, comfort: 4, category: 'seat', variants: colors('beanbag') }),
  item({ id: 'fridge', en: 'fridge', pt: 'geladeira', desc: 'Cold drinks and leftovers.', descPt: 'Bebida gelada e restos do jantar.', tier: 'good', price: 80, comfort: 3, category: 'kitchen', variants: one(k(416)) }),
  item({ id: 'sink', en: 'kitchen sink', pt: 'pia', desc: 'Who is washing the dishes today?', descPt: 'Quem lava a louça hoje?', tier: 'good', price: 50, comfort: 2, category: 'kitchen', variants: one(k(332)) }),
  item({ id: 'cabinet', en: 'kitchen cabinet', pt: 'armário de cozinha', desc: 'Pots, pans and plates.', descPt: 'Panelas, frigideiras e pratos.', tier: 'good', price: 40, comfort: 2, category: 'kitchen', variants: [v('doors', 'portas', k(324)), v('drawers', 'gavetas', k(352))] }),
  item({ id: 'spice_counter', en: 'spice counter', pt: 'bancada de temperos', desc: 'Salt, pepper and a lot of love.', descPt: 'Sal, pimenta e muito amor.', tier: 'good', price: 45, comfort: 2, category: 'kitchen', variants: [v('green', 'verde', k(329)), v('teal', 'azul-petróleo', k(330))] }),
  item({ id: 'dish_counter', en: 'dish counter', pt: 'bancada de louça', desc: 'Clean plates, ready to use.', descPt: 'Pratos limpos, prontos para usar.', tier: 'good', price: 40, comfort: 2, category: 'kitchen', variants: one(k(331)) }),
  item({ id: 'coffee_maker', en: 'coffee maker', pt: 'cafeteira', desc: 'Baristas need coffee at home too.', descPt: 'Baristas também precisam de café em casa.', tier: 'good', price: 60, comfort: 3, category: 'kitchen', variants: one(c('coffeeMaker')) }),
  item({ id: 'record_player', en: 'record player', pt: 'toca-discos', desc: 'Old songs sound better.', descPt: 'Músicas antigas soam melhor.', tier: 'good', price: 75, comfort: 5, category: 'fun', variants: one(c('recordPlayer')) }),
  item({ id: 'guitar', en: 'guitar', pt: 'violão', desc: 'Learn a song in English!', descPt: 'Aprenda uma música em inglês!', tier: 'good', price: 70, comfort: 4, category: 'fun', variants: one(c('guitar')) }),
  item({ id: 'cat_bed', en: 'cat bed', pt: 'caminha de gato', desc: 'Elias approves.', descPt: 'O Elias aprova.', tier: 'good', price: 40, comfort: 4, category: 'pet', variants: one(c('catBed')) }),
  item({ id: 'telephone', en: 'telephone', pt: 'telefone', desc: 'Call someone you love.', descPt: 'Ligue para alguém que você ama.', tier: 'good', price: 40, comfort: 2, category: 'fun', station: 'phone', variants: one(c('phone')) }),
  item({ id: 'writing_desk', en: 'writing desk', pt: 'escrivaninha', desc: 'Write a little every day.', descPt: 'Escreva um pouco todo dia.', tier: 'good', price: 60, comfort: 3, category: 'table', station: 'desk', variants: one(c('desk')) }),
  item({ id: 'string_lights', en: 'string lights', pt: 'varal de luzes', desc: 'Tiny stars inside the house.', descPt: 'Estrelinhas dentro de casa.', tier: 'good', price: 45, comfort: 4, category: 'light', place: 'wall', w: 2, variants: one(c('stringLights')) }),
  item({ id: 'wall_banner', en: 'wall banner', pt: 'flâmula', desc: 'Show your colors.', descPt: 'Mostre suas cores.', tier: 'good', price: 40, comfort: 2, category: 'wall', place: 'wall', variants: [v('green', 'verde', k(424)), v('orange', 'laranja', k(425)), v('teal', 'azul-petróleo', k(426))] }),

  // ── Especial (nível 5) ────────────────────────────────────────────────────
  item({ id: 'large_rug', en: 'large rug', pt: 'tapete grande', desc: 'Makes the whole room warmer.', descPt: 'Deixa o cômodo todo mais quentinho.', tier: 'special', price: 140, comfort: 8, category: 'rug', place: 'rug', w: 3, variants: [v('orange', 'laranja', k(232, 233, 234)), v('green', 'verde', k(286, 287, 288))] }),
  item({ id: 'banquet_table', en: 'banquet table', pt: 'mesa de banquete', desc: 'Invite all the customers for dinner!', descPt: 'Convide todos os clientes para jantar!', tier: 'special', price: 180, comfort: 8, category: 'table', w: 3, h: 2, variants: [v('orange', 'laranja', k(243, 244, 245, 270, 271, 272)), v('green', 'verde', k(250, 251, 252, 277, 278, 279))] }),
  item({ id: 'tea_table', en: 'tea table', pt: 'mesa de chá', desc: 'Tea at five, like in London.', descPt: 'Chá às cinco, como em Londres.', tier: 'special', price: 130, comfort: 6, category: 'table', w: 2, h: 2, variants: [v('orange', 'laranja', k(246, 247, 273, 274)), v('green', 'verde', k(253, 254, 280, 281))] }),
  item({ id: 'television', en: 'TV', pt: 'televisão', desc: 'Series in English, no subtitles!', descPt: 'Séries em inglês, sem legenda!', tier: 'special', price: 200, comfort: 8, category: 'fun', station: 'tv', variants: one(c('tv')) }),
  item({ id: 'computer', en: 'computer', pt: 'computador', desc: 'For reviews, emails and memes.', descPt: 'Para revisões, e-mails e memes.', tier: 'special', price: 220, comfort: 6, category: 'fun', station: 'pc', variants: one(c('computer')) }),
  item({ id: 'tapestry', en: 'tapestry', pt: 'tapeçaria', desc: 'A long and beautiful wall decoration.', descPt: 'Uma decoração de parede longa e linda.', tier: 'special', price: 150, comfort: 7, category: 'wall', place: 'wall', w: 3, variants: [v('teal', 'azul-petróleo', k(394, 395, 396)), v('orange', 'laranja', k(421, 422, 423)), v('green', 'verde', k(448, 449, 450))] }),
  item({ id: 'world_map', en: 'world map', pt: 'mapa-múndi', desc: 'Where do we travel next?', descPt: 'Para onde vamos viajar agora?', tier: 'special', price: 120, comfort: 5, category: 'wall', place: 'wall', w: 2, variants: [v('old', 'antigo', k(344, 345)), v('city', 'cidade', k(371, 372))] }),
  item({ id: 'aquarium', en: 'fish tank', pt: 'aquário', desc: 'Watching fish is very relaxing.', descPt: 'Olhar os peixes é muito relaxante.', tier: 'special', price: 220, comfort: 9, category: 'pet', station: 'aquarium', variants: one(c('aquarium')) }),
  item({ id: 'scratching_post', en: 'scratching post', pt: 'arranhador', desc: 'Save the sofa!', descPt: 'Salve o sofá!', tier: 'special', price: 120, comfort: 6, category: 'pet', variants: one(c('scratcher')) }),
  item({ id: 'monstera', en: 'monstera', pt: 'costela-de-adão', desc: 'A big plant with big leaves.', descPt: 'Uma planta grande de folhas grandes.', tier: 'special', price: 130, comfort: 7, category: 'plant', variants: one(c('monstera')) }),
  item({ id: 'chess_table', en: 'chess table', pt: 'mesa de xadrez', desc: 'Your move!', descPt: 'Sua vez!', tier: 'special', price: 160, comfort: 6, category: 'fun', station: 'gametable', variants: one(c('chessTable')) }),

  // ── Lendário (nível 8) ────────────────────────────────────────────────────
  item({ id: 'piano', en: 'piano', pt: 'piano', desc: 'Play a love song.', descPt: 'Toque uma canção de amor.', tier: 'legendary', price: 450, comfort: 18, category: 'fun', w: 2, h: 2, variants: one(k(239, 240, 266, 267)) }),
  item({ id: 'fireplace', en: 'fireplace', pt: 'lareira', desc: 'Warm and cozy on cold nights.', descPt: 'Quentinha nas noites frias.', tier: 'legendary', price: 400, comfort: 20, category: 'decor', w: 2, variants: one(c('fireplace')) }),
  item({ id: 'cat_tree', en: 'cat tree', pt: 'árvore de gato', desc: 'A castle for a very important cat.', descPt: 'Um castelo para um gato muito importante.', tier: 'legendary', price: 320, comfort: 15, category: 'pet', h: 2, variants: one(c('catTree')) }),
  item({ id: 'grandfather_clock', en: 'grandfather clock', pt: 'relógio de pêndulo', desc: 'Tick, tock. Time for English.', descPt: 'Tique-taque. Hora do inglês.', tier: 'legendary', price: 300, comfort: 12, category: 'decor', h: 2, variants: one(c('pendulumClock')) }),
];

export const FURNITURE_BY_ID: Record<string, Furniture> = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));

export const CATEGORY_PT: Record<Category, string> = {
  seat: 'Assentos',
  table: 'Mesas',
  storage: 'Guardar',
  decor: 'Decoração',
  plant: 'Plantas',
  light: 'Luzes',
  kitchen: 'Cozinha',
  fun: 'Diversão',
  rug: 'Tapetes',
  wall: 'Parede',
  pet: 'Gatos e bichos',
};

// nome da variante em inglês junto do nome ("green armchair"), para falar e mostrar
export const variantName = (f: Furniture, variant: number) => {
  const vv = f.variants[variant];
  return vv?.en ? `${vv.en} ${f.en}` : f.en;
};
