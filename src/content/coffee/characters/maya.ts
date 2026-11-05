import type { Character } from '../types';

const maya: Character = {
  id: 'maya',
  name: 'Maya',
  look: {
    skin: '#c98d63',
    hair: { style: 'cacheado', color: '#2b1d16' },
    shirt: { style: 'camiseta', color: '#f2cc8f' },
    pants: { style: 'saia', color: '#3d8a8f' },
    shoes: { style: 'sandália', color: '#7a5c45' },
  },
  personality_pt: 'Alegre, direta e carinhosa. Fala rápido quando está animada.',
  bio_pt: 'Maya namora Leo e Sam. Os três moram perto do café e adoram viajar.',
  chapters: [
    {
      id: 'maya-1',
      kind: 'chapter',
      theme: 'relationships',
      level: 'A2+',
      gapDays: 0,
      title_pt: 'Planos de viagem',
      summary_pt: 'Maya namora Leo e Sam há três anos. Os três estão planejando duas semanas em Portugal: Sam quer museus, Leo quer praia e Maya só quer comer bem.',
      steps: [
        { say: "Hi! I'm Maya. I'm waiting for my partners. We're planning a trip!", pt: 'Oi! Eu sou a Maya. Estou esperando meus parceiros. Estamos planejando uma viagem!', mood: 'happy' },
        { say: "Yes, partners, plural! I'm with Leo and Sam. We've been together for three years.", pt: 'Sim, parceiros, no plural! Estou com o Leo e o Sam. Estamos juntos há três anos.', mood: 'happy' },
        {
          activity: {
            id: 'react',
            type: 'choose_reply',
            items: ['g:going_to', 'trip'],
            options: [
              {
                text: "That's lovely! Where are you going to go?",
                correct: true,
                hearts: 1,
                reaction: { say: 'Portugal! Lisbon first, and then the beach.', pt: 'Portugal! Primeiro Lisboa, depois a praia.', mood: 'excited' },
              },
              {
                text: "Two partners? Isn't that complicated?",
                why_pt: 'A gramática está certa, mas soa como julgamento. Ela só contou uma notícia boa.',
                hearts: -1,
                reaction: { say: 'Ha, people ask me that a lot. It works for us.', pt: 'Ha, me perguntam muito isso. Para nós funciona.', mood: 'neutral' },
              },
              { text: "That's lovely! Where you are going?", why_pt: 'Em perguntas, o verbo "are" vem antes do sujeito: "Where are you going?"' },
            ],
          },
        },
        { say: "We're going to spend two weeks there. Sam wants museums, Leo wants the beach.", pt: 'Vamos passar duas semanas lá. O Sam quer museus, o Leo quer praia.', mood: 'thinking' },
        { say: 'And I just want good food and no arguments!', pt: 'E eu só quero comida boa e nenhuma discussão!', mood: 'happy' },
        {
          activity: {
            id: 'leo',
            type: 'comprehension',
            items: ['beach', 'partners'],
            question: 'What does Leo want to do in Portugal?',
            options: ['go to the beach', 'visit museums', 'eat good food'],
            answer: 0,
          },
        },
        {
          activity: {
            id: 'wish',
            type: 'build_reply',
            items: ['i_hope', 'trip'],
            text: 'I hope you have a great trip!',
            pt: 'Espero que vocês façam uma ótima viagem!',
            distractors: ['wish', 'having', 'travel'],
          },
        },
      ],
    },
    {
      id: 'maya-2',
      kind: 'chapter',
      theme: 'family',
      level: 'A2+',
      title_pt: 'A mãe não entende',
      summary_pt: 'A mãe da Maya perguntou qual dos dois é o namorado "de verdade". Maya está cansada de explicar. Leo sugeriu convidar a mãe para um café.',
      steps: [
        { say: 'Hey, you! Quick question before I tell you my news.', pt: 'Ei, você! Uma pergunta rápida antes de eu contar a novidade.', mood: 'happy' },
        {
          activity: {
            id: 'country',
            type: 'recall',
            from: 'maya-1',
            items: ['trip', 'g:going_to'],
            question: "Do you remember where we're going on our trip?",
            options: ['Portugal', 'Spain', 'Italy'],
            answer: 0,
          },
        },
        { say: 'Right! But... I told my mom about the trip, and she asked which one is my "real" boyfriend.', pt: 'Isso! Mas... contei para minha mãe sobre a viagem e ela perguntou qual é o meu namorado "de verdade".', mood: 'sad' },
        { say: "She doesn't get it. Both of them are real. I'm tired of explaining.", pt: 'Ela não entende. Os dois são de verdade. Estou cansada de explicar.', mood: 'tired' },
        {
          activity: {
            id: 'empathy',
            type: 'choose_reply',
            items: ['that_sounds_hard', 'g:past_simple'],
            options: [
              {
                text: 'That sounds hard. Did you talk to her about it?',
                correct: true,
                hearts: 1,
                reaction: { say: 'A little. Maybe I should try again, more calmly.', pt: 'Um pouco. Talvez eu deva tentar de novo, com mais calma.', mood: 'thinking' },
              },
              {
                text: "Well, she's your mom. She's always right.",
                why_pt: 'Toma o lado da mãe e ignora o que a Maya sente. Não é acolhedor.',
                hearts: -1,
                reaction: { say: "Hmm... I don't think so.", pt: 'Hum... acho que não.', mood: 'sad' },
              },
              { text: 'That sounds hard. Did you talked to her about it?', why_pt: 'Depois de "did", o verbo volta para a forma base: "Did you talk…?"' },
            ],
          },
        },
        { say: 'Leo says I should invite her for coffee. Here, with the cats. Cats make everything easier.', pt: 'O Leo diz que eu deveria convidá-la para um café. Aqui, com os gatos. Gatos deixam tudo mais fácil.', mood: 'happy' },
        {
          activity: {
            id: 'needs',
            type: 'gap',
            who: 'player',
            items: ['g:third_person_s', 'invite'],
            before: 'Good idea. Maybe she just ',
            after: ' more time.',
            answers: ['needs'],
            options: ['needs', 'need', 'needing'],
            pt: 'Boa ideia. Talvez ela só precise de mais tempo.',
          },
        },
      ],
    },
    {
      id: 'maya-3',
      kind: 'chapter',
      theme: 'family',
      level: 'A2+',
      title_pt: 'O café com a mãe',
      summary_pt: 'A mãe da Maya veio ao café e conversou uma hora com o Sam sobre plantas. Ela ainda tem dúvidas, mas está tentando. Ainda falta conhecer o Leo.',
      steps: [
        { say: 'Guess what happened yesterday!', pt: 'Adivinha o que aconteceu ontem!', mood: 'excited' },
        {
          activity: {
            id: 'who',
            type: 'recall',
            from: 'maya-2',
            items: ['invite'],
            question: 'Do you remember who Leo told me to invite for coffee?',
            options: ['my mom', 'my sister', 'my boss'],
            answer: 0,
          },
        },
        { say: 'Yes! My mom came. She was nervous, and so was I.', pt: 'Sim! Minha mãe veio. Ela estava nervosa, e eu também.', mood: 'worried' },
        { say: 'Then Sam started talking about his garden, and they talked for an hour! Mom loves plants.', pt: 'Aí o Sam começou a falar do jardim dele e eles conversaram por uma hora! Minha mãe ama plantas.', mood: 'excited' },
        {
          activity: {
            id: 'why',
            type: 'comprehension',
            items: ['g:past_simple'],
            question: "Why did Maya's mom and Sam talk for an hour?",
            options: ['They both love plants.', "Sam works with Maya's mom.", 'Her mom wanted a job.'],
            answer: 0,
          },
        },
        { say: "She still has questions, but she's trying. That means a lot.", pt: 'Ela ainda tem dúvidas, mas está tentando. Isso significa muito.', mood: 'love' },
        {
          activity: {
            id: 'support',
            type: 'choose_reply',
            items: ['happy_for_you', 'small_steps'],
            options: [
              {
                text: "I'm really happy for you. Small steps!",
                correct: true,
                hearts: 1,
                reaction: { say: 'Exactly. Small steps.', pt: 'Exatamente. Passinhos.', mood: 'happy' },
              },
              { text: "I'm really happy to you. Small steps!", why_pt: '"Happy for you" é a expressão para ficar feliz por alguém.' },
              { text: 'Finally! It took her long enough.', why_pt: 'Soa impaciente com a mãe dela. A Maya está comemorando um passo, não reclamando.' },
            ],
          },
        },
        {
          activity: {
            id: 'meet',
            type: 'gap',
            who: 'player',
            items: ['g:past_simple'],
            before: 'Did your mom ',
            after: ' Leo too?',
            answers: ['meet'],
            options: ['meet', 'met', 'meets'],
            pt: 'Sua mãe conheceu o Leo também?',
          },
        },
        { say: "Not yet. That's next month. Wish me luck!", pt: 'Ainda não. Isso é no mês que vem. Me deseje sorte!', mood: 'excited' },
      ],
    },
    {
      id: 'maya-4',
      kind: 'chapter',
      theme: 'relationships',
      level: 'A2+',
      title_pt: 'De volta de Lisboa',
      summary_pt: 'Maya voltou de Lisboa (o Leo se queimou de sol no primeiro dia). A mãe dela convidou os três para jantar no domingo.',
      steps: [
        { say: "I'm back! Lisbon was amazing. I've never eaten so many pastries in my life.", pt: 'Voltei! Lisboa foi incrível. Nunca comi tantos doces na minha vida.', mood: 'excited' },
        {
          activity: {
            id: 'leo-trip',
            type: 'recall',
            from: 'maya-1',
            items: ['beach'],
            question: 'Do you remember what Leo wanted to do on the trip?',
            options: ['go to the beach', 'visit museums', 'go shopping'],
            answer: 0,
          },
        },
        { say: 'He got sunburned on day one. Sam and I put sunscreen on him every morning after that.', pt: 'Ele se queimou de sol no primeiro dia. Depois disso, eu e o Sam passávamos protetor nele toda manhã.', mood: 'happy' },
        { say: "And the best part: my mom sent a message. 'Bring both of them for dinner on Sunday.'", pt: 'E a melhor parte: minha mãe mandou uma mensagem. "Traga os dois para jantar no domingo."', mood: 'love' },
        {
          activity: {
            id: 'sunday',
            type: 'comprehension',
            items: ['g:present_continuous_future'],
            question: 'What is happening on Sunday?',
            options: ["Dinner at Maya's mom's house", 'Another trip to Lisbon', 'A party at the café'],
            answer: 0,
          },
        },
        {
          activity: {
            id: 'nice',
            type: 'free_write',
            items: ['enjoy', 'happy_for_you'],
            prompt: 'Say something nice to Maya about the dinner.',
            prompt_pt: 'Diga algo legal para a Maya sobre o jantar.',
            keywords: [['happy', 'great', 'amazing', 'wonderful', 'good', 'nice', 'lovely', 'glad', 'fun', 'enjoy', 'luck', 'awesome', 'congrat']],
            examples: ["That's wonderful! Enjoy the dinner!", "I'm so happy for you. Good luck on Sunday!"],
          },
        },
        { say: 'Thank you. Honestly, this café helped. Next time, the coffee is on me!', pt: 'Obrigada. Sinceramente, este café ajudou. Da próxima vez, o café é por minha conta!', mood: 'love' },
      ],
    },
    {
      id: 'maya-s1',
      kind: 'chapter',
      theme: 'relationships',
      level: 'A2',
      minHearts: 5,
      title_pt: 'Um cartão-postal',
      summary_pt: 'Maya trouxe um cartão-postal de Lisboa para o café, assinado por ela, Leo e Sam.',
      steps: [
        { say: 'I brought you something from Lisbon. A postcard, from all three of us!', pt: 'Eu trouxe uma coisa de Lisboa para você. Um cartão-postal, de nós três!', mood: 'love' },
        { say: "Sam drew the cat. Leo wrote the message. I just signed it, haha.", pt: 'O Sam desenhou o gato. O Leo escreveu a mensagem. Eu só assinei, haha.', mood: 'happy' },
        {
          activity: {
            id: 'thanks',
            type: 'build_reply',
            items: ['thank_you_so_much'],
            text: "Thank you so much! I'm going to put it on the wall.",
            pt: 'Muito obrigado(a)! Vou colocar na parede.',
            distractors: ['putting', 'in', 'will'],
          },
        },
      ],
    },
  ],
  regulars: [
    {
      id: 'maya-r1',
      kind: 'regular',
      theme: 'drinks',
      level: 'A2',
      steps: [
        { say: 'Just my usual, please! A large latte with oat milk. Sam says hi!', pt: 'Só o de sempre, por favor! Um latte grande com leite de aveia. O Sam mandou um oi!', mood: 'happy' },
        { activity: { id: 'order', type: 'build_order', items: ['large', 'latte', 'oat_milk'], order: { size: 'large', drink: 'latte', milk: 'oat milk' } } },
        {
          activity: {
            id: 'hi',
            type: 'build_reply',
            items: ['say_hi'],
            text: 'Here you go! Say hi to Sam for me.',
            pt: 'Aqui está! Manda um oi para o Sam por mim.',
            distractors: ['tell', 'with', 'from'],
          },
        },
      ],
    },
    {
      id: 'maya-r2',
      kind: 'regular',
      theme: 'cats',
      level: 'A2',
      steps: [
        { say: 'The cats look so sleepy today. Which one is your favorite?', pt: 'Os gatos parecem tão sonolentos hoje. Qual é o seu favorito?', mood: 'happy' },
        {
          activity: {
            id: 'fav',
            type: 'free_write',
            items: ['favorite'],
            prompt: 'Tell Maya which cat is your favorite and why.',
            prompt_pt: 'Conte para a Maya qual gato é seu favorito e por quê.',
            keywords: [['cat', 'elias', 'orange', 'one', 'him', 'her', 'favorite', 'love', 'like', 'cute']],
            examples: ['Elias is my favorite. He is so lazy and cute!', 'I love the orange one because he is friendly.'],
          },
        },
      ],
    },
  ],
};

export default maya;
