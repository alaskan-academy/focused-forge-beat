// Palavras-cola (horta): as palavrinhas que montam e ligam frases — artigos, conectores,
// condições, "to", auxiliares, frases para ganhar tempo e as pequenas que confundem.
// Ids com prefixo "gl:" (não renomeie ids existentes: o SRS e as plantas guardam o id).
//
// Cada exercício (Drill) é [frase, certa, errada, errada]:
//  - frase com ___  → "complete a frase" (as opções são palavras)
//  - frase começando com "?" → pergunta em português; as opções são frases inteiras
// "∅" = sem palavra nenhuma (aparece como "∅ (nada)").
import type { Level } from './types';

export type GlueGroup = 'articles' | 'connectors' | 'conditions' | 'to' | 'aux' | 'fillers' | 'tricky';
export type Drill = [string, string, string, string];
export type GlueWord = { id: string; group: GlueGroup; en: string; pt: string; why: string; level: Level; drills: Drill[] };

export const GLUE_GROUPS: Record<GlueGroup, { pt: string; emoji: string; desc: string }> = {
  articles: { pt: 'Artigos', emoji: '🅰️', desc: 'a, an, the — ou nada' },
  connectors: { pt: 'Conectores', emoji: '🔗', desc: 'para ligar uma frase na outra' },
  conditions: { pt: 'Condições', emoji: '🔀', desc: 'if, unless, in case…' },
  to: { pt: 'O "to"', emoji: '➡️', desc: 'quando vai "to" e quando não vai' },
  aux: { pt: 'Auxiliares', emoji: '🧱', desc: 'do, did, is, was, have…' },
  fillers: { pt: 'Para não travar', emoji: '💬', desc: 'ganhar tempo sem o "aaamm"' },
  tricky: { pt: 'Pequenas que confundem', emoji: '🧩', desc: 'some/any, much/many, its/it’s…' },
};
export const GLUE_GROUP_ORDER: GlueGroup[] = ['articles', 'connectors', 'aux', 'to', 'conditions', 'fillers', 'tricky'];

const g = (group: GlueGroup, id: string, en: string, pt: string, level: Level, why: string, drills: Drill[]): GlueWord => ({ id: `gl:${id}`, group, en, pt, why, level, drills });

