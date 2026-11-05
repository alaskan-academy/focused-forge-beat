// Chunks: blocos prontos que nativos usam inteiros ("I'm on my way", "It's up to you").
// Um chunk novo a cada 12 h (na ordem desta lista), com quando usar, exemplos e um exercício.
// Os chunks viram itens do SRS (ids com prefixo "c:") e voltam na revisão e nas conversas.
import type { Activity, Level, Step } from './types';
import { build, choose, gap, no, ok } from './dsl';

export type Chunk = {
  id: string; // "c:..."
  en: string; // como aparece nas frases (sem diferenciar maiúsculas)
  pt: string;
  when_pt: string; // quando usar
  examples: { en: string; pt: string }[];
  level: Level;
  exercise: Activity;
};

const ex = (s: Step) => (s as { activity: Activity }).activity;

export const CHUNKS: Chunk[] = [
  {
    id: 'c:on_my_way',
    en: "I'm on my way",
    pt: 'Tô a caminho',
    when_pt: 'Quando alguém pergunta onde você está, ou para avisar que já saiu.',
    level: 'A2',
    examples: [
      { en: "Sorry, I'm on my way! Five minutes.", pt: 'Desculpa, tô a caminho! Cinco minutos.' },
      { en: "I'm on my way to the café. Want anything?", pt: 'Tô indo pro café. Quer alguma coisa?' },
    ],
    exercise: ex(build('ex', ['c:on_my_way'], "Don't worry, I'm on my way!", 'Não se preocupa, tô a caminho!', ['in', 'going', 'road'])),
  },
  {
    id: 'c:up_to_you',
    en: "it's up to you",
    pt: 'você que sabe / você decide',
    when_pt: 'Para deixar a decisão com a outra pessoa, sem parecer que não liga.',
    level: 'A2',
    examples: [
      { en: "Pizza or sushi? It's up to you.", pt: 'Pizza ou sushi? Você que sabe.' },
      { en: "It's up to you, but I'd go for the latte.", pt: 'Você decide, mas eu iria de latte.' },
    ],
    exercise: ex(gap('ex', ['c:up_to_you'], 'player', "Cats or dogs? It's ", 'up to', ' you.', 'Gatos ou cachorros? Você que sabe.', ['up to', 'on to', 'to up'])),
  },
  {
    id: 'c:no_big_deal',
    en: 'no big deal',
    pt: 'nada de mais / tranquilo',
    when_pt: 'Quando alguém pede desculpas por algo pequeno, ou para minimizar um problema.',
    level: 'A2',
    examples: [
      { en: 'You spilled coffee? No big deal.', pt: 'Você derramou café? Nada de mais.' },
      { en: "It's no big deal, I can make another one.", pt: 'Tranquilo, eu faço outro.' },
    ],
    exercise: ex(
      choose('ex', ['c:no_big_deal'], [
        ok("No big deal! I'll get you a new one."),
        no('No big problem! I get you a new one.', 'O chunk é fixo: "no big DEAL". E "I\'ll get" (vou pegar) em vez de "I get".'),
        no("That's a big deal. You should be more careful.", 'Gramática certa, mas transforma algo pequeno num drama.'),
      ], 'O cliente derrubou a xícara e pede desculpas. Responda:'),
    ),
  },
  {
    id: 'c:running_late',
    en: "I'm running late",
    pt: 'Tô atrasado(a)',
    when_pt: 'Para avisar que vai chegar atrasado. Mais natural que "I am late" antes de chegar.',
    level: 'A2',
    examples: [
      { en: "I'm running late, start without me!", pt: 'Tô atrasado, comecem sem mim!' },
      { en: "Sorry, I'm running a bit late today.", pt: 'Desculpa, tô um pouco atrasado hoje.' },
    ],
    exercise: ex(gap('ex', ['c:running_late'], 'customer', "Can you make it fast? I'm ", 'running', ' late for work.', 'Pode fazer rápido? Tô atrasado pro trabalho.', ['running', 'walking', 'being'])),
  },
  {
    id: 'c:let_you_know',
    en: "I'll let you know",
    pt: 'Te aviso',
    when_pt: 'Quando você ainda não sabe a resposta e promete avisar depois.',
    level: 'A2',
    examples: [
      { en: "I'm not sure yet. I'll let you know tomorrow.", pt: 'Ainda não sei. Te aviso amanhã.' },
      { en: "I'll let you know when it's ready.", pt: 'Te aviso quando estiver pronto.' },
    ],
    exercise: ex(build('ex', ['c:let_you_know', 'g:will_offers'], "I'll let you know when it's ready.", 'Te aviso quando estiver pronto.', ['say', 'knows', 'tell'])),
  },
  {
    id: 'c:make_yourself_at_home',
    en: 'make yourself at home',
    pt: 'fique à vontade',
    when_pt: 'Para receber alguém na sua casa (ou no seu café!) de um jeito acolhedor.',
    level: 'A2+',
    examples: [
      { en: "Come in, make yourself at home!", pt: 'Entra, fica à vontade!' },
      { en: 'Make yourself at home. The cat bites, though.', pt: 'Fique à vontade. Mas o gato morde.' },
    ],
    exercise: ex(gap('ex', ['c:make_yourself_at_home'], 'player', 'Welcome! Make yourself at ', 'home', '.', 'Bem-vindo! Fique à vontade.', ['home', 'house', 'comfort'])),
  },
  {
    id: 'c:sounds_good',
    en: 'sounds good',
    pt: 'beleza / fechado',
    when_pt: 'Para concordar com um plano de forma leve e natural.',
    level: 'A2',
    examples: [
      { en: 'Coffee at five? Sounds good!', pt: 'Café às cinco? Fechado!' },
      { en: 'Sounds good to me.', pt: 'Pra mim tá ótimo.' },
    ],
    exercise: ex(
      choose('ex', ['c:sounds_good'], [
        ok('Sounds good! See you there.'),
        no('Sounds well! See you there.', 'O chunk é "sounds GOOD" (adjetivo depois de "sound").'),
        no('It sounds a good. See you there.', 'Sem artigo: "it sounds good".'),
      ], 'Um amigo propõe: "Lunch at noon?" Responda:'),
    ),
  },
  {
    id: 'c:to_be_honest',
    en: 'to be honest',
    pt: 'sinceramente / pra ser sincero',
    when_pt: 'Antes de dar uma opinião sincera (às vezes um pouco desagradável).',
    level: 'A2',
    examples: [
      { en: "To be honest, I don't like decaf.", pt: 'Sinceramente, não gosto de descafeinado.' },
      { en: 'To be honest, I forgot.', pt: 'Pra ser sincero, eu esqueci.' },
    ],
    exercise: ex(gap('ex', ['c:to_be_honest'], 'customer', 'To be ', 'honest', ', this is the best latte in town.', 'Sinceramente, esse é o melhor latte da cidade.', ['honest', 'honesty', 'honestly'])),
  },
  {
    id: 'c:call_it_a_day',
    en: "let's call it a day",
    pt: 'vamos encerrar por hoje',
    when_pt: 'Para parar de trabalhar/estudar depois de um bom tempo.',
    level: 'A2+',
    examples: [
      { en: "It's late. Let's call it a day.", pt: 'Tá tarde. Vamos encerrar por hoje.' },
      { en: 'Great work, team. Let\'s call it a day!', pt: 'Ótimo trabalho, equipe. Vamos encerrar por hoje!' },
    ],
    exercise: ex(build('ex', ['c:call_it_a_day'], "We're tired. Let's call it a day.", 'Estamos cansados. Vamos encerrar por hoje.', ['night', 'calling', 'days'])),
  },
  {
    id: 'c:not_in_the_mood',
    en: "I'm not in the mood",
    pt: 'Não tô no clima / não tô a fim',
    when_pt: 'Para recusar algo sem dar muita explicação.',
    level: 'A2',
    examples: [
      { en: "I'm not in the mood for a party tonight.", pt: 'Não tô a fim de festa hoje.' },
      { en: "Sorry, I'm not in the mood to talk.", pt: 'Desculpa, não tô no clima pra conversar.' },
    ],
    exercise: ex(gap('ex', ['c:not_in_the_mood'], 'customer', "No cake today. I'm not in the ", 'mood', ' for sweets.', 'Sem bolo hoje. Não tô a fim de doce.', ['mood', 'mode', 'humor'])),
  },
  {
    id: 'c:its_on_me',
    en: "it's on me",
    pt: 'é por minha conta / eu pago',
    when_pt: 'Para oferecer pagar algo para alguém.',
    level: 'A2',
    examples: [
      { en: "Put your wallet away. It's on me.", pt: 'Guarda a carteira. É por minha conta.' },
      { en: "Next coffee is on me!", pt: 'O próximo café é por minha conta!' },
    ],
    exercise: ex(
      choose('ex', ['c:its_on_me'], [
        ok("No, no, it's on me today!"),
        no("No, no, it's in me today!", 'A preposição é "ON": "it\'s on me".'),
        no("No, no, it's for me today!", '"For me" seria "é pra mim", o oposto do que você quer dizer.'),
      ], 'Você quer pagar o café da sua amiga. Diga:'),
    ),
  },
  {
    id: 'c:take_your_time',
    en: 'take your time',
    pt: 'sem pressa / com calma',
    when_pt: 'Para tranquilizar alguém que está demorando ou nervoso.',
    level: 'A2',
    examples: [
      { en: 'Take your time, no rush.', pt: 'Com calma, sem pressa.' },
      { en: "Take your time choosing. I'll be here.", pt: 'Escolha com calma. Vou estar aqui.' },
    ],
    exercise: ex(build('ex', ['c:take_your_time'], "Take your time, I'm not in a hurry.", 'Com calma, não tô com pressa.', ['times', 'took', 'hurried'])),
  },
  {
    id: 'c:never_mind',
    en: 'never mind',
    pt: 'deixa pra lá',
    when_pt: 'Para desistir do que ia dizer ou dizer que não importa mais.',
    level: 'A2',
    examples: [
      { en: 'Oh, never mind, I found my keys.', pt: 'Ah, deixa pra lá, achei minhas chaves.' },
      { en: "Never mind, it's not important.", pt: 'Deixa pra lá, não é importante.' },
    ],
    exercise: ex(gap('ex', ['c:never_mind'], 'customer', 'Do you have sugar? Oh, never ', 'mind', ', I found it.', 'Tem açúcar? Ah, deixa pra lá, achei.', ['mind', 'mine', 'matter'])),
  },
  {
    id: 'c:what_do_you_mean',
    en: 'what do you mean',
    pt: 'como assim?',
    when_pt: 'Quando você não entendeu ou ficou surpreso com o que a pessoa disse.',
    level: 'A2',
    examples: [
      { en: "What do you mean, there's no coffee?!", pt: 'Como assim não tem café?!' },
      { en: 'Sorry, what do you mean by that?', pt: 'Desculpa, o que você quer dizer com isso?' },
    ],
    exercise: ex(
      choose('ex', ['c:what_do_you_mean'], [
        ok('What do you mean, the cat ate my muffin?'),
        no('What you mean, the cat ate my muffin?', 'Falta o "do": "What DO you mean…?"'),
        no('What do you means, the cat ate my muffin?', 'Depois de "do", verbo base: "mean".'),
      ], 'Você não acredita no que ouviu. Diga:'),
    ),
  },
  {
    id: 'c:cant_make_it',
    en: "I can't make it",
    pt: 'Não vou conseguir ir',
    when_pt: 'Para cancelar ou dizer que não vai poder comparecer.',
    level: 'A2+',
    examples: [
      { en: "Sorry, I can't make it tonight.", pt: 'Desculpa, não vou conseguir ir hoje à noite.' },
      { en: "I can't make it to the meeting. Can we reschedule?", pt: 'Não vou conseguir ir à reunião. Podemos remarcar?' },
    ],
    exercise: ex(gap('ex', ['c:cant_make_it'], 'player', "Sorry, I can't ", 'make', ' it to the party.', 'Desculpa, não vou conseguir ir à festa.', ['make', 'do', 'go'])),
  },
  {
    id: 'c:keep_me_posted',
    en: 'keep me posted',
    pt: 'me mantém informado(a)',
    when_pt: 'Para pedir atualizações sobre algo que está acontecendo.',
    level: 'B1',
    examples: [
      { en: 'Good luck with the interview! Keep me posted.', pt: 'Boa sorte na entrevista! Me conta como foi.' },
      { en: 'Keep me posted about the trip.', pt: 'Me mantém informado sobre a viagem.' },
    ],
    exercise: ex(build('ex', ['c:keep_me_posted'], 'Good luck tomorrow! Keep me posted.', 'Boa sorte amanhã! Me mantém informado.', ['post', 'keeping', 'informed'])),
  },
  {
    id: 'c:long_story_short',
    en: 'long story short',
    pt: 'resumindo',
    when_pt: 'Para pular os detalhes e ir direto ao ponto de uma história.',
    level: 'A2+',
    examples: [
      { en: "Long story short, I missed the bus.", pt: 'Resumindo, perdi o ônibus.' },
      { en: 'Long story short, we adopted a cat.', pt: 'Resumindo, adotamos um gato.' },
    ],
    exercise: ex(gap('ex', ['c:long_story_short'], 'customer', 'Long story ', 'short', ', my dog ate my homework.', 'Resumindo, meu cachorro comeu minha lição.', ['short', 'small', 'little'])),
  },
  {
    id: 'c:about_to',
    en: "I'm about to",
    pt: 'Tô prestes a / tô quase indo',
    when_pt: 'Para algo que vai acontecer agora mesmo.',
    level: 'A2+',
    examples: [
      { en: "I'm about to leave. Need anything?", pt: 'Tô quase saindo. Precisa de algo?' },
      { en: "Wait! I'm about to say something important.", pt: 'Espera! Vou dizer algo importante.' },
    ],
    exercise: ex(gap('ex', ['c:about_to'], 'customer', "Hurry! I'm about ", 'to', ' miss my train.', 'Rápido! Tô prestes a perder meu trem.', ['to', 'for', 'of'])),
  },
  {
    id: 'c:it_depends',
    en: 'it depends',
    pt: 'depende',
    when_pt: 'Quando a resposta muda conforme a situação. Use "it depends ON…".',
    level: 'A2',
    examples: [
      { en: "It depends on the weather.", pt: 'Depende do tempo.' },
      { en: 'Hot or iced? It depends on my mood.', pt: 'Quente ou gelado? Depende do meu humor.' },
    ],
    exercise: ex(gap('ex', ['c:it_depends'], 'player', 'Are we going out? It depends ', 'on', ' the rain.', 'Vamos sair? Depende da chuva.', ['on', 'of', 'from'])),
  },
  {
    id: 'c:makes_sense',
    en: 'that makes sense',
    pt: 'faz sentido',
    when_pt: 'Para mostrar que entendeu e concorda com a explicação.',
    level: 'A2',
    examples: [
      { en: 'Oh, that makes sense now!', pt: 'Ah, agora faz sentido!' },
      { en: "That doesn't make sense.", pt: 'Isso não faz sentido.' },
    ],
    exercise: ex(
      choose('ex', ['c:makes_sense'], [
        ok('Oh, that makes sense. Thanks for explaining!'),
        no('Oh, that does sense. Thanks for explaining!', 'Em inglês é "MAKE sense", não "do sense".'),
        no('Oh, that makes senses. Thanks for explaining!', '"Sense" fica no singular nesse chunk.'),
      ], 'Alguém te explica algo e você entendeu. Diga:'),
    ),
  },
  {
    id: 'c:let_me_know',
    en: 'let me know',
    pt: 'me avisa',
    when_pt: 'Para pedir que a pessoa te avise, responda ou diga se precisa de algo.',
    level: 'A2',
    examples: [
      { en: 'Let me know if you need anything.', pt: 'Me avisa se precisar de algo.' },
      { en: 'Let me know when you arrive.', pt: 'Me avisa quando chegar.' },
    ],
    exercise: ex(build('ex', ['c:let_me_know'], 'Let me know if you need anything.', 'Me avisa se precisar de algo.', ['knowing', 'some', 'needs'])),
  },
  {
    id: 'c:hang_on',
    en: 'hang on a second',
    pt: 'peraí um segundo',
    when_pt: 'Para pedir que alguém espere um pouquinho (informal).',
    level: 'A2+',
    examples: [
      { en: "Hang on a second, I'll get the milk.", pt: 'Peraí um segundo, vou pegar o leite.' },
      { en: 'Hang on a second... is that my cat?', pt: 'Peraí... aquele é o meu gato?' },
    ],
    exercise: ex(gap('ex', ['c:hang_on'], 'player', 'Hang ', 'on', " a second, I'll check.", 'Peraí um segundo, vou ver.', ['on', 'up', 'in'])),
  },
  {
    id: 'c:same_here',
    en: 'same here',
    pt: 'eu também / idem',
    when_pt: 'Resposta curta para dizer que com você é igual.',
    level: 'A2',
    examples: [
      { en: '"I need coffee." "Same here."', pt: '"Preciso de café." "Eu também."' },
      { en: "Same here, I'm exhausted.", pt: 'Idem, tô exausto.' },
    ],
    exercise: ex(
      choose('ex', ['c:same_here'], [
        ok('Same here! Mondays are hard.'),
        no('Same there! Mondays are hard.', 'O chunk é "same HERE".'),
        no('Me too here! Mondays are hard.', 'Mistura dois jeitos; use "same here" ou "me too".'),
      ], 'O cliente diz: "I\'m so tired today." Concorde:'),
    ),
  },
  {
    id: 'c:good_for_you',
    en: 'good for you',
    pt: 'que bom pra você!',
    when_pt: 'Para comemorar uma conquista de alguém. (Com tom irônico, pode soar debochado!)',
    level: 'A2',
    examples: [
      { en: 'You got the job? Good for you!', pt: 'Você conseguiu o emprego? Que bom pra você!' },
      { en: "You ran ten kilometers? Good for you. I ran to the fridge.", pt: 'Você correu dez quilômetros? Que bom. Eu corri até a geladeira.' },
    ],
    exercise: ex(gap('ex', ['c:good_for_you'], 'player', 'You passed the test? Good ', 'for', ' you!', 'Você passou na prova? Que bom pra você!', ['for', 'to', 'at'])),
  },
  {
    id: 'c:no_wonder',
    en: 'no wonder',
    pt: 'não é à toa / por isso',
    when_pt: 'Quando algo explica uma situação: "ah, por isso!".',
    level: 'B1',
    examples: [
      { en: "You didn't sleep? No wonder you're tired.", pt: 'Você não dormiu? Não é à toa que tá cansado.' },
      { en: 'No wonder the cat is happy. You gave him tuna.', pt: 'Por isso o gato tá feliz. Você deu atum pra ele.' },
    ],
    exercise: ex(gap('ex', ['c:no_wonder'], 'player', "You drank five espressos? No ", 'wonder', " you can't sleep.", 'Você tomou cinco expressos? Não é à toa que não consegue dormir.', ['wonder', 'surprise', 'reason'])),
  },
  {
    id: 'c:feel_like',
    en: 'I feel like',
    pt: 'tô com vontade de',
    when_pt: 'Para dizer o que você quer fazer agora. Depois vem verbo com -ing ou um substantivo.',
    level: 'A2+',
    examples: [
      { en: 'I feel like eating pizza tonight.', pt: 'Tô com vontade de comer pizza hoje.' },
      { en: "I don't feel like working today.", pt: 'Não tô com vontade de trabalhar hoje.' },
    ],
    exercise: ex(gap('ex', ['c:feel_like', 'g:gerund_subject'], 'customer', 'I feel like ', 'having', ' something sweet.', 'Tô com vontade de comer algo doce.', ['having', 'to have', 'have'])),
  },
  {
    id: 'c:worth_it',
    en: "it's worth it",
    pt: 'vale a pena',
    when_pt: 'Para dizer que algo compensa o esforço ou o preço.',
    level: 'A2+',
    examples: [
      { en: "It's expensive, but it's worth it.", pt: 'É caro, mas vale a pena.' },
      { en: 'Was the trip worth it?', pt: 'A viagem valeu a pena?' },
    ],
    exercise: ex(build('ex', ['c:worth_it'], "It's a long line, but it's worth it.", 'A fila é longa, mas vale a pena.', ['worthy', 'value', 'worths'])),
  },
  {
    id: 'c:used_to_it',
    en: "I'm used to it",
    pt: 'Tô acostumado(a)',
    when_pt: 'Para dizer que algo já é normal pra você. (Diferente de "I used to" = eu costumava!)',
    level: 'B1',
    examples: [
      { en: "The cat wakes me up at 5. I'm used to it.", pt: 'O gato me acorda às 5. Tô acostumado.' },
      { en: "I'm not used to the cold yet.", pt: 'Ainda não tô acostumada com o frio.' },
    ],
    exercise: ex(
      choose('ex', ['c:used_to_it', 'g:used_to'], [
        ok("It's loud here, but I'm used to it."),
        no("It's loud here, but I used to it.", 'Sem o "am", vira outra estrutura ("eu costumava"). Para "estar acostumado" é "I\'m used to".'),
        no("It's loud here, but I'm use to it.", 'É "used" (com -d) em "I\'m used to it".'),
      ], 'Diga que o barulho do café já não te incomoda:'),
    ),
  },
  {
    id: 'c:have_a_good_one',
    en: 'have a good one',
    pt: 'tenha um bom dia (informal)',
    when_pt: 'Despedida simpática e informal, serve para qualquer hora do dia.',
    level: 'A2',
    examples: [
      { en: 'Thanks! Have a good one!', pt: 'Valeu! Bom dia pra você!' },
      { en: 'Here you go. Have a good one!', pt: 'Aqui está. Tenha um ótimo dia!' },
    ],
    exercise: ex(gap('ex', ['c:have_a_good_one'], 'player', 'Here is your latte. Have a good ', 'one', '!', 'Aqui está seu latte. Tenha um bom dia!', ['one', 'won', 'once'])),
  },
  {
    id: 'c:catch_you_later',
    en: 'catch you later',
    pt: 'até mais / falou',
    when_pt: 'Despedida bem informal entre amigos.',
    level: 'A2+',
    examples: [
      { en: 'Gotta go. Catch you later!', pt: 'Tenho que ir. Até mais!' },
      { en: 'Catch you later, Elias!', pt: 'Até mais, Elias!' },
    ],
    exercise: ex(
      choose('ex', ['c:catch_you_later', 'g:register_informal'], [
        ok('Catch you later, dude!'),
        no('Catch you lately, dude!', '"Lately" significa "ultimamente". O chunk é "catch you LATER".'),
        no('I shall catch you subsequently, sir.', 'Formal e estranho demais para um "dude".'),
      ], 'Seu amigo está indo embora. Despeça-se informalmente:'),
    ),
  },
  {
    id: 'c:how_come',
    en: 'how come',
    pt: 'como assim? / por que?',
    when_pt: 'Jeito informal de perguntar "por quê". Atenção: depois vem a frase na ordem normal!',
    level: 'B1',
    examples: [
      { en: "How come you're here so early?", pt: 'Por que você chegou tão cedo?' },
      { en: 'How come the cat is wet?', pt: 'Por que o gato tá molhado?' },
    ],
    exercise: ex(
      choose('ex', ['c:how_come'], [
        ok("How come you're not drinking coffee today?"),
        no('How come are you not drinking coffee today?', 'Depois de "how come" a frase fica na ordem normal: "how come YOU ARE…".'),
        no('How comes you not drinking coffee today?', 'É "how come" (sem -s) e falta o verbo "are".'),
      ], 'Pergunte por que o cliente não está tomando café hoje:'),
    ),
  },
  {
    id: 'c:by_the_way',
    en: 'by the way',
    pt: 'aliás / a propósito',
    when_pt: 'Para mudar de assunto ou acrescentar uma informação. Em mensagens: "BTW".',
    level: 'A2',
    examples: [
      { en: 'By the way, I love your shirt.', pt: 'Aliás, amei sua camisa.' },
      { en: 'Oh, by the way, Maya called.', pt: 'Ah, a propósito, a Maya ligou.' },
    ],
    exercise: ex(gap('ex', ['c:by_the_way'], 'player', 'Here you go. By the ', 'way', ', your cat is adorable.', 'Aqui está. Aliás, seu gato é uma graça.', ['way', 'road', 'path'])),
  },
  {
    id: 'c:in_the_meantime',
    en: 'in the meantime',
    pt: 'enquanto isso',
    when_pt: 'Para o que acontece enquanto se espera outra coisa.',
    level: 'B1',
    examples: [
      { en: 'Your toastie is in the oven. In the meantime, have some water.', pt: 'Seu misto tá no forno. Enquanto isso, toma uma água.' },
      { en: 'In the meantime, I watched three episodes.', pt: 'Enquanto isso, assisti três episódios.' },
    ],
    exercise: ex(build('ex', ['c:in_the_meantime'], 'In the meantime, take a seat.', 'Enquanto isso, sente-se.', ['mean', 'while', 'times'])),
  },
  {
    id: 'c:over_it',
    en: "I'm over it",
    pt: 'Já superei / cansei disso',
    when_pt: 'Para dizer que superou algo, ou que cansou de uma situação.',
    level: 'B1',
    examples: [
      { en: "My ex? I'm so over it.", pt: 'Meu ex? Já superei total.' },
      { en: "This rain... I'm over it.", pt: 'Essa chuva... cansei.' },
    ],
    exercise: ex(gap('ex', ['c:over_it'], 'customer', 'Three hours of meetings. Honestly, I\'m ', 'over', ' it.', 'Três horas de reunião. Sinceramente, cansei.', ['over', 'above', 'under'])),
  },
  {
    id: 'c:give_it_a_try',
    en: 'give it a try',
    pt: 'experimenta / dá uma chance',
    when_pt: 'Para incentivar alguém a tentar algo novo.',
    level: 'A2+',
    examples: [
      { en: 'Never had a chai latte? Give it a try!', pt: 'Nunca tomou chai latte? Experimenta!' },
      { en: "I'll give it a try.", pt: 'Vou tentar.' },
    ],
    exercise: ex(build('ex', ['c:give_it_a_try'], "It's new on the menu. Give it a try!", 'É novo no cardápio. Experimenta!', ['gave', 'trying', 'attempt'])),
  },
  {
    id: 'c:fair_enough',
    en: 'fair enough',
    pt: 'justo / faz sentido',
    when_pt: 'Para aceitar o argumento de alguém, mesmo sem concordar 100%.',
    level: 'B1',
    examples: [
      { en: '"I prefer tea." "Fair enough."', pt: '"Prefiro chá." "Justo."' },
      { en: "Fair enough, you were here first.", pt: 'Justo, você chegou primeiro.' },
    ],
    exercise: ex(
      choose('ex', ['c:fair_enough'], [
        ok('Fair enough. The window table is yours.'),
        no('Enough fair. The window table is yours.', 'A ordem é fixa: "fair enough".'),
        no('Fairly enough. The window table is yours.', '"Fairly" é advérbio; o chunk é "fair enough".'),
      ], 'O cliente diz: "I was here first, so the window table is mine." Aceite:'),
    ),
  },
  {
    id: 'c:whats_up',
    en: "what's up",
    pt: 'e aí? / o que houve?',
    when_pt: 'Cumprimento informal, ou para perguntar o que está acontecendo.',
    level: 'A2',
    examples: [
      { en: "Hey, what's up?", pt: 'Ei, e aí?' },
      { en: "What's up? You look worried.", pt: 'O que houve? Você parece preocupado.' },
    ],
    exercise: ex(
      choose('ex', ['c:whats_up', 'g:register_informal'], [
        ok('Not much! Just tired.'),
        no('Up is the sky.', 'Literal demais. "What\'s up?" é só um "e aí?".'),
        no('I am very fine, thank you, and you?', 'Gramática ok, mas formal e "de livro" demais para um "what\'s up?".'),
      ], 'Um amigo diz "Hey, what\'s up?". Qual resposta é a mais natural?'),
    ),
  },
  {
    id: 'c:i_guess',
    en: 'I guess',
    pt: 'acho que sim / eu acho',
    when_pt: 'Para dar uma opinião sem muita certeza, ou concordar sem entusiasmo.',
    level: 'A2',
    examples: [
      { en: '"Is it good?" "I guess."', pt: '"É bom?" "Acho que sim."' },
      { en: "I guess I'll have the usual.", pt: 'Acho que vou de sempre.' },
    ],
    exercise: ex(gap('ex', ['c:i_guess'], 'customer', 'I ', 'guess', " I'll have a latte. Again.", 'Acho que vou de latte. De novo.', ['guess', 'guest', 'gess'])),
  },
  {
    id: 'c:no_way',
    en: 'no way',
    pt: 'não acredito! / de jeito nenhum',
    when_pt: 'Para surpresa ("não acredito!") ou recusa forte ("de jeito nenhum").',
    level: 'A2',
    examples: [
      { en: 'You met a celebrity? No way!', pt: 'Você conheceu uma celebridade? Não acredito!' },
      { en: 'Decaf? No way.', pt: 'Descafeinado? De jeito nenhum.' },
    ],
    exercise: ex(gap('ex', ['c:no_way'], 'player', 'Gary smiled today? No ', 'way', '!', 'O Gary sorriu hoje? Não acredito!', ['way', 'wait', 'how'])),
  },
  {
    id: 'c:to_go_with',
    en: "I'll go with",
    pt: 'vou de / vou escolher',
    when_pt: 'Para fazer sua escolha num pedido ou numa decisão.',
    level: 'A2',
    examples: [
      { en: "I'll go with the cappuccino.", pt: 'Vou de cappuccino.' },
      { en: "Hmm... I'll go with the blue one.", pt: 'Hum... vou escolher o azul.' },
    ],
    exercise: ex(build('ex', ['c:to_go_with', 'g:will_offers'], "I'll go with the lemon cake, please.", 'Vou de bolo de limão, por favor.', ['went', 'for', 'going'])),
  },
];

export const CHUNK_BY_ID: Record<string, Chunk> = Object.fromEntries(CHUNKS.map((c) => [c.id, c]));
