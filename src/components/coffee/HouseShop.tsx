import { useMemo, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { CATEGORY_PT, FURNITURE, TIER_INFO, minLevelOf, type Category, type Furniture, type Tier } from '@/content/coffee/furniture';
import FurniturePreview from './FurniturePreview';
import Pron from './Pron';

type Props = {
  coins: number;
  level: number;
  onBuy: (itemId: string, variant: number) => Promise<void>;
  onClose: () => void;
};

const TIERS: Tier[] = ['basic', 'good', 'special', 'legendary'];
const PLACE_PT = { floor: 'chão', rug: 'tapete (dá para pisar)', wall: 'parede' } as const;

// Lojinha da casa: móveis com nome em inglês (🔊 + IPA), tradução, preço e nível.
export default function HouseShop({ coins, level, onBuy, onClose }: Props) {
  const [cat, setCat] = useState<Category | 'all'>('all');
  const cats = useMemo(() => [...new Set(FURNITURE.map((f) => f.category))], []);
  const list = FURNITURE.filter((f) => cat === 'all' || f.category === cat);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-2 sm:p-4" onClick={onClose}>
      <div className="cc-panel relative flex max-h-[94%] w-full max-w-2xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-[#e6d2ad] px-4 py-3">
          <div>
            <h2 className="cc-title text-xl">🛋️ Furniture shop</h2>
            <p className="text-xs opacity-70">Lojinha da casa · o que você comprar vai para a sua mochila 🎒</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="cc-hud text-sm">🪙 {coins}</span>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#efe0c4]" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 gap-1.5 overflow-x-auto px-4 py-2 text-xs">
          <Chip on={cat === 'all'} onClick={() => setCat('all')}>
            Todos
          </Chip>
          {cats.map((c) => (
            <Chip key={c} on={cat === c} onClick={() => setCat(c)}>
              {CATEGORY_PT[c]}
            </Chip>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {TIERS.map((t) => {
            const items = list.filter((f) => f.tier === t);
            if (!items.length) return null;
            const info = TIER_INFO[t];
            const locked = level < info.minLevel;
            return (
              <section key={t} className="mt-3">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: info.color }}>
                  {info.pt}
                  <span className="rounded-full bg-[#efe0c4] px-2 py-0.5 text-[11px] font-semibold text-[#7d4f33]">
                    {info.minLevel > 1 ? `a partir do Nv ${info.minLevel}` : 'qualquer nível'}
                  </span>
                  {locked && <Lock className="h-3.5 w-3.5 opacity-60" />}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((f) => (
                    <ShopCard key={f.id} f={f} coins={coins} level={level} onBuy={onBuy} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border-2 px-2.5 py-1 font-semibold ${on ? 'border-[#7d4f33] bg-[#7d4f33] text-[#fffaf0]' : 'border-[#e6d2ad] bg-[#fffaf0] hover:bg-[#f6ead3]'}`}
    >
      {children}
    </button>
  );
}

function ShopCard({ f, coins, level, onBuy }: { f: Furniture; coins: number; level: number; onBuy: Props['onBuy'] }) {
  const [variant, setVariant] = useState(0);
  const [busy, setBusy] = useState(false);
  const minLevel = minLevelOf(f);
  const locked = level < minLevel;
  const poor = coins < f.price;
  const vv = f.variants[variant];
  const fullName = vv.en ? `${vv.en} ${f.en}` : f.en;

  return (
    <div className={`flex gap-3 rounded-xl border-2 border-[#e6d2ad] bg-[#fffaf0] p-2.5 ${locked ? 'opacity-60' : ''}`}>
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#efe0c4]">
        <FurniturePreview itemId={f.id} variant={variant} box={56} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5">
          <span className="cc-title text-base leading-tight">{fullName}</span>
          <Pron text={fullName} />
        </div>
        <div className="text-xs opacity-70">
          {f.pt}
          {vv.pt ? ` · ${vv.pt}` : ''} · {f.w}×{f.h} · {PLACE_PT[f.place]}
        </div>
        <div className="mt-0.5 text-xs italic" title={f.descPt}>
          “{f.desc}” <span className="not-italic opacity-60">({f.descPt})</span>
        </div>
        {f.variants.length > 1 && (
          <div className="mt-1.5 flex gap-1">
            {f.variants.map((x, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setVariant(i)}
                className={`rounded-md border-2 p-0.5 ${i === variant ? 'border-[#e07a5f]' : 'border-transparent hover:border-[#e6d2ad]'}`}
                title={`${x.en} (${x.pt})`}
                aria-label={x.pt}
              >
                <FurniturePreview itemId={f.id} variant={i} box={20} />
              </button>
            ))}
          </div>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] opacity-60">conforto +{f.comfort}</span>
          <button
            type="button"
            disabled={locked || poor || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onBuy(f.id, variant);
              } finally {
                setBusy(false);
              }
            }}
            className="cc-btn !px-3 !py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {locked ? `🔒 Nv ${minLevel}` : `Comprar · ${f.price} 🪙`}
          </button>
        </div>
      </div>
    </div>
  );
}