export const GLUE: GlueWord[] = [
  // ── artigos ──
  g('articles', 'a', 'a', 'um / uma (antes de som de consoante)', 'A2', 'A vem antes de SOM de consoante: a cat, a cup, a university (soa "iu"), a one-way street (soa "uan").', [
    ['I have ___ cat.', 'a', 'an', '∅'],
    ['She is ___ teacher.', 'a', 'an', '∅'],
    ['Jessica studies at ___ university in Canada.', 'a', 'an', '∅'],
  ]),
  g('articles', 'an', 'an', 'um / uma (antes de som de vogal)', 'A2', 'AN vem antes de SOM de vogal: an apple, an idea, an hour (o h é mudo), an honest person.', [
    ['I have ___ idea!', 'an', 'a', '∅'],
    ['We waited for ___ hour.', 'an', 'a', '∅'],
    ['Mucego ate ___ orange.', 'an', 'a', '∅'],
  ]),
  g('articles', 'the', 'the', 'o / a / os / as (aquele específico)', 'A2', 'THE é para algo específico, que os dois já sabem qual é, ou que é único: the sun, the door, the cake you made.', [
    ['Can you close ___ door, please?', 'the', 'a', '∅'],
    ['___ sun is so strong today.', 'The', 'A', '∅'],
    ['I loved ___ cake you made yesterday.', 'the', 'a', '∅'],
  ]),
  g('articles', 'zero', '∅ (sem artigo)', 'sem artigo: falando em geral', 'A2+', 'Falando de coisas EM GERAL (plural ou incontável), não vai artigo: I love coffee, cats are cute, life is good. Também: go to work, have breakfast.', [
    ['In general, I love ___ cats.', '∅', 'the', 'a'],
    ['We had ___ breakfast at home.', '∅', 'a', 'the'],
    ['She goes to ___ work by bus.', '∅', 'the', 'a'],
  ]),
  g('articles', 'a_then_the', 'a … the …', 'primeira vez A, depois THE', 'A2+', 'Primeira vez que fala de algo: A. Depois que os dois já sabem qual é: THE. "I saw a cat. The cat was black."', [
    ['I bought a plant. ___ plant is already dying.', 'The', 'A', '∅'],
    ['We met a man yesterday. ___ man was very funny.', 'The', 'A', 'An'],
    ['There is a fish in the lake. I want to catch ___ fish.', 'the', 'a', 'an'],
  ]),
  g('articles', 'a_lot_of', 'a lot of', 'muito(s), muita(s)', 'A2', 'A LOT OF serve para contável e incontável: a lot of people, a lot of coffee. Sem nada depois, é só "a lot": I miss you a lot.', [
    ['There were ___ people at the café.', 'a lot of', 'a lot', 'much'],
    ['I drink ___ coffee.', 'a lot of', 'many', 'a lot'],
    ['Thank you ___!', 'a lot', 'a lot of', 'many'],
  ]),

  // ── conectores ──
  g('connectors', 'but', 'but', 'mas', 'A2', 'BUT liga duas ideias que se opõem: "I like tea, but I love coffee."', [
    ['I like tea, ___ I love coffee.', 'but', 'so', 'because'],
    ['It was cold, ___ we went out anyway.', 'but', 'so', 'or'],
    ['?Junte: “The café is small.” + “It is very cozy.”', 'The café is small, but it is very cozy.', 'The café is small, so it is very cozy.', 'The café is small, because it is very cozy.'],
  ]),
  g('connectors', 'so', 'so', 'então / por isso', 'A2', 'SO mostra a CONSEQUÊNCIA: causa, so resultado. "I was tired, so I went to bed."', [
    ['I was tired, ___ I went to bed.', 'so', 'because', 'but'],
    ['It started raining, ___ we stayed home.', 'so', 'but', 'because'],
    ['?Junte: “I was hungry.” + “I made a sandwich.”', 'I was hungry, so I made a sandwich.', 'I was hungry, because I made a sandwich.', 'I was hungry, but I made a sandwich.'],
  ]),
  g('connectors', 'because', 'because', 'porque', 'A2', 'BECAUSE explica a CAUSA: resultado because causa. É o contrário do "so": "I went to bed because I was tired."', [
    ['I went to bed early ___ I was tired.', 'because', 'so', 'but'],
    ['She is happy ___ her plants are growing.', 'because', 'so', 'or'],
    ['?Junte: “We stayed home.” + “It was raining.”', 'We stayed home because it was raining.', 'We stayed home so it was raining.', 'We stayed home but it was raining.'],
  ]),
  g('connectors', 'or', 'or', 'ou', 'A2', 'OR dá opções: "Coffee or tea?" Em frase negativa, "or" também substitui o "nem": "I don\'t drink coffee or tea."', [
    ['Do you want coffee ___ tea?', 'or', 'and', 'but'],
    ['We can stay here ___ go to the lake.', 'or', 'so', 'because'],
    ['Is it hot ___ cold?', 'or', 'and', 'but'],
  ]),
  g('connectors', 'then', 'then', 'depois / então (em sequência)', 'A2', 'THEN coloca as coisas em ORDEM: "First I water the plants, then I go fishing." Não confunda com "than" (do que).', [
    ['First I water the plants, ___ I go fishing.', 'then', 'than', 'so'],
    ['Open the box, and ___ take out the cups.', 'then', 'than', 'because'],
    ['We had lunch and ___ took a nap.', 'then', 'than', 'but'],
  ]),
  g('connectors', 'also', 'also', 'também (no meio da frase)', 'A2', 'ALSO vai ANTES do verbo principal (ou depois do "be"): "I also like tea", "She is also tired". No fim da frase, use "too".', [
    ['I ___ like tea.', 'also', 'too', 'either'],
    ['She is ___ a teacher.', 'also', 'too', 'either'],
    ['?Qual soa natural?', 'We also have cake.', 'We have also cake.', 'Also we cake have.'],
  ]),
  g('connectors', 'actually', 'actually', 'na verdade (não é "atualmente"!)', 'A2+', 'ACTUALLY = "na verdade", para corrigir ou surpreender. "Atualmente" em inglês é "currently" ou "nowadays".', [
    ["I thought it was hard, but it's ___ easy.", 'actually', 'currently', 'nowadays'],
    ['___, I changed my mind. I want tea.', 'Actually', 'Currently', 'Nowadays'],
    ['?Você quer dizer “Na verdade, eu nunca fui lá.”', "Actually, I've never been there.", "Currently, I've never been there.", "Nowadays, I've never been there."],
  ]),
  g('connectors', 'anyway', 'anyway', 'enfim / de qualquer jeito', 'A2+', 'ANYWAY serve para voltar ao assunto ("Anyway, where was I?") ou dizer "mesmo assim" ("It was raining, but we went anyway.").', [
    ['It was raining, but we went ___.', 'anyway', 'however', 'although'],
    ['___, where was I?', 'Anyway', 'Although', 'Unless'],
    ["I don't need it, but thanks ___.", 'anyway', 'although', 'instead'],
  ]),
  g('connectors', 'however', 'however', 'porém / no entanto (mais formal)', 'B1', 'HOWEVER é um "but" mais formal, normalmente começando a frase e com vírgula: "The plan is good. However, it is expensive."', [
    ['The plan is good. ___, it is expensive.', 'However', 'Because', 'So'],
    ['The café was full. ___, they found a table.', 'However', 'So', 'Unless'],
    ['?Qual está certa?', 'It was late. However, we kept talking.', 'It was late, however we kept talking because.', 'However it was late we kept so talking.'],
  ]),
  g('connectors', 'although', 'although', 'embora', 'A2+', 'ALTHOUGH (ou "even though", mais forte) = "embora": "Although it was cold, we went out." Não use "but" junto na mesma frase.', [
    ['___ it was cold, we went out.', 'Although', 'But', 'So'],
    ['She smiled, ___ she was sad.', 'although', 'because', 'so'],
    ['?Qual está certa?', 'Although I was tired, I finished it.', 'Although I was tired, but I finished it.', 'Although tired I was, I finished it.'],
  ]),
  g('connectors', 'while', 'while', 'enquanto', 'A2+', 'WHILE = "enquanto" (duas coisas ao mesmo tempo): "I listen to music while I cook."', [
    ['I listen to music ___ I cook.', 'while', 'during', 'until'],
    ['Mucego slept ___ we were fishing.', 'while', 'during', 'because'],
    ['Someone called ___ I was in the shower.', 'while', 'during', 'until'],
  ]),
  g('connectors', 'until', 'until', 'até (no tempo)', 'A2+', 'UNTIL = "até" quando fala de TEMPO: "Wait until I come back", "open until 6". Para lugar, use "to" ou "as far as".', [
    ['Wait here ___ I come back.', 'until', 'while', 'to'],
    ['The café is open ___ 6 p.m.', 'until', 'while', 'during'],
    ["Don't open it ___ your birthday!", 'until', 'while', 'since'],
  ]),
  g('connectors', 'as_soon_as', 'as soon as', 'assim que', 'A2+', 'AS SOON AS = "assim que". Depois dele o verbo fica no PRESENTE mesmo falando do futuro: "I\'ll call you as soon as I arrive" (não "will arrive").', [
    ["I'll call you ___ I arrive.", 'as soon as', 'as long as', 'as well as'],
    ['?Qual está certa?', "I'll text you as soon as I get home.", "I'll text you as soon as I will get home.", "I text you as soon as I will get home."],
    ['___ the plant is ready, you can harvest it.', 'As soon as', 'As well as', 'As much as'],
  ]),
  g('connectors', 'instead', 'instead (of)', 'em vez de / no lugar', 'A2+', 'INSTEAD no fim da frase = "no lugar": "Let\'s have tea instead." INSTEAD OF + coisa ou verbo -ing: "instead of coffee", "instead of working".', [
    ["There's no coffee. Let's have tea ___.", 'instead', 'also', 'either'],
    ['We stayed home ___ going out.', 'instead of', 'instead', 'because of'],
    ['Can I have juice ___ soda?', 'instead of', 'instead', 'except'],
  ]),
  g('connectors', 'by_the_way', 'by the way', 'aliás / a propósito', 'A2', 'BY THE WAY (BTW) muda de assunto de leve, trazendo algo que você lembrou: "By the way, your cat is cute."', [
    ['___, did you feed Mucego?', 'By the way', 'Because of', 'Instead'],
    ['Nice to meet you. ___, I love your shirt!', 'By the way', 'However', 'Unless'],
    ['?Você lembrou de outro assunto no meio da conversa. Como começa?', 'Oh, by the way…', 'Oh, in the way…', 'Oh, on the way…'],
  ]),
  g('connectors', 'thats_why', "that's why", 'é por isso que', 'A2', 'THAT\'S WHY liga a explicação ao resultado, como um "so" falado: "I love plants. That\'s why I have a garden."', [
    ["I love plants. ___ I have a garden.", "That's why", 'Because', 'Although'],
    ["She missed the bus. ___ she was late.", "That's why", 'Because', 'Unless'],
    ['?Você quer dizer “É por isso que eu acordo cedo.”', "That's why I wake up early.", "That's because I wake up early.", "Is why I wake up early."],
  ]),
  g('connectors', 'since', 'since', 'desde / já que', 'B1', 'SINCE tem dois usos: "desde" (since 2020, since Monday) e "já que" (Since you\'re here, help me!). Para duração, use "for": for two years.', [
    ["I've lived here ___ 2020.", 'since', 'for', 'during'],
    ["I've lived here ___ two years.", 'for', 'since', 'during'],
    ["___ you're here, can you help me?", 'Since', 'For', 'During'],
  ]),

  // ── condições ──
  g('conditions', 'if', 'if', 'se', 'A2', 'IF + presente, will + verbo para algo que pode acontecer: "If it rains, we\'ll stay home." Depois do "if" não vai "will".', [
    ["___ it rains, we'll stay home.", 'If', 'So', 'Then'],
    ['?Qual está certa?', "If you water it, it'll grow.", "If you will water it, it grows.", "If you watered it, it will grow."],
    ['Tell me ___ you need anything.', 'if', 'so', 'than'],
  ]),
  g('conditions', 'unless', 'unless', 'a não ser que / se não', 'A2+', 'UNLESS = "if … not": "I\'ll go unless it rains" = "I\'ll go if it doesn\'t rain". Não coloque "not" de novo depois.', [
    ["I'll go ___ it rains.", 'unless', 'if', 'until'],
    ["The plant will die ___ you water it.", 'unless', 'if', 'until'],
    ['?Qual quer dizer o mesmo que “if you don’t hurry”?', 'unless you hurry', "unless you don't hurry", 'if you hurry not'],
  ]),
  g('conditions', 'in_case', 'in case', 'caso / por via das dúvidas', 'A2+', 'IN CASE = fazer algo AGORA por precaução: "Take an umbrella in case it rains." É diferente de "if" (só faz se acontecer).', [
    ['Take an umbrella ___ it rains.', 'in case', 'unless', 'as long as'],
    ["I'll write it down ___ I forget.", 'in case', 'unless', 'as soon as'],
    ['Bring some bait, just ___.', 'in case', 'if', 'unless'],
  ]),
  g('conditions', 'as_long_as', 'as long as', 'desde que / contanto que', 'B1', 'AS LONG AS = "desde que, contanto que" (uma condição): "You can stay as long as you\'re quiet."', [
    ["You can stay ___ you're quiet.", 'as long as', 'as soon as', 'in case'],
    ["I don't mind ___ you're happy.", 'as long as', 'unless', 'as soon as'],
    ['Plants are fine ___ they get water.', 'as long as', 'in case', 'unless'],
  ]),
  g('conditions', 'what_if', 'what if…?', 'e se…?', 'A2+', 'WHAT IF…? lança uma hipótese ou ideia: "What if it rains?", "What if we tried the lake?"', [
    ['___ it rains tomorrow?', 'What if', 'If what', 'Unless'],
    ['?Você quer sugerir uma ideia: “E se a gente pintasse a sala de verde?”', 'What if we painted the living room green?', 'If what we paint the living room green?', 'And if we to paint the living room green?'],
    ['___ she says no?', 'What if', 'What about if', 'Unless'],
  ]),
  g('conditions', 'whether', 'whether', 'se (entre duas opções)', 'B1', 'WHETHER = "se" quando é dúvida entre opções (whether … or not). Em conversa muita gente usa "if": "I don\'t know whether/if she\'s coming."', [
    ["I don't know ___ she's coming or not.", 'whether', 'unless', 'in case'],
    ["I'm not sure ___ to stay or go.", 'whether', 'if not', 'unless'],
    ['She asked ___ I wanted coffee.', 'if', 'that', 'unless'],
  ]),
  g('conditions', 'even_if', 'even if', 'mesmo se', 'B1', 'EVEN IF = "mesmo se": a condição não muda nada. "I\'ll go even if it rains."', [
    ["I'll go ___ it rains.", 'even if', 'unless', 'as long as'],
    ["___ you don't like it, try it once.", 'Even if', 'As long as', 'In case'],
    ['?Você quer dizer “Mesmo se for difícil, eu vou tentar.”', "Even if it's hard, I'll try.", "Even it's hard, I'll try.", "If even it's hard, I'll try."],
  ]),

  // ── to ──
  g('to', 'to_verb', 'to + verbo', 'para / de (antes de verbo)', 'A2', 'Depois de want, need, like, try, decide, hope… o verbo vem com TO: "I want to sleep", "I need to go".', [
    ['I want ___ sleep.', 'to', '∅', 'for'],
    ['We need ___ water the plants.', 'to', '∅', 'for'],
    ['?Qual está certa?', 'I decided to learn English.', 'I decided learn English.', 'I decided for learn English.'],
  ]),
  g('to', 'to_place', 'to (direção)', 'para (um lugar)', 'A2', 'TO mostra DIREÇÃO: go to the lake, come to my house. Exceção: home não leva "to" (go home).', [
    ["Let's go ___ the lake.", 'to', 'in', 'at'],
    ["I'm going ___ home now.", '∅', 'to', 'at'],
    ['She came ___ my house yesterday.', 'to', 'in', 'on'],
  ]),
  g('to', 'to_for', 'to × for', 'para (fazer algo) × para (algo)', 'A2+', 'Para dizer o OBJETIVO com verbo, use TO: "I came here to learn" (nunca "for learn"). FOR vem com coisa: "I came for the coffee."', [
    ['I came here ___ learn English.', 'to', 'for', 'for to'],
    ['I came here ___ the coffee.', 'for', 'to', 'for to'],
    ['?Qual está certa?', 'I went to the lake to fish.', 'I went to the lake for fish.', 'I went to the lake for to fish.'],
  ]),
  g('to', 'how_to', 'how to / what to', 'como (fazer) / o que (fazer)', 'A2+', 'HOW TO / WHAT TO / WHERE TO + verbo: "I don\'t know how to swim", "I don\'t know what to say."', [
    ["I don't know ___ swim.", 'how to', 'how', 'to how'],
    ["I don't know what ___ say.", 'to', '∅', 'for'],
    ['Can you show me ___ plant this?', 'how to', 'how', 'to how'],
  ]),
  g('to', 'no_to_modal', 'can / should + verbo (sem to)', 'sem "to" depois de modais', 'A2', 'Depois de can, could, should, will, would, must, might o verbo vem SEM "to": "You should rest" (nunca "should to rest").', [
    ['You should ___ rest.', '∅', 'to', 'for'],
    ['I can ___ help you.', '∅', 'to', 'for'],
    ['?Qual está certa?', 'We must leave now.', 'We must to leave now.', 'We must leaving now.'],
  ]),
  g('to', 'ing_after', 'enjoy / finish + -ing', 'verbo -ing depois de alguns verbos', 'A2+', 'Depois de enjoy, finish, mind, stop, keep, avoid… o verbo vai com -ING: "I enjoy fishing", "Do you mind waiting?"', [
    ['I enjoy ___ in the garden.', 'working', 'to work', 'work'],
    ['Did you finish ___ the book?', 'reading', 'to read', 'read'],
    ['Do you mind ___ a minute?', 'waiting', 'to wait', 'wait'],
  ]),
  g('to', 'look_forward', 'look forward to + -ing', 'estar ansioso por', 'B1', 'LOOK FORWARD TO: aqui o "to" é preposição, então vem -ING ou coisa: "I\'m looking forward to seeing you" (não "to see").', [
    ["I'm looking forward to ___ you.", 'seeing', 'see', 'saw'],
    ["We're looking forward ___ the weekend.", 'to', 'for', '∅'],
    ['?Qual está certa?', 'I look forward to hearing from you.', 'I look forward to hear from you.', 'I look forward hearing from you.'],
  ]),

  // ── auxiliares ──
  g('aux', 'do_does', 'do / does', 'auxiliar de pergunta e negativa (presente)', 'A2', 'Pergunta e negativa no presente usam DO (I, you, we, they) ou DOES (he, she, it). Com does, o verbo perde o -s: "Does she like it?"', [
    ['___ you like coffee?', 'Do', 'Does', 'Are'],
    ['___ Mucego like strawberries?', 'Does', 'Do', 'Is'],
    ["She ___ like spicy food.", "doesn't", "don't", "isn't"],
  ]),
  g('aux', 'did', 'did / didn\'t', 'auxiliar do passado', 'A2', 'Pergunta e negativa no passado usam DID + verbo BASE: "Did you go?" (nunca "did you went"), "I didn\'t see it".', [
    ['___ you water the plants yesterday?', 'Did', 'Do', 'Were'],
    ['?Qual está certa?', "I didn't see her.", "I didn't saw her.", "I don't saw her."],
    ['Where ___ you buy this?', 'did', 'were', 'have'],
  ]),
  g('aux', 'be_ing', 'am / is / are + -ing', 'estar fazendo (agora)', 'A2', 'Para o que está acontecendo AGORA: BE + verbo -ing. "I\'m cooking", "She is sleeping". Nunca "I am agree" (agree já é verbo: "I agree").', [
    ['Shh! The cat ___ sleeping.', 'is', 'are', 'does'],
    ['What ___ you doing?', 'are', 'do', 'is'],
    ['?Qual está certa?', 'I agree with you.', 'I am agree with you.', 'I agreeing with you.'],
  ]),
  g('aux', 'was_were', 'was / were', 'era / estava (passado do be)', 'A2', 'WAS com I, he, she, it. WERE com you, we, they. "I was tired", "We were at home".', [
    ['We ___ at home last night.', 'were', 'was', 'did'],
    ['The cake ___ delicious!', 'was', 'were', 'did'],
    ['___ you sleeping when I called?', 'Were', 'Was', 'Did'],
  ]),
  g('aux', 'have_pp', 'have / has + particípio', 'já fiz / tenho feito', 'A2+', 'HAVE/HAS + particípio liga o passado ao agora: "I have finished", "She has seen it". Com he/she/it é HAS.', [
    ['She ___ finished her coffee.', 'has', 'have', 'is'],
    ['I ___ never seen a golden fish.', 'have', 'has', 'am'],
    ['?Qual está certa?', 'Have you eaten yet?', 'Have you ate yet?', 'Did you have eaten yet?'],
  ]),
  g('aux', 'do_or_be', 'Do you…? × Are you…?', 'do (ação) × be (estado)', 'A2+', 'Com VERBO de ação use DO: "Do you like it?". Com adjetivo, lugar ou -ing use BE: "Are you tired?", "Are you working?"', [
    ['___ you tired?', 'Are', 'Do', 'Does'],
    ['___ you work on Saturdays?', 'Do', 'Are', 'Is'],
    ['___ she at home?', 'Is', 'Does', 'Do'],
  ]),
  g('aux', 'wont', "will / won't", 'vou / não vou (decisão, promessa)', 'A2', "WILL ('ll) para decidir na hora, prometer ou prever; WON'T = will not. Depois vem o verbo base: \"I'll help\", \"It won't rain\".", [
    ["Don't worry, I ___ tell anyone.", "won't", "don't", "am not"],
    ['?Alguém diz que está com frio. Você oferece fechar a janela:', "I'll close the window.", 'I close the window.', 'I closing the window.'],
    ["It ___ take long, I promise.", "won't", "doesn't will", "isn't"],
  ]),
  g('aux', 'short_answers', 'Yes, I do. / No, I didn\'t.', 'respostas curtas com o auxiliar', 'A2', 'Para responder sim/não, repita o AUXILIAR da pergunta: "Do you…?" → "Yes, I do." "Did you…?" → "No, I didn\'t." "Are you…?" → "Yes, I am."', [
    ['“Did you feed the cat?” — “Yes, I ___.”', 'did', 'do', 'fed'],
    ['“Are you ready?” — “No, I’m ___.”', 'not', "don't", 'no'],
    ['“Does she like fish?” — “Yes, she ___.”', 'does', 'is', 'likes'],
  ]),

  // ── para não travar ──
  g('fillers', 'well', 'Well…', 'Bom… / Então…', 'A2', 'WELL… no começo da resposta ganha um segundinho e soa natural: "Well… I think so."', [
    ['?Te perguntam algo e você precisa de um segundo. Como começa?', 'Well… I think so.', 'Good… I think so.', 'So well… I think so.'],
    ['“Do you like it?” — “___, it’s not bad.”', 'Well', 'Good', 'Very'],
    ['?Qual soa mais natural para começar uma resposta?', 'Well, it depends.', 'Aaaammm, it depends.', 'Good, it depends.'],
  ]),
  g('fillers', 'let_me_think', 'Let me think…', 'Deixa eu pensar…', 'A2', 'LET ME THINK (ou "Let me see…") mostra que você está pensando, em vez de ficar em silêncio.', [
    ['?Você travou e precisa pensar. O que diz?', 'Let me think…', 'Wait me think…', 'Let me thinking…'],
    ['“What time is it?” — “Let me ___… it’s three.”', 'see', 'look', 'saw'],
    ['?Qual está certa?', 'Hmm, let me think about it.', 'Hmm, let me to think about it.', 'Hmm, let me thinking about it.'],
  ]),
  g('fillers', 'you_know', 'you know', 'sabe?', 'A2', 'YOU KNOW no meio da frase chama a pessoa para a conversa e dá tempo para pensar: "It was, you know, kind of weird."', [
    ['It was, ___, kind of weird.', 'you know', 'you knew', 'do you know'],
    ['?Qual soa natural na conversa?', "I just need a break, you know?", 'I just need a break, do you know?', 'I just need a break, you knowing?'],
    ["She's, ___, a really nice person.", 'you know', 'you known', 'knows you'],
  ]),
  g('fillers', 'i_mean', 'I mean…', 'quer dizer… / tipo…', 'A2+', 'I MEAN… corrige ou explica melhor o que você acabou de dizer: "It\'s cheap. I mean, not cheap, but fair."', [
    ["It's cheap. ___, not cheap, but fair.", 'I mean', 'I say', 'I want'],
    ['?Você falou errado e quer corrigir na hora:', 'On Monday… I mean, on Tuesday.', 'On Monday… I want say, on Tuesday.', 'On Monday… I mean to, on Tuesday.'],
    ['I love it. ___, who doesn’t?', 'I mean', 'I say', 'I meant'],
  ]),
  g('fillers', 'kind_of', 'kind of', 'meio / tipo / mais ou menos', 'A2+', 'KIND OF (falado "kinda") suaviza: "I\'m kind of tired" = meio cansado. Ótimo quando não acha a palavra exata.', [
    ["I'm ___ tired today.", 'kind of', 'kind', 'a kind'],
    ["It's ___ like a big cat, but wild.", 'kind of', 'kind', 'kinds'],
    ['?Você quer dizer “É meio difícil de explicar.”', "It's kind of hard to explain.", "It's kind hard to explain.", "It's a kind of hard explain."],
  ]),
  g('fillers', 'the_thing_is', 'The thing is…', 'O negócio é que…', 'A2+', 'THE THING IS… introduz o problema ou o ponto principal: "The thing is, I don\'t have time."', [
    ["___, I don't have time.", 'The thing is', 'The thing are', 'Thing is that the'],
    ['?Você vai explicar o problema principal. Como começa?', 'The thing is, it’s too far.', 'The thing are, it’s too far.', 'The business is, it’s too far.'],
    ["I'd love to go. The ___ is, I'm broke.", 'thing', 'things', 'business'],
  ]),
  g('fillers', 'how_do_i_say', 'How do I say…?', 'Como eu digo…?', 'A2', 'Esqueceu a palavra? Diga: "How do I say it…?" ou "What\'s the word…?" e descreva a coisa. Muito melhor que travar.', [
    ['?Você esqueceu uma palavra no meio da frase:', 'How do I say it… the thing for fishing?', 'How I say it… the thing for fishing?', 'How do I speak it… the thing for fishing?'],
    ["What's the ___… the thing you use to water plants?", 'word', 'words', 'world'],
    ['?Qual está certa?', 'How do you say “regador” in English?', 'How you say “regador” in English?', 'How do you speak “regador” in English?'],
  ]),
  g('fillers', 'what_i_mean', 'What I mean is…', 'O que eu quero dizer é…', 'A2+', 'WHAT I MEAN IS… reformula quando a pessoa não entendeu: "What I mean is, we need more time."', [
    ['___, we need more time.', 'What I mean is', 'What I want say is', 'That I mean is'],
    ['?A pessoa não entendeu. Você reformula:', 'Sorry, what I mean is…', 'Sorry, what I want to say it is…', 'Sorry, that I mean is…'],
    ['What I ___ is, I like it, but it’s expensive.', 'mean', 'say', 'want'],
  ]),
  g('fillers', 'good_question', "That's a good question.", 'Boa pergunta.', 'A2', '"That\'s a good question…" e "Hmm, good question" ganham tempo de um jeito simpático antes de responder algo difícil.', [
    ['?Te fazem uma pergunta difícil. Para ganhar tempo:', "Hmm, that's a good question.", "Hmm, it's a good ask.", 'Hmm, a question good.'],
    ["That's a good ___. Let me think.", 'question', 'ask', 'answer'],
    ['?Qual soa natural?', 'Good question! I have no idea.', 'Good ask! I have no idea.', 'Question good! I have no idea.'],
  ]),
  g('fillers', 'like_filler', 'like', 'tipo (na fala)', 'A2+', 'Na conversa informal, LIKE funciona como o nosso "tipo": "It was, like, huge!" Use com moderação.', [
    ['It was, ___, huge!', 'like', 'as', 'how'],
    ['?Qual soa como fala informal natural?', 'She was, like, so happy.', 'She was, as, so happy.', 'She was, how, so happy.'],
    ['And then he was ___, "No way!"', 'like', 'as', 'how'],
  ]),

  // ── pequenas que confundem ──
  g('tricky', 'some_any', 'some / any', 'algum(a) / nenhum(a)', 'A2', 'SOME em frase positiva (e em ofertas: "Would you like some tea?"). ANY em pergunta e negativa: "Do you have any milk?", "I don\'t have any".', [
    ['Would you like ___ tea?', 'some', 'any', 'many'],
    ["We don't have ___ milk.", 'any', 'some', 'no'],
    ['Do you have ___ questions?', 'any', 'some', 'a'],
  ]),
  g('tricky', 'much_many', 'much / many', 'muito (incontável) / muitos (contável)', 'A2', 'MANY com coisas que se contam (many cups). MUCH com o que não se conta (much coffee), mais em pergunta e negativa: "How much?", "not much".', [
    ['How ___ cups do you need?', 'many', 'much', 'lot'],
    ["I don't have ___ time.", 'much', 'many', 'lot'],
    ['How ___ is this?', 'much', 'many', 'lot'],
  ]),
  g('tricky', 'few_little', 'a few / a little', 'uns poucos / um pouco', 'A2+', 'A FEW com contável (a few cookies). A LITTLE com incontável (a little sugar).', [
    ['Can I have ___ sugar?', 'a little', 'a few', 'many'],
    ['I caught ___ fish today.', 'a few', 'a little', 'much'],
    ['Just ___ minutes, please.', 'a few', 'a little', 'much'],
  ]),
  g('tricky', 'this_that', 'this / that / these / those', 'este / aquele (singular e plural)', 'A2', 'THIS/THESE = perto (singular/plural). THAT/THOSE = longe. "This cup" × "these cups"; "that tree" × "those trees".', [
    ['___ cups here are clean.', 'These', 'This', 'That'],
    ['Look at ___ birds over there!', 'those', 'that', 'these'],
    ['Is ___ your phone on the table there?', 'that', 'those', 'these'],
  ]),
  g('tricky', 'its', "its / it's", 'dele/dela (coisa) / é, está', 'A2', "IT'S = it is / it has. ITS = dele/dela (de uma coisa ou animal): \"The cat loves its bed.\"", [
    ['The cat loves ___ bed.', 'its', "it's", 'it'],
    ['___ raining again.', "It's", 'Its', 'It'],
    ['The plant lost ___ leaves.', 'its', "it's", 'his'],
  ]),
  g('tricky', 'your', "your / you're", 'seu / você é', 'A2', "YOU'RE = you are. YOUR = seu/sua. \"You're late!\" × \"Your coffee is ready.\"", [
    ['___ coffee is ready!', 'Your', "You're", 'You'],
    ['___ so funny!', "You're", 'Your', 'You'],
    ['Is this ___ fishing rod?', 'your', "you're", 'yours'],
  ]),
  g('tricky', 'there_their', "there / their / they're", 'lá / deles / eles são', 'A2+', "THERE = lá (e there is). THEIR = deles. THEY'RE = they are. Os três soam igual!", [
    ['The cups are over ___.', 'there', 'their', "they're"],
    ['They love ___ new house.', 'their', 'there', "they're"],
    ['___ coming at six.', "They're", 'Their', 'There'],
  ]),
  g('tricky', 'too_very', 'too / very', 'demais / muito', 'A2+', 'VERY = muito (neutro). TOO = demais (é um problema): "It\'s very hot" × "It\'s too hot to drink."', [
    ["It's ___ hot to drink. Wait a bit.", 'too', 'very', 'so much'],
    ['Thank you ___ much!', 'very', 'too', 'a lot'],
    ['?Você quer dizer que o sapato está pequeno demais (problema):', 'These shoes are too small.', 'These shoes are very small.', 'These shoes are much small.'],
  ]),
  g('tricky', 'too_either', 'too / either', 'também (positivo) / também não', 'A2+', 'TOO no fim de frase positiva: "I like it too." EITHER no fim de frase negativa: "I don\'t like it either." Resposta curta: "Me too" × "Me neither".', [
    ['“I love this song.” — “Me ___!”', 'too', 'either', 'neither'],
    ["I don't like spicy food ___.", 'either', 'too', 'also'],
    ['“I’m not hungry.” — “Me ___.”', 'neither', 'too', 'also'],
  ]),
  g('tricky', 'so_such', 'so / such', 'tão / tão (com substantivo)', 'A2+', 'SO + adjetivo: "so cute". SUCH (A) + adjetivo + substantivo: "such a cute cat", "such good news".', [
    ['Mucego is ___ cute!', 'so', 'such', 'such a'],
    ["She's ___ cute cat!", 'such a', 'so', 'such'],
    ['It was ___ a nice day.', 'such', 'so', 'very'],
  ]),
  g('tricky', 'already_yet', 'already / yet / still', 'já / ainda (não) / ainda', 'A2+', 'ALREADY = já (antes do esperado). YET = já/ainda, em pergunta e negativa, no fim: "Not yet". STILL = ainda (continua).', [
    ['“Is it ready?” — “Not ___.”', 'yet', 'already', 'still'],
    ["I've ___ watered the plants.", 'already', 'yet', 'still'],
    ["She's ___ sleeping.", 'still', 'yet', 'already'],
  ]),
  g('tricky', 'make_do', 'make / do', 'fazer (criar) / fazer (tarefa)', 'A2+', 'MAKE = criar, produzir (make coffee, make a cake, make a mistake). DO = tarefa, atividade (do homework, do the dishes, do me a favor).', [
    ['Can you ___ some coffee?', 'make', 'do', 'have'],
    ['I need to ___ the dishes.', 'do', 'make', 'have'],
    ['Everybody ___ mistakes.', 'makes', 'does', 'has'],
  ]),
];

export const GLUE_BY_ID: Record<string, GlueWord> = Object.fromEntries(GLUE.map((w) => [w.id, w]));

// "∅" vira texto legível nas opções
export const showOption = (o: string) => (o === '∅' ? '∅ (nada)' : o);
// frase completa (para ouvir e para o "montar a frase")
export const fillGap = (s: string, a: string) => s.replace('___', a === '∅' ? '' : a).replace(/\s{2,}/g, ' ').replace(/\s([,.!?])/g, '$1').trim();
