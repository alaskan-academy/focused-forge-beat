import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ITEMS } from '@/content/coffee';
import { SUDOKU_THEME_BY_ID, SUDOKU_WORD_BY_ID, sudokuItemId, type SudokuWord } from '@/content/coffee/sudokuWords';
import { checkTyped } from '@/lib/coffee/activities';
import {
  BOX,
  CLUE_REVEAL_COST,
  PUZZLE_COINS,
  UNLOCK_LEVEL,
  colOf,
  boxOf,
  dayKey,
  emptyProgress,
  isGiven,
  isSolved,
  ptClue,
  rowOf,
  totals,
  typedFor,
  type ClueKind,
  type PuzzleSummary,
  type SudokuProgress,
  type SudokuSize,
} from '@/lib/coffee/sudoku';
import type { VocabState } from '@/lib/coffee/srs';
import type { PuzzleRow } from '@/lib/coffee/store/types';

type Mode = 'auto' | 'list' | 'type';
const MODE_KEY = 'coffee-cats:sudoku-mode';
const loadMode = (): Mode => {
  try {
    const m = localStorage.getItem(MODE_KEY);
    return m === 'list' || m === 'type' ? m : 'auto';
  } catch {
    return 'auto';
  }
};

type Props = {
  puzzles: PuzzleRow[];
  states: Record<string, VocabState>;
  level: number;
  coins: number;
  now: Date;
  onStart: (size: SudokuSize) => Promise<PuzzleRow>;
  onSave: (id: string, progress: SudokuProgress) => Promise<void>;
  onFinish: (row: PuzzleRow, progress: SudokuProgress) => Promise<PuzzleSummary>;
  onSpend: (cost: number) => Promise<boolean>;
  onClose: () => void;
};

const SIZES: { size: SudokuSize; title: string; desc: string }[] = [
  { size: 4, title: '4×4 · Rápido', desc: '4 palavras, pistas mais fáceis' },
  { size: 6, title: '6×6 · Padrão', desc: '6 palavras, pistas variadas' },
  { size: 9, title: '9×9 · Desafio', desc: 'Em breve: definições e lacunas' },
];

