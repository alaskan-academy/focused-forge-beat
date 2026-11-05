// Cartões das atividades. Um componente por formato; adicionar um tipo novo = um componente
// aqui + um tipo em content/coffee/types.ts + uma regra em lib/coffee/activities.ts.
import { useMemo, useState, type ReactNode } from 'react';
import { Check, Languages, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MENU, MULTI_FIELDS } from '@/content/coffee/menu';
import type {
  Activity,
  BuildOrder,
  BuildReply,
  ChooseReply,
  FreeWrite,
  Gap,
  GroupOrder,
  Line,
  OrderSpec,
} from '@/content/coffee/types';
import {
  HINT_LINE_COST,
  buildTiles,
  checkFreeWrite,
  checkGroup,
  checkOrder,
  checkTiles,
  checkTyped,
  correctPrefix,
  emptySelection,
  orderFields,
  type OrderSelection,
  type Tile,
} from '@/lib/coffee/activities';

export type CardOutcome = {
  mistakes: number;
  hints: number;
  revealed: boolean;
  hearts: number;
  // o que o jogador "disse" (vai para a conversa como fala dele)
  utterance?: string;
  // fala do cliente (lacuna do cliente) que entra na conversa
  customerLine?: string;
};

type CardProps<A> = {
  activity: A;
  onHint: (cost: number) => Promise<boolean>;
  onReaction: (line: Line) => void;
  onDone: (o: CardOutcome) => void;
};

const MAX_TRIES = 3;

