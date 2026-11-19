import { useEffect, useRef, useState } from 'react';
import { Check, FlipHorizontal2, Lock, Move, PackageOpen, X } from 'lucide-react';
import { GARDEN_THINGS, KIND_PT, THING_BY_ID, type ThingKind } from '@/content/coffee/gardenShop';
import { CROPS, CROP_BY_ID } from '@/lib/coffee/garden';
import { FEEDS_PER_DAY, FRIEND_LEVELS, MUCEGO_NAME, PET_COOLDOWN_MIN, friendLevel, wantFor, type MucegoData } from '@/lib/coffee/mucego';
import { drawThing, hasDrawing } from '@/game/art/gardenArt';
import Pron from './Pron';
import type { GardenDecor } from './useGardenDecor';

export function ThingPreview({ itemId, size = 40 }: { itemId: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const g = THING_BY_ID[itemId];
  const drawn = !!g && hasDrawing(itemId);
  useEffect(() => {
    const c = ref.current;
    if (!c || !g || !drawn) return;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    const art = drawThing(g);
    const scale = Math.min(c.width / art.width, c.height / art.height);
    ctx.drawImage(art, (c.width - art.width * scale) / 2, (c.height - art.height * scale) / 2, art.width * scale, art.height * scale);
  }, [g, drawn]);
  if (!g) return null;
  if (!drawn) return <span style={{ fontSize: size * 0.7 }}>{g.emoji}</span>;
  return <canvas ref={ref} width={size} height={size} style={{ imageRendering: 'pixelated' }} />;
}

function Shell({ title, sub, onClose, children, wide }: { title: React.ReactNode; sub?: React.ReactNode; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-3" onClick={onClose}>
      <div className={`cc-panel relative flex max-h-[94%] w-full flex-col overflow-hidden ${wide ? 'max-w-2xl' : 'max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between gap-2 border-b-2 border-[#e6d2ad] px-4 py-3">
          <div>
            <h2 className="cc-title text-xl">{title}</h2>
            {sub && <div className="text-xs opacity-70">{sub}</div>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#efe0c4]" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

type PanelProps = {
  m: MucegoData;
  today: string;
  now: number;
  pantry: Record<string, number>;
  line: [string, string] | null;
  onPet: () => Promise<void>;
  onFeed: (cropId: string) => Promise<void>;
  onTreat: (treatId: string) => Promise<void>;
  onWear: (acc: string | null) => Promise<void>;
  onGift: () => Promise<void>;
  onShop: () => void;
  onClose: () => void;
};

// Painel da Mucego Frutífero: amizade, tapinha na bundinha, comida, petiscos, acessórios e presente.
export function MucegoPanel(p: PanelProps) {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  const lvl = friendLevel(p.m.friendship);
  const L = FRIEND_LEVELS[lvl];
  const next = FRIEND_LEVELS[lvl + 1];
  const pct = next ? ((p.m.friendship - L.min) / (next.min - L.min)) * 100 : 100;
  const want = wantFor(p.today);
  const petLeft = p.m.last_pet_at ? PET_COOLDOWN_MIN * 60_000 - (p.now - new Date(p.m.last_pet_at).getTime()) : 0;
  const food = CROPS.filter((c) => (p.pantry[c.id] ?? 0) > 0);
  const treats = GARDEN_THINGS.filter((g) => g.kind === 'treat' && (p.m.treats[g.id] ?? 0) > 0);
  const full = p.m.feeds_today >= FEEDS_PER_DAY;

  return (
    <Shell
      title={`🐈‍⬛ ${MUCEGO_NAME}`}
      sub={
        <span>
          {L.emoji} {L.pt} <span className="italic">({L.en})</span> · amizade de vocês dois ♥ {p.m.friendship}
        </span>
      }
      onClose={p.onClose}
    >
      <div className="h-2 overflow-hidden rounded-full bg-[#e6d2ad]">
        <div className="h-full bg-[#9a6ad0]" style={{ width: `${Math.max(3, Math.min(100, pct))}%` }} />
      </div>
      <div className="mt-1 text-[11px] opacity-70">{next ? `Faltam ${next.min - p.m.friendship} para ${next.emoji} ${next.pt}` : 'Ela é da família! 💞'} · com 30+ ela deixa presentes</div>

      {p.line && (
        <div className="mt-3 rounded-xl bg-[#efe6f6] px-3 py-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            “{p.line[0]}” <Pron text={p.line[0]} showIpa={false} />
          </div>
          <div className="text-xs italic opacity-70">{p.line[1]}</div>
        </div>
      )}

      {p.m.gift_ready && (
        <button type="button" disabled={busy} onClick={() => run(p.onGift)} className="cc-btn mt-3 w-full">
          🎁 Ela deixou um presente para você!
        </button>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" disabled={busy || petLeft > 0} onClick={() => run(p.onPet)} className="cc-btn disabled:opacity-60">
          🍑 Tapinha na bundinha
          {petLeft > 0 && <span className="block text-[10px] font-normal">de novo em {Math.ceil(petLeft / 60_000)} min</span>}
        </button>
        <button type="button" onClick={p.onShop} className="cc-btn-ghost">
          🛍️ Lojinha dela
        </button>
      </div>

      <div className="mt-4 rounded-xl border-2 border-dashed border-[#c9b3dc] px-3 py-2">
        <div className="text-[11px] font-bold uppercase tracking-wide opacity-60">Pedido de hoje {p.m.request_done ? '· atendido ✓' : '· +5 🪙 e +5 ♥'}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="cc-title text-base">“{want.en}”</span> <Pron text={want.en} showIpa={false} />
        </div>
        <details className="text-xs opacity-70">
          <summary className="cursor-pointer">Tradução</summary>
          {want.pt}
        </details>
      </div>

      <div className="mt-3 text-xs font-bold uppercase tracking-wide opacity-60">
        🍓 Dar comida da despensa {full ? '· ela está cheia por hoje 😸' : `· ${FEEDS_PER_DAY - p.m.feeds_today} hoje`}
      </div>
      {food.length === 0 ? (
        <p className="mt-1 text-sm opacity-70">Colha frutas e legumes na horta para dar para ela. Frutas são as favoritas!</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {food.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={busy || full}
              onClick={() => run(() => p.onFeed(c.id))}
              className="rounded-full border-2 border-[#e6d2ad] bg-[#fffaf0] px-2.5 py-1 text-sm hover:border-[#9a6ad0] disabled:opacity-50"
              title={c.pt}
            >
              {CROP_BY_ID[c.id].emoji} {c.en} ×{p.pantry[c.id]}
            </button>
          ))}
        </div>
      )}

      {treats.length > 0 && (
        <>
          <div className="mt-3 text-xs font-bold uppercase tracking-wide opacity-60">🍪 Petiscos</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {treats.map((t) => (
              <button key={t.id} type="button" disabled={busy} onClick={() => run(() => p.onTreat(t.id))} className="rounded-full border-2 border-[#e6d2ad] bg-[#fffaf0] px-2.5 py-1 text-sm hover:border-[#9a6ad0]">
                {t.emoji} {t.en} ×{p.m.treats[t.id]} <span className="text-[10px] opacity-60">+{t.friendship}♥</span>
              </button>
            ))}
          </div>
        </>
      )}

      {p.m.accessories.length > 0 && (
        <>
          <div className="mt-3 text-xs font-bold uppercase tracking-wide opacity-60">🎀 O que ela está vestindo</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button type="button" disabled={busy} onClick={() => run(() => p.onWear(null))} className={`rounded-full border-2 px-2.5 py-1 text-sm ${!p.m.accessory ? 'border-[#9a6ad0] bg-[#efe6f6]' : 'border-[#e6d2ad] bg-[#fffaf0]'}`}>
              nada
            </button>
            {p.m.accessories.map((a) => {
              const g = THING_BY_ID[a];
              return (
                <button key={a} type="button" disabled={busy} onClick={() => run(() => p.onWear(a))} className={`rounded-full border-2 px-2.5 py-1 text-sm ${p.m.accessory === a ? 'border-[#9a6ad0] bg-[#efe6f6]' : 'border-[#e6d2ad] bg-[#fffaf0]'}`}>
                  {g?.emoji} {g?.en}
                </button>
              );
            })}
          </div>
        </>
      )}
    </Shell>
  );
}

const KINDS: ThingKind[] = ['accessory', 'treat', 'toy', 'decor'];

// Lojinha do jardim: coisinhas para a Mucego Frutífero e decoração do quintal.
export function MucegoShop({ coins, level, owned, onBuy, onClose }: { coins: number; level: number; owned: string[]; onBuy: (itemId: string) => Promise<void>; onClose: () => void }) {
  const [kind, setKind] = useState<ThingKind>('accessory');
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <Shell title={`🛍️ ${MUCEGO_NAME}'s shop`} sub={`Lojinha do jardim · você tem 🪙 ${coins}`} onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
        {KINDS.map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-full border-2 px-2.5 py-1 font-semibold ${kind === k ? 'border-[#7d4f33] bg-[#7d4f33] text-[#fffaf0]' : 'border-[#e6d2ad] bg-[#fffaf0]'}`}>
            {KIND_PT[k]}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {GARDEN_THINGS.filter((g) => g.kind === kind).map((g) => {
          const locked = level < g.minLevel;
          const have = g.kind === 'accessory' && owned.includes(g.id);
          return (
            <div key={g.id} className={`flex gap-3 rounded-xl border-2 border-[#e6d2ad] bg-[#fffaf0] p-2.5 ${locked ? 'opacity-60' : ''}`}>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#efe0c4]">
                <ThingPreview itemId={g.id} size={48} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-1.5">
                  <span className="cc-title text-base leading-tight">{g.en}</span> <Pron text={g.en} />
                </div>
                <div className="text-xs opacity-70">
                  {g.pt}
                  {g.kind === 'toy' || g.kind === 'decor' ? ` · ${g.w}×${g.h}${g.place === 'flat' ? ' · dá para pisar' : ''}` : ''}
                  {g.friendship ? ` · +${g.friendship}♥` : ''}
                </div>
                <div className="mt-0.5 text-xs italic">
                  “{g.desc}” <span className="not-italic opacity-60">({g.descPt})</span>
                </div>
                <div className="mt-1.5 flex justify-end">
                  <button
                    type="button"
                    disabled={locked || have || coins < g.price || busy === g.id}
                    onClick={async () => {
                      setBusy(g.id);
                      try {
                        await onBuy(g.id);
                      } finally {
                        setBusy(null);
                      }
                    }}
                    className="cc-btn !px-3 !py-1 text-sm disabled:opacity-50"
                  >
                    {have ? 'Já é dela ✓' : locked ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Nv {g.minLevel}
                      </span>
                    ) : (
                      `Comprar · ${g.price} 🪙`
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

// Barra do modo decorar o jardim
export function GardenDecorBar({ decor, onShop }: { decor: GardenDecor; onShop: () => void }) {
  const { placing, selectedItem, check, busy, bag } = decor;
  const current = placing ?? selectedItem;
  const g = current ? THING_BY_ID[current.item_id] : null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-2 sm:p-3">
      <div className="cc-panel pointer-events-auto w-full max-w-xl p-3">
        {g && current ? (
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#efe0c4]">
              <ThingPreview itemId={current.item_id} size={48} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1.5">
                <span className="cc-title text-base">{g.en}</span> <Pron text={g.en} showIpa={false} /> <span className="text-xs opacity-60">({g.pt})</span>
              </div>
              <div className="text-xs">
                {placing ? (
                  check?.ok ? <span className="text-[#4f8a5b]">Cabe aqui! Toque no jardim para mudar o lugar.</span> : <span className="text-[#c4554d]">{check && !check.ok ? check.reason : 'Toque no jardim para escolher o lugar'}</span>
                ) : (
                  <span className="opacity-70">O que fazer com ele?</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {placing ? (
                  <>
                    <button type="button" disabled={!check?.ok || busy} onClick={decor.confirm} className="cc-btn inline-flex items-center gap-1 !px-3 !py-1 text-sm disabled:opacity-50">
                      <Check className="h-4 w-4" /> Colocar
                    </button>
                    <button type="button" onClick={decor.rotate} className="cc-btn-ghost inline-flex items-center gap-1 text-sm">
                      <FlipHorizontal2 className="h-4 w-4" /> Girar
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={decor.moveSelected} className="cc-btn inline-flex items-center gap-1 !px-3 !py-1 text-sm">
                      <Move className="h-4 w-4" /> Mover
                    </button>
                    <button type="button" disabled={busy} onClick={decor.rotate} className="cc-btn-ghost inline-flex items-center gap-1 text-sm">
                      <FlipHorizontal2 className="h-4 w-4" /> Girar
                    </button>
                    <button type="button" disabled={busy} onClick={decor.storeSelected} className="cc-btn-ghost inline-flex items-center gap-1 text-sm">
                      <PackageOpen className="h-4 w-4" /> Guardar
                    </button>
                  </>
                )}
                <button type="button" onClick={decor.cancel} className="cc-btn-ghost inline-flex items-center gap-1 text-sm">
                  <X className="h-4 w-4" /> Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="cc-title text-base">🎨 Decorar o jardim · 🎒 Mochila</div>
                <div className="text-xs opacity-70">Escolha um item da mochila, ou toque num item do jardim para mover.</div>
              </div>
              <button type="button" onClick={decor.close} className="cc-btn !px-3 !py-1 text-sm">
                Pronto
              </button>
            </div>
            {bag.length === 0 ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-[#d4bf9a] px-3 py-2 text-sm">
                <span>Sua mochila do jardim está vazia.</span>
                <button type="button" onClick={onShop} className="cc-btn-ghost text-sm">
                  🛍️ Lojinha
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {bag.map((it) => {
                  const t = THING_BY_ID[it.item_id];
                  if (!t) return null;
                  return (
                    <button key={it.id} type="button" onClick={() => decor.startPlacing(it)} className="flex w-20 shrink-0 flex-col items-center gap-1 rounded-xl border-2 border-[#e6d2ad] bg-[#fffaf0] p-1.5 hover:border-[#e07a5f]">
                      <span className="flex h-10 items-center">
                        <ThingPreview itemId={it.item_id} size={36} />
                      </span>
                      <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight">{t.en}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
