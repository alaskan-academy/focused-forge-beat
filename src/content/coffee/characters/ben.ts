import type { Character } from '../types';
import { ask, change, chapter, choose, gap, no, ok, order, recall, regular, say, write } from '../dsl';

// Ben: demitido, autodepreciativo, transforma tudo em piada. Treina para entrevistas.
const ben: Character = {
  id: 'ben',
  name: 'Ben',
  look: {
    skin: '#6e4630',
    hair: { style: 'curto', color: '#2b1d16' },
    shirt: { style: 'camiseta', color: '#c4554d' },
    pants: { style: 'calça', color: '#3d405b' },
    shoes: { style: 'tênis', color: '#3d405b' },
  },
  personality_pt: 'Irônico e autodepreciativo. Faz piada de tudo, principalmente de si mesmo.',
  bio_pt: 'Ben acabou de ser demitido. Está se preparando para entrevistas de emprego, com muito café e pouco dinheiro.',
  chapters: [
    chapter('ben-1', 'Não é você, é o orçamento', 'Ben foi demitido ontem. O chefe disse "não é você, é o orçamento", a mesma frase que a ex dele usou.', 'work', 'A2+', [
      say("Hey. Small black coffee, please. I'm on a budget now.", 'Oi. Café preto pequeno, por favor. Tô economizando agora.', 'tired'),
      order('order', ['small', 'black_coffee'], { size: 'small', drink: 'black coffee' }),
      say("I got fired yesterday. My boss said, 'It's not you, it's the budget.'", 'Fui demitido ontem. Meu chefe disse: "Não é você, é o orçamento."', 'sad'),
      say("Funny. That's exactly what my ex said.", 'Engraçado. Foi exatamente o que a minha ex disse.', 'thinking'),
      choose('fired', ['fired', 'im_sorry_to_hear', 'g:going_to'], [
        ok("I'm sorry to hear that. What are you going to do now?", say('Update my CV. Cry a little. In that order.', 'Atualizar meu currículo. Chorar um pouco. Nessa ordem.', 'tired'), 1),
        no("I'm sorry to hear that. What are you going to doing now?", 'Depois de "going to" vem o verbo base: "going to do".'),
        no('Well, maybe you were bad at your job.', 'Cruel. Ele acabou de ser demitido.', -1, say('Wow. Thanks for the coffee and the trauma.', 'Nossa. Obrigado pelo café e pelo trauma.', 'sad')),
      ]),
      ask('why', ['g:irregular_past'], "What did Ben's boss say?", ["It's not you, it's the budget.", "You're the best employee.", 'See you on Monday.']),
    ], { gapDays: 0 }),

    chapter('ben-2', 'Treino de entrevista', 'Ben tem entrevista de emprego na quinta e treinou com você. No emprego antigo, gerenciava cinco pessoas e uma impressora (que era a chefe de verdade).', 'work', 'A2+', [
      recall('reason', 'ben-1', ['g:irregular_past'], 'Remember the classic line my boss used to fire me?', ["It's not you, it's the budget.", 'You talk too much.', "We're moving to Mars."]),
      say('I have a job interview on Thursday. Can you practice with me? Ask me a question.', 'Tenho uma entrevista de emprego na quinta. Treina comigo? Me faz uma pergunta.', 'worried'),
      choose('ask', ['g:did_vs_was', 'job_interview'], [
        ok('Sure! What did you do in your last job?', say('I made spreadsheets. Beautiful, emotional spreadsheets.', 'Eu fazia planilhas. Planilhas lindas e emocionantes.', 'happy')),
        no('Sure! What you did in your last job?', 'Pergunta no passado: "What DID you do…?"'),
        no('Sure! What were you do in your last job?', 'Com verbo de ação (do), use "did", não "were".'),
      ]),
      gap('managed', ['g:past_simple'], 'customer', 'Also, in my last job I ', 'managed', ' a team of five people.', 'E no meu último emprego eu gerenciei uma equipe de cinco pessoas.', ['managed', 'manage', 'managing']),
      say('Five people and one printer. The printer was the real boss.', 'Cinco pessoas e uma impressora. A impressora era a chefe de verdade.', 'happy'),
    ]),

    chapter('ben-3', 'Mãe?', 'Na entrevista, Ben chamou a entrevistadora de "mãe". Por outro lado, ela riu. Ele vai mandar um e-mail de agradecimento bem-humorado.', 'work', 'A2+', [
      recall('day', 'ben-2', ['job_interview'], 'Do you remember what day my job interview was?', ['Thursday', 'Monday', 'Saturday']),
      say("It was... a disaster. I called the interviewer 'Mom'.", 'Foi... um desastre. Chamei a entrevistadora de "mãe".', 'embarrassed'),
      say("On the other hand, she laughed. So maybe I'm memorable?", 'Por outro lado, ela riu. Então talvez eu seja inesquecível?', 'thinking'),
      ask('good', ['on_the_other_hand'], "What was the good part of Ben's interview?", ['The interviewer laughed.', 'He got the job.', "He wasn't nervous."]),
      choose('cheer', ['give_up', 'g:should_advice'], [
        ok("Don't give up. You should send a funny thank-you email!", say("A thank-you email. From her 'son'. Genius.", 'Um e-mail de agradecimento. Do "filho" dela. Genial.', 'happy'), 1),
        no("Don't give up. You should sending a thank-you email!", 'Depois de "should", verbo base: "should send".'),
        no("Yeah, you're never getting that job.", 'Mesmo se fosse verdade, não ajuda ninguém.', -1, say('Cool. Cool cool cool.', 'Legal. Legal, legal, legal.', 'sad')),
      ]),
    ]),

    chapter('ben-4', 'Contratado', 'A entrevistadora contratou o Ben: achou ele "humano de um jeito revigorante". Ele começa na segunda e, pela primeira vez, está animado com uma segunda-feira.', 'work', 'A2+', [
      recall('word', 'ben-3', ['g:irregular_past'], "What did I call the interviewer? Don't laugh.", ['Mom', 'Boss', 'Darling']),
      say("Guess what. She hired me! She said I was 'refreshingly human'.", 'Adivinha. Ela me contratou! Disse que eu era "humano de um jeito revigorante".', 'excited'),
      gap('hired', ['g:past_simple'], 'player', 'Wait, she ', 'hired', " you? That's amazing!", 'Peraí, ela te contratou? Que incrível!', ['hired', 'hire', 'hiring']),
      say("I start on Monday. I used to hate Mondays. Now I'm kinda excited.", 'Começo na segunda. Eu odiava segundas. Agora tô meio animado.', 'happy'),
      write('congrats', ['proud_of_you'], 'Congratulate Ben!', 'Parabenize o Ben!', [['congrat', 'proud', 'amazing', 'awesome', 'great', 'well done', 'happy', 'yay']], [
        "Congratulations, Ben! I'm proud of you.",
        "That's awesome! Well done!",
      ]),
      say('Thanks. First paycheck, the coffee is on me. Small, though.', 'Valeu. No primeiro salário, o café é por minha conta. Pequeno, mas é.', 'love'),
    ]),
  ],
  regulars: [
    regular('ben-r1', 'ordering', 'A2', [
      say("Black coffee, please. Here's five dollars.", 'Café preto, por favor. Aqui tem cinco dólares.', 'neutral'),
      say('Keep the change. No, wait. I need the change.', 'Pode ficar com o troco. Não, peraí. Eu preciso do troco.', 'embarrassed'),
      change('change', ['change', 'g:prices'], "The black coffee is $2.75. How much change does Ben get from five dollars?", 275, 500, [325, 175, 250]),
    ]),
    regular('ben-r2', 'work', 'A2+', [
      say("Rate my LinkedIn headline: 'Professional Spreadsheet Artist'. Too much?", 'Avalia meu título do LinkedIn: "Artista Profissional de Planilhas". Exagerado?', 'thinking'),
      choose('rate', ['g:too_enough'], [
        ok("It's funny, but maybe a little too much for LinkedIn.", say("Fine. 'Spreadsheet Professional'. Boring, but employed.", 'Tá. "Profissional de Planilhas". Chato, mas empregado.', 'neutral')),
        no("It's funny, but maybe a little too many for LinkedIn.", '"Too many" é para coisas contáveis (too many people); aqui é "too much".'),
        no("It's terrible. Delete your account.", 'Ríspido demais para um pedido de opinião.', -1),
      ]),
    ]),
  ],
};

export default ben;
