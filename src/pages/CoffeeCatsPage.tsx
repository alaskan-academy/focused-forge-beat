import { useCallback, useMemo, useState } from 'react';
import { BookOpen, HelpCircle, Layers, ScrollText, Shirt, X } from 'lucide-react';
import { toast } from 'sonner';
import GameCanvas from '@/components/coffee/GameCanvas';
import CharacterCreator, { type Profile } from '@/components/coffee/CharacterCreator';
import DialogueOverlay from '@/components/coffee/DialogueOverlay';
import Journal from '@/components/coffee/Journal';
import DevPanel from '@/components/coffee/DevPanel';
import InfoPanel, { type InfoTopic } from '@/components/coffee/InfoPanel';
import CafeBoard from '@/components/coffee/CafeBoard';
import CafeSetup from '@/components/coffee/CafeSetup';
import ChunkBoard from '@/components/coffee/ChunkBoard';
import Bookshelf from '@/components/coffee/Bookshelf';
import GameTable from '@/components/coffee/GameTable';
import { UNLOCK_LEVEL, dayKey, type SudokuSize } from '@/lib/coffee/sudoku';
import ReviewDeck from '@/components/coffee/ReviewDeck';
import { dueItems } from '@/lib/coffee/review';
import MusicControl from '@/components/coffee/MusicControl';
import UpdateNotice from '@/components/coffee/UpdateNotice';
import { useNewVersion } from '@/components/coffee/useNewVersion';
import { chunkStatus } from '@/lib/coffee/chunkSchedule';
import { LANDLORD_CUSTOMER_ID, useCoffeeGame, type ActiveEncounter } from '@/components/coffee/useCoffeeGame';
import belmont from '@/content/coffee/characters/belmont';
import { useAuth } from '@/contexts/AuthContext';
import { CHARACTER_BY_ID } from '@/content/coffee';
import type { SceneOther } from '@/game/bridge';
import { DEFAULT_APPEARANCE, appearanceFromSeed, normalizeAppearance, type Appearance } from '@/lib/coffee/character';
import { levelFromXp, type ActivityResult } from '@/lib/coffee/activities';
import { PERSONAL_CORNERS } from '@/lib/coffee/map';
import { LocalStore } from '@/lib/coffee/store/localStore';
import { SupabaseStore } from '@/lib/coffee/store/supabaseStore';
import type { CoffeeStore } from '@/lib/coffee/store/types';
import '@/components/coffee/coffee.css';

// Página de teste (/coffee-dev): tudo no navegador, com painel de teste.
let localStore: LocalStore | null = null;
const getLocalStore = () => (localStore ??= new LocalStore());

