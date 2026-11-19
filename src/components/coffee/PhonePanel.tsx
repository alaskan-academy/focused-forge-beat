import { useEffect, useState } from 'react';
import { Heart, Send, X } from 'lucide-react';
import type { DailyReward, Note } from '@/lib/coffee/store/types';
import Pron from './Pron';

// Começos de frase para agradecer (o resto você completa em inglês).
const STARTERS = [
  { en: 'Thank you for', pt: 'Obrigado(a) por…' },
  { en: 'I really appreciate', pt: 'Eu valorizo muito…' },
  { en: 'You made my day when you', pt: 'Você fez meu dia quando…' },
  { en: "I'm so lucky to have you because", pt: 'Tenho muita sorte de ter você porque…' },
  { en: 'I love it when you', pt: 'Eu amo quando você…' },
];
const IDEAS = ['making me coffee', 'helping me study', 'being so patient', 'cooking dinner', 'making me laugh', 'always listening to me', 'the little things'];

type Props = {
  me: string;
  partnerName: string | null;
  notes: Note[];
  onSend: (body: string, heart: boolean) => Promise<DailyReward>;
  onRead: () => Promise<void>;
  onClose: () => void;
};

// Telefone: "Vamoo ligar para agradecer?" — recados de agradecimento em inglês para a outra pessoa.
export default function PhonePanel({ me, partnerName, notes, onSend, onRead, onClose }: Props) {
  const unread = notes.filter((n) => n.to_user === me && !n.read_at);
  const [tab, setTab] = useState<'call' | 'inbox'>(unread.length ? 'inbox' : 'call');
  const [starter, setStarter] = useState(0);
  const [rest, setRest] = useState('');
  const [heart, setHeart] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<DailyReward | null>(null);
  const body = `${STARTERS[starter].en} ${rest.trim()}`.trim().replace(/([^.!?])$/, '$1!');

  // abriu os recados: marca como lidos
  const hasUnread = unread.length > 0;
  useEffect(() => {
    if (tab === 'inbox' && hasUnread) void onRead();
  }, [tab, hasUnread, onRead]);

  const send = async () => {
    if (!rest.trim()) return;
    setBusy(true);
    try {
      setSent(await onSend(body, heart));
      setRest('');
    } finally {
      setBusy(false);
    }
  };

  const name = partnerName ?? 'a outra pessoa';

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-3" onClick={onClose}>
      <div className="cc-panel relative flex max-h-[94%] w-full max-w-md flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b-2 border-[#e6d2ad] px-4 py-3">
          <div>
            <h2 className="cc-title text-xl">📞 Vamoo ligar para agradecer?</h2>
            <p className="text-xs opacity-70">Um recado em inglês para {name} · +5 🪙 no primeiro do dia</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#efe0c4]" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex shrink-0 gap-1.5 px-4 pt-3 text-sm">
          <button type="button" onClick={() => setTab('call')} className={`rounded-full px-3 py-1 font-semibold ${tab === 'call' ? 'bg-[#7d4f33] text-[#fffaf0]' : 'bg-[#efe0c4]'}`}>
            Ligar
          </button>
          <button type="button" onClick={() => setTab('inbox')} className={`relative rounded-full px-3 py-1 font-semibold ${tab === 'inbox' ? 'bg-[#7d4f33] text-[#fffaf0]' : 'bg-[#efe0c4]'}`}>
            Recados
            {hasUnread && <span className="ml-1 rounded-full bg-[#e07a5f] px-1.5 text-[11px] text-white">{unread.length}</span>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'call' ? (
            !partnerName ? (
              <p className="text-sm opacity-75">Ainda não tem ninguém no café para receber a ligação. Convide a outra pessoa com o código do café!</p>
            ) : sent ? (
              <div className="text-center">
                <div className="text-4xl">💌</div>
                <p className="cc-title mt-1 text-lg">Message sent!</p>
                <p className="text-sm opacity-75">{name} vai ver quando abrir o jogo.</p>
                {sent.coins > 0 && <p className="mt-2 font-bold text-[#c4554d]">+{sent.coins} 🪙</p>}
                <button type="button" onClick={() => setSent(null)} className="cc-btn-ghost mt-3 text-sm">
                  Mandar outro
                </button>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold uppercase tracking-wide opacity-60">1. Escolha o começo</div>
                <div className="mt-1.5 flex flex-col gap-1">
                  {STARTERS.map((s, k) => (
                    <button
                      key={s.en}
                      type="button"
                      onClick={() => setStarter(k)}
                      className={`flex items-center justify-between rounded-lg border-2 px-2.5 py-1.5 text-left text-sm ${k === starter ? 'border-[#e07a5f] bg-[#fff1e6]' : 'border-[#e6d2ad] hover:bg-[#f6ead3]'}`}
                    >
                      <span className="font-semibold">{s.en}…</span>
                      <span className="text-xs opacity-60">{s.pt}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-wide opacity-60">2. Complete em inglês</div>
                <input
                  value={rest}
                  onChange={(e) => setRest(e.target.value.slice(0, 200))}
                  placeholder="making me coffee this morning"
                  className="mt-1.5 w-full rounded-lg border-2 border-[#e6d2ad] bg-white px-3 py-2 text-sm outline-none focus:border-[#e07a5f]"
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {IDEAS.map((idea) => (
                    <button key={idea} type="button" onClick={() => setRest(idea)} className="rounded-full bg-[#efe0c4] px-2 py-0.5 text-xs hover:bg-[#e6d2ad]">
                      {idea}
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-[#f2cc8f]/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-60">
                    Prévia <Pron text={body} showIpa={false} />
                  </div>
                  <div className="cc-title mt-1 text-base">
                    “{body}” {heart && '❤️'}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button type="button" onClick={() => setHeart(!heart)} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${heart ? 'bg-[#fbe3e3] text-[#c4554d]' : 'bg-[#efe0c4]'}`}>
                    <Heart className={`h-4 w-4 ${heart ? 'fill-current' : ''}`} /> com coração
                  </button>
                  <button type="button" disabled={!rest.trim() || busy} onClick={send} className="cc-btn inline-flex items-center gap-1.5 disabled:opacity-50">
                    <Send className="h-4 w-4" /> Enviar
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-2">
              {notes.length === 0 && <p className="text-sm opacity-70">Nenhum recado ainda. Que tal ser a primeira ligação? 📞</p>}
              {notes.map((n) => {
                const mine = n.from_user === me;
                return (
                  <div key={n.id} className={`rounded-xl p-3 text-sm ${mine ? 'ml-6 bg-[#efe0c4]' : 'mr-6 bg-[#fff1e6]'} ${!mine && !n.read_at ? 'ring-2 ring-[#e07a5f]' : ''}`}>
                    <div className="text-[11px] font-bold uppercase tracking-wide opacity-60">
                      {mine ? `Você → ${name}` : `${name} → você`} · {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="mt-0.5 flex items-start gap-1.5">
                      <span className="cc-title text-base leading-snug">
                        “{n.body}” {n.heart && '❤️'}
                      </span>
                      <Pron text={n.body} showIpa={false} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
