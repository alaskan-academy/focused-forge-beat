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

/** O dia 1 é sempre uma segunda-feira. 0 = segunda … 6 = domingo. */
export function diaDaSemana(dia: number) {
  return (dia - 1) % 7;
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
}

const acordar: Linha = { hora: '7:00', oque: 'Acordar e beber água', agua: [500, 400] };
const caminhada: Linha = { hora: '7:15', oque: 'Caminhada na praia juntos + podcast em inglês', agua: [300, 200] };
const cafe: Linha = { hora: '7:50', oque: 'Café da manhã: ovos + fruta + café' };
const suporteSemana: Linha = { hora: '9:00–17:00', oque: 'Suporte aberto: celular por perto (respostas em até 1–2h)', papel: 'suporte' };
const almoco: Linha = { hora: '12:00–13:15', oque: 'Almoço: metade vegetais, proteína, carboidrato de verdade', agua: [300, 200] };
const casaPets: Linha = { hora: '13:15–13:45', oque: 'Casa e pets', papel: 'casa' };
const cafeTarde: Linha = { hora: '15:30–15:45', oque: 'Café da tarde: iogurte natural + fruta, ou ovo cozido' };
const prepJantar: Linha = { hora: '19:00', oque: 'Preparar o jantar', papel: 'casa' };
const banho: Linha = { hora: '19:00', oque: 'Banho e descanso', papel: 'suporte' };
const jantar: Linha = { hora: '19:45', oque: 'Jantar (em inglês a partir da semana 2)', agua: [300, 300] };
const telas: Linha = {
  hora: '1h antes de dormir',
  oque: 'Telas desligadas: flashcards (10 min), três frases no passado e hobby',
  lucas: 'Ukulele',
  jessica: 'Crochê ou leitura',
};
const dormir: Linha = { hora: '{dormir}', oque: 'Dormir' };

const treino = (hora: string): Linha => ({ hora, oque: 'Treino de elásticos em dupla', agua: [500, 500], tipo: 'treino', destaque: true });

const segunda: Linha[] = [
  acordar, caminhada, cafe, suporteSemana,
  { hora: '8:45–12:00', oque: 'Bloco 1: o trabalho mais importante, celular longe', agua: [1000, 700] },
  almoco, casaPets,
  { hora: '13:45–15:30', oque: 'Bloco 2', agua: [1000, 700], lucas: '1 L até o fim do bloco 3', jessica: '700 ml até o fim do bloco 3' },
  cafeTarde,
  { hora: '15:45–17:45', oque: 'Bloco 3' },
  treino('18:00–18:45'),
  prepJantar, banho, jantar,
  { hora: '20:30', oque: 'Lazer: um episódio de série' },
  telas, dormir,
];

const terca: Linha[] = [
  acordar, caminhada, cafe, suporteSemana,
  { hora: '8:45–11:15', oque: 'Bloco 1, com 10 min revisando a aula anterior', agua: [1000, 700] },
  { hora: '11:30–12:30', oque: 'Aula de inglês; logo depois, 5 min anotando palavras novas', tipo: 'aula', destaque: true },
  { hora: '12:30–13:45', oque: 'Almoço: metade vegetais, proteína, carboidrato de verdade', agua: [300, 200] },
  { hora: '13:45–14:15', oque: 'Casa e pets', papel: 'casa' },
  { hora: '14:15–17:15', oque: 'Trabalho mais operacional; café da tarde às 15:30', agua: [1000, 700] },
  { hora: '17:30', oque: 'Caminhada rápida na praia, juntos', agua: [500, 500], tipo: 'cardio', destaque: true },
  prepJantar, banho, jantar,
  { hora: '20:30', oque: 'Noite livre e leve (cabeça cansada da aula)' },
  telas, dormir,
];

const quarta: Linha[] = [
  acordar, caminhada, cafe, suporteSemana,
  { hora: '8:45–9:50', oque: 'Bloco curto, com revisão da aula anterior', agua: [1000, 700] },
  { hora: '10:00–11:00', oque: 'Aula de inglês; logo depois, anotar palavras novas', tipo: 'aula', destaque: true },
  { hora: '11:15–12:00', oque: 'Trabalho operacional' },
  almoco, casaPets,
  { hora: '13:45–15:00', oque: 'Trabalho operacional', agua: [1000, 700] },
  { hora: '15:00', oque: 'Café da tarde' },
  { hora: '15:15', oque: 'Compras juntos (Komprão ou Silveira)', destaque: true },
  { hora: '16:45', oque: 'Bike em casa', papel: 'casa', agua: [500, 500], tipo: 'cardio', destaque: true },
  { hora: '18:00', oque: 'Bike em casa', papel: 'suporte', agua: [500, 500], tipo: 'cardio', destaque: true },
  { hora: '18:00', oque: 'Preparar o jantar e o mini-preparo de quinta e sexta', papel: 'casa' },
  jantar,
  { hora: '20:30', oque: 'Jogo no computador' },
  telas, dormir,
];

