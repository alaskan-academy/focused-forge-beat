// Conteúdo do Modo Caverna (30 dias). Tudo aqui é texto fixo do plano;
// o que cada pessoa marca no dia fica no Supabase (tabelas caverna_*).

export type Pessoa = 'lucas' | 'jessica';
export type Papel = 'casa' | 'suporte';

export const TOTAL_DIAS = 30;
export const META_CHECKLIST = 6;

export const PESSOAS: Record<Pessoa, { nome: string; altura: string; peso: string }> = {
  lucas: { nome: 'Lucas', altura: '1,83 m', peso: '96 kg' },
  jessica: { nome: 'Jessica', altura: '1,65 m', peso: '72 kg' },
};

export const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

/**
 * Dia da semana da data real (0 = segunda … 6 = domingo). O roteiro, o treino e o
 * checklist seguem o calendário; a contagem de dias (1 a 30) só define a fase.
 */
export function diaDaSemana(data: Date = new Date()) {
  return (data.getDay() + 6) % 7;
}

/** Semana corrida (1 a 5; os dias 29 e 30 caem na semana 5). */
export function semanaCorrida(dia: number) {
  return Math.ceil(dia / 7);
}

/** Fase do plano (1 a 4); os dias 29 e 30 seguem a fase 4. */
export function fase(dia: number) {
  return Math.min(4, semanaCorrida(dia));
}

export const FASES = [
  { nome: 'Base', foco: 'Rotina e sono', dormir: '23:30', cardio: '20–25 min', series: '2 séries', trilha: 'Curta e plana' },
  { nome: 'Construção', foco: 'Força entra para valer', dormir: '23:00', cardio: '30 min', series: '3 séries', trilha: 'Média' },
  { nome: 'Intensidade', foco: 'Subir carga e desafios', dormir: '22:30', cardio: '35–40 min', series: '3 séries, elástico mais forte', trilha: 'Mais longa ou com subida' },
  { nome: 'Consolidação', foco: 'Manter e decidir o "depois"', dormir: '22:30', cardio: '40 min', series: '3 a 4 séries', trilha: 'A favorita de vocês' },
] as const;

export function infoFase(dia: number) {
  return FASES[fase(dia) - 1];
}

// ── Roteiro do dia ────────────────────────────────────────────────

export interface Linha {
  hora: string;
  oque: string;
  /** Só aparece para quem está neste papel na semana. */
  papel?: Papel;
  /** Água em ml para [Lucas, Jessica] neste momento. */
  agua?: [number, number];
  /** Detalhe diferente para cada um. */
  lucas?: string;
  jessica?: string;
  tipo?: 'treino' | 'cardio' | 'trilha' | 'aula';
  destaque?: boolean;
  /** O que é para fazer, mostrado ao tocar na linha. */
  explica?: string[];
}

// Explicações que se repetem em mais de um dia.
const comoAlmoco = [
  'Prato montado: metade vegetais, um quarto proteína (peixe, ovos, frango, feijão) e um quarto carboidrato de verdade (arroz, mandioca, batata).',
  'Comer até ficar satisfeito, não estufado.',
  'Peixe fresco sempre que der.',
  'Durante a semana, a comida sai do preparo de domingo e do mini-preparo de quarta.',
];
const comoCafeTarde = [
  'Lanche planejado, para não chegar com fome no jantar: iogurte natural + fruta, ovo cozido ou castanhas.',
  'Biscoito e doce de pacote ficam de fora.',
  'Pausa curta de 15 min, longe da tela se der.',
];
const comoOperacional = [
  'Trabalho mais leve: e-mails, tarefas simples, organização e respostas.',
  'Depois da aula a cabeça fica cansada, então nada que exija foco profundo.',
];
const comoBike = [
  'Só tem uma bike, então é um de cada vez.',
  'Tempo da fase: 20–25 min na semana 1, 30 min na 2, 35–40 min na 3 e 40 min na 4.',
  'Ritmo em que dá para conversar, mas não cantar.',
  '500 ml de água durante a bike.',
];
const comoAula = [
  'Aula com a professora: é o treino pesado do inglês.',
  'Tema atual: relacionamento aberto, trabalhado em passado simples.',
  'No fim, pedir a lista de correções com os erros de verbo e de preposição de cada um.',
  'Logo depois, 5 min anotando palavras e expressões novas. À noite, elas entram nos flashcards.',
];

