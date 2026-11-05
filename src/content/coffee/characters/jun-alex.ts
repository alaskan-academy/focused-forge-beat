import type { Character } from '../types';
import { ask, chapter, choose, gap, group, no, ok, recall, regular, say, write } from '../dsl';

// Jun e Alex: casal que acabou de abrir o relacionamento. Alex é o da planilha; Jun é o empolgado.
// (Vocabulário da aula "Non-monogamy & modern relationships".)
const junAlex: Character = {
  id: 'jun-alex',
  name: 'Jun & Alex',
  look: {
    skin: '#e8b48f',
    hair: { style: 'coque', color: '#2b1d16' },
    shirt: { style: 'camiseta', color: '#3d8a8f' },
    pants: { style: 'short', color: '#7a5c45' },
    shoes: { style: 'tênis', color: '#f2ead8' },
  },
  personality_pt: 'Jun é empolgado e impulsivo; Alex é organizado e faz planilha para tudo. Os dois se amam e implicam um com o outro.',
  bio_pt: 'Jun e Alex estão juntos há oito anos e acabaram de abrir o relacionamento. Estão aprendendo a conversar sobre limites, ciúme e confiança.',
  chapters: [
    chapter('ja-1', 'A planilha dos limites', 'Jun e Alex abriram o relacionamento há uma semana. Antes de tudo, estão conversando sobre limites, e o Alex fez uma planilha.', 'relationships', 'A2+', [
      say("Hi! Two flat whites, please. We're celebrating!", 'Oi! Dois flat whites, por favor. Estamos comemorando!', 'excited', 'Jun'),
      say("We're not celebrating. We're 'having a calm conversation about boundaries'.", 'Não estamos comemorando. Estamos "tendo uma conversa calma sobre limites".', 'thinking', 'Alex'),
      group('order', ['flat_white', 'g:quantities'], { 'flat white': 2 }, ['flat white', 'latte', 'cappuccino', 'green tea']),
      say("We're in an open relationship now. It's been one week since we decided.", 'Agora a gente tem um relacionamento aberto. Faz uma semana que decidimos.', 'happy', 'Jun'),
      ask('what', ['open_relationship', 'g:it_has_been'], 'What did Jun and Alex decide one week ago?', ['to open their relationship', 'to get married', 'to move to another city']),
      choose('react', ['boundaries'], [
        ok("Oh, nice! So you're talking about boundaries first?", say('Exactly. Alex made a spreadsheet.', 'Exatamente. O Alex fez uma planilha.', 'happy', 'Jun'), 1),
        no('Oh no. Which one of you is cheating?', 'Relacionamento aberto é um acordo, não traição. Soa como julgamento.', -1, say("Nobody. That's literally the point.", 'Ninguém. Esse é literalmente o ponto.', 'angry', 'Alex')),
        no("Oh, nice! So you're talking about boundary first?", 'Aqui é plural: "boundaries" (os limites/acordos).'),
      ]),
    ], { gapDays: 0 }),

    chapter('ja-2', 'Regra número cinco', 'Regras novas de Jun e Alex: contar tudo um ao outro, sem segredos; e nada de sair com a pessoa que trabalha no café.', 'relationships', 'A2+', [
      recall('sheet', 'ja-1', ['remember', 'boundaries'], 'Remember what Alex made for our boundaries?', ['a spreadsheet', 'a cake', 'a playlist']),
      say('Rule number four: total honesty. No secrets.', 'Regra número quatro: honestidade total. Sem segredos.', 'happy', 'Alex'),
      gap('each', ['each_other', 'g:going_to'], 'customer', "We're gonna tell ", 'each other', ' everything.', 'A gente vai contar tudo um pro outro.', ['each other', 'each others', 'other each']),
      say('Rule number five: no dating the barista. Sorry.', 'Regra número cinco: nada de sair com quem trabalha no café. Foi mal.', 'happy', 'Jun'),
      choose('joke', ['agreement'], [
        ok('Ha! My heart is broken, but I respect the agreement.', say('See? Everybody respects the spreadsheet.', 'Viu? Todo mundo respeita a planilha.', 'happy', 'Alex'), 1),
        no('Ha! My heart is broken, but I respect the agree.', 'O substantivo é "agreement" (acordo); "agree" é verbo.'),
        no("That's a stupid rule.", 'Grosseiro, e a regra é deles. Brincar é ok, desrespeitar não.', -1),
      ]),
      ask('rule5', ['g:gerund_subject'], 'What is rule number five?', ['no dating the barista', 'no secrets', 'no coffee after 6 p.m.']),
    ]),

    chapter('ja-3', 'Cinco por cento de ciúme', 'Jun foi a um encontro com o OK do Alex. Alex sentiu "uns cinco por cento" de ciúme e comeu um bolo inteiro à 1 da manhã. Depois conversaram.', 'relationships', 'A2+', [
      recall('rule', 'ja-2', ['remember'], 'Do you remember rule number five? The one about you?', ['no dating the barista', 'no secrets', 'no spreadsheets']),
      say('So... I went on a date last night. Alex said it was OK.', 'Então... eu fui a um encontro ontem à noite. O Alex disse que tudo bem.', 'embarrassed', 'Jun'),
      say('It WAS OK. I was just a tiny bit jealous. Like, five percent.', 'ESTAVA tudo bem. Eu só fiquei um tiquinho com ciúme. Tipo, cinco por cento.', 'thinking', 'Alex'),
      say('You ate a whole cake at 1 a.m.', 'Você comeu um bolo inteiro à 1 da manhã.', 'happy', 'Jun'),
      ask('feel', ['jealous'], 'How did Alex feel last night?', ['a little jealous', 'very happy', 'angry at the barista']),
      choose('support', ['jealous', 'g:gerund_subject'], [
        ok('Feeling jealous is normal. Did you talk about it this morning?', say('We did. With coffee. Coffee helps.', 'Conversamos. Com café. Café ajuda.', 'love', 'Alex'), 1),
        no("Jealous? Then open relationships aren't for you.", 'Julgamento rápido demais: sentir ciúme não significa que não funciona.', -1),
        no('Feel jealous is normal. Did you talk about it?', 'Como sujeito da frase, o verbo vai com -ing: "FEELING jealous is normal".'),
      ]),
    ]),

    chapter('ja-4', 'Check de sentimentos', 'Jun e Alex decidiram ter menos regras e mais conversa: um "check de sentimentos" todo domingo. O segredo, segundo eles: confiança e lanchinhos.', 'relationships', 'B1', [
      recall('cake', 'ja-3', ['g:irregular_past'], 'What did Alex eat at 1 a.m.? Be honest.', ['a whole cake', 'a pizza', 'nothing']),
      gap('rather', ['g:would_rather'], 'customer', "Update: we'd ", 'rather', ' have fewer rules and more conversations.', 'Novidade: a gente prefere ter menos regras e mais conversas.', ['rather', 'prefer', 'better']),
      say("What if we did a 'feelings check' every Sunday?", 'E se a gente fizesse um "check de sentimentos" todo domingo?', 'thinking', 'Jun'),
      ask('sunday', ['g:what_if'], 'What does Jun suggest?', ['a feelings check every Sunday', 'a new spreadsheet', 'a trip to Portugal']),
      write('opinion', ['trust'], 'What do you think makes a relationship work?', 'O que você acha que faz um relacionamento dar certo?', [['trust', 'talk', 'communication', 'respect', 'honest', 'love', 'listen', 'patience', 'care']], [
        'I think trust and communication make a relationship work.',
        'Being honest and listening to each other.',
      ]),
      say("Trust and snacks. That's our secret.", 'Confiança e lanchinhos. Esse é o nosso segredo.', 'love', 'Alex'),
    ]),
  ],
  regulars: [
    regular('ja-r1', 'drinks', 'A2', [
      say('One latte and one... Alex, what do you want?', 'Um latte e um... Alex, o que você quer?', 'thinking', 'Jun'),
      say('Surprise me. Actually, no. A hot chocolate.', 'Me surpreende. Na verdade, não. Um chocolate quente.', 'happy', 'Alex'),
      group('order', ['g:quantities', 'actually'], { latte: 1, 'hot chocolate': 1 }, ['latte', 'hot chocolate', 'mocha', 'green tea']),
    ]),
    regular('ja-r2', 'relationships', 'A2+', [
      say('Question for the jury. Would you rather know everything or know very little?', 'Pergunta para o júri. Você prefere saber tudo ou saber bem pouco?', 'thinking', 'Jun'),
      write('rather', ['g:would_rather'], 'Answer with "I\'d rather..." and say why.', 'Responda com "I\'d rather..." e diga por quê.', [['rather', 'prefer']], [
        "I'd rather know everything, because I hate surprises.",
        "I'd rather know very little. Less drama!",
      ]),
      say('Interesting. Alex, write that down.', 'Interessante. Alex, anota isso.', 'happy', 'Jun'),
    ]),
  ],
};

export default junAlex;
