import type { Character } from '../types';
import { ask, chapter, choose, gap, group, no, ok, order, recall, regular, say, write } from '../dsl';

// Dana: gerente de marketing do escritório de cima. Fala em métricas, CTAs e público-alvo.
// (Vocabulário da aula "Talking about the past": campaigns, target audience, engagement…)
const dana: Character = {
  id: 'dana',
  name: 'Dana',
  look: {
    skin: '#f6d3b3',
    hair: { style: 'coque', color: '#d9a94e' },
    shirt: { style: 'manga longa', color: '#3d405b' },
    pants: { style: 'calça', color: '#2b1d16' },
    shoes: { style: 'bota', color: '#c4554d' },
  },
  personality_pt: 'Corporativa, rápida e acidamente engraçada. Transforma tudo em métrica.',
  bio_pt: 'Dana é gerente de marketing digital no escritório de cima. Vive entre campanhas, CTAs e reuniões que poderiam ser um e-mail.',
  chapters: [
    chapter('dana-1', 'Público-alvo: pessoas com pés', 'Dana trabalha com marketing digital no escritório de cima. Está lançando uma campanha de meias para um público-alvo bem "nichado": pessoas com pés.', 'work', 'A2+', [
      say('Good morning. One flat white, please. I need to boost my energy by forty percent.', 'Bom dia. Um flat white, por favor. Preciso aumentar minha energia em quarenta por cento.', 'neutral'),
      order('order', ['flat_white'], { drink: 'flat white' }),
      say("I work in digital marketing. Today we're launching a campaign for... socks.", 'Trabalho com marketing digital. Hoje vamos lançar uma campanha de... meias.', 'thinking'),
      say("Our target audience is 'people with feet'. Very niche.", 'Nosso público-alvo é "pessoas com pés". Bem nichado.', 'happy'),
      ask('audience', ['target_audience'], "Who is Dana's target audience?", ['people with feet', 'cat owners', 'coffee lovers']),
      choose('react', ['engagement', 'i_hope'], [
        ok('Ha! Good luck with the launch. I hope the engagement is great.', say("Thank you. I'll send you the metrics. You won't read them.", 'Obrigada. Vou te mandar as métricas. Você não vai ler.', 'happy'), 1),
        no('Ha! Good luck with the launch. I hope the engagement are great.', '"Engagement" é singular: "is".'),
        no("Socks? That's the most boring thing ever.", 'Pode até pensar, mas falar assim é grosseiro.', -1, say('Boring sells. Ask any bank.', 'Chato vende. Pergunta pra qualquer banco.', 'neutral')),
      ]),
    ], { gapDays: 0 }),

    chapter('dana-2', 'O CTA desastroso', 'A campanha de meias da Dana fracassou: o CTA dizia "compre meias agora ou se arrependa para sempre". As pessoas denunciaram o anúncio, mas o cliente achou "corajoso".', 'work', 'A2+', [
      recall('product', 'dana-1', ['remember'], 'Remember what product my campaign was for?', ['socks', 'shoes', 'sunglasses']),
      say("The campaign failed. We used the wrong CTA. It said 'Buy socks now or regret it forever.'", 'A campanha fracassou. Usamos o CTA errado. Dizia: "Compre meias agora ou se arrependa para sempre."', 'sad'),
      say('Instead of buying socks, people reported us. Twice.', 'Em vez de comprar meias, as pessoas denunciaram a gente. Duas vezes.', 'embarrassed'),
      ask('fail', ['g:did_vs_was', 'instead_of'], 'Was the campaign successful?', ['No, it failed.', 'Yes, it was a big success.', "It didn't start yet."]),
      gap('did', ['g:did_vs_was'], 'player', '', 'Did', ' the client get angry?', 'O cliente ficou bravo?', ['Did', 'Was', 'Were']),
      say("The client? The client loved it. He said it was 'brave'.", 'O cliente? O cliente amou. Disse que foi "corajoso".', 'happy'),
    ]),

    chapter('dana-3', 'Sobrecarregada', 'Dana está sobrecarregada: três campanhas, dois chefes e uma máquina de café que a odeia. Ela amava o trabalho; agora sonha com planilhas.', 'work', 'A2+', [
      recall('reported', 'dana-2', ['g:irregular_past'], 'Do you remember what people did instead of buying socks? They...', ['reported us', 'bought shoes', 'ignored us']),
      say("I'm overwhelmed. Three campaigns, two bosses, one coffee machine that hates me.", 'Tô sobrecarregada. Três campanhas, dois chefes, uma máquina de café que me odeia.', 'tired'),
      say('I used to love this job. Now I dream about spreadsheets.', 'Eu amava esse trabalho. Agora sonho com planilhas.', 'tired'),
      choose('advice', ['overwhelmed', 'g:should_advice'], [
        ok('That sounds overwhelming. Maybe you should take a day off.', say('A day off? What is that, a new app?', 'Um dia de folga? O que é isso, um app novo?', 'thinking'), 1),
        no('That sounds overwhelmed. Maybe you should take a day off.', 'A situação é "overwhelming" (sufocante); a pessoa é que fica "overwhelmed".'),
        no("Everybody's busy, Dana.", 'Seco demais com alguém sobrecarregada.', -1, say('Thank you for that deep insight.', 'Obrigada por essa reflexão profunda.', 'angry')),
      ]),
      ask('used', ['g:used_to'], 'How did Dana use to feel about her job?', ['She used to love it.', 'She used to hate it.', "She didn't use to work."]),
    ]),

    chapter('dana-4', 'A melhor ideia', 'Dana seguiu o conselho: tirou um dia de folga e foi à praia sem notebook. Lá teve a melhor ideia da vida: uma campanha para o próprio café.', 'work', 'A2+', [
      recall('dream', 'dana-3', ['g:used_to'], 'What do I dream about now? Remember?', ['spreadsheets', 'the beach', 'socks']),
      say('I took your advice. I took a day off and went to the beach. Alone. No laptop.', 'Segui seu conselho. Tirei um dia de folga e fui à praia. Sozinha. Sem notebook.', 'happy'),
      say('Then I had the best idea of my life: a campaign for... this café.', 'Aí tive a melhor ideia da minha vida: uma campanha para... este café.', 'excited'),
      ask('idea', ['g:superlatives'], "What was Dana's best idea?", ['a campaign for the café', 'a new sock brand', 'a café on the beach']),
      write('slogan', ['g:register_informal'], 'Help Dana: write a short slogan for the café.', 'Ajude a Dana: escreva um slogan curto para o café.', [['coffee', 'cat', 'cafe', 'café', 'cozy', 'latte', 'purr', 'meow', 'love']], [
        'Coffee, cats and good vibes.',
        'Come for the coffee, stay for the cats!',
      ]),
      say('Love it. Strong CTA. Zero socks. Approved.', 'Amei. CTA forte. Zero meias. Aprovado.', 'love'),
    ]),
  ],
  regulars: [
    regular('dana-r1', 'work', 'A2+', [
      say("Two cappuccinos and one croissant for the meeting. We're gonna pick them up in five.", 'Dois cappuccinos e um croissant para a reunião. A gente busca em cinco minutos.', 'neutral'),
      group('order', ['g:quantities', 'gonna'], { cappuccino: 2, croissant: 1 }, ['cappuccino', 'latte', 'croissant', 'brownie', 'green tea']),
    ]),
    regular('dana-r2', 'work', 'A2+', [
      say('Quick survey for my campaign. Would you rather have cats or coffee?', 'Pesquisa rápida para a minha campanha. Você prefere gatos ou café?', 'thinking'),
      write('rather', ['g:would_rather'], 'Answer Dana\'s survey with "I\'d rather...".', 'Responda à pesquisa da Dana com "I\'d rather...".', [['rather', 'prefer']], [
        "I'd rather have both, obviously.",
        "I'd rather have cats. Coffee doesn't purr.",
      ]),
      say('Both. Noted. Very helpful data.', 'Os dois. Anotado. Dados muito úteis.', 'happy'),
    ]),
  ],
};

export default dana;
