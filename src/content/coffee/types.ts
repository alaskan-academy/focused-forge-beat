// Formato do conteúdo do Coffee Cats. Veja CONTENT_GUIDE.md para exemplos e regras de escrita.
//
// Tudo que acontece num atendimento é uma CENA: uma lista de passos, que são falas (`say`)
// ou atividades (`activity`). Toda cena precisa ter pelo menos uma atividade.
import type { Appearance } from '@/lib/coffee/character';

export type Level = 'A2' | 'A2+' | 'B1';

export type Theme =
  | 'drinks'
  | 'food'
  | 'ordering'
  | 'smalltalk'
  | 'feelings'
  | 'work'
  | 'tech'
  | 'cats'
  | 'pets'
  | 'places'
  | 'relationships'
  | 'family'
  | 'life'
  | 'home';

export type Mood = 'neutral' | 'happy' | 'excited' | 'love' | 'sad' | 'worried' | 'embarrassed' | 'angry' | 'thinking' | 'tired';

export const MOOD_EMOJI: Record<Mood, string> = {
  neutral: '🙂',
  happy: '😊',
  excited: '🤩',
  love: '🥰',
  sad: '😢',
  worried: '😟',
  embarrassed: '😳',
  angry: '😠',
  thinking: '🤔',
  tired: '😮‍💨',
};

// Uma fala do cliente. `pt` é a tradução (só aparece como dica paga).
// `speaker` serve para cenas com duas pessoas (ex.: Jun e Alex); sem ele, fala o cliente.
export type Line = { say: string; pt: string; mood?: Mood; speaker?: string };

// ── Atividades ──────────────────────────────────────────────────────────────
// Campos comuns: `id` (único dentro da cena) e `items` (ids de vocabulário de vocab.ts ou de
// gramática de grammar.ts, com prefixo "g:") que a atividade treina. O SRS usa `items`.

type Base = { id: string; items: string[] };

export type ReplyOption = {
  text: string;
  correct?: boolean;
  // por que não serve (português), mostrado quando o jogador escolhe essa opção
  why_pt?: string;
  // efeito nos corações (ex.: +1 resposta acolhedora, -1 resposta fria)
  hearts?: number;
  // reação do cliente a essa escolha
  reaction?: Line;
  // escolha pessoal (com `either`): o valor fica guardado (ex.: quem reservou a cabana)
  value?: string;
};

// Escolher a resposta certa em gramática E em tom. Exatamente uma opção `correct`.
// Com `either`, é uma escolha pessoal: mais de uma opção pode ser `correct` (cada uma com `value`),
// e as erradas são erros de inglês.
export type ChooseReply = Base & { type: 'choose_reply'; prompt_pt?: string; options: ReplyOption[]; either?: boolean };

// Montar a própria fala ordenando palavras. As peças falsas não podem aparecer na resposta.
export type BuildReply = Base & { type: 'build_reply'; text: string; pt: string; distractors: string[] };

// Completar a lacuna. Com `options`, começa em múltipla escolha e vira digitação quando o
// jogador já domina os itens; sem `options`, é sempre digitada. `answers` = formas aceitas.
export type Gap = Base & {
  type: 'gap';
  who: 'customer' | 'player';
  before: string;
  after: string;
  answers: string[];
  options?: string[];
  pt: string; // tradução da frase inteira
};

// Pergunta de escolha única (compreensão, lembrança, item seguro, recomendação, troco).
type PickBase = Base & { question: string; options: string[]; answer: number; why_pt?: string };
export type Comprehension = PickBase & { type: 'comprehension' };
// Lembrança do capítulo anterior. `from` = id do capítulo onde a resposta apareceu.
export type Recall = PickBase & { type: 'recall'; from: string };
// Escolher o item seguro para uma restrição. `avoid` = tags de menu.ts que o cliente não pode comer.
export type SafePick = PickBase & { type: 'safe_pick'; avoid: string[] };
// Recomendar o item que combina com o que o cliente descreveu. `wants` = tags de menu.ts.
export type Recommend = PickBase & { type: 'recommend'; wants: string[] };
// Calcular o troco. Valores em centavos; `options` são valores em texto ("$5.50").
export type Change = PickBase & { type: 'change'; price_cents: number; paid_cents: number };

// Escrita livre curta: vale se tiver pelo menos uma palavra de CADA grupo de `keywords`.
// Nunca reprova por gramática, só por sentido.
export type FreeWrite = Base & {
  type: 'free_write';
  prompt: string; // em inglês (o que responder)
  prompt_pt: string;
  keywords: string[][];
  examples: string[];
};

// Montar o pedido no balcão. Campos de menu.ts. `milk` aceita lista quando a fala é indireta.
export type OrderSpec = {
  size?: string;
  drink?: string;
  temp?: string;
  milk?: string | string[];
  extras?: string[];
  food?: string[];
  where?: string;
};
export type BuildOrder = Base & { type: 'build_order'; order: OrderSpec };

// Pedido em grupo: quantidade de cada item (nomes de menu.ts).
export type GroupOrder = Base & { type: 'group_order'; order: Record<string, number>; choices: string[] };

// Achar o erro: a frase tem UMA palavra errada, marcada com *asteriscos* em `sentence`
// (ex.: "Did you *went* to the party?"). O jogador toca na palavra errada; `fix` é a frase certa.
export type SpotError = Base & { type: 'spot_error'; sentence: string; fix: string; why_pt: string };

export type Activity =
  | ChooseReply
  | BuildReply
  | Gap
  | Comprehension
  | Recall
  | SafePick
  | Recommend
  | Change
  | FreeWrite
  | BuildOrder
  | GroupOrder
  | SpotError;

export type ActivityType = Activity['type'];

export type Step = Line | { activity: Activity };

export const isLine = (s: Step): s is Line => 'say' in s;

// ── Cenas ───────────────────────────────────────────────────────────────────

export type OrderType =
  | 'basic'
  | 'modified'
  | 'food'
  | 'where'
  | 'allergy'
  | 'polite'
  | 'indecisive'
  | 'group'
  | 'complaint'
  | 'payment'
  | 'menu_question'
  | 'phone';

export type Scene = {
  id: string;
  kind: 'order' | 'talk' | 'chapter' | 'regular' | 'handoff';
  theme: Theme;
  level: Level;
  steps: Step[];
  // pedidos
  orderType?: OrderType;
  // 'phone' = pedido por telefone/app: só texto, sem ícones de apoio
  channel?: 'counter' | 'phone';
  // conversas avulsas: emendar um pedido depois da conversa
  withOrder?: boolean;
  // falas mais longas (até 5 frases), para personagens de nível mais alto (Belmont)
  long?: boolean;
};

export type Chapter = Scene & {
  kind: 'chapter';
  title_pt: string;
  summary_pt: string; // resumo para o caderninho
  gapDays?: number; // dias desde o capítulo anterior (padrão 2)
  minHearts?: number; // corações mínimos (capítulos especiais)
};

export type Character = {
  id: string;
  name: string;
  look: Appearance;
  personality_pt: string;
  bio_pt: string;
  // capítulos em ordem; os com minHearts > 0 são especiais e só aparecem com amizade alta
  chapters: Chapter[];
  // "bate-papos de cliente fiel", usados quando não há capítulo disponível
  regulars: Scene[];
};
