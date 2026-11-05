// Estante de livros: ideias de grandes nomes do ensino de línguas, resumidas com palavras nossas
// (não são citações). Cada folha é um passo em direção à fluência, com uma dica prática.

export type BookPage = {
  id: string;
  author: string;
  title: string;
  idea_pt: string;
  practice_pt: string;
  english: string; // uma frase em inglês para ler em voz alta
  english_pt: string;
};

export const BOOK_PAGES: BookPage[] = [
  {
    id: 'krashen-input',
    author: 'Stephen Krashen',
    title: 'Entender vem primeiro',
    idea_pt:
      'Krashen defende que a gente adquire uma língua principalmente entendendo mensagens, não decorando regras. O ponto ideal é um conteúdo um pouquinho acima do seu nível, que você entende pelo contexto.',
    practice_pt: 'Leia e ouça coisas que você entende quase tudo, mas não tudo. As falas dos clientes do café foram escritas assim.',
    english: 'If you understand most of it, you are learning.',
    english_pt: 'Se você entende a maior parte, está aprendendo.',
  },
  {
    id: 'krashen-filter',
    author: 'Stephen Krashen',
    title: 'O filtro do medo',
    idea_pt: 'Outra ideia dele: ansiedade e vergonha funcionam como um filtro que bloqueia o aprendizado. Quanto mais relaxado, mais a língua "entra".',
    practice_pt: 'Errar no Coffee Cats não custa nada de verdade. Riam dos erros (o Ben chamou a entrevistadora de "Mom" e foi contratado).',
    english: 'Mistakes are part of the coffee.',
    english_pt: 'Erros fazem parte do café.',
  },
  {
    id: 'lewis-chunks',
    author: 'Michael Lewis',
    title: 'A língua é feita de blocos',
    idea_pt:
      'Na abordagem lexical, Lewis mostra que falantes nativos não montam frases palavra por palavra: eles usam blocos prontos, os chunks ("I\'m on my way", "it\'s up to you"). Aprender blocos inteiros deixa a fala mais rápida e natural.',
    practice_pt: 'Abra o quadro-negro atrás do balcão: a cada 12 horas chega um chunk novo. Tente usar o chunk do dia numa conversa real com a outra pessoa.',
    english: "It's up to you, but I'd learn the whole chunk.",
    english_pt: 'Você que sabe, mas eu aprenderia o bloco inteiro.',
  },
  {
    id: 'nation-strands',
    author: 'Paul Nation',
    title: 'As quatro partes do treino',
    idea_pt:
      'Nation sugere dividir o estudo em quatro partes mais ou menos iguais: entender (ler e ouvir), produzir (falar e escrever), estudar a forma (gramática e vocabulário) e ganhar fluência (usar rápido o que você já sabe).',
    practice_pt: 'Equilibrem: conversas no café (entender), escrita livre (produzir), caderninho (forma) e revisão rápida dos cards (fluência).',
    english: 'Listen, speak, study and repeat.',
    english_pt: 'Ouça, fale, estude e repita.',
  },
  {
    id: 'nation-reading',
    author: 'Paul Nation',
    title: 'Ler muito, e fácil',
    idea_pt:
      'Para ler com prazer e aprender palavras pelo contexto, o texto precisa ser quase todo conhecido: uma ou duas palavras novas a cada cem. Ler muito material fácil rende mais do que sofrer com um texto difícil.',
    practice_pt: 'Procurem "graded readers" (livros adaptados) nível A2. Um capítulo por dia, sem dicionário a cada linha.',
    english: 'Easy reading is not lazy reading.',
    english_pt: 'Leitura fácil não é leitura preguiçosa.',
  },
  {
    id: 'ebbinghaus-forgetting',
    author: 'Hermann Ebbinghaus',
    title: 'A curva do esquecimento',
    idea_pt: 'Ebbinghaus mediu que esquecemos muito rápido nos primeiros dias, e que cada revisão no momento certo faz a memória durar mais.',
    practice_pt: 'É por isso que o jogo traz palavras e chunks de volta em intervalos cada vez maiores. Faça a revisão dos cards quando houver itens vencidos.',
    english: 'Review it before you forget it.',
    english_pt: 'Revise antes de esquecer.',
  },
  {
    id: 'pimsleur-recall',
    author: 'Paul Pimsleur',
    title: 'Lembrar puxando da memória',
    idea_pt: 'Pimsleur mostrou que tentar lembrar ativamente (antes de ver a resposta) fixa muito mais do que só reler. O esforço de buscar a palavra é o treino.',
    practice_pt: 'Na revisão, tente falar a resposta em voz alta ANTES de virar o card. Errar tentando vale mais que acertar olhando.',
    english: 'Try to remember first, then check.',
    english_pt: 'Tente lembrar primeiro, depois confira.',
  },
  {
    id: 'swain-output',
    author: 'Merrill Swain',
    title: 'Falar mostra o que falta',
    idea_pt:
      'Swain percebeu que alunos que só ouviam entendiam bem, mas travavam para falar. Produzir (falar e escrever) obriga a gente a perceber o que ainda não sabe e a procurar a forma certa.',
    practice_pt: 'Nas perguntas de escrita livre, escreva mesmo que saia imperfeito. E leiam as falas dos clientes em voz alta.',
    english: 'Speaking shows you what you need to learn.',
    english_pt: 'Falar mostra o que você precisa aprender.',
  },
  {
    id: 'long-interaction',
    author: 'Michael Long',
    title: 'Conversar e negociar sentido',
    idea_pt:
      'Long destacou o valor de conversar com alguém e "negociar" o sentido: pedir para repetir, perguntar o que a pessoa quis dizer, reformular. Esse vaivém é onde muita coisa se aprende.',
    practice_pt: 'Treinem juntos usando "What do you mean?", "Hang on a second" e "Can you say that again?". A atividade "Vamoo ligar para agradecer?" vai ajudar nisso.',
    english: 'What do you mean? Can you say that again?',
    english_pt: 'Como assim? Pode repetir?',
  },
  {
    id: 'bjork-difficulties',
    author: 'Robert Bjork',
    title: 'Dificuldades que ajudam',
    idea_pt:
      'Bjork chama de "dificuldades desejáveis" os pequenos esforços que tornam o estudo mais lento na hora, mas a memória mais forte depois: misturar temas, esconder a resposta, espaçar as revisões.',
    practice_pt: 'Por isso o café mistura pedidos, conversas e temas, e a tradução custa moedas. Se pareceu um pouco difícil, está funcionando.',
    english: 'A little difficulty makes memory stronger.',
    english_pt: 'Um pouco de dificuldade fortalece a memória.',
  },
  {
    id: 'shadowing',
    author: 'Alexander Arguelles',
    title: 'Shadowing: a sombra da fala',
    idea_pt:
      'Arguelles popularizou o "shadowing": ouvir uma frase e repetir junto, imitando o ritmo e a entonação, como uma sombra. Treina pronúncia e fluência ao mesmo tempo.',
    practice_pt: 'Escolha uma fala de cliente de que você gostou e repita três vezes em voz alta, exagerando a entonação. Funciona ainda melhor com séries.',
    english: 'Repeat it like a shadow, with the same rhythm.',
    english_pt: 'Repita como uma sombra, com o mesmo ritmo.',
  },
  {
    id: 'lomb-interest',
    author: 'Kató Lomb',
    title: 'Aprender pelo que você ama',
    idea_pt:
      'A intérprete húngara Kató Lomb, que trabalhava em vários idiomas, defendia aprender com conteúdos que despertam curiosidade de verdade. Interesse mantém a constância, e constância vence talento.',
    practice_pt: 'Usem inglês em coisas que vocês já amam: viagens, gatos, marketing, séries. Um pouco por dia, sempre.',
    english: 'Learn English with things you already love.',
    english_pt: 'Aprenda inglês com coisas que você já ama.',
  },
  {
    id: 'dornyei-motivation',
    author: 'Zoltán Dörnyei',
    title: 'O seu eu do futuro',
    idea_pt:
      'Dörnyei estudou a motivação e mostrou a força de imaginar o seu "eu do futuro" usando a língua: quanto mais vívida essa imagem, mais fácil manter o estudo.',
    practice_pt: 'Imaginem juntos uma cena concreta: vocês dois pedindo café em inglês numa viagem. Descrevam essa cena em inglês, em voz alta.',
    english: 'Imagine your future self speaking English.',
    english_pt: 'Imagine o seu eu do futuro falando inglês.',
  },
  {
    id: 'spacing-short',
    author: 'Pesquisas sobre o efeito do espaçamento',
    title: 'Pouco e sempre',
    idea_pt: 'Vários estudos sobre o efeito do espaçamento mostram que sessões curtas e frequentes rendem mais do que maratonas de vez em quando.',
    practice_pt: 'Cinco a dez minutos por dia no café valem mais que duas horas no domingo. Abra o jogo, atenda dois clientes, revise alguns cards e pronto.',
    english: 'A little every day beats a lot once a week.',
    english_pt: 'Um pouco todo dia vale mais que muito uma vez por semana.',
  },
];