function Shell({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="cc-card animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#7d4f33]/80">{title}</div>
      {children}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}

function Feedback({ kind, children }: { kind: 'ok' | 'bad' | 'info'; children: ReactNode }) {
  return (
    <div
      className={cn(
        'mt-2 rounded-lg px-3 py-2 text-sm',
        kind === 'ok' && 'bg-[#81b29a]/25 text-[#2f5d46]',
        kind === 'bad' && 'bg-[#e07a5f]/20 text-[#8a3a26]',
        kind === 'info' && 'bg-[#f2cc8f]/40 text-[#5e4433]',
      )}
    >
      {children}
    </div>
  );
}

function HintButton({ cost, label, onClick }: { cost: number; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="cc-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-xs">
      <Languages className="h-3.5 w-3.5" /> {label} · {cost}🪙
    </button>
  );
}

// ── choose_reply ────────────────────────────────────────────────────────────

function ChooseReplyCard({ activity: a, onReaction, onDone }: CardProps<ChooseReply>) {
  const options = useMemo(() => shuffled(a.options), [a]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [hearts, setHearts] = useState(0);
  const lastWrong = options.find((o) => o.text === wrong[wrong.length - 1]);

  const pick = (o: ChooseReply['options'][number]) => {
    if (done || wrong.includes(o.text)) return;
    const h = hearts + (o.hearts ?? 0);
    setHearts(h);
    if (o.reaction) onReaction(o.reaction);
    if (o.correct) {
      setDone(true);
      onDone({ mistakes: wrong.length, hints: 0, revealed: false, hearts: h, utterance: o.text });
    } else setWrong([...wrong, o.text]);
  };

  return (
    <Shell title={a.prompt_pt ?? 'Escolha a melhor resposta'}>
      <div className="flex flex-col gap-2">
        {options.map((o) => {
          const isWrong = wrong.includes(o.text);
          const isRight = done && o.correct;
          return (
            <button
              key={o.text}
              type="button"
              disabled={done || isWrong}
              onClick={() => pick(o)}
              className={cn('cc-option', isWrong && 'cc-option-bad', isRight && 'cc-option-ok')}
            >
              {o.text}
            </button>
          );
        })}
      </div>
      {!done && lastWrong?.why_pt && <Feedback kind="bad">{lastWrong.why_pt}</Feedback>}
    </Shell>
  );
}

// ── build_reply ─────────────────────────────────────────────────────────────

function BuildReplyCard({ activity: a, onHint, onDone }: CardProps<BuildReply>) {
  const tiles = useMemo(() => buildTiles(a.text, a.distractors), [a]);
  const [chosen, setChosen] = useState<Tile[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [showPt, setShowPt] = useState(false);
  const [state, setState] = useState<'play' | 'ok' | 'revealed'>('play');
  const [bad, setBad] = useState(false);
  const words = a.text.split(/\s+/).length;
  const pool = tiles.filter((t) => !chosen.some((c) => c.id === t.id));

  const check = () => {
    const texts = chosen.map((c) => c.text);
    if (checkTiles(a.text, texts)) {
      setState('ok');
      onDone({ mistakes, hints, revealed: false, hearts: 0, utterance: a.text });
      return;
    }
    const m = mistakes + 1;
    setMistakes(m);
    setBad(true);
    if (m >= MAX_TRIES) {
      setState('revealed');
      onDone({ mistakes: m, hints, revealed: true, hearts: 0, utterance: a.text });
      return;
    }
    // mantém o começo certo, devolve o resto
    setChosen(chosen.slice(0, correctPrefix(a.text, texts)));
  };

  return (
    <Shell
      title="Monte a sua resposta"
      footer={
        state === 'play' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="cc-btn" disabled={chosen.length !== words} onClick={check}>
              Conferir
            </button>
            <button type="button" className="cc-btn-ghost inline-flex items-center gap-1" onClick={() => setChosen([])}>
              <RotateCcw className="h-3.5 w-3.5" /> Limpar
            </button>
            {!showPt && (
              <HintButton
                cost={HINT_LINE_COST}
                label="Tradução"
                onClick={async () => {
                  if (await onHint(HINT_LINE_COST)) {
                    setShowPt(true);
                    setHints(hints + 1);
                  }
                }}
              />
            )}
          </div>
        ) : null
      }
    >
      {showPt && <p className="mb-2 text-sm italic opacity-75">“{a.pt}”</p>}
      <div className={cn('flex min-h-[44px] flex-wrap gap-1.5 rounded-lg border-2 border-dashed border-[#d4bf9a] p-2', state === 'ok' && 'border-[#81b29a]')}>
        {(state === 'revealed' ? a.text.split(/\s+/).map((text, id) => ({ id, text })) : chosen).map((t) => (
          <button key={t.id} type="button" disabled={state !== 'play'} className="cc-tile cc-tile-on" onClick={() => setChosen(chosen.filter((c) => c.id !== t.id))}>
            {t.text}
          </button>
        ))}
      </div>
      {state === 'play' && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pool.map((t) => (
            <button key={t.id} type="button" className="cc-tile" onClick={() => { setBad(false); setChosen([...chosen, t]); }}>
              {t.text}
            </button>
          ))}
        </div>
      )}
      {state === 'play' && bad && <Feedback kind="bad">Quase! Mantive o começo que estava certo.</Feedback>}
      {state === 'revealed' && <Feedback kind="info">A frase era esta. Ela vai voltar em breve.</Feedback>}
    </Shell>
  );
}

// ── gap ─────────────────────────────────────────────────────────────────────

