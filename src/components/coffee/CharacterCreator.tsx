import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CLOTH_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  PANTS_STYLES,
  SHIRT_STYLES,
  SHOE_STYLES,
  SKIN_COLORS,
  appearanceFromSeed,
  type Appearance,
} from '@/lib/coffee/character';
import type { Pronoun } from '@/content/coffee/personalize';
import CharacterPreview from './CharacterPreview';

export type Profile = { name: string; pronoun: Pronoun };

type Part = 'hair' | 'shirt' | 'pants' | 'shoes';

const PARTS: { key: Part; label: string; styles: readonly string[]; colors: string[] }[] = [
  { key: 'hair', label: 'Cabelo', styles: HAIR_STYLES, colors: HAIR_COLORS },
  { key: 'shirt', label: 'Camisa', styles: SHIRT_STYLES, colors: CLOTH_COLORS },
  { key: 'pants', label: 'Calça / short', styles: PANTS_STYLES, colors: CLOTH_COLORS },
  { key: 'shoes', label: 'Sapato', styles: SHOE_STYLES, colors: CLOTH_COLORS },
];

type Props = {
  initial: Appearance;
  profile: Profile;
  title?: string;
  saving?: boolean;
  onSave: (a: Appearance, profile: Profile) => void;
  onCancel?: () => void;
};

export default function CharacterCreator({ initial, profile, title = 'Seu personagem', saving, onSave, onCancel }: Props) {
  const [a, setA] = useState<Appearance>(initial);
  const [name, setName] = useState(profile.name);
  const [pronoun, setPronoun] = useState<Pronoun>(profile.pronoun);
  const [tab, setTab] = useState<Part | 'skin'>('hair');
  const part = PARTS.find((p) => p.key === tab);

  const setPart = (key: Part, patch: Partial<{ style: string; color: string }>) =>
    setA((cur) => ({ ...cur, [key]: { ...cur[key], ...patch } }) as Appearance);

  return (
    <div className="cc-panel w-full max-w-md p-4 sm:p-5">
      <h2 className="cc-title text-center text-xl">{title}</h2>

      <div className="mt-3 flex items-end justify-center gap-4">
        <div className="rounded-xl bg-[#e9d5b5] px-6 py-3 shadow-inner">
          <CharacterPreview appearance={a} scale={6} />
        </div>
        <button
          type="button"
          onClick={() => setA(appearanceFromSeed(Math.floor(Math.random() * 1e9)))}
          className="cc-btn-ghost mb-1 flex items-center gap-1 text-xs"
          title="Sortear"
        >
          <Shuffle className="h-3.5 w-3.5" /> Sortear
        </button>
        <button
          type="button"
          onClick={() => setA((cur) => {
            const { horns, ...rest } = cur;
            return horns ? rest : { ...rest, horns: true };
          })}
          className={cn('cc-chip mb-1', a.horns && 'cc-chip-on')}
          title="Chifrinhos (estilo Belmont)"
        >
          😈 Chifres
        </button>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {[...PARTS.map((p) => ({ key: p.key as Part | 'skin', label: p.label })), { key: 'skin' as const, label: 'Pele' }].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn('cc-chip', tab === t.key && 'cc-chip-on')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-[112px] rounded-xl bg-[#f6ead3] p-3">
        {part ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {part.styles.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPart(part.key, { style: s })}
                  className={cn('cc-chip capitalize', a[part.key].style === s && 'cc-chip-on')}
                >
                  {s}
                </button>
              ))}
            </div>
            <Swatches colors={part.colors} value={a[part.key].color} onPick={(c) => setPart(part.key, { color: c })} />
          </>
        ) : (
          <Swatches colors={SKIN_COLORS} value={a.skin} onPick={(c) => setA((cur) => ({ ...cur, skin: c }))} />
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
        <label className="text-xs font-semibold">
          Seu nome
          <input value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className="cc-input mt-1 w-full py-1.5 text-sm font-normal" />
        </label>
        <div className="text-xs font-semibold">
          Os clientes falam de você como
          <div className="mt-1 flex gap-1.5">
            {([['she', 'ela (she)'], ['he', 'ele (he)']] as [Pronoun, string][]).map(([p, label]) => (
              <button key={p} type="button" onClick={() => setPronoun(p)} className={cn('cc-chip py-1.5', pronoun === p && 'cc-chip-on')}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="cc-btn-ghost flex-1">
            Cancelar
          </button>
        )}
        <button type="button" disabled={saving || !name.trim()} onClick={() => onSave(a, { name: name.trim(), pronoun })} className="cc-btn flex-1">
          {saving ? 'Salvando…' : 'Pronto!'}
        </button>
      </div>
    </div>
  );
}

function Swatches({ colors, value, onPick }: { colors: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => onPick(c)}
          className={cn(
            'h-7 w-7 rounded-full border-2 border-[#5e4433]/40 transition-transform hover:scale-110',
            value === c && 'scale-110 ring-2 ring-[#5e4433] ring-offset-2 ring-offset-[#f6ead3]',
          )}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}