const acordar: Linha = {
  hora: '7:00', oque: 'Acordar e beber água', agua: [500, 400],
  explica: [
    'Acordar às 7:00 todos os dias, inclusive no fim de semana. É o primeiro item do checklist.',
    'Beber a água logo ao levantar, antes do café: Lucas 500 ml, Jessica 400 ml.',
    'Abrir a janela e pegar luz natural ajuda a regular o sono.',
    'Dormiu tarde? Levante no horário mesmo assim e durma mais cedo à noite.',
  ],
};
const caminhada: Linha = {
  hora: '7:15', oque: 'Caminhada na praia juntos + podcast em inglês', agua: [300, 200],
  explica: [
    'Caminhada juntos na praia, em ritmo confortável, de uns 30 min.',
    'Ouvir um áudio em inglês para quem está aprendendo, como o 6 Minute English, da BBC, ou podcasts de histórias simples.',
    'Levar a garrafinha: Lucas 300 ml, Jessica 200 ml.',
    'O sol logo de manhã ajuda a regular o sono.',
  ],
};
const cafe: Linha = {
  hora: '7:50', oque: 'Café da manhã: ovos + fruta + café',
  explica: [
    'Proteína já no café da manhã: ovos são o jeito mais fácil.',
    'Uma fruta e café.',
    'A proteína de manhã dá saciedade e ajuda a ganhar força enquanto emagrece.',
  ],
};
const suporteSemana: Linha = {
  hora: '9:00–17:00', oque: 'Suporte aberto: celular por perto (respostas em até 1–2h)', papel: 'suporte',
  explica: [
    'Quem está na semana suporte fica com o celular à mão das 9h às 17h (no sábado, das 9h às 12h).',
    'As respostas podem esperar de 1h a 2h, então aula, compras, caminhada e treino cabem.',
    'O trabalho que exige atenção fica para o começo da manhã; o atendimento entra no resto do dia.',
  ],
};
const almoco: Linha = { hora: '12:00–13:15', oque: 'Almoço: metade vegetais, proteína, carboidrato de verdade', agua: [300, 200], explica: comoAlmoco };
const casaPets: Linha = {
  hora: '13:15–13:45', oque: 'Casa e pets', papel: 'casa',
  explica: [
    'Meia hora para quem está na semana casa.',
    'Pets (comida, água e um passeio rápido), louça do almoço e uma arrumação leve.',
    'O jantar fica para as 19:00.',
  ],
};
const cafeTarde: Linha = { hora: '15:30–15:45', oque: 'Café da tarde: iogurte natural + fruta, ou ovo cozido', explica: comoCafeTarde };
const prepJantar: Linha = {
  hora: '19:00', oque: 'Preparar o jantar', papel: 'casa',
  explica: [
    'Quem está na semana casa prepara o jantar enquanto o outro toma banho.',
    'Usar o que ficou pronto no preparo de domingo e no mini-preparo de quarta: proteína, legumes e carboidrato.',
    'Mesmo prato montado do almoço, com o jantar pronto às 19:45.',
  ],
};
const banho: Linha = {
  hora: '19:00', oque: 'Banho e descanso', papel: 'suporte',
  explica: [
    'Quem está no suporte toma banho e descansa enquanto o outro prepara o jantar.',
    'Se sobrar tempo, pôr a mesa ou adiantar a louça.',
  ],
};
const jantar: Linha = {
  hora: '19:45', oque: 'Jantar (em inglês a partir da semana 2)', agua: [300, 300],
  explica: [
    'Jantar cedo, por volta das 19:45: ajuda a dormir melhor.',
    'Mesmo prato montado do almoço.',
    'A partir da semana 2, a conversa do jantar é em inglês: cada um conta como foi o dia, usando os verbos no passado (I worked, I went, I talked…).',
    'Não precisa ser perfeito. Travou? Diga a palavra em português e siga em inglês.',
    '300 ml de água até dormir.',
  ],
};
const telas: Linha = {
  hora: '1h antes de dormir',
  oque: 'Telas desligadas: flashcards (10 min), três frases no passado e hobby',
  lucas: 'Ukulele',
  jessica: 'Crochê ou leitura',
  explica: [
    'Desligar TV, computador e redes 1h antes do horário de dormir da fase. Kindle pode, com brilho baixo e modo noturno.',
    'Flashcards no Anki (10 min, a única tela liberada): 5 verbos irregulares novos por dia, as palavras da aula e as correções da professora.',
    'Três frases no passado sobre o dia, faladas ou escritas (ex.: "Today I walked on the beach").',
    'Depois, hobby: Lucas no ukulele, Jessica no crochê ou na leitura.',
  ],
};
const dormir: Linha = {
  hora: '{dormir}', oque: 'Dormir',
  explica: [
    'Horário da fase: 23:30 na semana 1, 23:00 na semana 2 e 22:30 a partir da semana 3.',
    'Sono curto aumenta a fome e derruba a disposição, então pesa tanto quanto o treino.',
    'Conta para o item "Dormi no horário, sem tela na última hora".',
  ],
};

