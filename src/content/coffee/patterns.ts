// Padrões do dia a dia (lago): as estruturas que mais aparecem na fala, cada uma treinada em
// todas as formas, e chunks prontos ligados a elas. Ids "pf:" (família) e "pc:" (chunk) —
// não renomeie ids existentes (o SRS guarda o id).
//
// Cada família tem 4 níveis, um por raridade do peixe:
//  basic (comum) · negq (incomum: negativa e pergunta) · past (raro: passado / "have" + particípio)
//  say (lendário: situação em português → a frase natural em inglês)
// Drill = [frase com ___ ou "?pergunta", certa, errada, errada] (o mesmo formato das palavras-cola).
import type { Level } from './types';
import type { Drill } from './glue';

export type PatternTier = 'basic' | 'negq' | 'past' | 'say';
export type PatternChunk = { id: string; en: string; pt: string; example: string };
export type PatternFamily = {
  id: string;
  name: string;
  pt: string; // explicação curta
  forms: string[]; // as variações (o que aparece no álbum)
  level: Level;
  tiers: Record<PatternTier, Drill[]>;
  chunks: PatternChunk[];
};

export const TIER_INFO: Record<PatternTier, { pt: string }> = {
  basic: { pt: 'forma básica' },
  negq: { pt: 'negativa e pergunta' },
  past: { pt: 'passado e "have" + particípio' },
  say: { pt: 'o que você diria' },
};

const c = (id: string, en: string, pt: string, example: string): PatternChunk => ({ id: `pc:${id}`, en, pt, example });

