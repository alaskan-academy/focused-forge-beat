// Conversas avulsas com o material das aulas de novembro: such a (road trip), there is/are/was/were
// (street dog rescue), home/downtown, could, mess up, vocabulário de "tell me about yourself" e hobbies.
import type { Scene } from './types';
import { ask, build, choose, gap, no, ok, say, spot, talk, write } from './dsl';

export const CLASS_TALKS: Scene[] = [
  // ── Such a road trip ───────────────────────────────────────────────────────
  talk('t-road-trip', 'life', 'A2+', [
    say('We just came back from such a crazy road trip. My husband checked the tires twice before we left.', 'A gente acabou de voltar de uma viagem de carro muito doida. Meu marido conferiu os pneus duas vezes antes de sair.', 'excited'),
    say("Then there was such a heavy storm that we couldn't see the road. I held his hand the whole time.", 'Aí veio uma tempestade tão forte que não dava para ver a estrada. Segurei a mão dele o tempo todo.', 'worried'),
    choose('such', ['g:such_a'], [
      ok('Wow, that sounds like such a scary moment!', say('It was! And then a tire exploded with such a loud noise.', 'Foi! E aí um pneu estourou com um barulho muito alto.', 'worried')),
      no('Wow, that sounds like such a scary moments!', 'Com "such a", o substantivo fica no singular: "such a scary moment".'),
      no('Wow, that sounds like a such scary moment!', 'A ordem é SUCH A + adjetivo + substantivo: "such a scary moment".'),
    ]),
    say('He changed it in the rain while I held a tiny umbrella. We both got wet.', 'Ele trocou o pneu na chuva enquanto eu segurava um guarda-chuva minúsculo. Nós dois ficamos molhados.', 'tired'),
    ask('wet', ['wet', 'while', 'held', 'the_whole', 'loud'], 'Why did they both get wet?', ['The umbrella was too small.', 'They jumped in the ocean.', 'The car had no roof.']),
    spot('news', ['g:such_a'], 'It was such *a* good news to find a warm shower.', 'It was such good news to find a warm shower.', '"News" é incontável: use "such good news", sem "a".'),
    say('But we found such a hidden gem, a tiny town with fresh bread. What a relief.', 'Mas achamos uma joia escondida, uma cidadezinha com pão fresquinho. Que alívio.', 'love'),
    ask('gem', ['hidden_gem', 'relief', 'g:such_a'], 'Why was the town such a hidden gem?', ['It was tiny, nobody knew it, and it had fresh bread.', 'It had a famous airport.', 'It was full of tourists.']),
  ]),

  // ── There is / there are: street dog rescue ───────────────────────────────
  talk('t-street-dog', 'pets', 'A2', [
    say('There is a street dog outside, near the door. He looks scared and injured.', 'Tem um cachorro de rua lá fora, perto da porta. Ele parece assustado e machucado.', 'worried'),
    gap('isnt', ['g:there_is_are', 'shelter'], 'customer', 'And ', "there isn't", ' a shelter in this neighborhood.', 'E não tem nenhum abrigo neste bairro.', ["there isn't", "there aren't", "isn't there"]),
    choose('help', ['g:there_is_are', 'water_bowl', 'food_scraps'], [
      ok(
        'There are some food scraps in the kitchen. I can bring a water bowl too.',
        say("You're so caring. Let's take care of him together.", 'Você é muito cuidadoso. Vamos cuidar dele juntos.', 'love'),
      ),
      no('There is some food scraps in the kitchen.', '"Food scraps" é plural: THERE ARE food scraps.'),
      no("Not my problem. I'm working.", 'Grosso demais, e ele só quer ajudar o cachorro.'),
    ]),
    say('Is there an animal clinic nearby? Maybe the owner is looking for him.', 'Tem uma clínica veterinária aqui perto? Talvez o dono esteja procurando ele.', 'thinking'),
    choose('clinic', ['g:short_answers', 'g:there_is_are', 'animal_clinic', 'owner'], [
      ok("Yes, there is. It's two blocks away.", say("Great. Be careful, he's scared. Let's rescue him.", 'Ótimo. Cuidado, ele está assustado. Vamos resgatar ele.', 'excited')),
      no('Yes, there are.', 'A pergunta é "Is there…?" (singular), então a resposta é "Yes, there is."'),
      no('Yes, it is.', 'Para "Is there…?", responda com "there": "Yes, there is."'),
    ]),
    ask('need', ['street_dog', 'scared', 'injured', 'caring', 'careful', 'rescue', 'take_care_of'], 'How is the street dog?', ['scared and injured', 'happy and hungry', 'sleeping in the shelter']),
    gap('build', ['build', 'shelter'], 'customer', 'One day I want to ', 'build', ' a shelter for them.', 'Um dia eu quero construir um abrigo para eles.', ['build', 'built', 'building']),
  ]),

  // ── There was / there were ───────────────────────────────────────────────
  talk('t-childhood-park', 'family', 'A2+', [
    say('When I was a kid, there was a park near my house. There were a lot of trees and a few old benches.', 'Quando eu era criança, tinha um parque perto de casa. Tinha muitas árvores e alguns bancos velhos.', 'happy'),
    ask('park', ['g:there_was_were', 'a_few'], 'What was there in the park?', ['a lot of trees and a few benches', 'a big shopping mall', 'a lot of street dogs']),
    choose('were', ['g:there_was_were'], [
      ok('Were there any pets in your childhood home?', say('There were three cats. And a very stubborn parrot.', 'Tinha três gatos. E um papagaio muito teimoso.', 'happy')),
      no('Was there any pets in your childhood home?', '"Pets" é plural: WERE there any pets?'),
      no('There were any pets in your childhood home?', 'Na pergunta, o verbo vem antes: "Were there…?"'),
    ]),
    write(
      'place',
      ['g:there_was_were'],
      'Tell her about a place there was in your city when you were a kid.',
      'Conte para ela de um lugar que existia na sua cidade quando você era criança.',
      [['there was', 'there were']],
      ['There was a big park near my school.', 'There were a lot of trees on my street.'],
    ),
  ]),

  // ── Tell me about yourself ───────────────────────────────────────────────
  talk('t-about-yourself', 'work', 'B1', [
    say("I'm interviewing people for my company today. So, tell me about yourself. What's your mindset at work?", 'Estou entrevistando pessoas para a minha empresa hoje. Então, me fala de você. Qual é a sua mentalidade no trabalho?', 'neutral'),
    build('consider', ['i_consider_myself', 'passionate_about', 'mindset'], "I consider myself a calm person, and I'm passionate about learning.", 'Eu me considero uma pessoa calma, e sou apaixonado por aprender.', ['considering', 'passion', 'me']),
    say('Nice. And how would your friends describe you?', 'Legal. E como seus amigos descreveriam você?', 'thinking'),
    choose('describe', ['describe_me_as', 'g:aux_modals'], [
      ok('People would probably describe me as stubborn, but caring.', say('Stubborn and caring. Honest answer. I like it.', 'Teimoso e cuidadoso. Resposta honesta. Gostei.', 'happy')),
      no('People would probably describing me as stubborn.', 'Depois de "would", o verbo fica na forma base: "would describe".'),
      no('People will probably to describe me as stubborn.', 'Depois de will/would não vai "to".'),
    ]),
    say('Last question. When it comes to English, what do you struggle to do?', 'Última pergunta. Quando se trata de inglês, o que você tem dificuldade de fazer?', 'thinking'),
    write(
      'struggle',
      ['struggle_to', 'when_it_comes_to'],
      'Tell him something you struggle to do in English.',
      'Conte uma coisa que você tem dificuldade de fazer em inglês.',
      [['struggle', 'difficult', 'hard']],
      ['I struggle to catch the words in movies.', "It's hard for me to speak fast."],
    ),
    say('Perfect. We want people who develop meaningful connections, not just skills.', 'Perfeito. Queremos pessoas que criam conexões significativas, não só habilidades.', 'happy'),
    ask('want', ['meaningful_connections', 'develop'], 'What kind of people does the company want?', ['people who develop meaningful connections', 'people who never ask questions', 'people who work alone']),
  ]),

  // ── Hobbies ─────────────────────────────────────────────────────────────
  talk('t-hobbies', 'smalltalk', 'A2+', [
    say("What do you do on weekends? I'm into old movies. I binge-watch them every Sunday.", 'O que você faz no fim de semana? Eu curto filmes antigos. Maratono todo domingo.', 'happy'),
    say("I'm a big fan of British series, but I struggle to catch the words. Their accent is so fast!", 'Sou muito fã de séries britânicas, mas tenho dificuldade de entender as palavras. O sotaque deles é muito rápido!', 'tired'),
    ask('fan', ['big_fan_of', 'catch_the_words', 'binge_watch'], 'What is difficult for her?', ['to catch the words in British series', 'to find old movies', 'to wake up on Sunday']),
    choose('hobby', ['im_into', 'go_for_a_drive', 'play_an_instrument'], [
      ok("I'm into music. I play an instrument, and sometimes I go for a drive to relax.", say('A drive with good music? Such a good plan.', 'Uma volta de carro com música boa? Que plano bom.', 'happy')),
      no("I'm into play an instrument.", 'Depois de "I\'m into" vem substantivo ou verbo com -ing: "I\'m into music" ou "I\'m into playing…".'),
      no("I'm into to go for a drive.", 'Depois de "into" não se usa "to": "I\'m into going for a drive".'),
    ]),
    say('My dream is to live abroad one day. Maybe in Ireland.', 'Meu sonho é morar fora um dia. Talvez na Irlanda.', 'excited'),
    ask('dream', ['abroad'], 'What is her dream?', ['to live abroad', 'to binge-watch every series', 'to play the guitar']),
  ]),

  // ── Mess / mess up / messed up ─────────────────────────────────────────────
  talk('t-mess', 'home', 'A2+', [
    say('My house is a mess today. My brother came here last night and messed up everything.', 'Minha casa está uma bagunça hoje. Meu irmão veio ontem à noite e bagunçou tudo.', 'tired'),
    spot('messes', ['mess_up', 'g:aux_do'], 'Why do you always get drunk and *messes* things up?', 'Why do you always get drunk and mess things up?', 'Com "do you", os dois verbos ficam na forma base: "get drunk and MESS things up".'),
    say('And now my whole schedule got messed up. I have three meetings and no clean cups.', 'E agora a minha agenda inteira ficou bagunçada. Tenho três reuniões e nenhuma xícara limpa.', 'angry'),
    choose('calm', ['c:take_it_easy', 'mess', 'messed_up', 'mess_up'], [
      ok('Take it easy. Have a coffee first, then fix the mess.', say("You're right. Coffee first. Chaos later.", 'Você tem razão. Café primeiro. Caos depois.', 'happy')),
      no('Take it easy. Have a coffee first, then mess up the mess.', '"Mess up" é bagunçar/estragar; aqui o certo é arrumar (fix) a bagunça.'),
      no('Took it easy. Have a coffee first.', 'Conselho vai no imperativo, na forma base: "Take it easy".'),
    ]),
  ]),

  // ── Class Vocabulary: regardless, surrounded by, stubborn, whenever, landscape ──
  talk('t-moving-south', 'places', 'B1', [
    say("We're moving to the south of Brazil. The landscape there is absolutely breathtaking.", 'Vamos nos mudar para o sul do Brasil. A paisagem lá é de tirar o fôlego.', 'excited'),
    say("Our new house is surrounded by trees. Whenever I feel stressed, I'll go for a walk.", 'Nossa casa nova é cercada de árvores. Sempre que eu ficar estressada, vou dar uma caminhada.', 'love'),
    say("My mom says it's too cold there. But I'm going regardless. I'm a bit stubborn.", 'Minha mãe diz que lá é frio demais. Mas eu vou de qualquer jeito. Sou meio teimosa.', 'happy'),
    ask('regardless', ['regardless', 'stubborn'], "Is she moving even though her mom doesn't like the idea?", ['Yes, regardless of what her mom says.', 'No, she changed her mind.', 'Only if her mom goes too.']),
    gap('whenever', ['whenever', 'surrounded_by', 'landscape'], 'player', '', 'Whenever', ' you want, send me photos of the landscape!', 'Sempre que quiser, me manda fotos da paisagem!', ['Whenever', 'Whoever', 'Although']),
  ]),

  // ── Home / downtown + could ───────────────────────────────────────────────
  talk('t-downtown', 'places', 'A2', [
    say('We had lunch downtown yesterday. Then we came back home and slept all afternoon.', 'A gente almoçou no centro ontem. Depois voltamos para casa e dormimos a tarde toda.', 'happy'),
    spot('home', ['g:home_downtown'], 'We came back *to* home very late.', 'We came back home very late.', 'Com HOME não se usa "to": "came back home", "go home".'),
    spot('could', ['g:could_past'], 'Last class we talked a lot and we can *saw* our improvements.', 'Last class we talked a lot and we could see our improvements.', 'Depois de can/could o verbo fica na forma base; e para o passado use COULD: "we could see".'),
    choose('where', ['g:home_downtown', 'downtown'], [
      ok('Do you want to go downtown after work?', say("Sure! There's a hidden gem there, a tiny bookstore.", 'Claro! Tem uma joia escondida lá, uma livrariazinha.', 'excited')),
      no('Do you want to go to downtown after work?', 'Com "downtown" não vai preposição: "go downtown".'),
      no('Do you want to go in downtown after work?', 'Sem preposição antes de "downtown".'),
    ]),
  ]),

  // ── Advertisement (digital marketing) ────────────────────────────────────
  talk('t-advertisement', 'work', 'B1', [
    say('I work with digital marketing. Yesterday a client hated our new advertisement.', 'Trabalho com marketing digital. Ontem um cliente odiou a nossa propaganda nova.', 'tired'),
    say("He said it was such a boring ad. Then he asked for the same ad, but 'more exciting'.", 'Ele disse que era um anúncio muito chato. Depois pediu o mesmo anúncio, só que "mais empolgante".', 'angry'),
    choose('ad', ['advertisement', 'g:such_a'], [
      ok('Clients! Such a mystery. What did you change?', say('The font. Only the font. He loved it.', 'A fonte. Só a fonte. Ele amou.', 'happy')),
      no('Clients! Such a mysteries.', 'Com "such a", o substantivo fica no singular: "such a mystery".'),
      no('Clients! A such mystery.', 'A ordem é SUCH A + substantivo: "such a mystery".'),
    ]),
    ask('change', ['advertisement'], 'What did she change in the advertisement?', ['only the font', 'the whole video', 'the client']),
  ]),

  // ── Break up / reliable / myself ─────────────────────────────────────────
  talk('t-break-up', 'relationships', 'A2+', [
    say('I had to break up with my boyfriend last week. It was such a painful experience.', 'Tive que terminar com o meu namorado semana passada. Foi uma experiência muito dolorosa.', 'sad'),
    say("He wasn't reliable. He never did what he said. I'm proud of myself for ending it.", 'Ele não era confiável. Nunca fazia o que dizia. Estou orgulhosa de mim por ter terminado.', 'thinking'),
    choose('support', ['reliable', 'g:reflexive_pronouns', 'take_care_of'], [
      ok('You deserve someone reliable. Take care of yourself, OK?', say('Thanks. I will. Starting with a big piece of cake.', 'Obrigada. Vou. Começando por um pedaço grande de bolo.', 'happy')),
      no('You deserve someone reliable. Take care of you, OK?', 'O reflexivo de "you" é YOURSELF: "take care of yourself".'),
      no('Breaking up is easy. Get over it.', 'Ríspido demais: ela está triste.'),
    ]),
    gap('myself', ['g:reflexive_pronouns', 'break_up'], 'customer', "I'm proud of ", 'myself', '. Really.', 'Estou orgulhosa de mim mesma. Sério.', ['myself', 'herself', 'mine']),
  ]),

  // ── Pack your bags ──────────────────────────────────────────────────────
  talk('t-pack', 'life', 'A2', [
    say("We're going to the beach tomorrow, but nobody wants to pack. Who packs the bathroom stuff when you travel?", 'Vamos para a praia amanhã, mas ninguém quer fazer as malas. Quem arruma as coisas de banheiro quando vocês viajam?', 'thinking'),
    choose('who', ['pack', 'g:short_answers'], [
      ok('I do. My partner always forgets the toothpaste.', say('Same here. Toothpaste is always the first victim.', 'Aqui também. A pasta de dente é sempre a primeira vítima.', 'happy')),
      no('I does. My partner always forgets the toothpaste.', 'Com "I" o auxiliar é DO: "I do."'),
      no('I am. My partner always forgets the toothpaste.', 'A pergunta usa um verbo de ação (packs), então a resposta curta é "I do."'),
    ]),
  ]),
];
