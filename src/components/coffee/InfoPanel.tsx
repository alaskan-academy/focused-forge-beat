import { useState } from 'react';
import { Copy, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HINT_LINE_COST, HINT_WORD_COST, WALKOUT_MISTAKES, levelFromXp } from '@/lib/coffee/activities';
import type { Snapshot } from '@/lib/coffee/store/types';

export type InfoTopic = 'coins' | 'stars' | 'xp' | 'hearts' | 'cafe';

type Props = { snap: Snapshot; topic: InfoTopic; onClose: () => void };

// "Como funciona": o que é cada coisa do HUD, como ganhar e como usar.
export default function InfoPanel({ snap, topic: initial, onClose }: Props) {
  const [topic, setTopic] = useState<InfoTopic>(initial);
  const lvl = levelFromXp(snap.me.xp);

  const TABS: [InfoTopic, string][] = [
    ['coins', '🪙 Moedas'],
    ['stars', '⭐ Estrelas'],
    ['xp', '📈 Nível'],
    ['hearts', '💛 Corações'],
    ['cafe', '☕ Café'],
  ];

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-2 sm:p-4" onClick={onClose}>
      <div className="cc-panel flex max-h-[94%] w-full max-w-md flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-2 border-[#e6d2ad] bg-[#f6ead3] px-4 py-2">
          <h2 className="cc-title text-xl">Como funciona</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#e9d5b5]" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 bg-[#f6ead3] px-3 pb-2">
          {TABS.map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTopic(k)} className={cn('cc-chip', topic === k && 'cc-chip-on')}>
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3 overflow-y-auto bg-[#fbf3e4] p-4 text-sm leading-relaxed">
          {topic === 'coins' && (
            <>
              <Big>🪙 {snap.me.coins} moedas</Big>
              <Section title="O que são">O dinheiro do café. É só seu: cada um tem as próprias moedas.</Section>
              <Section title="Como ganhar">
                Cada atendimento paga <b>2 + 2 por atividade</b>, mais uma <b>gorjeta de até 8</b>. A gorjeta cai <b>3 a cada erro</b>.
              </Section>
              <Section title="Cuidado">
                Com <b>{WALKOUT_MISTAKES} erros</b> no mesmo atendimento, o cliente vai embora <b>sem pagar</b>. Se for um cliente recorrente, ele também tira 1 💛 de amizade. Durante a conversa, o contador ❌ mostra quantos erros você já tem.
              </Section>
              <Section title="Como usar">
                <ul className="list-disc pl-5">
                  <li>Traduzir uma fala do cliente: {HINT_LINE_COST} 🪙</li>
                  <li>Ver a tradução de uma expressão sublinhada: {HINT_WORD_COST} 🪙</li>
                  <li>Juntar com a outra pessoa para as melhorias do café (ex.: o Cantinho do gato)</li>
                  <li>Em breve: a lojinha de decoração</li>
                </ul>
              </Section>
            </>
          )}

          {topic === 'stars' && (
            <>
              <Big>⭐⭐⭐ por atendimento</Big>
              <Section title="O que são">A nota de cada atendimento. Aparecem no resumo do fim da conversa e no mural.</Section>
              <Section title="Como ganhar">
                <ul className="list-disc pl-5">
                  <li>
                    <b>3 ⭐</b>: nenhum erro, nenhuma dica e no tempo
                  </li>
                  <li>
                    <b>2 ⭐</b>: até 1 erro e até 1 dica
                  </li>
                  <li>
                    <b>1 ⭐</b>: mais que isso (ou quando a resposta foi mostrada)
                  </li>
                </ul>
              </Section>
              <Section title="Para que servem">Mais estrelas dão mais XP (5 por estrela) e aumentam a reputação do café, que é dos dois.</Section>
            </>
          )}

          {topic === 'xp' && (
            <>
              <Big>
                Nível {lvl.level} · {lvl.into}/{lvl.needed} XP
              </Big>
              <div className="h-2 overflow-hidden rounded-full bg-[#e6d2ad]">
                <div className="h-full bg-[#e07a5f]" style={{ width: `${(lvl.into / lvl.needed) * 100}%` }} />
              </div>
              <Section title="Como ganhar XP">Todo atendimento dá XP: 5 por atividade e mais 5 por estrela. Mesmo errando você ganha XP, porque também é treino.</Section>
              <Section title="Níveis">O nível 2 pede 100 XP, e cada nível seguinte pede 50 XP a mais. O nível mostra o quanto você já praticou.</Section>
            </>
          )}

          {topic === 'hearts' && (
            <>
              <Big>💛 Amizade com os clientes</Big>
              <Section title="O que são">
                Cada cliente recorrente (Maya, Tom, Gary…) tem de 0 a 10 corações <b>com cada um de vocês</b>. Veja os seus no 📓 Caderninho.
              </Section>
              <Section title="Como ganhar">Respostas acolhedoras dão +1. A cada 2 atividades certas de primeira, mais +1.</Section>
              <Section title="Como perder">Respostas frias ou julgadoras tiram 1. Se o cliente for embora por erro demais, ele também tira 1.</Section>
              <Section title="O que desbloqueia">Com 5 ou 6 corações abrem capítulos especiais. Com 7, o cliente dá um presente; com 10, uma foto no caderninho.</Section>
            </>
          )}

          {topic === 'cafe' && <CafeInfoTab snap={snap} />}
        </div>
      </div>
    </div>
  );
}

function CafeInfoTab({ snap }: { snap: Snapshot }) {
  const [copied, setCopied] = useState(false);
  const alone = !snap.partner;
  return (
    <>
      <Big>☕ {snap.cafe.name}</Big>
      <Section title="Quem está no café">
        {snap.me.display_name}
        {snap.partner ? ` e ${snap.partner.display_name}` : ' (sozinho por enquanto)'} · reputação {snap.cafe.reputation}
      </Section>
      <Section title="Clientes">
        Chegam sozinhos, um a cada 90 segundos, até 6 no café. ☕ é pedido, 💬 é conversa e 📖 é capítulo novo da história. Cada um de vocês conversa uma vez com cada recorrente por visita.
      </Section>
      {alone && (
        <Section title="Convide a outra pessoa">
          Na aba Coffee Cats, ela escolhe "Entrar com código" e digita:
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded-lg bg-white px-3 py-1.5 text-lg font-bold tracking-widest">{snap.cafe.invite_code}</code>
            <button
              type="button"
              className="cc-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-xs"
              onClick={() => {
                navigator.clipboard?.writeText(snap.cafe.invite_code).then(() => setCopied(true), () => {});
              }}
            >
              <Copy className="h-3.5 w-3.5" /> {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </Section>
      )}
    </>
  );
}

function Big({ children }: { children: React.ReactNode }) {
  return <div className="cc-title text-lg">{children}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-xs font-bold uppercase tracking-wide text-[#7d4f33]/80">{title}</div>
      <div>{children}</div>
    </div>
  );
}
