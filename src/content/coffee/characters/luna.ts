import type { Character } from '../types';
import { ask, build, chapter, choose, no, ok, order, recall, regular, say } from '../dsl';

// Luna: dona de três gatos com personalidades fortes. Pickle (dramático), Duchess (chique), Waffles (preguiçoso).
const luna: Character = {
  id: 'luna',
  name: 'Luna',
  look: {
    skin: '#c98d63',
    hair: { style: 'cacheado', color: '#7d6aa8' },
    shirt: { style: 'moletom', color: '#81b29a' },
    pants: { style: 'saia', color: '#7a5c45' },
    shoes: { style: 'sandália', color: '#c4554d' },
  },
  personality_pt: 'Doce e caótica. Fala dos gatos como se fossem pessoas importantes.',
  bio_pt: 'Luna mora com três gatos: Pickle, o dramático; Duchess, a chique; e Waffles, o preguiçoso.',
  chapters: [
    chapter('luna-1', 'Três gatos', 'Luna mora com três gatos: Pickle (o mais dramático), Duchess (a mais chique, que abre portas e julga a dona) e Waffles (o mais preguiçoso).', 'cats', 'A2', [
      say('Hello! Chai latte, please. I need energy. I live with three cats.', 'Olá! Chai latte, por favor. Preciso de energia. Moro com três gatos.', 'happy'),
      order('order', ['chai_latte'], { drink: 'chai latte' }),
      say('Pickle is the most dramatic. Duchess is the fanciest. Waffles is the laziest.', 'O Pickle é o mais dramático. A Duchess é a mais chique. O Waffles é o mais preguiçoso.', 'love'),
      ask('lazy', ['g:superlatives'], 'Which cat is the laziest?', ['Waffles', 'Pickle', 'Duchess']),
      choose('cats', ['g:superlatives'], [
        ok('They sound adorable! Which one is the smartest?', say('Duchess. She opens doors. And judges me.', 'A Duchess. Ela abre portas. E me julga.', 'happy'), 1),
        no('They sound adorable! Which one is the most smart?', 'Adjetivo curto faz superlativo com -est: "the smartest".'),
        no("Three cats? That's too many cats.", 'Opinião não pedida e meio rude com quem ama os gatos.', -1, say("There's no such thing as too many cats.", 'Não existe gato demais.', 'angry')),
      ]),
    ], { gapDays: 0 }),

    chapter('luna-2', 'O celular na banheira', 'Pickle derrubou o celular da Luna na banheira enquanto ela tomava banho, e ainda olhou para ela como se a culpa fosse dela.', 'cats', 'A2', [
      recall('drama', 'luna-1', ['g:superlatives'], 'Quick quiz! Which of my cats is the most dramatic?', ['Pickle', 'Waffles', 'Duchess']),
      say('Last night Pickle knocked my phone into the bathtub. While I was in it.', 'Ontem à noite o Pickle derrubou meu celular na banheira. Comigo dentro.', 'angry'),
      say("Then he looked at me like, 'You did this.'", 'Aí ele me olhou tipo: "Foi você que fez isso."', 'thinking'),
      ask('phone', ['g:past_simple'], "Where did Luna's phone go?", ['into the bathtub', 'under the sofa', 'out the window']),
      choose('ok', ['g:did_vs_was'], [
        ok('Oh no! Was your phone OK?', say('It was fine. Rice saved it. Pickle was not sorry.', 'Ficou bem. O arroz salvou. O Pickle não se arrependeu.', 'happy'), 1),
        no('Oh no! Did your phone OK?', 'Com estado (estar ok) usa-se "was": "Was your phone OK?"'),
        no('Oh no! Were your phone OK?', '"Phone" é singular: "was", não "were".'),
      ]),
    ]),

    chapter('luna-3', 'O senhorio', 'O senhorio da Luna diz que três gatos são demais e quer que ela doe um. Luna prefere se mudar. Ideia: apresentar os gatos para ele.', 'home', 'A2+', [
      recall('bath', 'luna-2', ['remember'], 'Do you remember where Pickle threw my phone?', ['into the bathtub', 'into the toilet', 'into the fridge']),
      say('Big problem. My landlord says three cats are too many. He wants me to give one away.', 'Problemão. Meu senhorio diz que três gatos são demais. Quer que eu doe um.', 'worried'),
      say("I'd rather move than give away my babies.", 'Prefiro me mudar a doar meus bebês.', 'sad'),
      ask('landlord', ['g:too_enough'], 'What does the landlord say?', ['Three cats are too many.', 'The cats are too quiet.', 'The rent is too cheap.']),
      choose('help', ['g:what_if'], [
        ok("What if you asked him to meet them? They're charming!", say('Pickle is not charming. But Waffles can sleep on him.', 'O Pickle não é charmoso. Mas o Waffles pode dormir em cima dele.', 'thinking'), 1),
        no('What if you ask him to meeting them?', 'Depois de "what if" (sugestão), use o passado ("asked") e "to meet".'),
        no("Just give one away. It's only a cat.", 'Ela disse que prefere se mudar; isso desvaloriza o que ela sente.', -1, say('ONLY a cat?!', 'SÓ um gato?!', 'angry')),
      ]),
    ]),

    chapter('luna-4', 'Waffles, o negociador', 'O senhorio conheceu os gatos: Waffles dormiu no sapato dele por uma hora. Agora ele visita todo domingo e comprou uma coroinha para a Duchess.', 'cats', 'A2+', [
      recall('rule', 'luna-3', ['g:too_enough'], 'Remember what my landlord said about my cats?', ['three cats are too many', 'the cats are too loud', 'cats are not allowed']),
      say('He met them. Waffles slept on his shoes for an hour.', 'Ele conheceu os gatos. O Waffles dormiu no sapato dele por uma hora.', 'happy'),
      say('Now he visits every Sunday. He bought Duchess a tiny crown.', 'Agora ele visita todo domingo. Comprou uma coroinha para a Duchess.', 'love'),
      ask('bought', ['g:irregular_past'], 'What did the landlord buy?', ['a tiny crown for Duchess', 'a new bathtub', 'a dog']),
      build('win', ['g:superlatives'], 'Waffles is the best negotiator in the city.', 'O Waffles é o melhor negociador da cidade.', ['better', 'good', 'most']),
      say("He really is. I'm gonna make him a little business card.", 'Ele é mesmo. Vou fazer um cartãozinho de visita pra ele.', 'happy'),
    ]),

    chapter('luna-s1', 'Gatos baristas', 'Luna deu de presente uma foto dos três gatos vestidos de baristas. O Pickle mordeu o aventalzinho duas vezes.', 'cats', 'A2', [
      say("I made you something. It's a photo of my cats... dressed as baristas.", 'Fiz uma coisa pra você. É uma foto dos meus gatos... vestidos de baristas.', 'love'),
      say('Pickle bit the tiny apron. Twice.', 'O Pickle mordeu o aventalzinho. Duas vezes.', 'happy'),
      choose('photo', ['thank_you_so_much', 'g:going_to'], [
        ok("Thank you so much! I'm going to hang it by the register.", say('Perfect. Duchess approves of the location.', 'Perfeito. A Duchess aprova o lugar.', 'love')),
        no("Thank you so much! I'm going to hang it by register.", 'Falta o artigo: "by THE register".'),
        no('Thank you so much! I going to hang it by the register.', 'Falta o "am": "I\'m going to".'),
      ]),
    ], { minHearts: 5 }),
  ],
  regulars: [
    regular('luna-r1', 'cats', 'A2', [
      say('Do you think Waffles would like this café? Be honest.', 'Você acha que o Waffles ia gostar deste café? Seja sincero.', 'thinking'),
      choose('waffles', ['g:superlatives'], [
        ok('Totally. We have the softest cushions in town.', say("Then I'm bringing him. In a backpack.", 'Então vou trazer ele. Numa mochila.', 'happy')),
        no('Totally. We have the most soft cushions in town.', 'Adjetivo curto: "the softest".'),
        no("No. He'd hate it here.", 'Sem motivo e meio rude.', -1),
      ]),
    ]),
    regular('luna-r2', 'drinks', 'A2', [
      say("Large cappuccino with cinnamon, please. Pickle hates cinnamon, so it's my little revenge.", 'Cappuccino grande com canela, por favor. O Pickle odeia canela, então é a minha vingancinha.', 'happy'),
      order('order', ['large', 'cappuccino', 'cinnamon'], { size: 'large', drink: 'cappuccino', extras: ['cinnamon'] }),
    ]),
  ],
};

export default luna;
