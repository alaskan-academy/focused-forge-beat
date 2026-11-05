// Conversas avulsas (clientes não recorrentes). `withOrder: true` emenda um pedido depois.
import type { Scene } from './types';

export const TALKS: Scene[] = [
  {
    id: 'talk-weekend-01',
    kind: 'talk',
    theme: 'smalltalk',
    level: 'A2',
    steps: [
      { say: "Ugh, it's raining again. My whole weekend plan is ruined.", pt: 'Argh, está chovendo de novo. Meu plano do fim de semana foi todo por água abaixo.', mood: 'sad' },
      { say: "I was going to go hiking. Now I'm going to watch movies all day, I guess.", pt: 'Eu ia fazer trilha. Agora acho que vou ver filmes o dia todo.', mood: 'tired' },
      {
        activity: {
          id: 'plan',
          type: 'comprehension',
          items: ['g:going_to', 'hiking'],
          question: 'What was her plan for the weekend?',
          options: ['to go hiking', 'to watch movies', 'to work'],
          answer: 0,
        },
      },
      {
        activity: {
          id: 'reply',
          type: 'choose_reply',
          items: ['g:going_to', 'cozy'],
          options: [
            {
              text: 'That sounds cozy, honestly! What are you going to watch?',
              correct: true,
              reaction: { say: 'Probably something with cats. Obviously.', pt: 'Provavelmente algo com gatos. Óbvio.', mood: 'happy' },
            },
            { text: 'That sounds cozy, honestly! What you are going to watch?', why_pt: 'Em perguntas, "are" vem antes de "you": "What are you going to watch?"' },
            { text: 'Hiking is boring anyway.', why_pt: 'Desvaloriza o plano dela em vez de animar.' },
          ],
        },
      },
    ],
  },
  {
    id: 'talk-interview-01',
    kind: 'talk',
    theme: 'work',
    level: 'B1',
    withOrder: true,
    steps: [
      { say: 'I have a job interview in an hour. My hands are shaking.', pt: 'Tenho uma entrevista de emprego daqui a uma hora. Minhas mãos estão tremendo.', mood: 'worried' },
      { say: "It's for a marketing job. I really, really want it.", pt: 'É para uma vaga de marketing. Eu quero muito, muito.', mood: 'worried' },
      {
        activity: {
          id: 'calm',
          type: 'choose_reply',
          items: ['youve_got_this', 'deep_breath', 'job_interview'],
          options: [
            {
              text: "You've got this! Just take a deep breath.",
              correct: true,
              reaction: { say: 'OK. Deep breath. Thank you.', pt: 'Ok. Respirar fundo. Obrigada.', mood: 'happy' },
            },
            { text: "You've get this! Just take a deep breath.", why_pt: '"You\'ve got this" é uma expressão fixa, sempre com "got".' },
            { text: "Don't be nervous, it's only a job.", why_pt: 'Minimiza o que ela sente; para ela é importante.' },
          ],
        },
      },
      {
        activity: {
          id: 'practice',
          type: 'gap',
          who: 'player',
          items: ['g:should_advice'],
          before: 'Maybe you should ',
          after: ' your answers one more time.',
          answers: ['practice', 'practise', 'review', 'go over'],
          options: ['practice', 'practicing', 'to practice'],
          pt: 'Talvez você devesse praticar suas respostas mais uma vez.',
        },
      },
    ],
  },
  {
    id: 'talk-neighbor-01',
    kind: 'talk',
    theme: 'home',
    level: 'A2+',
    steps: [
      { say: 'My new neighbor plays the drums. Every. Single. Night.', pt: 'Meu vizinho novo toca bateria. Toda. Santa. Noite.', mood: 'angry' },
      { say: 'Last night he played until two in the morning!', pt: 'Ontem à noite ele tocou até as duas da manhã!', mood: 'tired' },
      {
        activity: {
          id: 'problem',
          type: 'comprehension',
          items: ['neighbor', 'g:past_simple'],
          question: "What's the problem with her neighbor?",
          options: ['He plays the drums at night.', 'He has a big dog.', 'He is very rude to her.'],
          answer: 0,
        },
      },
      {
        activity: {
          id: 'advice',
          type: 'free_write',
          items: ['g:should_advice'],
          prompt: 'Give her some advice.',
          prompt_pt: 'Dê um conselho para ela.',
          keywords: [['should', 'could', "why don't", 'maybe', 'try', 'talk', 'ask', 'how about']],
          examples: ['You should talk to him.', 'Maybe you could ask him to stop at ten.'],
        },
      },
    ],
  },
];
