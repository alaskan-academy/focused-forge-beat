// Repetição espaçada com sistema Leitner (5 caixas), invisível para o jogador.
//
// Por que Leitner e não SM-2: aguenta bem dias sem jogar, é fácil de entender e depurar, e
// combina com o que o jogo mede (acertou de primeira / com dica ou 2ª tentativa / errou).
// O SM-2 pede uma nota de 0 a 5 e fica instável com poucas revisões.

export type Grade = 'good' | 'ok' | 'fail';

export type VocabState = {
  item_id: string;
  box: number; // 1..5
  due_at: string; // ISO
  correct: number;
  wrong: number;
  first_seen_at: string;
  last_seen_at: string;
};

export const MAX_BOX = 5;
// dias até a próxima revisão para cada caixa (índice = caixa)
export const BOX_INTERVAL_DAYS = [0, 0, 1, 3, 7, 16];
// itens na caixa 1 voltam ainda hoje, mas não no pedido seguinte
const SAME_DAY_MINUTES = 20;

const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

function dueFor(box: number, now: Date): string {
  const days = BOX_INTERVAL_DAYS[box];
  return (days === 0 ? addMinutes(now, SAME_DAY_MINUTES) : addDays(now, days)).toISOString();
}

// Aplica o resultado de uma revisão.
//  good: acertou de primeira, sem dica → sobe uma caixa
//  ok:   acertou com dica ou na 2ª tentativa → fica na mesma caixa
//  fail: errou → desce duas caixas (mínimo 1)
export function review(prev: VocabState | undefined, itemId: string, grade: Grade, now: Date): VocabState {
  const iso = now.toISOString();
  if (!prev) {
    const box = grade === 'good' ? 2 : 1;
    return {
      item_id: itemId,
      box,
      due_at: dueFor(box, now),
      correct: grade === 'fail' ? 0 : 1,
      wrong: grade === 'fail' ? 1 : 0,
      first_seen_at: iso,
      last_seen_at: iso,
    };
  }
  const box = grade === 'good' ? Math.min(MAX_BOX, prev.box + 1) : grade === 'ok' ? prev.box : Math.max(1, prev.box - 2);
  return {
    ...prev,
    box,
    due_at: dueFor(box, now),
    correct: prev.correct + (grade === 'fail' ? 0 : 1),
    wrong: prev.wrong + (grade === 'fail' ? 1 : 0),
    last_seen_at: iso,
  };
}

export function isDue(s: VocabState, now: Date): boolean {
  return new Date(s.due_at).getTime() <= now.getTime();
}

// Quantos dias de atraso (0 se ainda não venceu).
export function overdueDays(s: VocabState, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(s.due_at).getTime()) / 86_400_000);
}

// Itens vistos pela primeira vez hoje (para limitar quantos novos entram por dia).
export function newToday(states: Iterable<VocabState>, now: Date): number {
  const today = now.toDateString();
  let n = 0;
  for (const s of states) if (new Date(s.first_seen_at).toDateString() === today) n++;
  return n;
}