const treino = (hora: string): Linha => ({
  hora, oque: 'Treino de elásticos em dupla', agua: [500, 500], tipo: 'treino', destaque: true,
  explica: [
    'Treino A ou B, conforme a semana. Os exercícios e as cargas estão no card Treino, abaixo.',
    '5 min de aquecimento e depois os pares: enquanto um usa os puxadores, o outro faz o exercício livre. Terminou a série, trocam.',
    '10 a 15 repetições por série, parando quando sobrarem umas 2 no "tanque".',
    '500 ml de água durante o treino.',
  ],
});

const bloco1: Linha = {
  hora: '8:45–12:00', oque: 'Bloco 1: o trabalho mais importante, celular longe', agua: [1000, 700],
  explica: [
    'Primeiro bloco focado: o trabalho mais importante do dia, aquele que exige atenção.',
    'Celular longe e notificações desligadas. Quem está no suporte olha as mensagens nos intervalos.',
    'Quem está na semana casa protege pelo menos este bloco para os próprios projetos.',
    'Garrafa de 1 L na mesa: o Lucas esvazia uma inteira; a Jessica, 700 ml.',
  ],
};
const bloco2 = (agua: [string, string]): Linha => ({
  hora: '13:45–15:30', oque: 'Bloco 2', agua: [1000, 700], lucas: agua[0], jessica: agua[1],
  explica: [
    'Segundo bloco focado, depois do almoço.',
    'Continuar o trabalho importante da manhã ou fazer tarefas que pedem atenção média.',
    'Mais uma garrafa: Lucas 1 L, Jessica 700 ml.',
  ],
});

const segunda: Linha[] = [
  acordar, caminhada, cafe, suporteSemana,
  bloco1,
  almoco, casaPets,
  bloco2(['1 L até o fim do bloco 3', '700 ml até o fim do bloco 3']),
  cafeTarde,
  {
    hora: '15:45–17:45', oque: 'Bloco 3',
    explica: [
      'Último bloco do dia: fechar pendências, responder o que ficou e planejar o dia seguinte.',
      'Termina a tempo de começar o treino às 18:00.',
    ],
  },
  treino('18:00–18:45'),
  prepJantar, banho, jantar,
  {
    hora: '20:30', oque: 'Lazer: um episódio de série',
    explica: [
      'Lazer com tela das 20:30 até 1h antes de dormir: um episódio, não uma maratona.',
      'Se der, com áudio e legenda em inglês: também conta como estudo leve.',
      'Filmes inteiros ficam para sexta e sábado.',
    ],
  },
  telas, dormir,
];

const terca: Linha[] = [
  acordar, caminhada, cafe, suporteSemana,
  {
    hora: '8:45–9:50', oque: 'Bloco curto, com revisão da aula anterior', agua: [1000, 700],
    explica: [
      'Bloco curto antes da aula das 10h.',
      'Começar com 10 min revisando as anotações da aula de quarta.',
      'Garrafa de 1 L até o almoço (Jessica, 700 ml).',
    ],
  },
  { hora: '10:00–11:00', oque: 'Aula de inglês; logo depois, 5 min anotando palavras novas', tipo: 'aula', destaque: true, explica: comoAula },
  { hora: '11:15–12:00', oque: 'Trabalho operacional', explica: comoOperacional },
  almoco, casaPets,
  {
    hora: '13:45–17:15', oque: 'Trabalho mais operacional; café da tarde às 15:30', agua: [1000, 700],
    explica: [...comoOperacional, 'Pausa para o café da tarde às 15:30: iogurte + fruta, ovo cozido ou castanhas.'],
  },
  {
    hora: '17:30', oque: 'Caminhada rápida na praia, juntos', agua: [500, 500], tipo: 'cardio', destaque: true,
    explica: [
      'Caminhada rápida juntos, no tempo da fase (20 a 40 min).',
      'Ritmo em que dá para conversar, mas não cantar.',
      'Nas primeiras semanas, caminhar rápido em vez de correr na areia, para poupar as articulações.',
      '500 ml de água.',
    ],
  },
  prepJantar, banho, jantar,
  {
    hora: '20:30', oque: 'Noite livre e leve (cabeça cansada da aula)',
    explica: ['Sem programação: descanso, conversa ou uma série leve.', 'Telas desligadas 1h antes de dormir.'],
  },
  { ...telas, explica: [...(telas.explica ?? []).slice(0, 1), 'Flashcards com as palavras da aula de hoje (10 min).', ...(telas.explica ?? []).slice(2)] },
  dormir,
];