function GapCard({ activity: a, mode, onHint, onDone }: CardProps<Gap> & { mode: 'options' | 'typed' }) {
  const options = useMemo(() => shuffled(a.options ?? []), [a]);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [showPt, setShowPt] = useState(false);
  const [wrong, setWrong] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [state, setState] = useState<'play' | 'ok' | 'typo' | 'revealed'>('play');
  const answer = a.answers[0];
  const full = a.before + answer + a.after;

  const finish = (m: number, revealed: boolean, ok: 'ok' | 'typo' | 'revealed') => {
    setState(ok);
    onDone({
      mistakes: m,
      hints,
      revealed,
      hearts: 0,
      ...(a.who === 'player' ? { utterance: full } : { customerLine: full }),
    });
  };

  const tryAnswer = (value: string) => {
    if (state !== 'play') return;
    const res = mode === 'typed' ? checkTyped(value, a.answers) : a.answers.includes(value) ? 'exact' : 'wrong';
    if (res === 'exact') return finish(mistakes, false, 'ok');
    if (res === 'typo') return finish(mistakes + 1, false, 'typo');
    const m = mistakes + 1;
    setMistakes(m);
    if (mode === 'options') setWrong([...wrong, value]);
    if (m >= (mode === 'options' ? 2 : MAX_TRIES)) finish(m, true, 'revealed');
  };

  const blank = (
    <span className={cn('mx-0.5 inline-block min-w-[64px] border-b-2 px-1 text-center font-semibold', state === 'play' ? 'border-[#e07a5f]' : 'border-[#81b29a] text-[#2f5d46]')}>
      {state === 'play' ? (mode === 'typed' && text ? text : ' ') : answer}
    </span>
  );

  return (
    <Shell title={a.who === 'player' ? 'Complete a sua fala' : 'Complete o que o cliente disse'}>
      <p className="text-base leading-relaxed">
        {a.before}
        {blank}
        {a.after}
      </p>
      {showPt && <p className="mt-1 text-sm italic opacity-75">“{a.pt}”</p>}
      {state === 'play' &&
        (mode === 'options' ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((o) => (
              <button key={o} type="button" disabled={wrong.includes(o)} onClick={() => tryAnswer(o)} className={cn('cc-option px-4', wrong.includes(o) && 'cc-option-bad')}>
                {o}
              </button>
            ))}
          </div>
        ) : (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) tryAnswer(text);
            }}
          >
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="cc-input flex-1"
              placeholder="digite em inglês…"
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="cc-btn">
              OK
            </button>
          </form>
        ))}
      {state === 'play' && (
        <div className="mt-2 flex items-center gap-2">
          {!showPt && (
            <HintButton
              cost={HINT_LINE_COST}
              label="Tradução"
              onClick={async () => {
                if (await onHint(HINT_LINE_COST)) {
                  setShowPt(true);
                  setHints(hints + 1);
                }
              }}
            />
          )}
          {mistakes > 0 && mode === 'typed' && <span className="text-xs text-[#8a3a26]">Ainda não. Tentativas: {MAX_TRIES - mistakes}</span>}
        </div>
      )}
      {state === 'typo' && <Feedback kind="ok">Quase perfeito! A grafia é “{answer}”.</Feedback>}
      {state === 'revealed' && <Feedback kind="info">A resposta era “{answer}”.</Feedback>}
    </Shell>
  );
}

// ── escolha única (compreensão, lembrança, alergia, recomendação, troco) ─────

const PICK_TITLE: Record<string, string> = {
  comprehension: 'Você entendeu?',
  recall: 'Você lembra?',
  safe_pick: 'Qual é seguro?',
  recommend: 'O que você recomenda?',
  change: 'Quanto de troco?',
};

type PickActivity = Extract<Activity, { type: 'comprehension' | 'recall' | 'safe_pick' | 'recommend' | 'change' }>;