// Ordem de liberação: as 4 primeiras já abertas; depois uma nova a cada PATTERN_EVERY_DAYS dias.
export const PATTERNS: PatternFamily[] = [
  {
    id: 'pf:there_be',
    name: 'there is / there are',
    pt: '"Tem / há". Singular: there is (there\'s). Plural: there are. Passado: there was / there were. Futuro: there will be / there\'s gonna be. Desde então: there has been.',
    forms: ['there is / there are', "there isn't / there aren't", 'Is there…? / Are there…?', 'there was / there were', 'there will be', 'there has been'],
    level: 'A2',
    tiers: {
      basic: [
        ['___ a cat in the garden.', "There's", 'There are', 'It has'],
        ['___ three fish in the bucket.', 'There are', "There's", 'Has'],
        ['___ some cake in the kitchen.', 'There is', 'There are', 'Have'],
      ],
      negq: [
        ['___ any milk left?', 'Is there', 'Are there', 'Has there'],
        ['___ any good cafés near here?', 'Are there', 'Is there', 'Have there'],
        ['There ___ any bait left. We need to buy some.', "isn't", "aren't", "don't"],
      ],
      past: [
        ['___ a lot of people at the party yesterday.', 'There were', 'There was', 'Had'],
        ['___ a strange noise last night.', 'There was', 'There were', 'It had'],
        ["___ a lot of rain this week.", 'There has been', 'There have been', 'There is being'],
      ],
      say: [
        ['?Você quer perguntar se tem banheiro por aqui.', 'Is there a bathroom around here?', 'Have a bathroom around here?', 'There is a bathroom around here?'],
        ['?Você quer avisar que amanhã vai ter uma festa.', "There's going to be a party tomorrow.", 'Will have a party tomorrow.', 'Tomorrow have a party.'],
        ['?Você conta que antigamente tinha uma padaria aqui.', 'There used to be a bakery here.', 'Here had a bakery.', 'There was used a bakery here.'],
      ],
    },
    chunks: [
      c('no_way', "There's no way…", 'De jeito nenhum… / Não tem como…', "There's no way I'm waking up at 5."),
      c('no_rush', "There's no rush.", 'Sem pressa.', "Take your time, there's no rush."),
      c('anything_i_can_do', 'Is there anything I can do?', 'Tem algo que eu possa fazer?', "You look stressed. Is there anything I can do?"),
    ],
  },
  {
    id: 'pf:should',
    name: 'should',
    pt: 'Conselho e o que é certo fazer: should + verbo (sem "to"). Negativa: shouldn\'t. Pergunta: Should I…? Arrependimento/crítica do passado: should have (should\'ve) + particípio.',
    forms: ['should + verbo', "shouldn't", 'Should I…?', "should have (should've) + particípio", "shouldn't have"],
    level: 'A2',
    tiers: {
      basic: [
        ['You ___ try the carrot cake.', 'should', 'should to', 'shoulds'],
        ['We should ___ the plants today.', 'water', 'to water', 'watering'],
        ["It's late. You ___ go to bed.", 'should', 'would', 'shall to'],
      ],
      negq: [
        ['You ___ drink coffee at night.', "shouldn't", "don't should", 'should not to'],
        ['___ I bring something?', 'Should', 'Do I should', 'Should I to'],
        ['What ___ I do?', 'should', 'do', 'am'],
      ],
      past: [
        ['You ___ told me! I would have helped.', "should've", 'should', 'should had'],
        ["I ___ eaten so much. I'm full.", "shouldn't have", "shouldn't", "didn't should"],
        ['We should have ___ earlier.', 'left', 'leave', 'leaving'],
      ],
      say: [
        ['?Você dá um conselho: “Você devia descansar um pouco.”', 'You should rest a bit.', 'You must to rest a bit.', 'You should to rest a bit.'],
        ['?Você ganhou um presente e diz, carinhoso: “Não precisava!”', "You shouldn't have!", "You didn't need!", 'Was not necessary!'],
        ['?Você se arrepende: “Eu devia ter estudado mais.”', 'I should have studied more.', 'I should studied more.', 'I must have to study more.'],
      ],
    },
    chunks: [
      c('shouldnt_have', "You shouldn't have!", 'Não precisava! (ao ganhar presente)', "Flowers? Oh, you shouldn't have!"),
      c('shouldve_told', "You should've told me.", 'Você devia ter me contado.', "You were sick? You should've told me."),
      c('what_should_i_do', 'What should I do?', 'O que eu faço?', "I missed the bus. What should I do?"),
    ],
  },
  {
    id: 'pf:could',
    name: 'could',
    pt: 'COULD: pedido educado (Could you…?), possibilidade (It could rain) e passado de can (I couldn\'t sleep). Could have + particípio = poderia ter (mas não aconteceu).',
    forms: ['Could you…?', 'could (possibilidade)', "couldn't (passado de can't)", 'could have + particípio', "couldn't have"],
    level: 'A2',
    tiers: {
      basic: [
        ['___ you pass me the sugar, please?', 'Could', 'Should', 'Will to'],
        ['Take a coat. It ___ get cold later.', 'could', 'can to', 'should to'],
        ['We could ___ to the lake later.', 'go', 'to go', 'going'],
      ],
      negq: [
        ['I ___ sleep last night. It was too hot.', "couldn't", "can't", "didn't could"],
        ['___ I ask you something?', 'Could', 'Do', 'Should to'],
        ["I ___ find my keys anywhere this morning.", "couldn't", "can't to", "wasn't can"],
      ],
      past: [
        ['You ___ called me! I was free.', 'could have', 'could', 'can have'],
        ["It ___ been worse. At least nobody got hurt.", 'could have', 'could', 'can'],
        ['I could have ___ you, but you didn\'t ask.', 'helped', 'help', 'helping'],
      ],
      say: [
        ['?Você pede um favor educado: “Você poderia me ajudar?”', 'Could you help me?', 'Can you to help me?', 'You could help me?'],
        ['?Você está morrendo de vontade de um café: “Bem que eu tomaria um café.”', 'I could use a coffee.', 'I could to drink a coffee.', 'I can use a coffee.'],
        ['?Alguém pergunta como você está e está tudo ótimo: “Não poderia estar melhor!”', "Couldn't be better!", "Can't be more good!", 'Could not better!'],
      ],
    },
    chunks: [
      c('could_use', 'I could use a…', 'Bem que eu precisava de um…', 'What a day. I could use a coffee.'),
      c('couldnt_be_better', "Couldn't be better!", 'Não poderia estar melhor!', "How are you? Couldn't be better!"),
      c('could_be_worse', 'Could be worse.', 'Podia ser pior.', 'It rained all day, but… could be worse.'),
    ],
  },
  {
    id: 'pf:would',
    name: 'would',
    pt: 'WOULD: pedido e oferta educados (Would you like…?), desejo (I\'d love to), hipótese (I would buy it if…). Would have + particípio = teria feito.',
    forms: ["would / 'd + verbo", 'Would you like…?', "I'd love to / I'd rather", "wouldn't", 'would have + particípio', 'Would you mind…?'],
    level: 'A2',
    tiers: {
      basic: [
        ['___ you like some tea?', 'Would', 'Do', 'Will to'],
        ["I'd ___ to come!", 'love', 'loving', 'to love'],
        ['If I had money, I ___ buy a boat.', 'would', 'will', 'am'],
      ],
      negq: [
        ['I ___ do that if I were you.', "wouldn't", "won't to", "don't would"],
        ['___ you mind closing the window?', 'Would', 'Do you', 'Will to'],
        ["Would you mind ___ me a hand?", 'giving', 'to give', 'give'],
      ],
      past: [
        ['I ___ come if you had invited me.', 'would have', 'would', 'will have'],
        ["She would have ___ it. It's her favorite.", 'loved', 'love', 'loving'],
        ["I ___ have guessed! You look so young.", "wouldn't", "won't", "didn't"],
      ],
      say: [
        ['?Você oferece educadamente: “Você gostaria de um café?”', 'Would you like a coffee?', 'Do you would like a coffee?', 'You like would a coffee?'],
        ['?Você pede algo bem educado: “Você se importaria de esperar um pouco?”', 'Would you mind waiting a bit?', 'Would you mind to wait a bit?', 'Do you mind wait a bit?'],
        ['?Aceitando um convite com entusiasmo: “Eu adoraria!”', "I'd love to!", 'I would love!', 'I will love it to!'],
      ],
    },
    chunks: [
      c('would_you_mind', 'Would you mind…?', 'Você se importaria de…?', 'Would you mind holding this for a second?'),
      c('id_love_to', "I'd love to!", 'Eu adoraria!', "Dinner on Friday? I'd love to!"),
      c('that_would_be_great', 'That would be great.', 'Seria ótimo.', 'You can pick me up? That would be great.'),
    ],
  },
  {
    id: 'pf:will',
    name: "will / I'll",
    pt: "WILL ('ll) para decidir na hora, prometer, oferecer e prever: I'll help, It'll be fine. Negativa: won't. Pergunta: Will you…? Depois de if/when o verbo fica no presente.",
    forms: ["will / 'll + verbo", "won't", 'Will you…?', "I'll (oferta na hora)", "it'll be…"],
    level: 'A2',
    tiers: {
      basic: [
        ['Wait, ___ help you with that.', "I'll", "I'm", "I'd to"],
        ["Don't worry, ___ be fine.", "it'll", "it's going", "it's"],
        ["I think it ___ rain tomorrow.", 'will', 'is', 'does'],
      ],
      negq: [
        ["I promise I ___ forget.", "won't", "don't", "willn't"],
        ['___ you marry me?', 'Will', 'Do', 'Are'],
        ["It ___ take long, I promise.", "won't", "doesn't", "isn't"],
      ],
      past: [
        ["I'll call you when I ___ home.", 'get', 'will get', 'got'],
        ["By next year, we ___ have saved enough.", 'will', 'are', 'do'],
        ['If it rains, ___ stay home.', "we'll", "we'd", 'we did'],
      ],
      say: [
        ['?O telefone toca e você diz: “Eu atendo!”', "I'll get it!", 'I get it!', 'I am getting it to!'],
        ['?Você vai sair rapidinho: “Já volto.”', "I'll be right back.", 'I come back already.', 'I am right back.'],
        ['?Respondendo a um pedido, rápido e informal: “Pode deixar!”', 'Will do!', 'Can leave!', 'I let it!'],
      ],
    },
    chunks: [
      c('be_right_back', "I'll be right back.", 'Já volto.', "Hold on, I'll be right back."),
      c('let_you_know', "I'll let you know.", 'Te aviso.', "I'm not sure yet. I'll let you know."),
      c('will_do', 'Will do!', 'Pode deixar!', '“Call me when you arrive.” — “Will do!”'),
    ],
  },
  {
    id: 'pf:have_to',
    name: 'have to',
    pt: 'HAVE TO = ter que (obrigação). Com he/she/it: has to. Negativa: don\'t have to = não precisa. Passado: had to. Futuro: will have to.',
    forms: ['have to / has to', "don't have to / doesn't have to", 'Do I have to…?', 'had to', 'will have to'],
    level: 'A2',
    tiers: {
      basic: [
        ['I ___ go now. See you!', 'have to', 'have', 'must to'],
        ['She ___ work on Saturdays.', 'has to', 'have to', 'has'],
        ['We have ___ wake up early tomorrow.', 'to', '∅', 'for'],
      ],
      negq: [
        ["You ___ come if you don't want to.", "don't have to", "haven't to", "mustn't to"],
        ['___ I have to pay now?', 'Do', 'Have', 'Am'],
        ["She ___ have to work today. It's a holiday.", "doesn't", "don't", "hasn't"],
      ],
      past: [
        ['I ___ wait an hour for the bus yesterday.', 'had to', 'have to', 'must'],
        ['Did you ___ pay for parking?', 'have to', 'had to', 'has to'],
        ["We'll ___ wait and see.", 'have to', 'had to', 'must to'],
      ],
      say: [
        ['?Você precisa ir embora: “Tenho que ir.”', 'I have to go.', 'I have go.', 'I must to go.'],
        ['?Você tranquiliza alguém: “Você não precisa fazer isso.”', "You don't have to do that.", "You haven't to do that.", "You must not to do that."],
        ['?Contando de ontem: “Eu tive que trabalhar até tarde.”', 'I had to work late.', 'I have to worked late.', 'I must worked late.'],
      ],
    },
    chunks: [
      c('i_have_to_go', 'I have to go.', 'Tenho que ir.', "Sorry, I have to go. Talk later!"),
      c('you_dont_have_to', "You don't have to.", 'Não precisa.', "You don't have to pay me back."),
      c('wait_and_see', "We'll have to wait and see.", 'Vamos ter que esperar para ver.', "Will it work? We'll have to wait and see."),
    ],
  },
  {
    id: 'pf:going_to',
    name: 'going to',
    pt: 'BE GOING TO (gonna) = planos e previsões com sinais: "I\'m going to visit my mom", "It\'s going to rain". Passado: was going to = ia (mas não fiz).',
    forms: ['am / is / are going to', "isn't going to", 'Are you going to…?', 'was / were going to', 'gonna (falado)'],
    level: 'A2',
    tiers: {
      basic: [
        ["I'm going ___ visit my mom on Sunday.", 'to', '∅', 'for'],
        ['Look at those clouds. ___ going to rain.', "It's", 'It will', 'It does'],
        ['We ___ going to plant tomatoes.', 'are', 'is', 'will'],
      ],
      negq: [
        ['What ___ you going to do this weekend?', 'are', 'do', 'will'],
        ["She ___ going to come. She's sick.", "isn't", "doesn't", "won't"],
        ['___ he going to call you?', 'Is', 'Does', 'Will'],
      ],
      past: [
        ['I ___ going to call you, but I forgot.', 'was', 'am', 'did'],
        ['We were going to ___ to the lake, but it rained.', 'go', 'went', 'going'],
        ['They ___ going to move, but they changed their minds.', 'were', 'was', 'did'],
      ],
      say: [
        ['?Você conta um plano: “Eu vou começar a academia na segunda.”', "I'm going to start the gym on Monday.", 'I go to start the gym on Monday.', 'I will to start the gym on Monday.'],
        ['?Você tranquiliza: “Vai dar tudo certo.”', "It's going to be fine.", 'Is going to be fine.', 'Will to be fine.'],
        ['?Alguém disse exatamente o que você ia dizer: “Eu ia falar isso!”', 'I was going to say that!', 'I go to say that!', 'I was going say that!'],
      ],
    },
    chunks: [
      c('gonna_be_fine', "It's gonna be fine.", 'Vai ficar tudo bem.', "Don't worry, it's gonna be fine."),
      c('was_going_to_say', 'I was going to say that!', 'Eu ia falar isso!', '“Pizza tonight?” — “I was going to say that!”'),
      c('what_are_you_gonna_do', 'What are you gonna do?', 'O que você vai fazer? / Fazer o quê?', 'It rained on the picnic. Oh well, what are you gonna do?'),
    ],
  },
  {
    id: 'pf:used_to',
    name: 'used to',
    pt: 'USED TO + verbo = costumava (hábito que acabou). Negativa e pergunta perdem o -d: didn\'t use to, Did you use to…? Cuidado: BE USED TO + -ing = estar acostumado.',
    forms: ['used to + verbo', "didn't use to", 'Did you use to…?', 'there used to be', 'be used to + -ing (acostumado)'],
    level: 'A2+',
    tiers: {
      basic: [
        ['I ___ live near the beach.', 'used to', 'use to', 'was used'],
        ['We used ___ play video games every night.', 'to', '∅', 'for'],
        ['She used to ___ coffee, but now she drinks tea.', 'drink', 'drinking', 'drank'],
      ],
      negq: [
        ["I ___ like vegetables, but now I love them.", "didn't use to", "didn't used to", "wasn't use to"],
        ['___ you use to have a pet?', 'Did', 'Were', 'Used'],
        ['Where did you ___ to live?', 'use', 'used', 'using'],
      ],
      past: [
        ['There ___ be a bakery on this corner.', 'used to', 'use to', 'was used'],
        ["I'm ___ waking up early now.", 'used to', 'use to', 'using to'],
        ["It's hard, but you'll get used to ___.", 'it', 'do it', 'doing'],
      ],
      say: [
        ['?Você conta de quando era criança: “Eu costumava ter medo do escuro.”', 'I used to be afraid of the dark.', 'I use to be afraid of the dark.', 'I was used to be afraid of the dark.'],
        ['?Sobre um barulho que já não te incomoda: “Eu já me acostumei.”', "I'm used to it.", 'I used to it.', 'I am use to it.'],
        ['?Você conta que as coisas eram diferentes: “As coisas costumavam ser mais simples.”', 'Things used to be simpler.', 'Things use to be simpler.', 'Things were used to be simpler.'],
      ],
    },
    chunks: [
      c('im_used_to_it', "I'm used to it.", 'Já estou acostumado(a).', "The noise? Don't worry, I'm used to it."),
      c('used_to_love', 'I used to love…', 'Eu amava… (antigamente)', 'I used to love this song when I was a kid.'),
      c('get_used_to', "You'll get used to it.", 'Você vai se acostumar.', "The cold is hard at first, but you'll get used to it."),
    ],
  },
  {
    id: 'pf:have_ever',
    name: 'Have you ever…?',
    pt: 'HAVE YOU EVER + particípio = você já…? (experiência, sem dizer quando). Resposta: Yes, I have / No, I\'ve never… Com data, use o passado: "I went there in 2019."',
    forms: ['Have you ever + particípio?', "I've never…", "I've … once / twice", 'Yes, I have / No, I haven\'t', 'Has she ever…?'],
    level: 'A2+',
    tiers: {
      basic: [
        ['Have you ever ___ sushi?', 'tried', 'try', 'trying'],
        ["I've ___ been to Japan.", 'never', 'ever', 'not'],
        ['___ you ever seen a golden fish?', 'Have', 'Did', 'Are'],
      ],
      negq: [
        ['“Have you ever been to Paris?” — “No, I ___.”', "haven't", "didn't", "don't"],
        ['___ she ever cooked for you?', 'Has', 'Have', 'Did'],
        ["I've never ___ a horse.", 'ridden', 'rode', 'ride'],
      ],
      past: [
        ["I've been there twice. The first time, I ___ there in 2019.", 'went', 'have gone', 'go'],
        ['Have you ever ___ a mistake at work?', 'made', 'make', 'did'],
        ["She has ___ seen snow. She's from Bahia!", 'never', 'ever', 'already never'],
      ],
      say: [
        ['?Você quer saber se a pessoa já foi ao Canadá.', 'Have you ever been to Canada?', 'Did you ever go Canada?', 'Have you ever gone in Canada?'],
        ['?Você conta: “Eu nunca vi isso antes.”', "I've never seen that before.", 'I never saw that before never.', "I haven't never seen that before."],
        ['?Respondendo “Ainda não.” para “Você já experimentou o bolo?”', 'Not yet.', 'Still no.', 'Yet not.'],
      ],
    },
    chunks: [
      c('have_you_ever_tried', 'Have you ever tried…?', 'Você já experimentou…?', 'Have you ever tried coffee with cinnamon?'),
      c('ive_never_been', "I've never been there.", 'Nunca fui lá.', "Lisbon? I've never been there."),
      c('not_yet', 'Not yet.', 'Ainda não.', '“Did you finish the book?” — “Not yet.”'),
    ],
  },
  {
    id: 'pf:been_ing',
    name: "I've been + -ing",
    pt: "HAVE BEEN + -ing = algo que vem acontecendo até agora (e talvez continue): \"I've been working all day\", \"How long have you been waiting?\"",
    forms: ["I've been + -ing", 'How long have you been…?', "I haven't been…", 'How have you been?', "I've been meaning to…"],
    level: 'B1',
    tiers: {
      basic: [
        ["I've ___ working all day.", 'been', 'being', 'be'],
        ["We've been ___ for an hour!", 'waiting', 'waited', 'wait'],
        ["She's been ___ English for two years.", 'learning', 'learn', 'learned'],
      ],
      negq: [
        ['How long have you been ___ here?', 'waiting', 'wait', 'waited'],
        ["I ___ been sleeping well lately.", "haven't", "didn't", "don't"],
        ['___ you been crying?', 'Have', 'Did', 'Are'],
      ],
      past: [
        ["I've been ___ to call you all week!", 'meaning', 'mean', 'meant'],
        ["It's been raining ___ Monday.", 'since', 'for', 'from'],
        ["They've been dating ___ three years.", 'for', 'since', 'during'],
      ],
      say: [
        ['?Encontrando alguém depois de um tempo: “Como você tem andado?”', 'How have you been?', 'How are you being?', 'How you have been?'],
        ['?Você explica o cansaço: “Eu estive trabalhando muito.”', "I've been working a lot.", "I'm working a lot since.", 'I have work a lot.'],
        ['?Você confessa: “Faz tempo que eu quero te perguntar isso.”', "I've been meaning to ask you that.", 'I want to ask you this since time.', "I'm meaning to ask you since long."],
      ],
    },
    chunks: [
      c('how_have_you_been', 'How have you been?', 'Como você tem andado?', "Hey! Long time no see. How have you been?"),
      c('been_meaning_to', "I've been meaning to…", 'Faz tempo que eu quero…', "I've been meaning to call you!"),
      c('been_thinking', "I've been thinking…", 'Eu estive pensando…', "I've been thinking… what if we got a dog?"),
    ],
  },
  {
    id: 'pf:might',
    name: 'might / may',
    pt: 'MIGHT (ou may) = talvez, pode ser que: "I might be late." Sem "to" depois. Might have + particípio = talvez tenha… "You might want to…" é um conselho educado.',
    forms: ['might / may + verbo', "might not", 'might have + particípio', 'You might want to…', 'May I…? (pedido formal)'],
    level: 'A2+',
    tiers: {
      basic: [
        ['Take an umbrella. It ___ rain.', 'might', 'might to', 'mights'],
        ['I might ___ late tonight.', 'be', 'to be', 'being'],
        ['We ___ go fishing later, I\'m not sure.', 'might', 'must', 'should to'],
      ],
      negq: [
        ['She ___ come. She looked tired.', "might not", "mightn't to", "don't might"],
        ['___ I come in?', 'May', 'Might to', 'Do'],
        ["I might ___ have time tomorrow.", 'not', "don't", 'no'],
      ],
      past: [
        ["I can't find my keys. I might have ___ them at the café.", 'left', 'leave', 'leaving'],
        ['She ___ have forgotten. Call her.', 'might', 'might to', 'mights'],
        ["He might have ___ the bus.", 'missed', 'miss', 'missing'],
      ],
      say: [
        ['?Você avisa: “Talvez eu me atrase.”', 'I might be late.', 'Maybe I might to be late.', 'I may to be late.'],
        ['?Conselho educado: “Talvez seja bom você levar um casaco.”', 'You might want to bring a coat.', 'You might to want bring a coat.', 'You want might bring a coat.'],
        ['?Sem certeza: “Pode ser que chova mais tarde.”', 'It might rain later.', 'It might to rain later.', 'Can be that rain later.'],
      ],
    },
    chunks: [
      c('might_be_late', 'I might be late.', 'Talvez eu me atrase.', "Start without me, I might be late."),
      c('might_want_to', 'You might want to…', 'Talvez seja bom você…', 'You might want to check the weather first.'),
      c('might_as_well', 'We might as well…', 'Já que é assim, vamos…', "The bus is late. We might as well walk."),
    ],
  },
  {
    id: 'pf:feel_like',
    name: 'feel like',
    pt: 'FEEL LIKE + -ing (ou coisa) = estar a fim de: "I feel like dancing", "I feel like a coffee". Negativa: I don\'t feel like it. Também: I feel like (that)… = sinto que…',
    forms: ['feel like + -ing', 'feel like + coisa', "don't feel like it", 'Do you feel like…?', 'I feel like (sinto que)…'],
    level: 'A2+',
    tiers: {
      basic: [
        ['I feel like ___ pizza tonight.', 'having', 'to have', 'have'],
        ['I feel ___ a coffee.', 'like', 'as', 'for'],
        ['She feels like ___ a walk.', 'taking', 'take', 'to take'],
      ],
      negq: [
        ["I don't feel like ___ out today.", 'going', 'go', 'to go'],
        ['Do you feel like ___ a movie?', 'watching', 'watch', 'to watch'],
        ['“Want to go?” — “Nah, I don\'t feel like ___.”', 'it', 'that to', 'going it'],
      ],
      past: [
        ['I felt like ___ all day yesterday.', 'sleeping', 'sleep', 'slept'],
        ["I didn't feel like ___ anything.", 'eating', 'eat', 'ate'],
        ['I feel like ___ you before. Have we met?', "I've seen", "I've see", 'I seen'],
      ],
      say: [
        ['?Você está com vontade: “Tô a fim de um sorvete.”', 'I feel like an ice cream.', 'I am in the mood of ice cream to.', 'I feel to ice cream.'],
        ['?Sem vontade nenhuma: “Não tô a fim.”', "I don't feel like it.", "I don't feel it.", "I'm not feel like."],
        ['?Você sente que algo vai dar certo: “Sinto que hoje vai ser um bom dia.”', "I feel like today's going to be a good day.", 'I feel like to today be good day.', 'I am feeling that today good day.'],
      ],
    },
    chunks: [
      c('dont_feel_like_it', "I don't feel like it.", 'Não tô a fim.', "Cook tonight? I don't feel like it."),
      c('feel_free', 'Feel free to…', 'Fique à vontade para…', 'Feel free to take a cookie.'),
      c('feel_like_a', 'I feel like a…', 'Tô a fim de um…', 'I feel like a hot chocolate.'),
    ],
  },
  {
    id: 'pf:about_to',
    name: 'be about to',
    pt: 'BE ABOUT TO + verbo = estar prestes a: "The movie is about to start." Passado: I was about to call you = eu ia te ligar agorinha.',
    forms: ['am / is / are about to', 'was / were about to', 'Are you about to…?', 'just about to'],
    level: 'A2+',
    tiers: {
      basic: [
        ["Hurry! The movie is about ___ start.", 'to', '∅', 'for'],
        ["We're about to ___. Want to come?", 'leave', 'leaving', 'left'],
        ['The fish ___ about to bite!', 'is', 'does', 'has'],
      ],
      negq: [
        ['___ you about to go out?', 'Are', 'Do', 'Will'],
        ["I'm not about ___ give up now!", 'to', 'for', '∅'],
        ['Is it about to ___?', 'rain', 'raining', 'rained'],
      ],
      past: [
        ['I ___ about to call you!', 'was', 'am', 'did'],
        ['We were about to ___ when you arrived.', 'eat', 'eating', 'ate'],
        ['She was just ___ to leave.', 'about', 'going about', 'near'],
      ],
      say: [
        ['?A pessoa te liga bem na hora: “Eu ia te ligar agorinha!”', 'I was about to call you!', 'I was going call you now!', 'I am about calling you!'],
        ['?Você avisa: “Tá quase começando!”', "It's about to start!", 'Is almost to start!', "It's about starting!"],
        ['?Você está saindo: “A gente tá prestes a sair.”', "We're about to leave.", 'We about to leave.', "We're about leaving to."],
      ],
    },
    chunks: [
      c('was_about_to_call', 'I was about to call you!', 'Eu ia te ligar agorinha!', "Oh, hi! I was about to call you!"),
      c('about_to_start', "It's about to start!", 'Tá quase começando!', 'Come sit down, it\'s about to start!'),
      c('about_to_leave', "We're about to leave.", 'A gente tá saindo.', "We're about to leave. Need a ride?"),
    ],
  },
  {
    id: 'pf:lets',
    name: "let's / how about / why don't we",
    pt: "Para sugerir: LET'S + verbo (Let's go!). HOW ABOUT + -ing ou coisa (How about a coffee?). WHY DON'T WE + verbo (Why don't we stay in?). Negativa: let's not.",
    forms: ["let's + verbo", "let's not", 'How about + -ing / coisa?', "Why don't we…?", 'Shall we…?'],
    level: 'A2',
    tiers: {
      basic: [
        ["___ go to the lake!", "Let's", 'Lets to', 'We let'],
        ["Let's ___ a break.", 'take', 'to take', 'taking'],
        ['How about ___ pizza tonight?', 'having', 'have', 'to have'],
      ],
      negq: [
        ["Let's ___ argue about it.", 'not', "don't", 'no'],
        ["Why ___ we stay in tonight?", "don't", "doesn't", "not"],
        ['___ about a coffee?', 'How', 'What for', 'Why'],
      ],
      past: [
        ['“Why don\'t we watch a movie?” — “Good idea, ___ do it.”', "let's", 'we let', 'lets to'],
        ['___ we go? It\'s getting late.', 'Shall', 'Will to', 'Do'],
        ['How about ___ the plants first?', 'watering', 'water', 'to water'],
      ],
      say: [
        ['?Você sugere: “Vamos pedir comida?”', "Let's order some food.", 'Lets to order some food.', 'We go order some food?'],
        ['?Você propõe: “Que tal a gente ficar em casa hoje?”', "Why don't we stay home tonight?", "Why we don't stay home tonight?", 'Why not we stay home tonight?'],
        ['?Você oferece uma ideia: “E que tal um café?”', 'How about a coffee?', 'How about to drink a coffee?', 'What about drink coffee?'],
      ],
    },
    chunks: [
      c('lets_go', "Let's go!", 'Vamos!', "Ready? Let's go!"),
      c('how_about', 'How about…?', 'Que tal…?', "How about Friday at 7?"),
      c('why_dont_we', "Why don't we…?", 'Por que a gente não…?', "Why don't we try the new café?"),
    ],
  },
  {
    id: 'pf:wondering',
    name: 'I was wondering if…',
    pt: 'I WAS WONDERING IF + you could… = o pedido mais educado e natural. I WONDER + why/if/what = eu me pergunto…',
    forms: ['I was wondering if you could…', 'I wonder if / why / what…', 'Just wondering.', "I'm wondering whether…"],
    level: 'B1',
    tiers: {
      basic: [
        ['I was wondering ___ you could help me.', 'if', 'that', 'what'],
        ['I wonder ___ she is so quiet today.', 'why', 'that', 'because'],
        ['I was ___ if you were free tonight.', 'wondering', 'wonder', 'wondered to'],
      ],
      negq: [
        ['I wonder if they ___ coming.', 'are', 'do', 'will to'],
        ['I was wondering if you ___ lend me your umbrella.', 'could', 'can to', 'would to'],
        ["I wonder what ___ for dinner.", "we're having", 'are we having', 'have we'],
      ],
      past: [
        ['I was wondering if you ___ the email I sent.', 'got', 'get', 'getting'],
        ['I always wondered what ___ like to live by the sea.', 'it was', 'was it', 'it'],
        ['She was wondering ___ to call you or not.', 'whether', 'that', 'what'],
      ],
      say: [
        ['?Pedido bem educado: “Eu queria saber se você poderia me ajudar.”', 'I was wondering if you could help me.', 'I was wondering you can help me.', 'I wonder you could to help me.'],
        ['?Perguntaram “Por quê?” e era só curiosidade: “Só curiosidade.”', 'Just wondering.', 'Only curious thing.', 'Just wonder.'],
        ['?Você se pergunta em voz alta: “Será que ela gostou?”', 'I wonder if she liked it.', 'I wonder did she liked it.', 'Will be that she liked?'],
      ],
    },
    chunks: [
      c('was_wondering_if', 'I was wondering if you could…', 'Eu queria saber se você poderia…', 'I was wondering if you could give me a ride.'),
      c('just_wondering', 'Just wondering.', 'Só curiosidade.', '“Why do you ask?” — “Just wondering.”'),
      c('i_wonder_why', 'I wonder why…', 'Eu me pergunto por que…', 'I wonder why Mucego loves strawberries so much.'),
    ],
  },
  {
    id: 'pf:depends',
    name: 'it depends / up to you',
    pt: 'IT DEPENDS ON + coisa = depende de (on, não "of"!). IT\'S UP TO YOU = você decide. Úteis para responder sem travar quando não há resposta certa.',
    forms: ['It depends.', 'It depends on…', "It's up to you.", 'Whatever you want.', "I don't mind."],
    level: 'A2',
    tiers: {
      basic: [
        ['It depends ___ the weather.', 'on', 'of', 'from'],
        ["“Where should we go?” — “It's up ___ you.”", 'to', 'for', 'on'],
        ['It ___ on how much it costs.', 'depends', 'depend', 'is depend'],
      ],
      negq: [
        ["“Tea or coffee?” — “I don't ___. Either is fine.”", 'mind', 'care to', 'matter'],
        ['What does it depend ___?', 'on', 'of', 'from'],
        ["It doesn't ___ on me.", 'depend', 'depends', 'depending'],
      ],
      past: [
        ['It depended ___ the price.', 'on', 'of', 'in'],
        ["It was up ___ her, so she chose the lake.", 'to', 'for', 'on'],
        ["It'll depend ___ how you feel tomorrow.", 'on', 'of', 'at'],
      ],
      say: [
        ['?“Você gosta de filme de terror?” e a resposta não é simples: “Depende.”', 'It depends.', 'Depends of.', 'Is depend.'],
        ['?Você deixa a pessoa escolher: “Você que sabe.”', "It's up to you.", 'Is with you.', 'You that know.'],
        ['?“Depende do preço.”', 'It depends on the price.', 'It depends of the price.', 'Depends the price.'],
      ],
    },
    chunks: [
      c('it_depends', 'It depends.', 'Depende.', '“Is it far?” — “It depends. By car, no.”'),
      c('up_to_you', "It's up to you.", 'Você que sabe.', "Pizza or sushi? It's up to you."),
      c('i_dont_mind', "I don't mind.", 'Tanto faz para mim. / Não me importo.', "“Window or aisle?” — “I don't mind.”"),
    ],
  },
];

export const PATTERN_BY_ID: Record<string, PatternFamily> = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
export const PATTERN_CHUNKS: PatternChunk[] = PATTERNS.flatMap((p) => p.chunks);
export const PATTERN_CHUNK_BY_ID: Record<string, PatternChunk> = Object.fromEntries(PATTERN_CHUNKS.map((c) => [c.id, c]));
