// Despedidas de "esperar a outra pessoa": entram no fim do atendimento de um cliente recorrente
// quando o(a) parceiro(a) ainda não conversou com ele nesta visita. O cliente fica no café esperando.
//
// Marcadores (trocados pelo nome/pronome do outro jogador, ver personalize.ts):
//   {partner} nome · {sub}/{Sub} she|he · {obj} her|him · {pos} her|his · {ela}/{Ela} ela|ele (no pt)
import type { Scene } from './types';

export const HANDOFFS: Scene[] = [
  {
    id: 'handoff-01',
    kind: 'handoff',
    theme: 'smalltalk',
    level: 'A2',
    steps: [
      { say: 'It was nice talking to you! Have you seen {partner} around?', pt: 'Foi bom conversar com você! Você viu {partner} por aí?', mood: 'happy' },
      { say: 'I want to tell {obj} something.', pt: 'Quero contar uma coisa para {ela}.', mood: 'thinking' },
      {
        activity: {
          id: 'where',
          type: 'choose_reply',
          items: ['g:object_pronouns', 'g:will_offers', 'looking_for', 'right_now'],
          options: [
            {
              text: "{Sub}'s not here right now, but I'll tell {obj} you're looking for {obj}.",
              correct: true,
              hearts: 1,
              reaction: { say: "Thanks! I'll wait a little.", pt: 'Valeu! Vou esperar um pouquinho.', mood: 'happy' },
            },
            {
              text: "{Sub}'s not here right now, but I'll tell {sub} you're looking for {sub}.",
              why_pt: 'Depois de "tell" e de "for" vem o pronome objeto: "tell {obj}", "for {obj}".',
            },
            {
              text: 'No idea. Not my problem.',
              why_pt: 'Grosseiro. Dá para dizer que não sabe e ainda assim ajudar.',
              hearts: -1,
              reaction: { say: 'Oh... OK then.', pt: 'Ah... tá bom então.', mood: 'sad' },
            },
          ],
        },
      },
    ],
  },
  {
    id: 'handoff-02',
    kind: 'handoff',
    theme: 'smalltalk',
    level: 'A2',
    steps: [
      { say: "Is {partner} coming today? I'd like to say hi.", pt: '{partner} vem hoje? Eu queria dar um oi.', mood: 'happy' },
      {
        activity: {
          id: 'soon',
          type: 'gap',
          who: 'player',
          items: ['be_back', 'g:will_offers'],
          before: "{Sub}'ll be back ",
          after: '. Do you want to wait?',
          answers: ['soon'],
          options: ['soon', 'since', 'yet'],
          pt: '{Ela} volta logo. Quer esperar?',
        },
      },
      { say: "Sure, I'll stay a bit longer.", pt: 'Claro, vou ficar mais um pouco.', mood: 'happy' },
    ],
  },
  {
    id: 'handoff-03',
    kind: 'handoff',
    theme: 'smalltalk',
    level: 'A2',
    steps: [
      { say: 'Can you give {partner} a message? Tell {obj} I said hi!', pt: 'Pode dar um recado para {partner}? Diga que eu mandei um oi!', mood: 'happy' },
      {
        activity: {
          id: 'letknow',
          type: 'build_reply',
          items: ['message', 'g:will_offers', 'g:object_pronouns'],
          text: "Of course! I'll let {obj} know.",
          pt: 'Claro! Vou avisar {ela}.',
          distractors: ['{sub}', 'will', 'knows'],
        },
      },
    ],
  },
  {
    id: 'handoff-04',
    kind: 'handoff',
    theme: 'smalltalk',
    level: 'A2+',
    steps: [
      { say: 'Before I go: is {partner} working today?', pt: 'Antes de eu ir: {partner} está trabalhando hoje?', mood: 'thinking' },
      {
        activity: {
          id: 'later',
          type: 'choose_reply',
          items: ['later', 'g:present_continuous_future'],
          options: [
            {
              text: "I think {sub}'s coming in later.",
              correct: true,
              reaction: { say: "Great, I'll wait for {obj} then.", pt: 'Ótimo, então vou esperar por {ela}.', mood: 'happy' },
            },
            { text: 'I think {sub} coming in later.', why_pt: 'Falta o verbo "is": o certo é "{sub}\'s coming" ({sub} is coming).' },
            { text: "I think {sub}'s come in later.", why_pt: 'Para algo combinado no futuro usa-se is + -ing: "{sub}\'s coming".' },
          ],
        },
      },
    ],
  },
  {
    id: 'handoff-05',
    kind: 'handoff',
    theme: 'smalltalk',
    level: 'A2',
    steps: [
      { say: "I'll stay here a bit longer. I want to see {partner} too!", pt: 'Vou ficar aqui mais um pouco. Quero ver {partner} também!', mood: 'happy' },
      {
        activity: {
          id: 'here',
          type: 'gap',
          who: 'player',
          items: ['a_bit_longer', 'g:will_offers'],
          before: "Great! I'll tell {obj} you're ",
          after: '.',
          answers: ['here'],
          options: ['here', 'hear', 'where'],
          pt: 'Ótimo! Vou avisar {ela} que você está aqui.',
        },
      },
    ],
  },
  {
    id: 'handoff-06',
    kind: 'handoff',
    theme: 'smalltalk',
    level: 'A2',
    steps: [
      { say: 'Oh! If you see {partner}, can you give {obj} a message for me?', pt: 'Ah! Se você encontrar {partner}, pode dar um recado meu para {ela}?', mood: 'thinking' },
      { say: "Tell {obj} I have a surprise for {obj}. I'll wait here!", pt: 'Diga que eu tenho uma surpresa para {ela}. Vou esperar aqui!', mood: 'excited' },
      {
        activity: {
          id: 'promise',
          type: 'free_write',
          items: ['message', 'g:will_offers'],
          prompt: 'Promise you will give {partner} the message.',
          prompt_pt: 'Prometa que vai dar o recado para {partner}.',
          keywords: [['tell', 'let', 'say', 'give', 'message', 'know', 'sure', 'of course', 'ok', 'okay', 'promise']],
          examples: ["Sure, I'll tell {obj}!", "Of course, I'll let {obj} know.", 'I promise I will give {obj} the message.'],
        },
      },
    ],
  },
];