function PickCard({ activity: a, onDone }: CardProps<PickActivity>) {
  const order = useMemo(() => shuffled(a.options.map((_, i) => i)), [a]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [state, setState] = useState<'play' | 'ok' | 'revealed'>('play');

  const pick = (i: number) => {
    if (state !== 'play' || wrong.includes(i)) return;
    if (i === a.answer) {
      setState('ok');
      onDone({ mistakes: wrong.length, hints: 0, revealed: false, hearts: 0 });
      return;
    }
    const w = [...wrong, i];
    setWrong(w);
    if (w.length >= 2) {
      setState('revealed');
      onDone({ mistakes: w.length, hints: 0, revealed: true, hearts: 0 });
    }
  };

  return (
    <Shell title={PICK_TITLE[a.type]}>
      {a.type !== 'recall' && <p className="mb-2 font-semibold">{a.question}</p>}
      <div className={cn('grid gap-2', a.type === 'change' ? 'grid-cols-2' : 'grid-cols-1')}>
        {order.map((i) => (
          <button
            key={i}
            type="button"
            disabled={state !== 'play' || wrong.includes(i)}
            onClick={() => pick(i)}
            className={cn('cc-option', wrong.includes(i) && 'cc-option-bad', state !== 'play' && i === a.answer && 'cc-option-ok')}
          >
            {a.options[i]}
          </button>
        ))}
      </div>
      {wrong.length > 0 && a.why_pt && <Feedback kind={state === 'revealed' ? 'info' : 'bad'}>{a.why_pt}</Feedback>}
    </Shell>
  );
}

// ── free_write ──────────────────────────────────────────────────────────────

function FreeWriteCard({ activity: a, onDone }: CardProps<FreeWrite>) {
  const [text, setText] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [state, setState] = useState<'play' | 'ok' | 'revealed'>('play');

  const send = () => {
    if (checkFreeWrite(a, text).ok) {
      setState('ok');
      onDone({ mistakes, hints: 0, revealed: false, hearts: 0, utterance: text.trim() });
      return;
    }
    const m = mistakes + 1;
    setMistakes(m);
    if (m >= 2) {
      setState('revealed');
      onDone({ mistakes: m, hints: 0, revealed: true, hearts: 0, utterance: a.examples[0] });
    }
  };

  return (
    <Shell title="Escreva com as suas palavras">
      <p className="font-semibold">{a.prompt}</p>
      <p className="text-xs opacity-70">{a.prompt_pt}</p>
      {state === 'play' ? (
        <>
          <textarea
            autoFocus
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="cc-input mt-2 w-full resize-none"
            placeholder="uma frase curta em inglês…"
            spellCheck={false}
          />
          <div className="mt-2 flex items-center gap-2">
            <button type="button" className="cc-btn" disabled={text.trim().split(/\s+/).length < 2} onClick={send}>
              Responder
            </button>
            <span className="text-xs opacity-60">Vale qualquer forma, o importante é a ideia.</span>
          </div>
          {mistakes > 0 && <Feedback kind="bad">Não entendi bem a ideia. Tente de outro jeito.</Feedback>}
        </>
      ) : (
        <Feedback kind={state === 'ok' ? 'ok' : 'info'}>
          {state === 'ok' ? 'Boa! Outras formas de dizer:' : 'Você poderia dizer, por exemplo:'}
          <ul className="mt-1 list-disc pl-5">
            {a.examples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        </Feedback>
      )}
    </Shell>
  );
}

// ── build_order ─────────────────────────────────────────────────────────────

const FIELD_LABEL: Record<keyof OrderSpec, string> = {
  size: 'Tamanho',
  drink: 'Bebida',
  temp: 'Quente/gelado',
  milk: 'Leite',
  extras: 'Extras',
  food: 'Comida',
  where: 'Onde',
};

function BuildOrderCard({ activity: a, onDone }: CardProps<BuildOrder>) {
  const fields = orderFields(a.order);
  const [sel, setSel] = useState<OrderSelection>(emptySelection);
  const [wrong, setWrong] = useState<(keyof OrderSpec)[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [state, setState] = useState<'play' | 'ok' | 'revealed'>('play');

  const toggle = (f: keyof OrderSpec, v: string) => {
    setWrong(wrong.filter((w) => w !== f));
    if ((MULTI_FIELDS as readonly string[]).includes(f)) {
      const list = sel[f as 'extras' | 'food'];
      setSel({ ...sel, [f]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] });
    } else setSel({ ...sel, [f]: sel[f as 'size'] === v ? undefined : v });
  };

  const serve = () => {
    const res = checkOrder(a.order, sel);
    if (res.ok) {
      setState('ok');
      onDone({ mistakes, hints: 0, revealed: false, hearts: 0 });
      return;
    }
    const m = mistakes + 1;
    setMistakes(m);
    setWrong(res.wrong);
    if (m >= MAX_TRIES) {
      setState('revealed');
      onDone({ mistakes: m, hints: 0, revealed: true, hearts: 0 });
    }
  };

  const isOn = (f: keyof OrderSpec, v: string) => {
    if (state === 'revealed') {
      const want = a.order[f];
      return Array.isArray(want) ? want.includes(v) && (f !== 'milk' || want[0] === v) : want === v;
    }
    const cur = sel[f as keyof OrderSelection];
    return Array.isArray(cur) ? cur.includes(v) : cur === v;
  };

  return (
    <Shell title="Monte o pedido" footer={state === 'play' ? <button type="button" className="cc-btn" onClick={serve}>Servir ☕</button> : null}>
      <div className="flex flex-col gap-2.5">
        {fields.map((f) => (
          <div key={f}>
            <div className={cn('mb-1 text-xs font-semibold', wrong.includes(f) ? 'text-[#c4554d]' : 'opacity-70')}>
              {FIELD_LABEL[f]} {wrong.includes(f) && '✗'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(MENU[f] as readonly string[]).map((v) => (
                <button key={v} type="button" disabled={state !== 'play'} onClick={() => toggle(f, v)} className={cn('cc-chip', isOn(f, v) && 'cc-chip-on')}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {state === 'play' && mistakes > 0 && <Feedback kind="bad">Algo não bate com o pedido. Releia o que o cliente disse.</Feedback>}
      {state === 'revealed' && <Feedback kind="info">O pedido certo está marcado.</Feedback>}
    </Shell>
  );
}

// ── group_order ─────────────────────────────────────────────────────────────

function GroupOrderCard({ activity: a, onDone }: CardProps<GroupOrder>) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [wrong, setWrong] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [state, setState] = useState<'play' | 'ok' | 'revealed'>('play');
  const shown = state === 'revealed' ? a.order : counts;

  const change = (name: string, d: number) => {
    setWrong(wrong.filter((w) => w !== name));
    setCounts({ ...counts, [name]: Math.max(0, Math.min(9, (counts[name] ?? 0) + d)) });
  };

  const serve = () => {
    const clean = Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 0));
    const res = checkGroup(a.order, clean);
    if (res.ok) {
      setState('ok');
      onDone({ mistakes, hints: 0, revealed: false, hearts: 0 });
      return;
    }
    const m = mistakes + 1;
    setMistakes(m);
    setWrong(res.wrong);
    if (m >= MAX_TRIES) {
      setState('revealed');
      onDone({ mistakes: m, hints: 0, revealed: true, hearts: 0 });
    }
  };

  return (
    <Shell title="Monte o pedido do grupo" footer={state === 'play' ? <button type="button" className="cc-btn" onClick={serve}>Confirmar pedido</button> : null}>
      <div className="flex flex-col gap-1.5">
        {a.choices.map((name) => (
          <div key={name} className={cn('flex items-center justify-between rounded-lg bg-[#f6ead3] px-3 py-1.5', wrong.includes(name) && 'ring-2 ring-[#e07a5f]')}>
            <span className="text-sm font-medium">{name}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={state !== 'play'} onClick={() => change(name, -1)} className="cc-round" aria-label="menos">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-4 text-center font-bold">{shown[name] ?? 0}</span>
              <button type="button" disabled={state !== 'play'} onClick={() => change(name, 1)} className="cc-round" aria-label="mais">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {state === 'play' && mistakes > 0 && <Feedback kind="bad">As quantidades marcadas não batem. Releia o pedido.</Feedback>}
      {state === 'revealed' && <Feedback kind="info">Estas eram as quantidades certas.</Feedback>}
    </Shell>
  );
}

// ── despacho ────────────────────────────────────────────────────────────────

export default function ActivityCard(props: CardProps<Activity> & { gapMode: 'options' | 'typed' }) {
  const { activity: a } = props;
  switch (a.type) {
    case 'choose_reply':
      return <ChooseReplyCard {...props} activity={a} />;
    case 'build_reply':
      return <BuildReplyCard {...props} activity={a} />;
    case 'gap':
      return <GapCard {...props} activity={a} mode={props.gapMode} />;
    case 'free_write':
      return <FreeWriteCard {...props} activity={a} />;
    case 'build_order':
      return <BuildOrderCard {...props} activity={a} />;
    case 'group_order':
      return <GroupOrderCard {...props} activity={a} />;
    default:
      return <PickCard {...props} activity={a} />;
  }
}

export function DoneMark({ ok }: { ok: boolean }) {
  return ok ? <Check className="h-4 w-4 text-[#2f5d46]" /> : <X className="h-4 w-4 text-[#8a3a26]" />;
}

function shuffled<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