const quinta: Linha[] = segunda.map((l) =>
  l.hora === '20:30'
    ? { hora: '20:30', oque: 'Sessão de música: Billie Eilish (30–40 min)', destaque: true }
    : l === telas
      ? { ...telas, lucas: 'Ukulele (a música da semana)' }
      : l,
);

const sexta: Linha[] = [
  acordar, caminhada, cafe, suporteSemana,
  { hora: '8:45–12:00', oque: 'Bloco 1', agua: [1000, 700] },
  almoco, casaPets,
  { hora: '13:45–15:30', oque: 'Bloco 2', agua: [1000, 700], lucas: '1 L até o treino', jessica: '700 ml até o treino' },
  cafeTarde,
  { hora: '15:45–17:00', oque: 'Bloco 3 (curto)' },
  treino('17:00–17:45'),
  {
    hora: '18:00',
    oque: 'Sexta do casal: receita especial, vinho, MasterChef ou série. Alimentação livre começa aqui',
    agua: [300, 300],
    lucas: 'Um copo de água a cada taça de vinho',
    jessica: 'Um copo de água a cada taça de vinho',
    destaque: true,
  },
  { hora: '1h antes de dormir', oque: 'Telas desligadas' },
  dormir,
];

const sabado: Linha[] = [
  acordar,
  { hora: '7:30', oque: 'Café da manhã normal, com proteína', agua: [300, 200] },
  { hora: '9:00–12:00', oque: 'Suporte aberto: celular por perto', papel: 'suporte' },
  { hora: '9:00–12:00', oque: 'Manhã livre em casa: leitura, ukulele, crochê, descanso', agua: [1000, 700] },
  { hora: '12:00', oque: 'Almoço livre', agua: [300, 200] },
  {
    hora: '14:30',
    oque: 'Trilha. Em dia muito quente, sair às 15:30. Protetor e boné',
    agua: [1500, 1200],
    lucas: 'Levar 1,5 L',
    jessica: 'Levar 1,2 L',
    tipo: 'trilha',
    destaque: true,
  },
  { hora: 'Volta da trilha', oque: 'Banho, praia ou cochilo' },
  { hora: 'Jantar', oque: 'Livre: pizza, receita, o que tiver vontade', agua: [300, 300] },
  { hora: 'Noite', oque: 'Filme da semana' },
  telas, dormir,
];

const domingo: Linha[] = [
  acordar,
  { hora: '7:15', oque: 'Mar ou caminhada leve + 10 min de alongamento', agua: [300, 200] },
  { hora: '8:00', oque: 'Café da manhã (volta a alimentação da semana)' },
  { hora: '9:00', oque: 'Lavanderia juntos; na espera, revisão de inglês da semana', agua: [1000, 700] },
  { hora: '12:00', oque: 'Almoço', agua: [300, 200] },
  { hora: '14:00–16:00', oque: 'Preparo da comida da semana (quem vai ficar na casa)' },
  {
    hora: '16:30',
    oque: 'Check-in do casal: o que funcionou, o que pesou, papéis da semana, lista do que assistir',
    agua: [1000, 700],
    destaque: true,
  },
  { hora: 'Tarde e noite', oque: 'Série ou documentário' },
  { hora: '19:30', oque: 'Jantar', agua: [300, 300] },
  telas, dormir,
];

const ROTEIRO: Linha[][] = [segunda, terca, quarta, quinta, sexta, sabado, domingo];

export function roteiroDoDia(dia: number, papel: Papel): Linha[] {
  const dormirHora = infoFase(dia).dormir;
  return ROTEIRO[diaDaSemana(dia)]
    .filter((l) => !l.papel || l.papel === papel)
    .map((l) => (l.hora === '{dormir}' ? { ...l, hora: dormirHora } : l));
}

export function metaAgua(dia: number, papel: Papel, pessoa: Pessoa): number {
  const i = pessoa === 'lucas' ? 0 : 1;
  return roteiroDoDia(dia, papel).reduce((s, l) => s + (l.agua ? l.agua[i] : 0), 0);
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
export function treinoDoDia(dia: number): { letra: 'A' | 'B'; lucasComecaComPuxadores: boolean } | null {
  const d = diaDaSemana(dia);
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

export function checklistDoDia(dia: number): { id: ItemId; label: string }[] {
  const d = diaDaSemana(dia);
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

// ── Regras e limites ──────────────────────────────────────────────

export const REGRAS: { titulo: string; itens: string[] }[] = [
  {
    titulo: 'Princípios',
    itens: [
      'Começar menor do que dá vontade: cada semana sobe um degrau.',
      'Nunca falhar duas vezes seguidas. Falhar um dia é normal.',
      'Meta do checklist: 6 de 7 por dia, não 7 de 7.',
      'O treino nunca é cortado por causa do papel da semana.',
      'Tudo que é fora de casa é feito juntos.',
    ],
  },
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
