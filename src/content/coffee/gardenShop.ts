// Lojinha do jardim: coisinhas para a Mucego Frutífero (acessórios que ela usa, petiscos e brinquedos)
// e decoração do quintal. Nomes em inglês com tradução. Preços e níveis iguais aos da tabela
// coffee_garden_catalog (migration coffee_mucego) — um teste confere.

// accessory: ela usa (um de cada vez) · treat: petisco (gasta) · toy: brinquedo no jardim · decor: decoração
export type ThingKind = 'accessory' | 'treat' | 'toy' | 'decor';
// floor: bloqueia a passagem · flat: no chão, dá para pisar
export type ThingPlace = 'floor' | 'flat';
// o que a Mucego faz com o brinquedo
export type CatUse = 'bed' | 'play' | 'perch';

export type GardenThing = {
  id: string;
  en: string;
  pt: string;
  desc: string;
  descPt: string;
  kind: ThingKind;
  price: number;
  minLevel: number;
  w: number;
  h: number;
  place: ThingPlace;
  use?: CatUse;
  friendship?: number; // petiscos
  emoji: string; // ícone na loja (o desenho no jogo está em art/gardenArt.ts)
};

type Base = Omit<GardenThing, 'w' | 'h' | 'place' | 'minLevel'> & Partial<Pick<GardenThing, 'w' | 'h' | 'place' | 'minLevel'>>;
const t = (b: Base): GardenThing => ({ w: 1, h: 1, place: 'floor', minLevel: 1, ...b });