const quarta: Linha[] = [
  acordar, caminhada, cafe, suporteSemana,
  {
    hora: '8:45–11:15', oque: 'Bloco 1, com 10 min revisando a aula anterior', agua: [1000, 700],
    explica: [
      'Bloco focado mais curto, que termina antes da aula das 11:30.',
      'Nos primeiros 10 min, revisar as anotações da aula de terça.',
      'Garrafa de 1 L até o almoço (Jessica, 700 ml).',
    ],
  },
  { hora: '11:30–12:30', oque: 'Aula de inglês; logo depois, anotar palavras novas', tipo: 'aula', destaque: true, explica: comoAula },
  { ...almoco, hora: '12:30–13:45' },
  { ...casaPets, hora: '13:45–14:15' },
  { hora: '14:15–15:00', oque: 'Trabalho operacional', agua: [1000, 700], explica: [...comoOperacional, 'Garrafa: Lucas 1 L, Jessica 700 ml até o jantar.'] },
  { hora: '15:00', oque: 'Café da tarde', explica: comoCafeTarde },
  {
    hora: '15:15', oque: 'Compras juntos (Komprão ou Silveira)', destaque: true,
    explica: [
      'Compras juntos no Komprão ou no Silveira: quarta é dia de promoção.',
      'Levar a lista pronta, pensando no mini-preparo de quinta e sexta e no que falta até domingo.',
      'Comida de verdade: legumes, frutas, ovos, peixe fresco, frango, feijão, iogurte natural e castanhas.',
      'Biscoito, refrigerante e salgadinho ficam fora do carrinho.',
    ],
  },
  {
    hora: '16:45', oque: 'Bike em casa', papel: 'casa', agua: [500, 500], tipo: 'cardio', destaque: true,
    explica: ['Quem está na semana casa pedala primeiro, na volta das compras.', ...comoBike],
  },
  {
    hora: '18:00', oque: 'Bike em casa', papel: 'suporte', agua: [500, 500], tipo: 'cardio', destaque: true,
    explica: ['Às 18:00, depois do horário do suporte, é a vez de quem está na semana suporte.', ...comoBike],
  },
  {
    hora: '18:00', oque: 'Preparar o jantar e o mini-preparo de quinta e sexta', papel: 'casa',
    explica: [
      'Enquanto o outro pedala, quem está na casa faz o jantar e o mini-preparo.',
      'Mini-preparo: deixar proteína pronta (frango, peixe ou ovos cozidos) e legumes lavados e cortados para quinta e sexta.',
    ],
  },
  jantar,
  {
    hora: '20:30', oque: 'Jogo no computador',
    explica: ['Quarta é uma das noites de jogo no computador (a outra é o sábado).', 'Vai até 1h antes de dormir; depois, telas desligadas.'],
  },
  telas, dormir,
];

const quinta: Linha[] = segunda.map((l) =>
  l.hora === '20:30'
    ? {
        hora: '20:30', oque: 'Sessão de música: Billie Eilish (30–40 min)', destaque: true,
        explica: [
          'Uma música da Billie Eilish por semana, com roteiro e perguntas prontas no documento "Estudo de inglês com Billie Eilish".',
          'Ouvir, acompanhar a letra, entender as frases e responder às perguntas em inglês.',
          'Os verbos da música vão para os flashcards na última hora do dia.',
          'Depois, o Lucas treina a música da semana no ukulele.',
        ],
      }
    : l === telas
      ? { ...telas, lucas: 'Ukulele (a música da semana)' }
      : l,
);

const sexta: Linha[] = [
  acordar, caminhada, cafe, suporteSemana,
  { ...bloco1, oque: 'Bloco 1' },
  almoco, casaPets,
  bloco2(['1 L até o treino', '700 ml até o treino']),
  cafeTarde,
  {
    hora: '15:45–17:00', oque: 'Bloco 3 (curto)',
    explica: ['Bloco curto para fechar a semana e anotar o que fica para segunda.', 'Termina às 17:00, a tempo do treino.'],
  },
  treino('17:00–17:45'),
  {
    hora: '18:00',
    oque: 'Sexta do casal: receita especial, vinho, MasterChef ou série. Alimentação livre começa aqui',
    agua: [300, 300],
    lucas: 'Um copo de água a cada taça de vinho',
    jessica: 'Um copo de água a cada taça de vinho',
    destaque: true,
    explica: [
      'A alimentação livre começa aqui: comer o que tem vontade, não comer até passar mal.',
      'Uma receita especial feita juntos, vinho, MasterChef, série ou um filme inteiro.',
      'Um copo de água a cada taça de vinho.',
      'A receita de hoje pode inspirar versões saudáveis para a semana.',
    ],
  },
  {
    hora: '1h antes de dormir', oque: 'Telas desligadas',
    explica: ['Mesmo na sexta, telas desligadas 1h antes de dormir.', 'Hobby, leitura no Kindle ou conversa.'],
  },
  dormir,
];

