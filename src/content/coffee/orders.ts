// Pedidos (cenas kind 'order'). Cada `orderType` treina estruturas diferentes; veja CONTENT_GUIDE.md.
import type { Scene } from './types';

export const ORDERS: Scene[] = [
  {
    id: 'ord-basic-01',
    kind: 'order',
    orderType: 'basic',
    theme: 'drinks',
    level: 'A2',
    steps: [
      { say: 'Hi! Can I get a medium cappuccino with almond milk, please?', pt: 'Oi! Pode me ver um cappuccino médio com leite de amêndoas, por favor?', mood: 'happy' },
      {
        activity: {
          id: 'order',
          type: 'build_order',
          items: ['can_i_get', 'medium', 'cappuccino', 'almond_milk'],
          order: { size: 'medium', drink: 'cappuccino', milk: 'almond milk' },
        },
      },
      { say: "Thanks! That's four twenty-five, right? Here's a ten.", pt: 'Obrigada! São quatro e vinte e cinco, né? Aqui tem uma nota de dez.', mood: 'neutral' },
      {
        activity: {
          id: 'change',
          type: 'change',
          items: ['g:prices', 'change'],
          question: 'How much change do you give her?',
          price_cents: 425,
          paid_cents: 1000,
          options: ['$5.75', '$6.75', '$5.25', '$4.75'],
          answer: 0,
        },
      },
    ],
  },
  {
    id: 'ord-allergy-01',
    kind: 'order',
    orderType: 'allergy',
    theme: 'food',
    level: 'A2+',
    steps: [
      { say: "Hi! I'd like something sweet with my coffee, but I'm allergic to nuts.", pt: 'Oi! Eu queria algo doce com o meu café, mas sou alérgica a nozes/castanhas.', mood: 'worried' },
      { say: 'Which one is safe for me?', pt: 'Qual é seguro para mim?', mood: 'thinking' },
      {
        activity: {
          id: 'safe',
          type: 'safe_pick',
          items: ['allergic', 'nuts', 'sweet'],
          question: 'Which one can she eat?',
          avoid: ['nuts'],
          options: ['banana bread', 'almond croissant', 'blueberry muffin', 'carrot cake'],
          answer: 2,
          why_pt: 'O pão de banana e o bolo de cenoura levam nozes; o croissant leva amêndoas.',
        },
      },
      {
        activity: {
          id: 'nonuts',
          type: 'gap',
          who: 'player',
          items: ['g:third_person_s', 'nuts'],
          before: 'The blueberry muffin ',
          after: " have any nuts. You're safe!",
          answers: ["doesn't", 'does not'],
          options: ["doesn't", "don't", "isn't"],
          pt: 'O muffin de mirtilo não tem nozes. Pode comer tranquila!',
        },
      },
    ],
  },
  {
    id: 'ord-indecisive-01',
    kind: 'order',
    orderType: 'indecisive',
    theme: 'food',
    level: 'A2+',
    steps: [
      { say: "Hmm... I can't decide. I just had lunch.", pt: 'Hum... não consigo decidir. Acabei de almoçar.', mood: 'thinking' },
      { say: 'I want something sweet, but not too heavy.', pt: 'Quero algo doce, mas não muito pesado.', mood: 'thinking' },
      {
        activity: {
          id: 'rec',
          type: 'recommend',
          items: ['sweet', 'heavy', 'g:too_enough'],
          question: 'What do you recommend?',
          wants: ['sweet', 'light'],
          options: ['lemon cake', 'brownie', 'cheese toastie', 'carrot cake'],
          answer: 0,
          why_pt: 'Brownie e bolo de cenoura são pesados; o misto quente não é doce.',
        },
      },
      {
        activity: {
          id: 'lighter',
          type: 'choose_reply',
          items: ['g:comparatives'],
          prompt_pt: 'Explique a sua sugestão:',
          options: [
            {
              text: 'The lemon cake is lighter than the brownie.',
              correct: true,
              reaction: { say: 'Perfect. Lemon cake it is!', pt: 'Perfeito. Vai ser o bolo de limão!', mood: 'happy' },
            },
            { text: 'The lemon cake is more light than the brownie.', why_pt: 'Adjetivo curto faz comparativo com -er: "lighter".' },
            { text: 'The lemon cake is the lightest than the brownie.', why_pt: 'Superlativo ("the lightest") não usa "than".' },
          ],
        },
      },
    ],
  },
  {
    id: 'ord-complaint-01',
    kind: 'order',
    orderType: 'complaint',
    theme: 'ordering',
    level: 'A2+',
    steps: [
      { say: 'Excuse me... I ordered an iced latte, but this one is hot.', pt: 'Com licença... eu pedi um latte gelado, mas este está quente.', mood: 'worried' },
      { say: "And it's a little too sweet for me.", pt: 'E está um pouco doce demais para mim.', mood: 'worried' },
      {
        activity: {
          id: 'problem',
          type: 'comprehension',
          items: ['iced', 'g:too_enough'],
          question: "What's wrong with the drink?",
          options: ["It's hot, and it's too sweet.", "It's cold, and it's too bitter.", "It's the wrong size."],
          answer: 0,
        },
      },
      {
        activity: {
          id: 'reply',
          type: 'choose_reply',
          items: ['so_sorry', 'let_me'],
          options: [
            {
              text: "I'm so sorry! Let me make you a new one.",
              correct: true,
              reaction: { say: "Thank you, that's really kind.", pt: 'Obrigada, é muito gentil.', mood: 'happy' },
            },
            { text: "It's not my problem, sorry.", why_pt: 'Grosseiro. Numa reclamação, peça desculpas e ofereça uma solução.' },
            { text: "I'm so sorry! Let me to make you a new one.", why_pt: 'Depois de "let me", o verbo vem sem "to".' },
          ],
        },
      },
    ],
  },
  {
    id: 'ord-phone-01',
    kind: 'order',
    orderType: 'phone',
    channel: 'phone',
    theme: 'work',
    level: 'A2+',
    steps: [
      { say: "Hi, it's Dana from the office upstairs. Can I order for the team?", pt: 'Oi, é a Dana do escritório lá de cima. Posso fazer um pedido para a equipe?', mood: 'happy' },
      { say: "Two lattes, one green tea, and three chocolate cookies, please. We'll pick up the order in ten minutes.", pt: 'Dois lattes, um chá verde e três cookies de chocolate, por favor. A gente busca o pedido em dez minutos.', mood: 'neutral' },
      {
        activity: {
          id: 'group',
          type: 'group_order',
          items: ['g:quantities', 'pick_up'],
          order: { latte: 2, 'green tea': 1, 'chocolate cookie': 3 },
          choices: ['latte', 'cappuccino', 'green tea', 'iced tea', 'chocolate cookie', 'brownie'],
        },
      },
      {
        activity: {
          id: 'ready',
          type: 'build_reply',
          items: ['ready'],
          text: "Sure! It'll be ready in ten minutes.",
          pt: 'Claro! Vai estar pronto em dez minutos.',
          distractors: ['minute', 'already', 'will'],
        },
      },
    ],
  },
];
