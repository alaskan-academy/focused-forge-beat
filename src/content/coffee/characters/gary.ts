import type { Character } from '../types';
import { ask, build, chapter, choose, gap, no, ok, order, recall, regular, say, write } from '../dsl';

// Gary: o cliente ranzinza. Grosso, seco, irônico, e secretamente um coração mole.
const gary: Character = {
  id: 'gary',
  name: 'Gary',
  look: {
    skin: '#e8b48f',
    hair: { style: 'curto', color: '#5a3825' },
    shirt: { style: 'moletom', color: '#7a5c45' },
    pants: { style: 'calça', color: '#3d405b' },
    shoes: { style: 'bota', color: '#2b1d16' },
  },
  personality_pt: 'Ranzinza, seco e irônico. Reclama de tudo, mas sempre volta.',
  bio_pt: 'Gary frequenta o lugar desde quando era uma livraria. Odeia barulho, conversa fiada e música alta.',
  chapters: [
    chapter('gary-1', 'O cliente ranzinza', 'Gary pediu café preto e reclamou da cadeira. Ele vinha aqui quando o lugar era uma livraria, onde ninguém falava com ele.', 'feelings', 'A2+', [
      say("Coffee. Black. And don't talk to me before I drink it.", 'Café. Preto. E não fala comigo antes de eu beber.', 'angry'),
      order('order', ['black_coffee'], { drink: 'black coffee' }),
      say('What are you looking at? This is the worst chair in town.', 'Tá olhando o quê? Essa é a pior cadeira da cidade.', 'angry'),
      choose('chair', ['g:superlatives', 'by_the_window'], [
        ok('Sorry about that. Would you like the one by the window?', say('...Fine. The window is acceptable.', '...Tá. A janela é aceitável.', 'neutral'), 1),
        no('Then go to another café.', 'Ele é grosso, mas responder na mesma moeda só piora. Seja firme e educado.', -1, say('Ha. Maybe I will.', 'Ha. Talvez eu vá mesmo.', 'angry')),
        no('Sorry about that. Would you like the one by window?', 'Falta o artigo: "by THE window".'),
      ]),
      say('I used to come here when it was a bookstore. Nobody talked to me. It was perfect.', 'Eu vinha aqui quando era uma livraria. Ninguém falava comigo. Era perfeito.', 'tired'),
      ask('before', ['g:used_to'], 'What was this place before the café?', ['a bookstore', 'a bank', 'a gym']),
    ], { gapDays: 0 }),

    chapter('gary-2', 'O vizinho do trompete', 'O vizinho do Gary toca trompete de madrugada. Gary deixou um bilhete "educado" em letras maiúsculas e agora admira corujas.', 'home', 'A2+', [
      recall('place', 'gary-1', ['g:used_to'], 'You. Do you remember what this place used to be?', ['a bookstore', 'a bakery', 'a cinema']),
      say('Correct. Unlike the Wi-Fi here, your memory works.', 'Correto. Diferente do Wi-Fi daqui, sua memória funciona.', 'neutral'),
      say("My neighbor's kid plays the trumpet. At 2 a.m. I'm so pissed off.", 'O filho do meu vizinho toca trompete. Às 2 da manhã. Tô muito pistola.', 'angry'),
      choose('vent', ['pissed_off', 'g:past_simple'], [
        ok('Oh no. Did you talk to the neighbor?', say('I left a note. A very polite note. In capital letters.', 'Deixei um bilhete. Um bilhete muito educado. Em letras maiúsculas.', 'angry'), 1),
        no('Oh no. Did you talked to the neighbor?', 'Depois de "did", verbo na forma base: "Did you talk…?"'),
        no('Everyone has problems, Gary.', 'Verdade, mas soa como desprezo. Ele está desabafando.', -1, say('Wow. Inspiring.', 'Nossa. Inspirador.', 'angry')),
      ]),
      gap('instead', ['instead_of'], 'customer', 'So, ', 'instead of', ' sleeping, I watched documentaries about owls.', 'Então, em vez de dormir, assisti documentários sobre corujas.', ['instead of', 'instead', 'in place']),
      say("Owls don't play the trumpet. Owls are my new heroes.", 'Corujas não tocam trompete. Corujas são minhas novas heroínas.', 'thinking'),
    ]),

    chapter('gary-3', 'O segredo do Gary', 'O garoto parou com o trompete depois que o Gary deu seus fones velhos para ele. Gary pediu segredo e deixou o gato do café sentar no jornal dele.', 'feelings', 'A2+', [
      recall('instrument', 'gary-2', ['remember'], "What instrument does my neighbor's kid play? Do you remember?", ['the trumpet', 'the drums', 'the violin']),
      say("He stopped. I gave him my old headphones. Don't tell anyone.", 'Ele parou. Eu dei meus fones velhos pra ele. Não conta pra ninguém.', 'embarrassed'),
      ask('gave', ['g:irregular_past'], 'What did Gary give the kid?', ['his old headphones', 'a trumpet', 'a polite note']),
      choose('secret', ['g:tell_say'], [
        ok('Your secret is safe with me. That was really kind.', say('Kind? I was protecting my sleep. Obviously.', 'Gentil? Eu estava protegendo meu sono. Óbvio.', 'embarrassed'), 1),
        no('Your secret is safe with me. That was really kindly.', '"Kind" é adjetivo (gentil); "kindly" é advérbio. Depois de "was", use o adjetivo.'),
        no("I'm going to tell everyone!", 'Ele pediu segredo. Engraçado, mas ele não vai gostar.', -1, say('Traitor.', 'Traidor.', 'angry')),
      ]),
      say("Also, your cat sat on my newspaper. I let her. Don't make it a thing.", 'Ah, e o seu gato sentou no meu jornal. Eu deixei. Não transforma isso num evento.', 'neutral'),
    ]),

    chapter('gary-4', 'O ratinho de brinquedo', 'Gary comprou um ratinho de brinquedo para o gato. Ele não costumava gostar de animais; agora tem opiniões sobre brinquedos de gato.', 'cats', 'A2+', [
      recall('gift', 'gary-3', ['g:irregular_past'], 'Do you remember what I gave the trumpet kid?', ['my old headphones', 'my newspaper', 'a cat toy']),
      say("I bought something for the cat. It's a mouse that squeaks. I hate it.", 'Comprei uma coisa pro gato. É um ratinho que apita. Eu odeio.', 'embarrassed'),
      say("I didn't use to like animals. Now I have opinions about cat toys.", 'Eu não costumava gostar de animais. Agora tenho opiniões sobre brinquedos de gato.', 'thinking'),
      gap('usedto', ['g:used_to'], 'player', "So you didn't ", 'use to', ' like cats?', 'Então você não costumava gostar de gatos?', ['use to', 'used to', 'using to']),
      write('nice', ['g:register_informal'], 'Say something nice to Gary. He will pretend he hates it.', 'Diga algo legal para o Gary. Ele vai fingir que odeia.', [['nice', 'kind', 'sweet', 'love', 'thank', 'great', 'cute', 'awesome', 'best', 'good']], [
        "That's so sweet, Gary. The cat loves you.",
        "Thank you, Gary! You're a good guy.",
      ]),
      say('Ugh. Stop. Same coffee as always. Black. Quickly.', 'Argh. Para. O café de sempre. Preto. Rápido.', 'embarrassed'),
    ]),

    chapter('gary-s1', 'Cinco estrelas', 'Gary disse que o café "não é terrível". Vindo dele, é uma avaliação cinco estrelas.', 'feelings', 'A2', [
      say("I'm going to say this once. This café is... not terrible.", 'Vou dizer isso uma vez só. Este café é... não terrível.', 'neutral'),
      say("From me, that's a five-star review.", 'Vindo de mim, isso é uma avaliação cinco estrelas.', 'happy'),
      build('thanks', ['means_a_lot'], 'Thanks, Gary. That means a lot.', 'Valeu, Gary. Isso significa muito.', ['mean', 'meaning', 'thank']),
    ], { minHearts: 6 }),
  ],
  regulars: [
    regular('gary-r1', 'drinks', 'A2', [
      say('Black coffee. Large. No small talk.', 'Café preto. Grande. Sem papo furado.', 'angry'),
      order('order', ['large', 'black_coffee'], { size: 'large', drink: 'black coffee' }),
    ]),
    regular('gary-r2', 'smalltalk', 'A2+', [
      say('Why is the music so loud? Is this a café or a nightclub?', 'Por que a música está tão alta? Isso é um café ou uma balada?', 'angry'),
      choose('music', ['certainly', 'g:register_formal'], [
        ok("Certainly. I'll turn it down right now.", say('Thank you. Finally, some competence.', 'Obrigado. Finalmente, alguma competência.', 'neutral')),
        no("It's not loud. You're just old.", 'Grosseiro. Mesmo com cliente chato, seja educado.', -1),
        no("Certainly. I'll turn down it right now.", 'Com pronome, ele fica no meio: "turn IT down".'),
      ]),
    ]),
  ],
};

export default gary;