export const GARDEN_THINGS: GardenThing[] = [
  // ── acessórios (ela veste um de cada vez) ─────────────────────────────────
  t({ id: 'red_bow', en: 'red bow', pt: 'laço vermelho', desc: 'A classic look for a classy cat.', descPt: 'Um visual clássico para uma gata chique.', kind: 'accessory', price: 15, emoji: '🎀' }),
  t({ id: 'pink_bow', en: 'pink bow', pt: 'laço rosa', desc: 'Pretty in pink!', descPt: 'Linda de rosa!', kind: 'accessory', price: 15, emoji: '🎀' }),
  t({ id: 'blue_bow', en: 'blue bow', pt: 'laço azul', desc: 'Cool and calm.', descPt: 'Tranquila e estilosa.', kind: 'accessory', price: 15, emoji: '🎀' }),
  t({ id: 'bell_collar', en: 'collar with a bell', pt: 'coleira com sininho', desc: 'Ding-ding! Now you always know where she is.', descPt: 'Plim-plim! Agora você sempre sabe onde ela está.', kind: 'accessory', price: 25, emoji: '🔔' }),
  t({ id: 'bandana', en: 'bandana', pt: 'bandana', desc: 'A little adventurer.', descPt: 'Uma pequena aventureira.', kind: 'accessory', price: 25, emoji: '🧣' }),
  t({ id: 'scarf', en: 'scarf', pt: 'cachecol', desc: 'Warm and cozy for winter days.', descPt: 'Quentinho para os dias de inverno.', kind: 'accessory', price: 35, emoji: '🧣' }),
  t({ id: 'flower_crown', en: 'flower crown', pt: 'coroa de flores', desc: 'The queen of the garden.', descPt: 'A rainha da horta.', kind: 'accessory', price: 40, minLevel: 3, emoji: '🌸' }),
  t({ id: 'straw_hat', en: 'straw hat', pt: 'chapéu de palha', desc: 'Perfect for working in the garden.', descPt: 'Perfeito para trabalhar na horta.', kind: 'accessory', price: 45, minLevel: 3, emoji: '👒' }),
  t({ id: 'sunglasses', en: 'sunglasses', pt: 'óculos de sol', desc: 'Too cool for school.', descPt: 'Estilosa demais.', kind: 'accessory', price: 50, minLevel: 3, emoji: '🕶️' }),
  t({ id: 'witch_hat', en: 'witch hat', pt: 'chapéu de bruxa', desc: 'A black cat in a witch hat. Spooky!', descPt: 'Uma gata preta de chapéu de bruxa. Assustador!', kind: 'accessory', price: 60, minLevel: 5, emoji: '🧙' }),
  t({ id: 'santa_hat', en: 'Santa hat', pt: 'gorro de Papai Noel', desc: 'Ho ho ho! Merry Christmas!', descPt: 'Ho ho ho! Feliz Natal!', kind: 'accessory', price: 60, minLevel: 5, emoji: '🎅' }),
  t({ id: 'golden_crown', en: 'golden crown', pt: 'coroa de ouro', desc: 'For a very, very important cat.', descPt: 'Para uma gata muito, muito importante.', kind: 'accessory', price: 300, minLevel: 8, emoji: '👑' }),

  // ── petiscos (dão amizade) ────────────────────────────────────────────────
  t({ id: 'cat_cookie', en: 'cat cookie', pt: 'biscoitinho de gato', desc: 'Crunchy and healthy.', descPt: 'Crocante e saudável.', kind: 'treat', price: 3, friendship: 1, emoji: '🍪' }),
  t({ id: 'dried_fish', en: 'dried fish', pt: 'peixinho seco', desc: 'Her second favorite food.', descPt: 'A segunda comida favorita dela.', kind: 'treat', price: 5, friendship: 2, emoji: '🐟' }),
  t({ id: 'cat_pouch', en: 'cat food pouch', pt: 'sachê', desc: 'Tuna flavor. She goes crazy for it.', descPt: 'Sabor atum. Ela fica doida.', kind: 'treat', price: 6, friendship: 3, emoji: '🥫' }),
  t({ id: 'catnip', en: 'catnip', pt: 'erva-de-gato', desc: 'Warning: zoomies ahead!', descPt: 'Cuidado: correria à vista!', kind: 'treat', price: 8, friendship: 4, emoji: '🌿' }),

  // ── brinquedos e cantinhos dela (no jardim) ───────────────────────────────
  t({ id: 'yarn_ball', en: 'ball of yarn', pt: 'novelo de lã', desc: 'Hours of fun.', descPt: 'Horas de diversão.', kind: 'toy', price: 15, place: 'flat', use: 'play', emoji: '🧶' }),
  t({ id: 'toy_mouse', en: 'toy mouse', pt: 'ratinho de brinquedo', desc: 'Squeak squeak!', descPt: 'Ii ii!', kind: 'toy', price: 15, place: 'flat', use: 'play', emoji: '🐭' }),
  t({ id: 'feather_toy', en: 'feather toy', pt: 'varinha de pena', desc: 'She can never catch it. She keeps trying.', descPt: 'Ela nunca pega. Ela continua tentando.', kind: 'toy', price: 20, place: 'flat', use: 'play', emoji: '🪶' }),
  t({ id: 'food_bowl', en: 'food bowl', pt: 'potinho de comida', desc: 'Her name is on it.', descPt: 'Tem o nome dela.', kind: 'toy', price: 12, place: 'flat', emoji: '🥣' }),
  t({ id: 'water_bowl', en: 'water bowl', pt: 'potinho de água', desc: 'Fresh water every day.', descPt: 'Água fresquinha todo dia.', kind: 'toy', price: 12, place: 'flat', emoji: '💧' }),
  t({ id: 'sunny_cushion', en: 'sunny cushion', pt: 'almofada de sol', desc: 'The best spot for a nap in the sun.', descPt: 'O melhor lugar para cochilar no sol.', kind: 'toy', price: 25, place: 'flat', use: 'bed', emoji: '🟨' }),
  t({ id: 'cat_bed_garden', en: 'cat bed', pt: 'caminha de gato', desc: 'Soft, round and just her size.', descPt: 'Macia, redonda e do tamanho dela.', kind: 'toy', price: 35, place: 'flat', use: 'bed', emoji: '🛏️' }),
  t({ id: 'cat_hammock', en: 'cat hammock', pt: 'rede de gato', desc: 'Swing, swing, sleep.', descPt: 'Balança, balança, dorme.', kind: 'toy', price: 50, minLevel: 3, use: 'perch', emoji: '🪢' }),
  t({ id: 'scratching_post_garden', en: 'scratching post', pt: 'arranhador', desc: 'Saves the garden bench!', descPt: 'Salva o banco do jardim!', kind: 'toy', price: 40, use: 'perch', emoji: '🪵' }),
  t({ id: 'cat_tunnel', en: 'cat tunnel', pt: 'túnel de gato', desc: 'In one side, out the other. Again!', descPt: 'Entra de um lado, sai do outro. De novo!', kind: 'toy', price: 45, minLevel: 3, w: 2, use: 'play', emoji: '🌀' }),
  t({ id: 'cat_house', en: 'cat house', pt: 'casinha de gato', desc: 'A tiny house for a tiny queen.', descPt: 'Uma casinha para uma rainha pequenininha.', kind: 'toy', price: 80, minLevel: 5, use: 'perch', emoji: '🏠' }),
  t({ id: 'cat_tower', en: 'cat tower', pt: 'torre de gato', desc: 'She can see the whole garden from up there.', descPt: 'Lá de cima ela vê a horta inteira.', kind: 'toy', price: 120, minLevel: 5, use: 'perch', emoji: '🗼' }),

  // ── decoração do jardim ───────────────────────────────────────────────────
  t({ id: 'stone_path', en: 'stone path', pt: 'caminho de pedra', desc: 'Step by step.', descPt: 'Passo a passo.', kind: 'decor', price: 10, place: 'flat', emoji: '🪨' }),
  t({ id: 'red_flowers', en: 'red flowers', pt: 'flores vermelhas', desc: 'A splash of color.', descPt: 'Um toque de cor.', kind: 'decor', price: 12, place: 'flat', emoji: '🌺' }),
  t({ id: 'yellow_flowers', en: 'yellow flowers', pt: 'flores amarelas', desc: 'Like little suns.', descPt: 'Como pequenos sóis.', kind: 'decor', price: 12, place: 'flat', emoji: '🌼' }),
  t({ id: 'purple_flowers', en: 'purple flowers', pt: 'flores roxas', desc: 'Her favorite color (after black).', descPt: 'A cor favorita dela (depois do preto).', kind: 'decor', price: 12, place: 'flat', emoji: '🪻' }),
  t({ id: 'mushrooms', en: 'mushrooms', pt: 'cogumelos', desc: 'Cute, but do not eat them!', descPt: 'Fofos, mas não coma!', kind: 'decor', price: 15, place: 'flat', emoji: '🍄' }),
  t({ id: 'white_fence', en: 'white fence', pt: 'cerquinha branca', desc: 'The dream house fence.', descPt: 'A cerquinha da casa dos sonhos.', kind: 'decor', price: 10, emoji: '🤍' }),
  t({ id: 'bush', en: 'bush', pt: 'arbusto', desc: 'Green and round.', descPt: 'Verde e redondinho.', kind: 'decor', price: 15, emoji: '🌳' }),
  t({ id: 'rose_bush', en: 'rose bush', pt: 'roseira', desc: 'Beautiful, but careful with the thorns.', descPt: 'Linda, mas cuidado com os espinhos.', kind: 'decor', price: 30, emoji: '🌹' }),
  t({ id: 'garden_gnome', en: 'garden gnome', pt: 'gnomo de jardim', desc: 'He guards the carrots at night.', descPt: 'Ele vigia as cenouras de noite.', kind: 'decor', price: 30, emoji: '🧙' }),
  t({ id: 'watering_can', en: 'watering can', pt: 'regador', desc: 'Every gardener needs one.', descPt: 'Todo jardineiro precisa de um.', kind: 'decor', price: 15, place: 'flat', emoji: '🚿' }),
  t({ id: 'bird_bath', en: 'bird bath', pt: 'bebedouro de passarinho', desc: 'Birds love it. Mucego loves watching them.', descPt: 'Os passarinhos amam. A Mucego ama observar.', kind: 'decor', price: 45, minLevel: 3, emoji: '🐦' }),
  t({ id: 'scarecrow', en: 'scarecrow', pt: 'espantalho', desc: 'Keeps the crows away. Not the cat.', descPt: 'Espanta os corvos. A gata não.', kind: 'decor', price: 50, minLevel: 3, emoji: '🌾' }),
  t({ id: 'lamp_post', en: 'lamp post', pt: 'poste de luz', desc: 'A warm light for summer nights.', descPt: 'Uma luz quentinha nas noites de verão.', kind: 'decor', price: 55, minLevel: 3, emoji: '🏮' }),
  t({ id: 'garden_bench', en: 'garden bench', pt: 'banco de jardim', desc: 'Sit together and watch the plants grow.', descPt: 'Sentem juntos e vejam as plantas crescerem.', kind: 'decor', price: 60, minLevel: 3, w: 2, emoji: '🪑' }),
  t({ id: 'picnic_table', en: 'picnic table', pt: 'mesa de piquenique', desc: 'Lunch outside today?', descPt: 'Almoço lá fora hoje?', kind: 'decor', price: 90, minLevel: 5, w: 2, emoji: '🧺' }),
  t({ id: 'parasol', en: 'parasol', pt: 'guarda-sol', desc: 'Shade for hot afternoons.', descPt: 'Sombra para as tardes quentes.', kind: 'decor', price: 70, minLevel: 5, emoji: '⛱️' }),
  t({ id: 'swing', en: 'swing', pt: 'balanço', desc: 'Higher, higher!', descPt: 'Mais alto, mais alto!', kind: 'decor', price: 120, minLevel: 5, w: 2, emoji: '🎠' }),
  t({ id: 'fountain', en: 'fountain', pt: 'fonte', desc: 'The sound of water is so relaxing.', descPt: 'O barulho da água é tão relaxante.', kind: 'decor', price: 200, minLevel: 8, w: 2, h: 2, emoji: '⛲' }),
];

export const THING_BY_ID: Record<string, GardenThing> = Object.fromEntries(GARDEN_THINGS.map((g) => [g.id, g]));

export const KIND_PT: Record<ThingKind, string> = { accessory: 'Para ela vestir', treat: 'Petiscos', toy: 'Brinquedos e cantinhos', decor: 'Decoração do jardim' };