// Mesa de jogos: escolhe o tamanho do Sudoku de hoje e joga. Cada tamanho vale uma vez por dia.
export default function GameTable(props: Props) {
  const { puzzles, level, now, onStart, onClose } = props;
  const [row, setRow] = useState<PuzzleRow | null>(null);
  const [opening, setOpening] = useState<SudokuSize | null>(null);
  const today = dayKey(now);
  const todays = (size: SudokuSize) => puzzles.find((p) => p.day === today && p.size === size);

  const open = async (size: SudokuSize) => {
    setOpening(size);
    try {
      setRow(await onStart(size));
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-2 sm:p-4">
      <div className="cc-panel flex max-h-[96%] w-full max-w-lg flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b-2 border-[#e6d2ad] bg-[#f6ead3] px-3 py-2">
          {row && (
            <button type="button" onClick={() => setRow(null)} className="rounded-lg p-1.5 hover:bg-[#e9d5b5]" aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="cc-title flex-1 text-xl">♟️ Mesa de jogos</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#e9d5b5]" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {row ? (
          <Board key={row.id} {...props} row={row} />
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#fbf3e4] p-4">
            <div>
              <div className="cc-title text-lg">Sudoku de inglês</div>
              <p className="text-sm opacity-75">
                Cada palavra aparece uma vez em cada linha, coluna e bloco. As casas prontas mostram só uma <b>pista</b> (imagem, tradução,
                definição ou frase): descubra a palavra e preencha o resto em inglês.
              </p>
            </div>
            {SIZES.map(({ size, title, desc }) => {
              const p = todays(size);
              const locked = level < UNLOCK_LEVEL[size] || size === 9;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={locked || opening !== null}
                  onClick={() => open(size)}
                  className={cn('cc-card flex w-full items-center gap-3 text-left transition-transform', !locked && 'hover:-translate-y-0.5', locked && 'opacity-60')}
                >
                  <MiniGrid size={size} />
                  <div className="min-w-0 flex-1">
                    <div className="cc-title text-base">{title}</div>
                    <div className="text-xs opacity-70">{desc}</div>
                    <div className="mt-0.5 text-xs font-semibold">
                      {locked
                        ? size === 9
                          ? `Nv ${UNLOCK_LEVEL[9]} · na próxima etapa`
                          : `Abre no Nv ${UNLOCK_LEVEL[size]}`
                        : p?.status === 'done'
                          ? `Feito hoje ${'⭐'.repeat(p.stars ?? 1)}`
                          : p
                            ? 'Em andamento: continuar'
                            : `Novo hoje · +${PUZZLE_COINS[size]} 🪙`}
                    </div>
                  </div>
                  {locked ? <Lock className="h-4 w-4 opacity-60" /> : opening === size ? <span className="text-xs">…</span> : null}
                </button>
              );
            })}
            <p className="text-center text-xs opacity-60">Um puzzle de cada tamanho por dia. As palavras vêm da sua revisão.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniGrid({ size }: { size: SudokuSize }) {
  const n = Math.min(size, 6);
  return (
    <div className="grid h-11 w-11 shrink-0 gap-px rounded-md bg-[#5e3a24] p-0.5" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {Array.from({ length: n * n }, (_, i) => (
        <span key={i} className={(rowOf(i, n) + colOf(i, n)) % 2 ? 'bg-[#3d2a22]' : 'bg-[#f2ead8]'} />
      ))}
    </div>
  );
}

// ── tabuleiro ───────────────────────────────────────────────────────────────

const CLUE_LABEL: Record<ClueKind, string> = { emoji: 'Imagem', pt: 'Tradução', def: 'Definição', gap: 'Frase com lacuna' };

function Board({ row, states, coins, now, onSave, onFinish, onSpend }: Props & { row: PuzzleRow }) {
  const p = row.data;
  const n = p.size;
  const words = useMemo(() => p.words.map((id) => SUDOKU_WORD_BY_ID[id]), [p.words]);
  const theme = SUDOKU_THEME_BY_ID[p.theme];
  const [prog, setProg] = useState<SudokuProgress>(() => row.progress ?? emptyProgress(now));
  const [sel, setSel] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>(loadMode);
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState<{ cell: number; tick: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [summary, setSummary] = useState<PuzzleSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const done = row.status === 'done' || !!summary;

  // salva o andamento (com um pequeno atraso) para continuar depois
  const saveTimer = useRef<number | null>(null);
  const latest = useRef(prog);
  latest.current = prog;
  const persist = (next: SudokuProgress) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => onSave(row.id, next).catch(() => {}), 500);
  };
  useEffect(
    () => () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        if (row.status === 'playing') onSave(row.id, latest.current).catch(() => {});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const update = (next: SudokuProgress) => {
    setProg(next);
    if (isSolved(p, next)) finish(next);
    else persist(next);
  };

  const finish = async (final: SudokuProgress) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSaving(true);
    try {
      setSummary(await onFinish(row, final));
    } finally {
      setSaving(false);
    }
  };

  const valueAt = (i: number) => (isGiven(p, i) ? p.solution[i] : prog.filled[i]);
  const selWord = sel !== null ? words[p.solution[sel]] : null;
  const selGiven = sel !== null && isGiven(p, sel);
  const wordBox = (w: SudokuWord) => states[sudokuItemId(w)]?.box ?? 0;
  const useTyping = selWord ? (mode === 'auto' ? typedFor(wordBox(selWord)) : mode === 'type') : false;

  const answer = (cell: number, symbol: number | null, text?: string) => {
    if (done || isGiven(p, cell) || prog.filled[cell] !== undefined) return;
    const target = words[p.solution[cell]];
    let ok = symbol === p.solution[cell];
    let typo = false;
    if (text !== undefined) {
      const res = checkTyped(text, [target.en]);
      ok = res !== 'wrong';
      typo = res === 'typo';
    }
    if (!ok) {
      setWrong({ cell, tick: Date.now() });
      setNote('Não é essa palavra aqui. Confira a linha, a coluna e o bloco.');
      update({ ...prog, mistakes: { ...prog.mistakes, [target.id]: (prog.mistakes[target.id] ?? 0) + 1 } });
      return;
    }
    setNote(typo ? `Quase! A grafia é “${target.en}”.` : null);
    setTyped('');
    const next: SudokuProgress = {
      ...prog,
      filled: { ...prog.filled, [cell]: p.solution[cell] },
      // erro de digitação conta como ajuda (não perde a estrela de erro, mas a palavra volta antes)
      hints: typo ? { ...prog.hints, [target.id]: (prog.hints[target.id] ?? 0) + 1 } : prog.hints,
    };
    update(next);
    // vai para a próxima casa vazia
    const after = p.solution.findIndex((_, i) => i > cell && !isGiven(p, i) && next.filled[i] === undefined);
    setSel(after >= 0 ? after : null);
  };

  const reveal = async (cell: number) => {
    if (prog.revealed.includes(cell)) return;
    if (!(await onSpend(CLUE_REVEAL_COST))) return;
    const w = words[p.solution[cell]];
    update({ ...prog, revealed: [...prog.revealed, cell], hints: { ...prog.hints, [w.id]: (prog.hints[w.id] ?? 0) + 1 } });
  };

  const setModePref = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* sem armazenamento */
    }
  };

  const t = totals(prog);
  const { r: br, c: bc } = BOX[n];
  const sorted = useMemo(() => words.map((w, sym) => ({ w, sym })).sort((a, b) => a.w.en.localeCompare(b.w.en)), [words]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#fbf3e4] p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold">
          {theme?.emoji} {theme?.name_pt} · {n}×{n}
        </span>
        <span className="opacity-70">
          🪙 {coins} {t.mistakes > 0 && <span className="ml-1 text-[#8a3a26]">❌ {t.mistakes}</span>}
          {t.hints > 0 && <span className="ml-1">💡 {t.hints}</span>}
        </span>
      </div>

      <div
        className="mx-auto grid aspect-square w-full max-w-[420px] overflow-hidden rounded-lg border-[3px] border-[#5e3a24]"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      >
        {p.solution.map((sym, i) => {
          const r = rowOf(i, n);
          const c = colOf(i, n);
          const given = isGiven(p, i);
          const v = valueAt(i);
          const related = sel !== null && (rowOf(sel, n) === r || colOf(sel, n) === c || boxOf(sel, n) === boxOf(i, n));
          const shaking = wrong?.cell === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSel(i);
                setNote(null);
              }}
              className={cn(
                'relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden border-[#5e3a24] p-0.5 text-center leading-tight transition-colors',
                (Math.floor(r / br) + Math.floor(c / bc)) % 2 ? 'bg-[#f6ead3]' : 'bg-[#fffaf0]',
                related && 'bg-[#f2e2c2]',
                sel === i && 'bg-[#f2cc8f]',
                // linhas finas entre casas, grossas entre blocos
                c < n - 1 && ((c + 1) % bc === 0 ? 'border-r-[3px]' : 'border-r'),
                r < n - 1 && ((r + 1) % br === 0 ? 'border-b-[3px]' : 'border-b'),
                shaking && 'animate-[cc-shake_0.35s]',
              )}
              style={{ fontSize: n === 4 ? 13 : 11 }}
              aria-label={given ? `pista ${CLUE_LABEL[p.clues[i]]}` : v !== undefined ? words[v].en : 'casa vazia'}
            >
              {given ? (
                <ClueFace word={words[sym]} kind={p.clues[i]} revealed={prog.revealed.includes(i)} big={n === 4} />
              ) : v !== undefined ? (
                <span className="break-words font-bold text-[#2f5d46]">{words[v].en}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {summary ? (
        <Summary s={summary} />
      ) : row.status === 'done' ? (
        <div className="cc-card mt-3 text-center text-sm">Você já resolveu este puzzle hoje {'⭐'.repeat(row.stars ?? 1)}. Volte amanhã para um novo!</div>
      ) : (
        <div className="cc-card mt-3 min-h-[120px]">
          {saving && <div className="py-4 text-center text-sm opacity-60">Guardando…</div>}
          {!saving && sel === null && <p className="py-3 text-center text-sm opacity-70">Toque numa casa vazia para preencher, ou numa pista para lê-la.</p>}
          {!saving && sel !== null && selWord && selGiven && (
            <div>
              <div className="text-xs font-semibold opacity-60">Pista · {CLUE_LABEL[p.clues[sel]]}</div>
              <ClueText word={selWord} kind={p.clues[sel]} />
              {prog.revealed.includes(sel) ? (
                <div className="mt-2 text-sm">
                  A palavra é <b>{selWord.en}</b>
                </div>
              ) : (
                <button type="button" className="cc-btn-ghost mt-2 text-xs" onClick={() => reveal(sel)}>
                  💡 Revelar a palavra · {CLUE_REVEAL_COST}🪙
                </button>
              )}
            </div>
          )}
          {!saving && sel !== null && selWord && !selGiven && valueAt(sel) !== undefined && (
            <p className="py-3 text-center text-sm">
              <b>{selWord.en}</b> = {selWord.pt} ✓
            </p>
          )}
          {!saving && sel !== null && selWord && !selGiven && valueAt(sel) === undefined && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold opacity-60">Qual palavra vai aqui?</span>
                <div className="flex gap-1">
                  {(
                    [
                      ['auto', 'Auto'],
                      ['list', 'Lista'],
                      ['type', 'Digitar'],
                    ] as [Mode, string][]
                  ).map(([m, label]) => (
                    <button key={m} type="button" onClick={() => setModePref(m)} className={cn('cc-chip px-2 py-0.5 text-[11px]', mode === m && 'cc-chip-on')}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {useTyping ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (typed.trim()) answer(sel, null, typed);
                  }}
                >
                  <input
                    autoFocus
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    className="cc-input min-w-0 flex-1 py-1.5"
                    placeholder="digite em inglês…"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button type="submit" className="cc-btn px-3 py-1.5" disabled={!typed.trim()}>
                    OK
                  </button>
                </form>
              ) : (
                <div className={cn('grid gap-1.5', n === 4 ? 'grid-cols-2' : 'grid-cols-3')}>
                  {sorted.map(({ w, sym }) => (
                    <button key={w.id} type="button" className="cc-option px-2 py-1.5 text-center text-sm" onClick={() => answer(sel, sym)}>
                      {w.en}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {note && <p className="mt-2 rounded-lg bg-[#f6d5cb] px-2 py-1 text-xs text-[#8a3a26]">{note}</p>}
        </div>
      )}
    </div>
  );
}

// Como a pista aparece na casa (curta); o texto completo aparece embaixo ao tocar.
function ClueFace({ word, kind, revealed, big }: { word: SudokuWord; kind: ClueKind; revealed: boolean; big: boolean }) {
  const face =
    kind === 'emoji' ? (
      <span className={big ? 'text-3xl' : 'text-2xl'}>{word.emoji}</span>
    ) : kind === 'pt' ? (
      <span className="break-words italic text-[#7d4f33]">{ptClue(word)}</span>
    ) : (
      <span className="flex flex-col items-center text-[#7d4f33]">
        <span className={big ? 'text-xl' : 'text-lg'}>{kind === 'def' ? '📖' : '✏️'}</span>
        <span className="text-[9px] uppercase tracking-wide opacity-70">{kind === 'def' ? 'definição' : 'frase'}</span>
      </span>
    );
  return (
    <span className="flex flex-col items-center">
      {face}
      {revealed && <span className="mt-0.5 rounded bg-[#5e3a24] px-1 text-[9px] font-semibold text-white">{word.en}</span>}
    </span>
  );
}

function ClueText({ word, kind }: { word: SudokuWord; kind: ClueKind }) {
  if (kind === 'emoji') return <div className="mt-1 text-4xl">{word.emoji}</div>;
  if (kind === 'pt') return <div className="mt-1 text-lg font-semibold">{ptClue(word)}</div>;
  if (kind === 'def') return <div className="mt-1 text-base italic">“{word.def}”</div>;
  return <div className="mt-1 text-base italic">“{word.gap.replace('___', '_____')}”</div>;
}

function Summary({ s }: { s: PuzzleSummary }) {
  return (
    <div className="cc-card mt-3 animate-in zoom-in-95 fade-in text-center duration-300">
      <div className="text-3xl tracking-widest">
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= s.stars ? '' : 'opacity-25 grayscale'}>
            ⭐
          </span>
        ))}
      </div>
      <div className="cc-title mt-1 text-base">{s.feedback.headline}</div>
      {s.feedback.notes.map((n) => (
        <div key={n} className="text-xs opacity-75">
          {n}
        </div>
      ))}
      <div className="mt-2 flex justify-center gap-3 text-sm font-semibold">
        <span>+{s.coins} 🪙</span>
        <span>+{s.xp} XP</span>
      </div>
      <div className="mt-3 text-left text-xs">
        <div className="mb-1 font-semibold opacity-70">Você treinou:</div>
        <div className="flex flex-wrap gap-1">
          {s.items.map((id) => {
            const weak = s.weak.includes(id);
            return (
              <span key={id} className={cn('rounded-full px-2 py-0.5', weak ? 'bg-[#f6d5cb] text-[#8a3a26]' : 'bg-[#efe0c4]')}>
                {weak ? '↻ ' : ''}
                {ITEMS[id]?.label ?? id}
              </span>
            );
          })}
        </div>
        {s.weak.length > 0 && <div className="mt-1 opacity-60">↻ = volta logo na revisão para você fixar</div>}
      </div>
    </div>
  );
}