const sabado: Linha[] = [
  acordar,
  {
    hora: '7:30', oque: 'Café da manhã normal, com proteína', agua: [300, 200],
    explica: [
      'Mesmo no dia livre, o café da manhã continua normal, com proteína (ovos).',
      'Assim ninguém chega com fome na trilha nem exagera no almoço.',
    ],
  },
  {
    hora: '9:00–12:00', oque: 'Suporte aberto: celular por perto', papel: 'suporte',
    explica: ['Quem está na semana suporte fica com o celular à mão das 9h às 12h.', 'As respostas podem esperar de 1h a 2h.'],
  },
  {
    hora: '9:00–12:00', oque: 'Manhã livre em casa: leitura, ukulele, crochê, descanso', agua: [1000, 700],
    explica: ['Manhã sem tarefa: leitura, ukulele, crochê ou descanso.', 'Garrafa de 1 L ao longo da manhã (Jessica, 700 ml).'],
  },
  {
    hora: '12:00', oque: 'Almoço livre', agua: [300, 200],
    explica: ['Alimentação livre: comer o que tem vontade, sem exagerar.', 'Leve o bastante para fazer a trilha às 14:30.'],
  },
  {
    hora: '14:30',
    oque: 'Trilha. Em dia muito quente, sair às 15:30. Protetor e boné',
    agua: [1500, 1200],
    lucas: 'Levar 1,5 L',
    jessica: 'Levar 1,2 L',
    tipo: 'trilha',
    destaque: true,
    explica: [
      'Trilha juntos, no nível da fase: curta e plana na semana 1, média na 2, mais longa ou com subida na 3 e a favorita de vocês na 4.',
      'Em dia muito quente, sair às 15:30.',
      'Levar protetor, boné, água (Lucas 1,5 L, Jessica 1,2 L) e uma fruta.',
      'Avisar alguém de qual trilha vão fazer e voltar antes de escurecer.',
    ],
  },
  { hora: 'Volta da trilha', oque: 'Banho, praia ou cochilo', explica: ['Descanso de verdade: banho, praia ou cochilo.'] },
  {
    hora: 'Jantar', oque: 'Livre: pizza, receita, o que tiver vontade', agua: [300, 300],
    explica: ['Jantar livre: pizza, uma receita ou o que tiver vontade.', 'Livre é comer o que tem vontade, não até passar mal.'],
  },
  {
    hora: 'Noite', oque: 'Filme da semana',
    explica: [
      'O filme da semana, escolhido no check-in de domingo.',
      'Ideias da lista: Dias Perfeitos, Assunto de Família, Ninguém Pode Saber, Vidas Passadas, Viver (Ikiru), Aftersun e o documentário Jiro Sonha com Sushi.',
      'Depois, jogo no computador se der vontade, até 1h antes de dormir.',
    ],
  },
  telas, dormir,
];

const domingo: Linha[] = [
  acordar,
  {
    hora: '7:15', oque: 'Mar ou caminhada leve + 10 min de alongamento', agua: [300, 200],
    explica: ['Movimento leve: um mergulho no mar ou uma caminhada tranquila.', 'Depois, 10 min de alongamento: pernas, quadril, costas e ombros.'],
  },
  {
    hora: '8:00', oque: 'Café da manhã (volta a alimentação da semana)',
    explica: ['A alimentação da semana volta: ovos + fruta + café.', 'Os dias livres acabaram no sábado.'],
  },
  {
    hora: '9:00', oque: 'Lavanderia juntos; na espera, revisão de inglês da semana', agua: [1000, 700],
    explica: [
      'Lavanderia juntos.',
      'Na espera, 10 min revisando o inglês da semana: palavras das aulas, correções da professora e verbos dos flashcards.',
    ],
  },
  { hora: '12:00', oque: 'Almoço', agua: [300, 200], explica: comoAlmoco },
  {
    hora: '14:00–16:00', oque: 'Preparo da comida da semana (quem vai ficar na casa)',
    explica: [
      'Quem entra na semana casa faz o preparo principal da semana.',
      'Proteínas (frango, carne, peixe, ovos cozidos), arroz, feijão e legumes, guardados em potes.',
      'Na quarta à noite tem o mini-preparo de quinta e sexta.',
    ],
  },
  {
    hora: '16:30',
    oque: 'Check-in do casal: o que funcionou, o que pesou, papéis da semana, lista do que assistir',
    agua: [1000, 700],
    destaque: true,
    explica: [
      '15 minutos, só vocês dois. Respondam: o que funcionou? O que está pesado? O que ajustar na próxima semana?',
      'Passagem de bastão da casa: o que está pendente e o que tem pronto na geladeira.',
      'Escolher os papéis da semana seguinte, casa ou suporte (normalmente alternando).',
      'Fazer a lista do que assistir na semana, para não perder tempo procurando.',
      'É para ajustar o plano, não para cobrar o outro.',
    ],
  },
  { hora: 'Tarde e noite', oque: 'Série ou documentário', explica: ['Tarde e noite livres: série ou documentário juntos.', 'Telas desligadas 1h antes de dormir.'] },
  { hora: '19:30', oque: 'Jantar', agua: [300, 300], explica: ['Jantar cedo, às 19:30, com a comida do preparo.', '300 ml de água até dormir.'] },
  telas, dormir,
];