// visual salvo pela primeira versão desta aba
function legacyAppearance(): Appearance | null {
  try {
    const raw = localStorage.getItem('coffee-cats:appearance');
    return raw ? normalizeAppearance(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto bg-[#24170f]/80 p-3 backdrop-blur-sm">{children}</div>;
}

// `local`: página de teste sem login (dados no navegador). Sem ele, o café é o compartilhado no Supabase.
export default function CoffeeCatsPage({ local = false }: { local?: boolean }) {
  const { user } = useAuth();
  // o Supabase entrega um objeto `user` novo a cada renovação de token; o store depende só do id
  const userId = user?.id;
  const store = useMemo<CoffeeStore | null>(() => (local ? getLocalStore() : userId ? new SupabaseStore(userId) : null), [local, userId]);
  if (!store) return null;
  return <CoffeeCatsGame key={local ? 'local' : user!.id} store={store} defaultName={user?.email?.split('@')[0] ?? ''} />;
}

function CoffeeCatsGame({ store, defaultName }: { store: CoffeeStore; defaultName: string }) {
  const { snap, loading, needsCafe, error, refresh, sceneCustomers, begin, complete, contribute, gradeItems, others, move, startPuzzle, savePuzzle, finishPuzzle, addWord, deleteWord } = useCoffeeGame(store);
  const [chunks, setChunks] = useState(false);
  const [books, setBooks] = useState(false);
  const [table, setTable] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [chunkNoticeClosed, setChunkNoticeClosed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [journal, setJournal] = useState(false);
  const [board, setBoard] = useState(false);
  const [info, setInfo] = useState<InfoTopic | null>(null);
  const [active, setActive] = useState<ActiveEncounter | null>(null);
  const [starting, setStarting] = useState(false);
  const newVersion = useNewVersion();
  const [laterFor, setLaterFor] = useState<string | null>(null);
  // não interrompe um atendimento: o aviso espera a conversa acabar
  const showUpdate = !!newVersion && laterFor !== newVersion && !active;

  const appearance = useMemo(() => (snap?.me.appearance ? normalizeAppearance(snap.me.appearance) : null), [snap?.me.appearance]);
  const firstVisit = !!snap && !appearance;
  const overlayOpen = firstVisit || editing || journal || board || !!info || !!active || chunks || books || reviewing || table;

  // chunk do dia (a cada 12 h) e itens vencidos para a revisão
  const now = store.now();
  const chunkReady = !!snap && chunkStatus(snap.items, now).available;
  const dueCount = snap ? dueItems(snap.items, now).length : 0;
  const level = levelFromXp(snap?.me.xp ?? 0);
  // mesa de jogos: ❗ enquanto houver um Sudoku liberado que ainda não foi resolvido hoje
  const today = dayKey(now);
  const puzzleReady =
    !!snap &&
    ([4, 6] as SudokuSize[]).some((size) => level.level >= UNLOCK_LEVEL[size] && !snap.puzzles.some((p) => p.day === today && p.size === size && p.status === 'done'));
  const objectBadges = useMemo(
    () => ({ chalkboard: chunkReady ? ('alert' as const) : null, gametable: puzzleReady ? ('alert' as const) : null }),
    [chunkReady, puzzleReady],
  );

  // a outra pessoa: andando se estiver online, senão parada no cantinho dela
  const sceneOthers = useMemo<SceneOther[]>(() => {
    const p = snap?.partner;
    if (!snap || !p) return [];
    const online = others.find((o) => o.user_id === p.user_id);
    const idx = Math.max(0, snap.cafe.members.indexOf(p.user_id));
    return [
      {
        id: p.user_id,
        name: p.display_name,
        appearance: online?.appearance ?? p.appearance ?? appearanceFromSeed(p.user_id.length * 7919),
        online: !!online,
        pos: online?.pos ?? null,
        corner: PERSONAL_CORNERS[idx % PERSONAL_CORNERS.length],
      },
    ];
  }, [snap, others]);

  const saveAppearance = async (a: Appearance, profile: Profile) => {
    await store.savePlayer({ appearance: a, display_name: profile.name, pronoun: profile.pronoun });
    await refresh();
    setEditing(false);
  };

  const onInteract = useCallback(
    async (customerId: string) => {
      if (starting) return;
      setStarting(true);
      try {
        const res = await begin(customerId);
        if (res === 'busy') toast('Alguém já está atendendo esse cliente ☕');
        else if (res) setActive(res);
      } catch {
        toast('Não consegui falar com o servidor. Tente de novo.');
      } finally {
        setStarting(false);
      }
    },
    [begin, starting],
  );

  const spend = useCallback(
    async (cost: number) => {
      try {
        await store.spendCoins(cost);
        await refresh();
        return true;
      } catch {
        toast('Moedas insuficientes para a dica 🪙');
        return false;
      }
    },
    [store, refresh],
  );

  const onComplete = useCallback((results: ActivityResult[], durationMs: number) => complete(active!, results, durationMs), [active, complete]);
  const char = active?.encounter.characterId
    ? active.encounter.characterId === belmont.id
      ? belmont
      : CHARACTER_BY_ID[active.encounter.characterId]
    : undefined;
  // Belmont na porta (só para mim) e a dívida com ele
  const landlordHere = !!snap?.landlord?.ready;
  const debt = snap?.landlord?.debt ?? 0;
  const [landlordNoticeClosed, setLandlordNoticeClosed] = useState(false);

  return (
    <div className="cc-root relative h-[calc(100dvh-4rem)] overflow-hidden bg-[#24170f] md:h-screen">
      {appearance && snap && (
        <GameCanvas
          appearance={appearance}
          customers={sceneCustomers}
          others={sceneOthers}
          catCorner={!!snap.upgrade?.completed_at}
          inputEnabled={!overlayOpen}
          objectBadges={objectBadges}
          onInteract={onInteract}
          onObject={(id) => (id === 'chalkboard' ? setChunks(true) : id === 'gametable' ? setTable(true) : setBooks(true))}
          onMove={move}
        />
      )}

      {loading && <Center><div className="cc-hud">Abrindo o café… ☕</div></Center>}
      {error && !snap && (
        <Center>
          <div className="cc-panel max-w-sm p-5 text-center text-sm">
            <p className="cc-title text-lg">Ops, o café não abriu</p>
            <p className="mt-2 opacity-75">{error}</p>
            <button type="button" className="cc-btn mt-4" onClick={refresh}>
              Tentar de novo
            </button>
          </div>
        </Center>
      )}
      {needsCafe && (
        <Center>
          <CafeSetup
            defaultName={defaultName}
            onCreate={async (name, pronoun) => {
              await store.createCafe(name, pronoun);
              await refresh();
            }}
            onJoin={async (code, name, pronoun) => {
              await store.joinCafe(code, name, pronoun);
              await refresh();
            }}
          />
        </Center>
      )}

      {/* HUD */}
      {appearance && snap && !editing && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="cc-hud pointer-events-auto flex items-center gap-1">
            <span className="cc-title mr-2 hidden sm:inline">☕ Coffee Cats</span>
            <button type="button" onClick={() => setInfo('coins')} className="rounded-lg px-1.5 py-0.5 hover:bg-[#e9d5b5]" title="Moedas: o que são e como ganhar">
              🪙 {snap.me.coins}
            </button>
            {debt > 0 && (
              <span className="rounded-lg bg-[#6b1f2a] px-1.5 py-0.5 text-xs font-bold text-[#fbe3e3]" title="Dívida com o Belmont (ele cobra na próxima visita)">
                😈 {debt}
              </span>
            )}
            <button type="button" onClick={() => setInfo('xp')} className="flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 hover:bg-[#e9d5b5]" title="Nível e XP">
              Nv {level.level}
              <span className="h-1.5 w-10 overflow-hidden rounded-full bg-[#e6d2ad]">
                <span className="block h-full bg-[#e07a5f]" style={{ width: `${(level.into / level.needed) * 100}%` }} />
              </span>
            </button>
            <button type="button" onClick={() => setInfo('stars')} className="rounded-lg p-1 hover:bg-[#e9d5b5]" aria-label="Como funciona">
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <div className="pointer-events-auto flex gap-2">
            <button type="button" onClick={() => setReviewing(true)} className="cc-hud relative flex items-center gap-1.5" title="Revisão em cards">
              <Layers className="h-4 w-4" /> <span className="hidden sm:inline">Revisar</span>
              {dueCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-[#e07a5f] px-1 text-center text-[11px] font-bold leading-[18px] text-white">{dueCount}</span>
              )}
            </button>
            <button type="button" onClick={() => setBoard(true)} className="cc-hud flex items-center gap-1.5">
              <ScrollText className="h-4 w-4" /> <span className="hidden sm:inline">Mural</span>
            </button>
            <button type="button" onClick={() => setJournal(true)} className="cc-hud flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">Caderninho</span>
            </button>
            <button type="button" onClick={() => setEditing(true)} className="cc-hud flex items-center gap-1.5">
              <Shirt className="h-4 w-4" /> <span className="hidden sm:inline">Personagem</span>
            </button>
            <MusicControl />
          </div>
        </div>
      )}
      {appearance && !overlayOpen && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <div className="cc-hud text-xs font-medium opacity-90">
            <span className="hidden md:inline">WASD/setas para andar · E para atender · ☕ pedido · 💬 conversa · 📖 capítulo novo</span>
            <span className="md:hidden">Toque num cliente para atender</span>
          </div>
        </div>
      )}
      {/* aviso do chunk do dia (a cada 12 h) */}
      {showUpdate && <UpdateNotice version={newVersion!} partner={snap?.partner?.display_name ?? null} onLater={() => setLaterFor(newVersion)} />}
      {/* o Belmont chegou: faixa vermelha escura (até você falar com ele ou fechar) */}
      {appearance && landlordHere && !landlordNoticeClosed && !overlayOpen && !showUpdate && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center px-3">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border-[3px] border-[#2a0f14] bg-[#6b1f2a] px-4 py-2.5 text-[#fbe3e3] shadow-[0_4px_0_#2a0f14] animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="text-2xl">😈</span>
            <div className="text-sm">
              <div className="cc-title font-bold !text-[#fbe3e3]">Belmont Sulphur is here.</div>
              <div className="text-xs opacity-80">He doesn't look happy. He never does. (Ele está na porta, esperando o aluguel.)</div>
            </div>
            <button type="button" className="rounded-xl bg-[#fbe3e3] px-3 py-1.5 text-xs font-semibold text-[#6b1f2a]" onClick={() => onInteract(LANDLORD_CUSTOMER_ID)}>
              Atender
            </button>
            <button type="button" className="opacity-60 hover:opacity-100" onClick={() => setLandlordNoticeClosed(true)} aria-label="Fechar aviso">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {appearance && chunkReady && !chunkNoticeClosed && !overlayOpen && !showUpdate && !(landlordHere && !landlordNoticeClosed) && (
        <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center px-3">
          <div className="cc-panel pointer-events-auto flex items-center gap-3 px-4 py-2.5 animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="text-2xl">🧠</span>
            <div className="text-sm">
              <div className="font-bold">Chunk novo no quadro-negro!</div>
              <div className="text-xs opacity-70">Um bloco que nativos usam o tempo todo, com exercício.</div>
            </div>
            <button type="button" className="cc-btn px-3 py-1.5 text-xs" onClick={() => setChunks(true)}>
              Ver agora
            </button>
            <button type="button" className="opacity-50 hover:opacity-100" onClick={() => setChunkNoticeClosed(true)} aria-label="Fechar aviso">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {import.meta.env.DEV && store instanceof LocalStore && appearance && !overlayOpen && <DevPanel store={store} />}

      {(firstVisit || editing) && snap && (
        <Center>
          <CharacterCreator
            initial={appearance ?? legacyAppearance() ?? DEFAULT_APPEARANCE}
            profile={{ name: snap.me.display_name, pronoun: snap.me.pronoun }}
            title={appearance ? 'Trocar visual' : 'Monte seu personagem'}
            onSave={saveAppearance}
            onCancel={appearance ? () => setEditing(false) : undefined}
          />
        </Center>
      )}

      {journal && snap && (
        <Journal
          states={snap.items}
          arcs={snap.arcs}
          now={store.now()}
          customItems={snap.customItems}
          userId={store.userId}
          partnerName={snap.partner?.display_name ?? null}
          onAddWord={addWord}
          onDeleteWord={deleteWord}
          onClose={() => setJournal(false)}
        />
      )}
      {board && snap && <CafeBoard snap={snap} now={store.now()} onContribute={contribute} onClose={() => setBoard(false)} />}
      {info && snap && <InfoPanel snap={snap} topic={info} onClose={() => setInfo(null)} />}
      {chunks && snap && (
        <ChunkBoard
          states={snap.items}
          now={now}
          onHint={spend}
          onLearn={(id, grade) => gradeItems([{ itemId: id, grade }])}
          onClose={() => setChunks(false)}
        />
      )}
      {books && <Bookshelf onClose={() => setBooks(false)} />}
      {table && snap && (
        <GameTable
          puzzles={snap.puzzles}
          states={snap.items}
          level={level.level}
          coins={snap.me.coins}
          now={now}
          onStart={startPuzzle}
          onSave={savePuzzle}
          onFinish={finishPuzzle}
          onSpend={spend}
          onClose={() => setTable(false)}
        />
      )}
      {reviewing && snap && <ReviewDeck states={snap.items} now={now} onGrade={(id, grade) => gradeItems([{ itemId: id, grade }])} onClose={() => setReviewing(false)} />}

      {active && snap && (
        <DialogueOverlay
          key={active.customer.id}
          encounter={active.encounter}
          name={char?.name ?? 'Cliente'}
          look={char?.look ?? appearanceFromSeed(active.customer.seed)}
          states={snap.items}
          coins={snap.me.coins}
          onSpend={spend}
          onComplete={onComplete}
          onCancel={() => {
            // o Belmont não é um cliente do banco: sair só fecha a conversa (ele continua esperando)
            if (active.customer.id !== LANDLORD_CUSTOMER_ID) store.release(active.customer.id).catch(() => {});
            setActive(null);
          }}
          onClose={() => {
            setActive(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
