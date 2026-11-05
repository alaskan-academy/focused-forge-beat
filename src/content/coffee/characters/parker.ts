import type { Character } from '../types';
import { ask, build, chapter, choose, gap, no, ok, order, recall, regular, say, write } from '../dsl';

// Mr. Parker: aposentado, formal, morou em vários países, sente falta da esposa. Humor seco.
const parker: Character = {
  id: 'parker',
  name: 'Mr. Parker',
  look: {
    skin: '#f6d3b3',
    hair: { style: 'curto', color: '#d8d2c4' },
    shirt: { style: 'manga longa', color: '#3d405b' },
    pants: { style: 'calça', color: '#7a5c45' },
    shoes: { style: 'bota', color: '#2b1d16' },
  },
  personality_pt: 'Formal, educadíssimo e com um humor seco britânico.',
  bio_pt: 'Arthur Parker é aposentado, foi diplomata e morou no Japão, no Egito e no Canadá com a esposa, Eleanor, que faleceu.',
  chapters: [
    chapter('parker-1', 'Chá verde', 'Mr. Parker é aposentado e formal. A falecida esposa, Eleanor, tomava chá verde toda tarde. Eles moraram no Japão, no Egito e no Canadá.', 'life', 'A2+', [
      say('Good afternoon. Would it be possible to have a green tea, please?', 'Boa tarde. Seria possível um chá verde, por favor?', 'neutral'),
      order('order', ['would_it_be_possible', 'green_tea'], { drink: 'green tea' }),
      say('Thank you. My late wife, Eleanor, used to drink green tea every afternoon.', 'Obrigado. Minha falecida esposa, Eleanor, tomava chá verde toda tarde.', 'sad'),
      say('We lived in Japan, Egypt and Canada. She loved tea in every country.', 'Moramos no Japão, no Egito e no Canadá. Ela amava chá em todos os países.', 'love'),
      choose('wife', ['g:did_vs_was'], [
        ok('She sounds wonderful. Where did you live first?', say("Japan, in 1971. I didn't know how to use chopsticks.", 'No Japão, em 1971. Eu não sabia usar hashis.', 'happy'), 1),
        no('She sounds wonderful. Where did you lived first?', 'Depois de "did", verbo base: "Where did you live…?"'),
        no("OK. That'll be three dollars.", 'Ele está compartilhando uma lembrança; cortar assim é frio.', -1, say('Of course. How efficient.', 'Claro. Que eficiente.', 'sad')),
      ]),
      ask('countries', ['g:past_simple'], 'Where did Mr. Parker live with Eleanor?', ['Japan, Egypt and Canada', 'Brazil, Italy and Spain', 'only in England']),
    ], { gapDays: 0 }),

    chapter('parker-2', 'Terno no deserto', 'No Egito, Mr. Parker trabalhava na embaixada e usava terno com quarenta graus. Eleanor ria dele todo santo dia.', 'life', 'A2+', [
      recall('first', 'parker-1', ['g:did_vs_was'], 'Do you recall in which country Eleanor and I lived first?', ['Japan', 'Egypt', 'Canada']),
      say('In Egypt, I used to work at the embassy. I wore a suit at forty degrees.', 'No Egito, eu trabalhava na embaixada. Usava terno com quarenta graus.', 'thinking'),
      say('Eleanor used to laugh at me every single day. Rightly so.', 'Eleanor ria de mim todo santo dia. Com razão.', 'love'),
      ask('suit', ['g:used_to'], 'What did Mr. Parker use to wear in Egypt?', ['a suit', 'shorts', 'a uniform']),
      gap('was', ['g:did_vs_was'], 'player', '', 'Was', ' it hard to work in that heat?', 'Era difícil trabalhar naquele calor?', ['Was', 'Did', 'Were']),
      say('Hard? It was a sauna with paperwork.', 'Difícil? Era uma sauna com papelada.', 'happy'),
    ]),

    chapter('parker-3', 'Cinquenta e dois anos', 'No aniversário de 52 anos de casamento, Mr. Parker estava triste. Eleanor diria: "Arthur, pare de drama e coma um biscoito."', 'feelings', 'A2+', [
      recall('heat', 'parker-2', ['g:used_to'], 'What did I use to wear in Egypt, if you remember?', ['a suit', 'a hat', 'sandals']),
      say('Today is our anniversary. Fifty-two years. I find it rather difficult.', 'Hoje é nosso aniversário de casamento. Cinquenta e dois anos. Acho bem difícil.', 'sad'),
      choose('anniv', ['so_sorry', 'g:register_formal'], [
        ok("I'm so sorry. Would you like me to sit with you for a moment?", say('That is very kind of you. Just a moment, yes.', 'É muita gentileza sua. Só um momento, sim.', 'love'), 1),
        no('Happy anniversary! Party time!', 'Ele está de luto; a animação aqui não combina.', -1),
        no("I'm so sorry. Would you like that I sit with you?", 'Estrutura certa: "Would you like ME TO sit…?"'),
      ]),
      say("Eleanor would say, 'Arthur, stop being dramatic and eat a biscuit.'", 'Eleanor diria: "Arthur, pare de drama e coma um biscoito."', 'happy'),
      ask('name', ['anniversary'], "On their anniversary, what is Mr. Parker's first name?", ['Arthur', 'Eleanor', 'Thomas']),
    ]),

    chapter('parker-4', 'Portugal, sozinho', 'Aos 81 anos, Mr. Parker decidiu viajar sozinho para Portugal. O filho acha perigoso; ele disse que perigoso foi casar com a mãe dele.', 'life', 'A2+', [
      recall('years', 'parker-3', ['anniversary'], 'Do you remember how many years Eleanor and I were married on our anniversary?', ['fifty-two', 'twenty-five', 'forty']),
      say('I have decided to travel again. Portugal. Alone, at eighty-one.', 'Decidi viajar de novo. Portugal. Sozinho, aos oitenta e um.', 'excited'),
      say("My son says it's dangerous. I said, 'So was marrying your mother.'", 'Meu filho diz que é perigoso. Eu disse: "Casar com a sua mãe também foi."', 'happy'),
      ask('trip', ['g:present_perfect'], 'Where is Mr. Parker going?', ['to Portugal, alone', 'to Japan, with his son', 'nowhere']),
      write('wish', ['i_hope', 'g:register_formal'], 'Wish Mr. Parker a good trip (formal is fine!).', 'Deseje uma boa viagem ao Mr. Parker (pode ser formal!).', [['trip', 'journey', 'travel', 'safe', 'enjoy', 'wonderful', 'good', 'hope', 'luck']], [
        'I hope you have a wonderful trip, Mr. Parker.',
        'Have a safe journey and enjoy Portugal!',
      ]),
      say('Thank you. I shall send a postcard to the cats.', 'Obrigado. Mandarei um cartão-postal para os gatos.', 'love'),
    ]),
  ],
  regulars: [
    regular('parker-r1', 'drinks', 'B1', [
      say('Good morning. I was wondering if I could have a small cappuccino, please.', 'Bom dia. Eu estava pensando se poderia tomar um cappuccino pequeno, por favor.', 'neutral'),
      order('order', ['i_was_wondering', 'small', 'cappuccino'], { size: 'small', drink: 'cappuccino' }),
      build('reply', ['certainly', 'g:register_formal'], 'Certainly, sir. Coming right up.', 'Certamente, senhor. Já sai.', ['certain', 'come', 'surely']),
    ]),
    regular('parker-r2', 'life', 'A2+', [
      say('Young person, may I ask you something? Did you use to read newspapers?', 'Jovem, posso lhe perguntar uma coisa? Você costumava ler jornal?', 'thinking'),
      gap('read', ['g:used_to'], 'player', 'Not really. I ', 'used to', ' read the news on my phone.', 'Não muito. Eu costumava ler as notícias no celular.', ['used to', 'use to', 'using to']),
      say('On a phone. How tragic. How convenient.', 'No celular. Que trágico. Que conveniente.', 'neutral'),
    ]),
  ],
};

export default parker;