const ROTEIRO: Linha[][] = [segunda, terca, quarta, quinta, sexta, sabado, domingo];

/** `sem` é o dia da semana real (0 = segunda … 6 = domingo); `dia` é a contagem, que define a fase. */
export function roteiroDoDia(dia: number, papel: Papel, sem: number): Linha[] {
  const dormirHora = infoFase(dia).dormir;
  return ROTEIRO[sem]
    .filter((l) => !l.papel || l.papel === papel)
    .map((l) => (l.hora === '{dormir}' ? { ...l, hora: dormirHora } : l));
}

export function metaAgua(dia: number, papel: Papel, pessoa: Pessoa, sem: number): number {
  const i = pessoa === 'lucas' ? 0 : 1;
  return roteiroDoDia(dia, papel, sem).reduce((s, l) => s + (l.agua ? l.agua[i] : 0), 0);
}

// ── Treino ────────────────────────────────────────────────────────

export interface Exercicio {
  id: string;
  nome: string;
  como: string;
  lucas: string;
  jessica: string;
}

export interface Par {
  comPuxadores: Exercicio;
  livre: Exercicio;
}

export const TREINOS: Record<'A' | 'B', Par[]> = {
  A: [
    {
      comPuxadores: { id: 'agachamento', nome: 'Agachamento', como: 'Pisando no extensor, puxadores nos ombros', lucas: '2 a 3 extensores combinados', jessica: '1 a 2 extensores' },
      livre: { id: 'ponte', nome: 'Ponte de glúteo', como: 'Deitado, mini band acima dos joelhos, subir o quadril', lucas: 'Mini band forte', jessica: 'Mini band média' },
    },
    {
      comPuxadores: { id: 'remada', nome: 'Remada', como: 'Suporte de porta na altura do peito, puxar até a cintura', lucas: '2 extensores', jessica: '1 extensor' },
      livre: { id: 'flexao', nome: 'Flexão de braço', como: 'Corpo reto, descer o peito em direção ao apoio', lucas: 'No chão (joelhos apoiados se precisar)', jessica: 'Inclinada, mãos na bancada ou na mesa' },
    },
    {
      comPuxadores: { id: 'pallof', nome: 'Anti-rotação (Pallof)', como: 'Suporte de porta ao lado, estender os braços sem girar o tronco', lucas: '1 extensor médio', jessica: '1 extensor leve' },
      livre: { id: 'prancha', nome: 'Prancha', como: 'Antebraços no chão, corpo reto', lucas: '30–45 s', jessica: '20–30 s' },
    },
  ],
  B: [
    {
      comPuxadores: { id: 'terra', nome: 'Levantamento terra romeno', como: 'Pisando no extensor, quadril para trás, costas retas', lucas: '2 a 3 extensores combinados', jessica: '1 a 2 extensores' },
      livre: { id: 'afundo', nome: 'Afundo', como: 'Peso do corpo, descer o joelho de trás em direção ao chão', lucas: '10–12 por perna', jessica: '8–10 por perna' },
    },
    {
      comPuxadores: { id: 'puxada', nome: 'Puxada alta', como: 'Suporte de porta no alto, ajoelhado, puxar até o peito', lucas: '2 extensores', jessica: '1 extensor' },
      livre: { id: 'rosca', nome: 'Rosca bíceps', como: 'Pisando no cross tube, subir as mãos até os ombros', lucas: 'Cross tube, até 15 repetições', jessica: 'Cross tube, até 15 repetições' },
    },
    {
      comPuxadores: { id: 'desenvolvimento', nome: 'Desenvolvimento', como: 'Pisando no extensor, empurrar acima da cabeça', lucas: '1 a 2 extensores', jessica: '1 extensor leve' },
      livre: { id: 'triceps', nome: 'Tríceps', como: 'Thera band acima da cabeça, estender os cotovelos', lucas: 'Thera band, até 15 repetições', jessica: 'Thera band, até 15 repetições' },
    },
    {
      comPuxadores: { id: 'coice', nome: 'Coice de glúteo', como: 'Tornozeleira presa a um extensor no suporte de porta (embaixo)', lucas: '1 extensor médio', jessica: '1 extensor leve' },
      livre: { id: 'deadbug', nome: 'Dead bug', como: 'Deitado de costas, estender braço e perna opostos devagar', lucas: '8–10 por lado', jessica: '8–10 por lado' },
    },
  ],
};

