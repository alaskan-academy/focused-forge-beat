// Mucego Frutífero, a gatinha preta da horta: amizade (do café, os dois juntos), comida da despensa,
// pedido do dia em inglês, "tapinha na bundinha" e presentes. Mesmas regras de coffee_mucego_* no banco.
import { CROP_BY_ID, type CropKind } from './garden';

export const MUCEGO_NAME = 'Mucego Frutífero';

export type FriendLevel = { min: number; pt: string; en: string; emoji: string };
export const FRIEND_LEVELS: FriendLevel[] = [
  { min: 0, pt: 'Desconfiada', en: 'suspicious', emoji: '😾' },
  { min: 10, pt: 'Curiosa', en: 'curious', emoji: '🐱' },
  { min: 30, pt: 'Amiga', en: 'friend', emoji: '😺' },
  { min: 60, pt: 'Melhor amiga', en: 'best friend', emoji: '😻' },
  { min: 100, pt: 'Família', en: 'family', emoji: '💞' },
];
export const friendLevel = (f: number) => {
  let i = 0;
  FRIEND_LEVELS.forEach((l, k) => {
    if (f >= l.min) i = k;
  });
  return i;
};

// tapinha na bundinha: uma vez por hora (cada um)
export const PET_COOLDOWN_MIN = 60;
// comida: até 5 por dia (cada um); fruta é a favorita
export const FEEDS_PER_DAY = 5;
export const FOOD_FRIENDSHIP: Record<CropKind, number> = { herb: 1, veg: 1, fruit: 3, golden: 5 };
export const REQUEST_BONUS = { friendship: 5, coins: 5 };

// O que ela diz quando ganha cada tipo de comida
export const FOOD_LINES: Record<CropKind, [string, string][]> = {
  fruit: [
    ['Yummy! Fruit is my favorite thing in the world!', 'Hummm! Fruta é minha coisa favorita no mundo!'],
    ['So sweet! Can I have another one tomorrow?', 'Que docinho! Posso ganhar outra amanhã?'],
  ],
  veg: [
    ["A vegetable…? Okay, I'll try it.", 'Um legume…? Tá bom, vou provar.'],
    ['Crunchy! Not bad, not bad at all.', 'Crocante! Nada mal, nada mal mesmo.'],
  ],
  herb: [
    ['It smells funny… but I like it!', 'Tem um cheiro engraçado… mas eu gostei!'],
    ['Leaves? I am a cat, not a rabbit! …Thanks, though.', 'Folhas? Eu sou uma gata, não um coelho! …Obrigada, mesmo assim.'],
  ],
  golden: [['A GOLDEN apple?! You are the best human ever!', 'Uma maçã DOURADA?! Você é o melhor humano do mundo!']],
};

export const PET_LINES: [string, string][] = [
  ['Purr… right there! Butt pats are the best!', 'Rrrr… bem aí! Tapinha na bundinha é o melhor!'],
  ['Prrrt! A little higher… perfect.', 'Prrrt! Um pouquinho mais pra cima… perfeito.'],
  ['More, more! Don’t stop!', 'Mais, mais! Não para!'],
];
export const PET_TIRED: [string, string] = ["I'm sleepy now. Come back later!", 'Agora estou com sono. Volta depois!'];

// Pedido do dia: ela descreve em inglês o que quer; você escolhe da despensa.
export type Want = { id: string; en: string; pt: string; accepts: string[] };
export const WANTS: Want[] = [
  { id: 'red_sweet', en: 'I want something red and sweet today!', pt: 'Quero algo vermelho e doce hoje!', accepts: ['strawberry', 'watermelon'] },
  { id: 'orange', en: 'Can I have something orange, please?', pt: 'Pode me dar algo laranja, por favor?', accepts: ['carrot', 'pumpkin'] },
  { id: 'green_leafy', en: 'I feel like eating something green and leafy.', pt: 'Estou com vontade de comer algo verde e de folha.', accepts: ['lettuce', 'basil', 'mint', 'parsley'] },
  { id: 'blue', en: 'Do you have anything blue? Blue food is so rare!', pt: 'Você tem algo azul? Comida azul é tão rara!', accepts: ['blueberry'] },
  { id: 'yellow', en: 'Something yellow, like the sun!', pt: 'Algo amarelo, como o sol!', accepts: ['corn', 'sunflower'] },
  { id: 'big', en: 'I want something BIG today. Really big!', pt: 'Hoje quero algo GRANDE. Bem grande!', accepts: ['watermelon', 'pumpkin'] },
  { id: 'smells_good', en: 'Bring me something that smells good.', pt: 'Me traz algo que tenha cheiro bom.', accepts: ['rosemary', 'mint', 'basil'] },
  { id: 'salad', en: 'Let’s make a salad! What can I put in it?', pt: 'Vamos fazer uma salada! O que posso colocar?', accepts: ['tomato', 'lettuce'] },
];
export const WANT_BY_ID: Record<string, Want> = Object.fromEntries(WANTS.map((w) => [w.id, w]));

// pedido de hoje (mesmo para os dois): dia do ano % número de pedidos — o banco faz a mesma conta
export function wantFor(day: string): Want {
  const [y, m, d] = day.split('-').map(Number);
  const doy = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
  return WANTS[doy % WANTS.length];
}

export const foodKind = (cropId: string): CropKind => CROP_BY_ID[cropId]?.kind ?? 'herb';

// Estado da Mucego visto pelo app.
export type MucegoData = {
  friendship: number;
  accessory: string | null; // acessório que ela está usando
  accessories: string[]; // acessórios que vocês já compraram (do café)
  request_done: boolean; // o pedido de hoje já foi atendido (por qualquer um)
  last_pet_at: string | null; // meu último tapinha
  feeds_today: number; // quantas comidas eu dei hoje
  treats: Record<string, number>; // meus petiscos
  gift_ready: boolean; // tem presente para mim hoje
};

export type MucegoResult = { friendship: number; coins: number; line: [string, string] };

// Saudações da Mucego Frutífero quando você toca nela (ela adora plantinhas, legumes e frutinhas).
export const MUCEGO_LINES: [string, string][] = [
  ['Meow! I love the smell of fresh basil.', 'Miau! Eu amo o cheiro de manjericão fresquinho.'],
  ['Purr… strawberries are my favorite fruit.', 'Rrrr… morango é minha fruta favorita.'],
  ["Don't forget to water the plants!", 'Não esquece de regar as plantas!'],
  ["I'm guarding the tomatoes. Nobody touches them.", 'Estou vigiando os tomates. Ninguém mexe neles.'],
  ['Is it lunchtime yet? I could eat a carrot.', 'Já é hora do almoço? Eu comeria uma cenoura.'],
  ['The sunflowers are taller than me!', 'Os girassóis são mais altos que eu!'],
  ['I took a nap between the lettuces. Best nap ever.', 'Tirei uma soneca entre as alfaces. Melhor soneca da vida.'],
];

