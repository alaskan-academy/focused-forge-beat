import { Check, FlipHorizontal2, Move, PackageOpen, ShoppingBag, X } from 'lucide-react';
import { FURNITURE_BY_ID, variantName } from '@/content/coffee/furniture';
import FurniturePreview from './FurniturePreview';
import Pron from './Pron';
import type { HouseDecor } from './useHouseDecor';

// Barra do modo decorar (embaixo da tela): mochila, prévia do móvel sendo colocado e ações.
export default function DecorBar({ decor, onShop }: { decor: HouseDecor; onShop: () => void }) {
  const { placing, selectedItem, check, busy, bag } = decor;
  const current = placing ?? selectedItem;
  const f = current ? FURNITURE_BY_ID[current.item_id] : null;
  const name = f && current ? variantName(f, current.variant) : '';

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-2 sm:p-3">
      <div className="cc-panel pointer-events-auto w-full max-w-xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {f && current ? (
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#efe0c4]">
              <FurniturePreview itemId={current.item_id} variant={current.variant} flip={current.flip} box={48} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1.5">
                <span className="cc-title text-base">{name}</span>
                <Pron text={name} showIpa={false} />
                <span className="text-xs opacity-60">({f.pt})</span>
              </div>
              <div className="text-xs">
                {placing ? (
                  check?.ok ? (
                    <span className="text-[#4f8a5b]">Cabe aqui! Toque no mapa para mudar o lugar.</span>
                  ) : (
                    <span className="text-[#c4554d]">{check && !check.ok ? check.reason : 'Toque no mapa para escolher o lugar'}</span>
                  )
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
                <div className="cc-title text-base">🎨 Decorar · 🎒 Mochila</div>
                <div className="text-xs opacity-70">Escolha um móvel da mochila, ou toque num móvel da casa para mover.</div>
              </div>
              <button type="button" onClick={decor.close} className="cc-btn !px-3 !py-1 text-sm">
                Pronto
              </button>
            </div>
            {bag.length === 0 ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-[#d4bf9a] px-3 py-2 text-sm">
                <span>Sua mochila está vazia.</span>
                <button type="button" onClick={onShop} className="cc-btn-ghost inline-flex items-center gap-1 text-sm">
                  <ShoppingBag className="h-4 w-4" /> Lojinha
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {bag.map((it) => {
                  const g = FURNITURE_BY_ID[it.item_id];
                  if (!g) return null;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => decor.startPlacing(it)}
                      className="flex w-20 shrink-0 flex-col items-center gap-1 rounded-xl border-2 border-[#e6d2ad] bg-[#fffaf0] p-1.5 hover:border-[#e07a5f]"
                      title={g.pt}
                    >
                      <span className="flex h-10 items-center">
                        <FurniturePreview itemId={it.item_id} variant={it.variant} box={36} />
                      </span>
                      <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight">{variantName(g, it.variant)}</span>
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