/** Treino de elásticos do dia, ou null. Semanas ímpares: A/B/A; pares: B/A/B (seg/qui/sex). */
export function treinoDoDia(dia: number, sem: number): { letra: 'A' | 'B'; lucasComecaComPuxadores: boolean } | null {
  const d = sem;
  const pos = d === 0 ? 0 : d === 3 ? 1 : d === 4 ? 2 : -1;
  if (pos < 0) return null;
  const impar = semanaCorrida(dia) % 2 === 1;
  const ordem: ('A' | 'B')[] = impar ? ['A', 'B', 'A'] : ['B', 'A', 'B'];
  return { letra: ordem[pos], lucasComecaComPuxadores: d !== 4 };
}

export function aquecimento(dia: number): string[] {
  const itens = [
    'Thera band: abrir os braços (15x) e rotação de ombro (10x); enquanto um faz, o outro caminha de lado com a mini band',
    'Trocam: quem fez a thera band vai para a mini band',
    '10 agachamentos sem carga, juntos',
  ];
  if (fase(dia) >= 3) itens.push('Corda: 30 s pulando enquanto o outro descansa, 3 a 5 vezes');
  return itens;
}

// ── Checklist diário ──────────────────────────────────────────────

export type ItemId = 'acordar' | 'movimento' | 'alimentacao' | 'trabalho' | 'ingles' | 'agua' | 'sono';

export function checklistDoDia(sem: number): { id: ItemId; label: string }[] {
  const d = sem;
  const livre = d === 4 || d === 5;
  const trabalho = d === 5 ? 'Cobri o suporte ou descansei de verdade' : d === 6 ? 'Fiz o check-in do casal' : 'Fiz o trabalho focado do dia';
  const ingles =
    d === 1 || d === 2 ? 'Fui à aula e anotei as palavras novas'
      : d === 3 ? 'Fiz a sessão de música em inglês'
        : d === 5 ? 'Ouvi algo em inglês'
          : d === 6 ? 'Revisei o inglês da semana'
            : 'Estudei inglês (15–20 min)';
  return [
    { id: 'acordar', label: 'Acordei às 7:00' },
    { id: 'movimento', label: 'Treinei ou me movimentei' },
    { id: 'alimentacao', label: livre ? 'Dia livre com equilíbrio' : 'Comi dentro das regras' },
    { id: 'trabalho', label: trabalho },
    { id: 'ingles', label: ingles },
    { id: 'agua', label: 'Bati a meta de água' },
    { id: 'sono', label: 'Dormi no horário, sem tela na última hora' },
  ];
}

// ── Princípios: o guia para manter o Modo Caverna ─────────────────

