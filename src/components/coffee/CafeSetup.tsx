import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Pronoun } from '@/content/coffee/personalize';

type Props = {
  defaultName: string;
  onCreate: (name: string, pronoun: Pronoun) => Promise<void>;
  onJoin: (code: string, name: string, pronoun: Pronoun) => Promise<void>;
};

// Primeira vez: abrir um café novo ou entrar no café da outra pessoa com o código.
export default function CafeSetup({ defaultName, onCreate, onJoin }: Props) {
  const [name, setName] = useState(defaultName);
  const [pronoun, setPronoun] = useState<Pronoun>('she');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes('invalid invite code')
          ? 'Código não encontrado. Confira com a outra pessoa.'
          : msg.includes('cafe is full')
            ? 'Esse café já está cheio.'
            : msg.includes('already in a cafe')
              ? 'Você já está num café. Recarregue a página.'
              : `Não deu certo: ${msg}`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cc-panel w-full max-w-md p-5">
      <h2 className="cc-title text-center text-xl">Bem-vindo ao Coffee Cats! ☕🐱</h2>
      <p className="mt-1 text-center text-sm opacity-75">Um café para os dois. Cada um tem o próprio dinheiro e o próprio inglês; o café é de vocês.</p>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
        <label className="text-xs font-semibold">
          Seu nome no jogo
          <input value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className="cc-input mt-1 w-full py-1.5 text-sm font-normal" />
        </label>
        <div className="text-xs font-semibold">
          Os clientes falam de você como
          <div className="mt-1 flex gap-1.5">
            {([['she', 'ela'], ['he', 'ele']] as [Pronoun, string][]).map(([p, label]) => (
              <button key={p} type="button" onClick={() => setPronoun(p)} className={cn('cc-chip py-1.5', pronoun === p && 'cc-chip-on')}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <button type="button" disabled={busy || !name.trim()} onClick={() => run(() => onCreate(name.trim(), pronoun))} className="cc-btn w-full">
          Abrir um café novo
        </button>
        <div className="text-center text-xs opacity-60">ou, se a outra pessoa já abriu o café:</div>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            maxLength={8}
            className="cc-input flex-1 text-center font-bold tracking-widest"
          />
          <button type="button" disabled={busy || !name.trim() || code.trim().length < 4} onClick={() => run(() => onJoin(code.trim(), name.trim(), pronoun))} className="cc-btn-ghost">
            Entrar com código
          </button>
        </div>
        {error && <div className="rounded-lg bg-[#e07a5f]/20 px-3 py-2 text-sm text-[#8a3a26]">{error}</div>}
      </div>
    </div>
  );
}
