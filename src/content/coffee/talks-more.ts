// Mais conversas avulsas: irônicas, grossas, formais e muito informais (de propósito, para treinar registros).
import type { Scene } from './types';
import { ask, build, choose, gap, no, ok, say, talk, write } from './dsl';

export const MORE_TALKS: Scene[] = [
  talk('t-airport', 'life', 'A2+', [
    say("Airports didn't use to be so crowded. Today I waited two hours to take off my shoes.", 'Aeroporto não costumava ser tão lotado. Hoje esperei duas horas para tirar os sapatos.', 'tired'),
    say('And my flight? Delayed. Of course. I love paying to sit on the floor.', 'E o meu voo? Atrasado. Claro. Adoro pagar para sentar no chão.', 'angry'),
    ask('problem', ['crowded', 'g:used_to'], 'What is the problem with airports nowadays, according to him?', ["They're too crowded.", "They're too quiet.", "They're too cheap."]),
    choose('reply', ['g:used_to'], [
      ok('Travelling used to be easier, right? At least you have coffee now.', say('True. Coffee is the only thing that never gets delayed.', 'Verdade. Café é a única coisa que nunca atrasa.', 'happy')),
      no('Travelling use to be easier, right?', 'Na afirmativa é "used to" (com -d): "Travelling USED to be easier".'),
      no('Stop complaining. At least you can travel.', 'Ríspido; ele só está desabafando.'),
    ]),
  ], true),

  talk('t-paper-map', 'family', 'A2+', [
    say('My dad refuses to use Google Maps. He carries a paper map. In 2026.', 'Meu pai se recusa a usar Google Maps. Ele carrega um mapa de papel. Em 2026.', 'thinking'),
    say('Yesterday we got lost for three hours. He said it was "an adventure".', 'Ontem a gente se perdeu por três horas. Ele disse que foi "uma aventura".', 'tired'),
    gap('instead', ['instead_of'], 'player', 'So he uses a paper map ', 'instead of', ' his phone?', 'Então ele usa mapa de papel em vez do celular?', ['instead of', 'instead', 'in front of']),
    ask('lost', ['g:irregular_past'], 'What happened yesterday?', ['They got lost for three hours.', 'They found a new restaurant.', 'His dad bought a phone.']),
  ]),

  talk('t-sitcom', 'smalltalk', 'A2', [
    say("I watched my favorite sitcom from the 90s again. For the fifth time. I know every joke.", 'Assisti de novo à minha sitcom favorita dos anos 90. Pela quinta vez. Sei todas as piadas.', 'happy'),
    say('My girlfriend says I need help. I say I need season six.', 'Minha namorada diz que eu preciso de ajuda. Eu digo que preciso da sexta temporada.', 'happy'),
    write('series', ['g:past_simple', 'g:used_to'], 'Tell him a series you used to watch when you were a teenager.', 'Conte para ele uma série que você assistia quando era adolescente.', [['watch', 'watched', 'series', 'show', 'cartoon', 'loved', 'liked']], [
      'I used to watch Friends with my family.',
      'When I was a teenager, I watched cartoons every day.',
    ]),
    say('Good choice. Respect.', 'Boa escolha. Respeito.', 'happy'),
  ]),

  talk('t-cheating-cafe', 'relationships', 'A2+', [
    say('I think my girlfriend is cheating on me.', 'Acho que minha namorada está me traindo.', 'worried'),
    say('...With another café. She came home smelling like hazelnut syrup. We don\'t even have hazelnut!', '...Com outro café. Ela chegou em casa cheirando a xarope de avelã. A gente nem tem avelã!', 'angry'),
    ask('joke', ['cheat_on'], 'What is she really "cheating" with?', ['another café', 'another person', 'his best friend']),
    choose('reply', ['g:register_informal'], [
      ok("That's a betrayal. Want a free cookie to deal with the pain?", say('Yes. Emotional support cookie, please.', 'Sim. Cookie de apoio emocional, por favor.', 'happy')),
      no("That's a betrayal. Want a free cookie for deal with the pain?", 'Para indicar finalidade use "to": "TO deal with the pain".'),
      no('Maybe she just likes their coffee better.', 'Verdade dolorosa demais para dizer em voz alta. Ele vai chorar.'),
    ]),
  ]),

  talk('t-would-rather-phone', 'smalltalk', 'A2+', [
    say('Random question. Would you rather lose your phone or your keys?', 'Pergunta aleatória. Você prefere perder o celular ou as chaves?', 'thinking'),
    write('rather', ['g:would_rather'], 'Answer with "I\'d rather lose..." and say why.', 'Responda com "I\'d rather lose..." e diga por quê.', [['rather', 'prefer']], [
      "I'd rather lose my keys, because my life is on my phone.",
      "I'd rather lose my phone. I can buy another one.",
    ]),
    say("Interesting. I lost both this morning. So I'm living the dream.", 'Interessante. Perdi os dois hoje de manhã. Então tô vivendo o sonho.', 'tired'),
  ]),

  talk('t-hurry', 'ordering', 'A2', [
    say('Can you hurry up? Some of us have jobs.', 'Dá pra andar logo? Alguns de nós trabalham.', 'angry'),
    choose('calm', ['hurry_up', 'g:register_formal'], [
      ok("I'm sorry for the wait. Your order is next.", say('Hmph. Fine.', 'Hunf. Tá.', 'neutral')),
      no("Some of us have jobs too. This is mine. Relax.", 'Rebater a grosseria só cria briga. Firme e educado funciona melhor.', 0, say('Wow. Great service.', 'Nossa. Ótimo atendimento.', 'angry')),
      no("I'm sorry for the waiting. Your order is next.", 'O substantivo é "the wait" (a espera).'),
    ]),
  ], true),

  talk('t-wifi-formal', 'tech', 'B1', [
    say('Excuse me. I must inform you that your Wi-Fi password is "password123".', 'Com licença. Devo informar que a senha do seu Wi-Fi é "password123".', 'neutral'),
    say('That is not a password. That is an invitation.', 'Isso não é uma senha. Isso é um convite.', 'thinking'),
    choose('reply', ['g:register_formal', 'wifi_password'], [
      ok("Thank you for letting us know. I'll change the Wi-Fi password right away.", say('Excellent. I suggest something stronger. Like "password124".', 'Excelente. Sugiro algo mais forte. Tipo "password124".', 'happy')),
      no("Thank you for let us know. I'll change it right away.", 'Depois de "thank you for", o verbo vai com -ing: "for LETTING us know".'),
      no('Bro, nobody wants to hack a café.', 'Informal e desdenhoso com um cliente formal que está ajudando.'),
    ]),
  ]),

  talk('t-slang', 'smalltalk', 'A2+', [
    say("Bro, this café is lowkey fire. No cap.", 'Mano, esse café é sinistro de bom. Sem mentira.', 'excited'),
    ask('meaning', ['g:register_informal'], 'What does he mean?', ['He really likes the café.', 'The café is on fire.', 'He wants a cap.']),
    choose('reply', ['g:register_informal'], [
      ok('Haha, thanks, man! Glad you like it.', say("For real. The cat even liked my post.", 'Sério. Até o gato curtiu meu post.', 'happy')),
      no('We sincerely appreciate your kind words, sir.', 'Correto, mas formal demais para "bro, no cap". Soa como um robô do banco.', 0, say('...OK, AI.', '...Tá bom, IA.', 'thinking')),
      no('Haha, thanks, man! Glad you likes it.', 'Com "you", o verbo não leva -s: "you like".'),
    ]),
  ]),

  talk('t-traffic', 'feelings', 'A2+', [
    say("I'm so pissed off. Two hours in traffic. TWO HOURS.", 'Tô muito pistola. Duas horas no trânsito. DUAS HORAS.', 'angry'),
    say('I listened to the same podcast three times. Now I know too much about mushrooms.', 'Ouvi o mesmo podcast três vezes. Agora sei demais sobre cogumelos.', 'tired'),
    ask('why', ['pissed_off'], 'Why is he pissed off?', ['He spent two hours in traffic.', 'He hates mushrooms.', 'His podcast was deleted.']),
    gap('listened', ['g:past_simple', 'g:too_enough'], 'customer', 'I ', 'listened', ' to the same podcast three times.', 'Ouvi o mesmo podcast três vezes.', ['listened', 'listen', 'listening']),
  ]),

  talk('t-twins', 'family', 'A2+', [
    say("I'm overwhelmed. I have five-year-old twins. They're tiny tornadoes.", 'Tô sobrecarregada. Tenho gêmeos de cinco anos. São mini furacões.', 'tired'),
    say("Today they painted the cat with yogurt. It's fine. Everything is fine.", 'Hoje eles pintaram o gato com iogurte. Tá tudo bem. Tudo ótimo.', 'tired'),
    choose('support', ['overwhelmed'], [
      ok('That sounds exhausting. Sit down, the coffee is on me.', say('I could cry. In a good way.', 'Eu poderia chorar. De um jeito bom.', 'love')),
      no('Kids are a blessing. Enjoy every moment!', 'Bem-intencionado, mas ignora o cansaço dela. Não acolhe.'),
      no('That sounds exhausted. Sit down, the coffee is on me.', 'A situação é "exhausting" (exaustiva); a pessoa é que fica "exhausted".'),
    ]),
  ]),

  talk('t-first-date', 'relationships', 'B1', [
    say('I have a first date in ten minutes. What if she hates me? What if I spill coffee on her?', 'Tenho um primeiro encontro em dez minutos. E se ela me odiar? E se eu derrubar café nela?', 'worried'),
    choose('calm', ['g:what_if'], [
      ok('What if she loves you? Just be yourself. And hold the cup with two hands.', say('Two hands. Got it. Very romantic.', 'Duas mãos. Entendi. Muito romântico.', 'happy')),
      no('What if she love you? Just be yourself.', 'Com "she", o verbo leva -s: "she loves". (Aqui o presente também funciona.)'),
      no('Honestly, she will probably hate you.', 'Cruel e sem motivo.'),
    ]),
    say("She's here and she's beautiful. Act normal. ACT NORMAL.", 'Ela chegou e ela é linda. Age normal. AGE NORMAL.', 'embarrassed'),
  ]),

  talk('t-ex-dog', 'relationships', 'A2+', [
    say("Don't look. My ex just walked in. With MY dog.", 'Não olha. Meu ex acabou de entrar. Com o MEU cachorro.', 'angry'),
    say('Technically, it is his dog. But emotionally, it is my dog.', 'Tecnicamente, o cachorro é dele. Mas emocionalmente, é meu.', 'sad'),
    ask('dog', ['g:irregular_past'], 'Whose dog is it, technically?', ["her ex's dog", 'her dog', "the café's dog"]),
    choose('reply', ['g:should_advice'], [
      ok('Do you want to sit by the window? He won\'t see you there.', say('Yes. Hide me. Like a spy.', 'Sim. Me esconde. Tipo espiã.', 'happy')),
      no('Do you want sit by the window?', 'Falta o "to": "Do you want TO sit…?"'),
      no('You should go say hi. Be mature!', 'Ela claramente não quer isso agora.'),
    ]),
  ]),

  talk('t-email-register', 'work', 'B1', [
    say('Help. I need to write to my boss, but I\'m pissed off. How do I say that... professionally?', 'Socorro. Preciso escrever para o meu chefe, mas tô pistola. Como eu digo isso... profissionalmente?', 'angry'),
    choose('formal', ['g:register_formal', 'pissed_off'], [
      ok("Try: \"I'm a little frustrated with this situation.\"", say('Frustrated. Elegant. Passive-aggressive. Perfect.', 'Frustrado. Elegante. Passivo-agressivo. Perfeito.', 'happy')),
      no("Try: \"I'm so pissed off with you.\"", 'Informal e agressivo demais para um e-mail ao chefe.'),
      no("Try: \"I'm a little frustrate with this situation.\"", 'O adjetivo é "frustrated" (com -ed).'),
    ], 'Qual versão é adequada para um e-mail formal?'),
  ]),

  talk('t-weather-irony', 'smalltalk', 'A2', [
    say("Lovely weather today, isn't it? Rainy, windy and cold. My favorite.", 'Que tempo lindo hoje, né? Chuvoso, ventando e frio. Meu favorito.', 'tired'),
    ask('irony', ['rainy'], 'Does she really like the weather?', ["No, she's being ironic.", 'Yes, she loves rain.', 'She has no opinion.']),
    build('reply', ['g:register_informal', 'cozy'], 'At least it\'s cozy in here!', 'Pelo menos aqui dentro é aconchegante!', ['last', 'cozily', 'there']),
    say('True. I\'m never leaving. This is my house now.', 'Verdade. Nunca mais vou sair. Agora aqui é minha casa.', 'happy'),
  ]),

  talk('t-gym', 'life', 'A2+', [
    say('I used to go to the gym every day. Now I visit the gym\'s website. Same thing.', 'Eu ia na academia todo dia. Agora eu visito o site da academia. Dá no mesmo.', 'happy'),
    gap('usedto', ['g:used_to'], 'player', 'So you ', 'used to', ' be really fit?', 'Então você era bem em forma?', ['used to', 'use to', 'was used']),
    say('Fit? I used to run five kilometers. Now I run out of patience.', 'Em forma? Eu corria cinco quilômetros. Agora eu corro... da paciência.', 'happy'),
  ]),

  talk('t-plant-killer', 'home', 'A2', [
    say('I killed another plant. That\'s five this year. I even talked to them!', 'Matei mais uma planta. Já são cinco este ano. Eu até conversava com elas!', 'sad'),
    say('Maybe they didn\'t like my voice. Or the fact that I never watered them.', 'Talvez elas não gostassem da minha voz. Ou do fato de eu nunca regar.', 'thinking'),
    ask('reason', ['g:did_vs_was'], 'Why did the plants probably die?', ['He never watered them.', 'He talked too much.', 'The cat ate them.']),
    choose('reply', ['g:should_advice'], [
      ok('Maybe you should try a cactus. They love being ignored.', say('A plant that loves being ignored? That\'s my soulmate.', 'Uma planta que ama ser ignorada? É minha alma gêmea.', 'love')),
      no('Maybe you should to try a cactus.', 'Depois de "should" o verbo vem sem "to".'),
      no('Wow. You\'re a plant murderer.', 'Engraçado, mas pesado demais para quem está triste.'),
    ]),
  ]),

  talk('t-wedding-speech', 'family', 'A2+', [
    say('I gave a speech at my brother\'s wedding yesterday. Everybody cried.', 'Fiz um discurso no casamento do meu irmão ontem. Todo mundo chorou.', 'happy'),
    say('Not because it was beautiful. Because I forgot his wife\'s name.', 'Não porque foi lindo. Porque eu esqueci o nome da esposa dele.', 'embarrassed'),
    ask('forgot', ['g:irregular_past'], 'What did he forget?', ["his brother's wife's name", 'his speech', 'the rings']),
    gap('gave', ['g:irregular_past'], 'customer', 'I ', 'gave', ' a speech and then I wanted to disappear.', 'Fiz um discurso e depois quis sumir.', ['gave', 'gived', 'give']),
  ]),

  talk('t-allergic-rather', 'cats', 'A2+', [
    say("I'm allergic to cats. But I'd rather sneeze than leave. Look at that face!", 'Sou alérgica a gato. Mas prefiro espirrar a ir embora. Olha essa carinha!', 'love'),
    ask('rather', ['allergic', 'g:would_rather'], 'What would she rather do?', ['sneeze and stay', 'leave the café', 'take the cat home']),
    choose('reply', ['g:would_rather'], [
      ok('Would you rather sit a little farther from her?', say('No. I\'d rather suffer next to her.', 'Não. Prefiro sofrer do lado dela.', 'happy')),
      no('Would you rather to sit a little farther from her?', 'Depois de "would rather", o verbo vem sem "to".'),
      no('Then go home. Allergies are serious.', 'Ríspido; ela sabe o que está fazendo.'),
    ]),
  ]),

  talk('t-roommate', 'home', 'A2+', [
    say('My roommate eats my food. Every day. He says, "Sharing is caring."', 'Meu colega de casa come a minha comida. Todo dia. Ele diz: "Compartilhar é cuidar."', 'angry'),
    say("I didn't agree to share. We need boundaries. And a lock.", 'Eu não concordei em compartilhar. A gente precisa de limites. E de um cadeado.', 'angry'),
    write('advice', ['boundaries', 'g:should_advice'], 'Give him some advice about his roommate.', 'Dê um conselho sobre o colega de casa.', [['should', 'could', 'talk', 'tell', 'maybe', 'try', 'lock', 'label', 'rule']], [
      'You should talk to him and make some rules.',
      'Maybe you could put your name on your food.',
    ]),
  ]),

  talk('t-proposal', 'relationships', 'A2+', [
    say("I'm going to propose tonight! Should I do it here? With the cats watching?", 'Vou pedir em casamento hoje! Faço aqui? Com os gatos assistindo?', 'excited'),
    choose('reply', ['g:going_to'], [
      ok("That's so romantic! We're going to keep the cats calm. Probably.", say('Probably is good enough. Love is a risk.', 'Provavelmente já tá bom. Amor é um risco.', 'love')),
      no("That's so romantic! We're going keep the cats calm.", 'Falta o "to": "going TO keep".'),
      no('A proposal in a café? Kind of cheap, no?', 'Grosseiro com um momento importante.'),
    ]),
    ask('when', ['g:going_to'], 'When is he going to propose?', ['tonight', 'next year', 'never']),
  ]),

  talk('t-influencer', 'ordering', 'A2+', [
    say('Hi! Can you make my latte more... aesthetic? It\'s for my followers.', 'Oi! Dá pra deixar meu latte mais... estético? É pros meus seguidores.', 'happy'),
    say("Like, beige. But warm beige. Not sad beige.", 'Tipo, bege. Mas bege quentinho. Não bege triste.', 'thinking'),
    choose('reply', ['g:register_informal'], [
      ok("I'll do my best! Warm beige, coming right up.", say('You understand me. Finally.', 'Você me entende. Finalmente.', 'love')),
      no('A latte is a latte. Take it or leave it.', 'Ríspido e ainda perde a cliente.'),
      no("I'll do my better! Warm beige, coming right up.", 'A expressão é "I\'ll do my BEST".'),
    ]),
  ], true),

  talk('t-grandma-google', 'tech', 'A2+', [
    say('My grandson told me to "just Google it". Who is Google? Is he single?', 'Meu neto me disse para "só dar um Google". Quem é Google? Ele é solteiro?', 'thinking'),
    choose('ask', ['g:who_questions'], [
      ok('Haha! Who told you that? Your grandson?', say('Yes. He also told me to "touch grass". I have a garden!', 'Sim. Ele também me mandou "tocar na grama". Eu tenho um jardim!', 'angry')),
      no('Haha! Who did tell you that?', 'Quando o WHO fez a ação (quem contou), não use "did": "Who told you that?"'),
      no('Google is a website, obviously.', 'Correto, mas seco demais com uma senhora fofa.'),
    ]),
  ]),

  talk('t-keys', 'home', 'A2', [
    say('Did you see my keys? I put them... somewhere. On Earth, probably.', 'Você viu minhas chaves? Eu coloquei... em algum lugar. Na Terra, provavelmente.', 'worried'),
    gap('were', ['g:did_vs_was'], 'player', '', 'Were', ' they in your bag?', 'Elas estavam na sua bolsa?', ['Were', 'Did', 'Was']),
    say('No... wait. Yes. They were in my hand. The whole time.', 'Não... peraí. Sim. Estavam na minha mão. O tempo todo.', 'embarrassed'),
  ]),

  talk('t-vegan-two-days', 'food', 'A2+', [
    say("I've been vegan for two days. I feel like a better person. And very hungry.", 'Sou vegano há dois dias. Me sinto uma pessoa melhor. E com muita fome.', 'tired'),
    ask('feel', ['vegan', 'g:present_perfect'], 'How does he feel?', ['better, but very hungry', 'sick and tired', 'exactly the same']),
    choose('reply', ['vegan'], [
      ok("That's great! Do you want a fruit cup? It's vegan.", say("Yes. Two. I'm a growing vegan.", 'Sim. Dois. Sou um vegano em crescimento.', 'happy')),
      no('Two days? Let\'s see how long it lasts.', 'Irônico com quem está tentando; desanimador.'),
      no("That's great! Do you want a fruit cup? It is vegans.", '"Vegan" como adjetivo não vai para o plural: "it\'s vegan".'),
    ]),
  ]),

  talk('t-tourist', 'places', 'A2', [
    say('Excuse me, where is the train station? Is it far?', 'Com licença, onde fica a estação de trem? É longe?', 'worried'),
    choose('dir', ['g:prepositions_place', 'around_the_corner'], [
      ok("No, it's very close. It's around the corner, next to the bank.", say('Thank you! My map says it\'s in the ocean.', 'Obrigado! Meu mapa diz que fica no oceano.', 'happy')),
      no("No, it's very close. It's around of the corner.", 'A expressão é "around the corner" (sem "of").'),
      no('Google it.', 'Seco demais; ele pediu ajuda com educação.'),
    ]),
  ]),

  talk('t-backpack', 'life', 'A2+', [
    say('I carry my laptop, two chargers, snacks, a book, stuff like that. Every day.', 'Eu carrego meu notebook, dois carregadores, lanches, um livro, coisas do tipo. Todo dia.', 'tired'),
    say('My back hates me. On the other hand, I\'m ready for the apocalypse.', 'Minhas costas me odeiam. Por outro lado, estou pronto para o apocalipse.', 'happy'),
    ask('carry', ['carry', 'stuff_like_that'], 'What does he carry every day?', ['a laptop, chargers, snacks and a book', 'only his phone', 'a cat']),
    gap('hand', ['on_the_other_hand'], 'customer', 'On the other ', 'hand', ", I'm ready for anything.", 'Por outro lado, estou pronto para qualquer coisa.', ['hand', 'side', 'way']),
  ]),

  talk('t-nowadays', 'life', 'A2+', [
    say('Nowadays everybody looks at their phones. In my day, we looked at walls.', 'Hoje em dia todo mundo olha pro celular. Na minha época, a gente olhava pra parede.', 'thinking'),
    say('Beautiful walls. Very interesting walls.', 'Paredes lindas. Paredes muito interessantes.', 'happy'),
    choose('reply', ['nowadays', 'g:used_to'], [
      ok('Ha! What did you use to do for fun?', say('We used to play cards. And complain. Mostly complain.', 'A gente jogava cartas. E reclamava. Mais reclamava.', 'happy')),
      no('Ha! What did you used to do for fun?', 'Na pergunta com "did", é "use to" (sem -d).'),
      no('OK, boomer.', 'Desrespeitoso. Ele estava só brincando.'),
    ]),
  ]),
];