export const PRINCIPIOS: { titulo: string; porque: string; pratica: string }[] = [
  {
    titulo: 'Começar menor do que dá vontade',
    porque: 'A empolgação do começo acaba lá pela segunda semana. Quem começa no máximo cansa, se machuca ou desiste. Quem começa leve chega ao dia 30.',
    pratica: 'A semana 1 é de base: carga leve, menos séries, dormir no horário. Cada semana sobe só um degrau (veja as fases). Se a semana 1 parecer fácil demais, está certo.',
  },
  {
    titulo: 'Nunca falhar duas vezes seguidas',
    porque: 'Um dia ruim é um acidente. Dois dias ruins seguidos começam a virar o hábito novo. A regra não é nunca falhar: é não deixar a falha se repetir.',
    pratica: 'Falhou hoje? Amanhã é obrigatório fazer pelo menos a versão mínima. A sequência pode zerar, o desafio não.',
  },
  {
    titulo: '6 de 7, não 7 de 7',
    porque: 'Exigir perfeição todo dia faz o primeiro deslize parecer o fim de tudo. A meta já deixa uma folga para a vida real.',
    pratica: 'Por dia, um item pode ficar de fora sem culpa. Só não use a folga sempre no mesmo item: se for sempre o mesmo, ele precisa de um plano.',
  },
  {
    titulo: 'Feito vale mais que perfeito',
    porque: 'Nos dias de cansaço, doença ou imprevisto, o que mantém o ritmo é aparecer, mesmo que pouco. O hábito é construído pela repetição, não pela intensidade.',
    pratica: 'Dia ruim? Faça a "versão mínima para dias ruins" e marque. Dez minutos de bike contam. Zero não conta.',
  },
  {
    titulo: 'O treino nunca é cortado pelo papel da semana',
    porque: 'O papel muda quem cuida da casa e quem cuida do suporte, não quem treina. Se o treino depende de sobrar tempo, ele nunca sobra.',
    pratica: 'O suporte pode responder em 1h a 2h, então o treino cabe. Quem está na casa encaixa a comida em volta do treino, não o contrário.',
  },
  {
    titulo: 'Fora de casa, sempre juntos',
    porque: 'Um puxa o outro nos dias sem vontade, a trilha fica mais segura e vira tempo de casal em vez de mais uma tarefa.',
    pratica: 'Caminhada da manhã, caminhada rápida de terça, compras de quarta e trilha de sábado: se um não vai, combinem outro horário em vez de ir sozinho.',
  },
  {
    titulo: 'O ambiente decide, não a força de vontade',
    porque: 'Força de vontade acaba no fim do dia. O que está à mão e à vista ganha quase sempre.',
    pratica: 'Sem ultraprocessados em casa, preparo de domingo feito, celular longe no bloco focado, telas desligadas 1h antes de dormir. Facilite o certo e dificulte o errado.',
  },
  {
    titulo: 'Dormir é parte do plano',
    porque: 'Sem sono não tem disposição, a fome aumenta e o treino rende menos. Dormir mal sabota todo o resto.',
    pratica: 'Acordar às 7:00 todos os dias, inclusive no fim de semana, e deitar no horário da fase. Se for dormir tarde, acorde no horário mesmo assim.',
  },
  {
    titulo: 'Cada um cuida do próprio placar',
    porque: 'Fiscalizar o outro gera atrito e tira o foco de si. O apoio funciona melhor que a cobrança.',
    pratica: 'Marque só o seu checklist, com honestidade. Para o outro: convite e incentivo ("bora caminhar?"), nunca cobrança.',
  },
  {
    titulo: 'Recomeçar é permitido',
    porque: 'Se a vida atropelou a semana, arrastar um desafio quebrado desanima mais do que começar de novo. O objetivo é sair com os hábitos, não com o número.',
    pratica: 'Pode começar no dia que quiser e voltar ao dia 1 quando precisar. Pode ser em qualquer dia da semana: o roteiro segue o calendário e a fase segue a contagem.',
  },
];

// ── Regras e limites ──────────────────────────────────────────────

export const REGRAS: { titulo: string; itens: string[] }[] = [
  {
    titulo: 'Alimentação',
    itens: [
      'Prato montado: metade vegetais, um quarto proteína, um quarto carboidrato de verdade.',
      'Proteína em todas as refeições, inclusive no café da manhã.',
      'Sem ultraprocessados: biscoito, refrigerante, salgadinho e fast-food ficam fora.',
      'Lanche planejado no café da tarde.',
      'Comer até ficar satisfeito, não estufado. Nada de dieta radical.',
      'Dias livres: sexta à noite e sábado. Livre é comer o que tem vontade, não até passar mal.',
      'Café da manhã de sábado continua normal, com proteína. Domingo volta tudo.',
    ],
  },
  {
    titulo: 'Limites',
    itens: [
      'Álcool só nos dias livres; um copo de água a cada taça.',
      'Telas desligadas 1h antes de dormir. Kindle pode, com brilho baixo e modo noturno.',
      'Jogos no computador só na quarta à noite e no sábado.',
      'Filmes inteiros só na sexta e no sábado.',
      'Celular longe durante o bloco focado.',
      'Acordar às 7:00 todos os dias, inclusive no fim de semana.',
    ],
  },
  {
    titulo: 'Suporte e papéis',
    itens: [
      'Suporte aberto das 9h às 17h nos dias úteis e das 9h às 12h no sábado.',
      'Respostas podem esperar de 1h a 2h: aula, compras e caminhada cabem.',
      'No domingo, cada um escolhe o papel da semana seguinte: casa ou suporte.',
      'Quem fica na casa cuida da comida, da limpeza e dos pets, e faz o preparo de domingo.',
    ],
  },
  {
    titulo: 'Versão mínima para dias ruins',
    itens: [
      'Treino: só o aquecimento e um par de exercícios.',
      'Cardio: 10 minutos de bike ou caminhada.',
      'Inglês: 5 minutos de flashcards.',
      'Trabalho: um único bloco focado de 1 hora.',
      'Alimentação: só a regra da proteína em todas as refeições.',
    ],
  },
  {
    titulo: 'Treino',
    itens: [
      '10 a 15 repetições, parando quando sobrarem umas 2 no "tanque".',
      'Fez 15 repetições com boa técnica em todas as séries? Sobe um extensor.',
      'O descanso é o tempo da série do outro; se ficar curto, mais 30 s.',
      'Corda só a partir da semana 3, em piso com amortecimento.',
      'Check-up médico antes da semana 3.',
    ],
  },
];
