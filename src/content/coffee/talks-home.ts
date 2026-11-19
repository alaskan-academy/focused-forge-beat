// Conversas do tema "Home & Furniture": clientes falando da casa, mudança e decoração,
// treinando preposições de lugar (next to, in front of, behind, between, in the corner…)
// e as palavras dos móveis da lojinha (itens f:…).
import { ask, choose, gap, no, ok, say, spot, talk } from './dsl';
import type { Scene } from './types';

export const HOME_TALKS: Scene[] = [
  // ── Sofá novo: onde colocar? ────────────────────────────────────────────────
  talk('t-new-sofa', 'home', 'A2', [
    say('We finally bought a new sofa! But my husband wants it in front of the TV, and I want it by the window.', 'Finalmente compramos um sofá novo! Mas meu marido quer na frente da TV, e eu quero perto da janela.', 'thinking'),
    ask('where', ['g:prepositions_place', 'f:television'], 'Where does her husband want the sofa?', ['in front of the TV', 'next to the window', 'behind the door']),
    choose('advice', ['g:prepositions_place', 'next_to'], [
      ok('Put it next to the window and move the TV across from it.', say("Oh, that's smart! Everybody wins.", 'Ah, que esperto! Todo mundo ganha.', 'happy')),
      no('Put it in the window.', '"In the window" seria dentro da janela. Para perto dela use "by" ou "next to the window".'),
      no('Put it next the window.', 'Faltou o "to": "next TO the window".'),
    ]),
  ]),

  // ── Chaves perdidas em casa ────────────────────────────────────────────────
  talk('t-lost-keys-home', 'home', 'A2', [
    say("I can't find my keys anywhere! I looked under the bed and behind the sofa.", 'Não acho minhas chaves em lugar nenhum! Olhei embaixo da cama e atrás do sofá.', 'worried'),
    gap('counter', ['g:prepositions_place'], 'player', 'Did you check ', 'on', ' the kitchen counter?', 'Você olhou em cima da bancada da cozinha?', ['on', 'in', 'at']),
    say('The counter! They were on the counter, between the coffee maker and the fruit bowl.', 'A bancada! Estavam em cima da bancada, entre a cafeteira e a fruteira.', 'happy'),
    ask('between', ['g:prepositions_place', 'f:coffee_maker'], 'Where were the keys?', ['between the coffee maker and the fruit bowl', 'under the bed', 'behind the sofa']),
  ]),

  // ── Quarto pequeno e aconchegante ───────────────────────────────────────────
  talk('t-cozy-room', 'home', 'A2+', [
    say("I'm decorating my bedroom. I want it to feel cozy, but it's so small.", 'Estou decorando meu quarto. Quero que fique aconchegante, mas ele é tão pequeno.', 'thinking'),
    choose('cozy', ['g:prepositions_place', 'f:string_lights', 'f:floor_lamp'], [
      ok('Hang string lights above the bed and put a floor lamp in the corner.', say("Cozy and cute. I'm doing it tonight!", 'Aconchegante e fofo. Vou fazer hoje à noite!', 'excited')),
      no('Hang string lights under the bed.', 'Luzes embaixo da cama ninguém ia ver! Para "acima de" use "above".'),
      no('Put a floor lamp on the corner.', 'Canto de um cômodo é "IN the corner". "On the corner" é a esquina da rua.'),
    ]),
    spot('front', ['g:prepositions_place', 'f:small_rug'], 'There is a small rug in front *to* the bed.', 'There is a small rug in front of the bed.', 'É "in front OF": "in front of the bed".'),
  ]),
];
