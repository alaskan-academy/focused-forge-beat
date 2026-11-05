import type { Character } from '../types';

const tom: Character = {
  id: 'tom',
  name: 'Tom',
  look: {
    skin: '#f6d3b3',
    hair: { style: 'curto', color: '#a0622d' },
    shirt: { style: 'manga longa', color: '#5b6ea8' },
    pants: { style: 'calça', color: '#7a5c45' },
    shoes: { style: 'bota', color: '#3d405b' },
  },
  personality_pt: 'Gentil, meio desastrado, ri de si mesmo.',
  bio_pt: 'Tom se divorciou há pouco tempo e se mudou para a rua do café. Está aprendendo a cozinhar e a morar sozinho.',
  chapters: [
    {
      id: 'tom-1',
      kind: 'chapter',
      theme: 'life',
      level: 'A2',
      gapDays: 0,
      title_pt: 'Vida nova',
      summary_pt: 'Tom se mudou para a rua do café depois do divórcio. Comeu pizza por dois meses e agora está aprendendo a fazer massa.',
      steps: [
        { say: 'Hi... sorry, first time here. I just moved to this street.', pt: 'Oi... desculpa, primeira vez aqui. Acabei de me mudar para esta rua.', mood: 'embarrassed' },
        { say: 'New apartment, new life. I got divorced in March.', pt: 'Apartamento novo, vida nova. Eu me divorciei em março.', mood: 'sad' },
        {
          activity: {
            id: 'sorry',
            type: 'choose_reply',
            items: ['im_sorry_to_hear'],
            options: [
              {
                text: "I'm sorry to hear that. How are you doing?",
                correct: true,
                hearts: 1,
                reaction: { say: 'Better, thanks. Some days are weird, but OK.', pt: 'Melhor, obrigado. Alguns dias são estranhos, mas tudo bem.', mood: 'neutral' },
              },
              {
                text: 'Oh. OK. Next, please!',
                why_pt: 'Ignora o que ele acabou de contar. Fica frio demais.',
                hearts: -1,
                reaction: { say: 'Ah... right. Sorry.', pt: 'Ah... certo. Desculpa.', mood: 'embarrassed' },
              },
              { text: "I'm sorry for hear that. How are you doing?", why_pt: 'A expressão é "sorry TO hear that".' },
            ],
          },
        },
        { say: 'The hardest part? Cooking. I lived on pizza for two months.', pt: 'A parte mais difícil? Cozinhar. Vivi de pizza por dois meses.', mood: 'embarrassed' },
        {
          activity: {
            id: 'pizza',
            type: 'comprehension',
            items: ['g:past_simple'],
            question: 'What did Tom eat for two months?',
            options: ['pizza', 'pasta', 'salad'],
            answer: 0,
          },
        },
        { say: "This week I'm learning to make pasta. Any tips?", pt: 'Esta semana estou aprendendo a fazer massa. Alguma dica?', mood: 'thinking' },
        {
          activity: {
            id: 'tip',
            type: 'gap',
            who: 'player',
            items: ['g:should_advice'],
            before: 'You ',
            after: ' start with a simple tomato sauce.',
            answers: ['should'],
            options: ['should', 'should to', 'must to'],
            pt: 'Você deveria começar com um molho de tomate simples.',
          },
        },
      ],
    },
    {
      id: 'tom-2',
      kind: 'chapter',
      theme: 'home',
      level: 'A2',
      title_pt: 'A lasanha',
      summary_pt: 'Tom tentou fazer lasanha para a irmã e queimou tudo; o prédio inteiro ficou cheirando a fumaça. Próximo desafio: sopa.',
      steps: [
        {
          activity: {
            id: 'cook',
            type: 'recall',
            from: 'tom-1',
            items: ['remember', 'learning'],
            question: 'Hey! Do you remember what I was learning to cook?',
            options: ['pasta', 'sushi', 'bread'],
            answer: 0,
          },
        },
        { say: 'Well, the pasta was fine. So I tried lasagna for my sister...', pt: 'Bom, a massa ficou ok. Aí eu tentei fazer lasanha para minha irmã...', mood: 'embarrassed' },
        { say: 'I burned it. The whole building smelled like smoke. The neighbors were not happy.', pt: 'Queimei. O prédio inteiro ficou com cheiro de fumaça. Os vizinhos não ficaram felizes.', mood: 'embarrassed' },
        {
          activity: {
            id: 'advice',
            type: 'choose_reply',
            items: ['g:should_advice', 'g:past_simple'],
            options: [
              {
                text: 'Oh no! Maybe you should try something easier first.',
                correct: true,
                hearts: 1,
                reaction: { say: 'Ha, my sister said the same thing.', pt: 'Ha, minha irmã disse a mesma coisa.', mood: 'happy' },
              },
              { text: 'Oh no! Maybe you should to try something easier first.', why_pt: 'Depois de "should", o verbo vem sem "to".' },
              { text: 'Oh no! Why you burned it?', why_pt: 'Pergunta no passado usa "did": "Why did you burn it?"' },
            ],
          },
        },
        {
          activity: {
            id: 'everyone',
            type: 'build_reply',
            items: ['at_the_beginning', 'g:third_person_s'],
            text: 'Everyone burns something at the beginning.',
            pt: 'Todo mundo queima alguma coisa no começo.',
            distractors: ['burned', 'end', 'nobody'],
          },
        },
        { say: "That's kind. OK, next weekend: soup. What can go wrong with soup?", pt: 'Que gentil. Ok, próximo fim de semana: sopa. O que pode dar errado com sopa?', mood: 'happy' },
      ],
    },
    {
      id: 'tom-3',
      kind: 'chapter',
      theme: 'pets',
      level: 'A2+',
      title_pt: 'Biscuit',
      summary_pt: 'Tom adotou um cachorro de abrigo chamado Biscuit: tem três anos, é tímido e segue o Tom por todo lado.',
      steps: [
        { say: "Big news! I'm not alone in the apartment anymore.", pt: 'Grande novidade! Não estou mais sozinho no apartamento.', mood: 'excited' },
        { say: "I adopted a dog from the shelter. His name is Biscuit. He's three and a little scared of everything.", pt: 'Adotei um cachorro do abrigo. O nome dele é Biscuit. Ele tem três anos e tem um pouco de medo de tudo.', mood: 'love' },
        {
          activity: {
            id: 'where',
            type: 'comprehension',
            items: ['adopted', 'shelter'],
            question: 'Where did Tom get his dog?',
            options: ['from a shelter', 'from his sister', 'from a pet shop'],
            answer: 0,
          },
        },
        {
          activity: {
            id: 'like',
            type: 'choose_reply',
            items: ['whats_he_like'],
            options: [
              {
                text: "Aww! What's he like?",
                correct: true,
                hearts: 1,
                reaction: { say: 'Shy, but he follows me everywhere. Even to the bathroom.', pt: 'Tímido, mas me segue por todo lado. Até no banheiro.', mood: 'love' },
              },
              { text: 'Aww! How is he like?', why_pt: 'Para perguntar como alguém é (personalidade), usa-se "What is he like?"' },
              {
                text: 'A dog? In an apartment? Bad idea.',
                why_pt: 'Julgamento desnecessário. Ele está todo feliz com a novidade.',
                hearts: -1,
                reaction: { say: "It's a big apartment... I think.", pt: 'É um apartamento grande... eu acho.', mood: 'worried' },
              },
            ],
          },
        },
        {
          activity: {
            id: 'calmer',
            type: 'gap',
            who: 'player',
            items: ['g:comparatives'],
            before: 'He sounds ',
            after: ' than the cats here. They never stop running!',
            answers: ['calmer'],
            options: ['calmer', 'more calmer', 'calmest'],
            pt: 'Ele parece mais calmo que os gatos daqui. Eles não param de correr!',
          },
        },
      ],
    },
    {
      id: 'tom-4',
      kind: 'chapter',
      theme: 'pets',
      level: 'A2+',
      title_pt: 'Um sapato a menos',
      summary_pt: 'Biscuit comeu um sapato do Tom. Mas o jantar para a irmã deu certo: nada queimou!',
      steps: [
        {
          activity: {
            id: 'dogname',
            type: 'recall',
            from: 'tom-3',
            items: ['remember'],
            question: "Hi! Do you remember my dog's name?",
            options: ['Biscuit', 'Cookie', 'Muffin'],
            answer: 0,
          },
        },
        { say: 'Yesterday he ate one of my shoes. Just one. Now I have a very expensive single shoe.', pt: 'Ontem ele comeu um dos meus sapatos. Só um. Agora tenho um pé de sapato muito caro.', mood: 'embarrassed' },
        { say: 'But guess what? I cooked dinner for my sister, and nothing burned!', pt: 'Mas adivinha? Fiz o jantar para minha irmã e nada queimou!', mood: 'excited' },
        {
          activity: {
            id: 'shoe',
            type: 'comprehension',
            items: ['g:past_simple'],
            question: 'What did Biscuit do yesterday?',
            options: ["He ate one of Tom's shoes.", 'He burned the dinner.', 'He ran away.'],
            answer: 0,
          },
        },
        {
          activity: {
            id: 'congrats',
            type: 'free_write',
            items: ['proud_of_you'],
            prompt: 'Congratulate Tom on the dinner.',
            prompt_pt: 'Parabenize o Tom pelo jantar.',
            keywords: [['congrat', 'well done', 'great', 'amazing', 'proud', 'awesome', 'good job', 'nice', 'wow', 'fantastic']],
            examples: ["Congratulations! I'm proud of you.", 'Well done! Your sister was lucky.'],
          },
        },
        { say: "Thanks. Six months ago I couldn't boil an egg. Life changes, huh?", pt: 'Valeu. Seis meses atrás eu não sabia nem cozinhar um ovo. A vida muda, né?', mood: 'love' },
      ],
    },
  ],
  regulars: [
    {
      id: 'tom-r1',
      kind: 'regular',
      theme: 'drinks',
      level: 'A2',
      steps: [
        { say: 'Large black coffee to go, please. Biscuit is waiting outside!', pt: 'Café preto grande para viagem, por favor. O Biscuit está esperando lá fora!', mood: 'happy' },
        { activity: { id: 'order', type: 'build_order', items: ['large', 'black_coffee', 'to_go'], order: { size: 'large', drink: 'black coffee', where: 'to go' } } },
      ],
    },
    {
      id: 'tom-r2',
      kind: 'regular',
      theme: 'home',
      level: 'A2',
      steps: [
        { say: "I'm trying a new recipe tonight. What should I cook?", pt: 'Vou testar uma receita nova hoje à noite. O que eu deveria cozinhar?', mood: 'thinking' },
        {
          activity: {
            id: 'recipe',
            type: 'free_write',
            items: ['g:should_advice'],
            prompt: 'Suggest something for Tom to cook.',
            prompt_pt: 'Sugira algo para o Tom cozinhar.',
            keywords: [['should', 'try', 'cook', 'make', "why don't", 'how about', 'what about', 'maybe']],
            examples: ['You should make soup!', 'How about pancakes? They are easy.'],
          },
        },
      ],
    },
  ],
};

export default tom;
