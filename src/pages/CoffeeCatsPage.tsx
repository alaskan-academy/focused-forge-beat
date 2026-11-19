import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, HelpCircle, Layers, Paintbrush, ScrollText, Shirt, Sofa, X } from 'lucide-react';
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
import HouseShop from '@/components/coffee/HouseShop';
import DecorBar from '@/components/coffee/DecorBar';
import { useHouseDecor } from '@/components/coffee/useHouseDecor';
import { ComfortChip, ComfortPanel, MorningCard } from '@/components/coffee/HouseComfort';
import { houseComfort } from '@/lib/coffee/comfort';
import PhonePanel from '@/components/coffee/PhonePanel';
import TvPanel from '@/components/coffee/TvPanel';
import { tvWatched } from '@/lib/coffee/tv';
import type { Station } from '@/content/coffee/furniture';
import { GardenPlotPanel, SeedStand } from '@/components/coffee/GardenPanels';
import { CROP_BY_ID, plantNow } from '@/lib/coffee/garden';
import { ITEMS } from '@/content/coffee';
import type { SceneFishing, SceneGarden } from '@/game/bridge';
import { BaitPanel, CatchResultPanel, FishAlbum, FishQuizPanel } from '@/components/coffee/FishingPanels';
import { GardenDecorBar, MucegoPanel, MucegoShop } from '@/components/coffee/MucegoPanels';
import { useGardenDecor } from '@/components/coffee/useGardenDecor';
import { FOOD_LINES, MUCEGO_LINES, PET_LINES, PET_TIRED, foodKind } from '@/lib/coffee/mucego';
import { THING_BY_ID } from '@/content/coffee/gardenShop';
import { FISH_BY_ID, type CastResult, type CatchResult } from '@/lib/coffee/fishing';
import type { WaterQuiz } from '@/lib/coffee/gardenWords';
import { fishLesson } from '@/lib/coffee/lakePatterns';
import { FURNITURE_BY_ID, variantName } from '@/content/coffee/furniture';
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
import { SLEEP_SPOT, bedroomIndex } from '@/lib/coffee/house';
import type { Area } from '@/game/bridge';
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

const NO_ITEMS: never[] = [];
const NO_MEMBERS: string[] = [];
const NO_NOTES: import('@/lib/coffee/store/types').Note[] = [];
const NO_GARDEN_ITEMS: import('@/lib/coffee/gardenItems').GardenItem[] = [];

function CoffeeCatsGame({ store, defaultName }: { store: CoffeeStore; defaultName: string }) {
  const { snap, loading, needsCafe, error, refresh, sceneCustomers, begin, complete, contribute, gradeItems, others, move, startPuzzle, savePuzzle, finishPuzzle, addWord, deleteWord, buyHouseItem, placeHouseItem, storeHouseItem, morning, dismissMorning, sendNote, readNotes, tvReward, prepReward, seedGift, dismissSeedGift, plantSeed, waterPlant, harvestPlant, buySeed, buyPlot, fishCast, fishCatch, buyBait, baitFromPantry, feedMucego, mucego } = useCoffeeGame(store);
  const [mucegoOpen, setMucegoOpen] = useState(false);
  const [mucegoShopOpen, setMucegoShopOpen] = useState(false);
  const [mucegoLine, setMucegoLine] = useState<[string, string] | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [baitOpen, setBaitOpen] = useState(false);
  const [plotOpen, setPlotOpen] = useState<{ owner: number; plot: number } | null>(null);
  const [standOpen, setStandOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [tv, setTv] = useState(false);
  const [shop, setShop] = useState(false);
  const [comfortOpen, setComfortOpen] = useState(false);
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
  const comfort = useMemo(() => houseComfort(snap?.houseItems ?? []), [snap?.houseItems]);
  // bônus do dia ao acordar (depois de criar o personagem, sem interromper um atendimento)
  const showMorning = !!morning?.claimed && !firstVisit && !active;
  const overlayOpen = mucegoOpen || mucegoShopOpen || albumOpen || baitOpen || !!plotOpen || standOpen || phone || tv || showMorning || comfortOpen || firstVisit || editing || journal || board || !!info || !!active || chunks || books || reviewing || table || shop;

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
  // estações de estudo da casa: ❗ quando têm novidade
  const notes = snap?.notes ?? NO_NOTES;
  const myUserId = snap?.me.user_id ?? '';
  const unreadNotes = notes.filter((n) => n.to_user === myUserId && !n.read_at).length;
  const tvNew = !tvWatched(today) && !tv;
  const stationBadges = useMemo(
    () => ({ phone: unreadNotes > 0, tv: tvNew, pc: dueCount > 0, gametable: puzzleReady }),
    [unreadNotes, tvNew, dueCount, puzzleReady],
  );
  const onStation = useCallback((st: Station) => {
    if (st === 'pc') setReviewing(true);
    else if (st === 'desk') setJournal(true);
    else if (st === 'bookshelf') setBooks(true);
    else if (st === 'gametable') setTable(true);
    else if (st === 'phone') setPhone(true);
    else if (st === 'tv') setTv(true);
    else if (st === 'aquarium') setAlbumOpen(true);
  }, []);
  // ligação nova chegando: avisa (em qualquer lugar do jogo)
  const partnerFirst = snap?.partner?.display_name ?? 'Alguém';
  const [seenUnread, setSeenUnread] = useState(0);
  useEffect(() => {
    if (unreadNotes > seenUnread) toast(`📞 ${partnerFirst} te ligou! Vá até o telefone de casa para ouvir o recado.`);
    setSeenUnread(unreadNotes);
  }, [unreadNotes, seenUnread, partnerFirst]);

  const objectBadges = useMemo(
    () => ({ chalkboard: chunkReady ? ('alert' as const) : null, gametable: puzzleReady ? ('alert' as const) : null }),
    [chunkReady, puzzleReady],
  );

  // em que mapa eu estou (o jogo sempre começa no quarto)
  const [area, setArea] = useState<Area>('house');
  // casa: meu quarto e o nome na porta de cada um (pela ordem de entrada no café)
  const myId = snap?.me.user_id ?? '';
  const members = snap?.cafe.members;
  const partnerName = snap?.partner?.display_name ?? '';
  const myName = snap?.me.display_name ?? '';
  const house = useMemo(() => {
    const list = members ?? [];
    const nameOf = (id: string | undefined) => (!id ? '' : id === myId ? myName : partnerName);
    return { myRoom: bedroomIndex(list, myId), roomNames: [nameOf(list[0]), nameOf(list[1])] as [string, string] };
  }, [members, myId, myName, partnerName]);

  // ── horta: relógio (as plantas crescem sozinhas), estado para a cena e avisos ──
  const [nowMs, setNowMs] = useState(() => store.now().getTime());
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(store.now().getTime()), 30_000);
    return () => window.clearInterval(t);
  }, [store]);
  useEffect(() => setNowMs(store.now().getTime()), [snap, store]);
  const gardenDecor = useGardenDecor({ items: snap?.gardenItems ?? NO_GARDEN_ITEMS, me: myId, place: mucego.place, store: mucego.store });
  const closeGardenDecor = gardenDecor.close;
  useEffect(() => {
    if (area !== 'garden') closeGardenDecor();
  }, [area, closeGardenDecor]);
  const gardenData = snap?.garden;
  const partnerUserId = snap?.partner?.user_id ?? null;
  const myIdx = house.myRoom;
  const sceneGarden = useMemo<SceneGarden>(() => {
    const now = new Date(nowMs);
    const plots: [number, number] = [6, 6];
    plots[myIdx] = gardenData?.plots ?? 6;
    plots[1 - myIdx] = gardenData?.partnerPlots ?? 6;
    return {
      myIndex: myIdx,
      names: house.roomNames,
      plots,
      plants: (gardenData?.plants ?? []).map((p) => {
        const v = plantNow(p, now);
        const mine = p.owner_id === myId;
        return { id: p.id, owner: mine ? myIdx : 1 - myIdx, plot: p.plot, crop_id: p.crop_id, stage: v.stage, thirsty: v.thirsty, ready: v.ready, mine };
      }),
      items: gardenDecor.sceneItems,
      decor: overlayOpen ? null : gardenDecor.view,
      accessory: snap?.mucego.accessory ?? null,
    };
  }, [gardenData, nowMs, myIdx, myId, house.roomNames, gardenDecor.sceneItems, gardenDecor.view, overlayOpen, snap?.mucego.accessory]);
  const myReady = sceneGarden.plants.filter((p) => p.mine && p.ready).length;
  const myThirsty = sceneGarden.plants.filter((p) => p.mine && p.thirsty).length;

  // sementes grátis do dia
  useEffect(() => {
    if (!seedGift.length) return;
    toast(`🌱 Sementes grátis de hoje: ${seedGift.map((c) => CROP_BY_ID[c]?.en ?? c).join(', ')}. Plante no quintal (porta da cozinha)!`);
    dismissSeedGift();
  }, [seedGift, dismissSeedGift]);

  // a outra pessoa regou uma planta minha
  const wateredSeen = useRef<Record<string, string>>({});
  useEffect(() => {
    const plants = gardenData?.plants ?? [];
    const seen = wateredSeen.current;
    const first = Object.keys(seen).length === 0;
    for (const p of plants) {
      const stamp = `${p.last_watered_by}:${p.stage}:${p.watered}`;
      if (!first && seen[p.id] && seen[p.id] !== stamp && p.owner_id === myId && p.last_watered_by && p.last_watered_by === partnerUserId)
        toast(`💧 ${snap?.partner?.display_name ?? 'Alguém'} regou seu ${CROP_BY_ID[p.crop_id]?.en ?? 'canteiro'}!`);
      seen[p.id] = stamp;
    }
  }, [gardenData, myId, partnerUserId, snap?.partner?.display_name]);

  // ── pescaria: lançar → esperar → fisgou → pergunta com cronômetro → resultado ──
  type FishFlow = {
    phase: 'waiting' | 'bite' | 'quiz' | 'result';
    at: { x: number; y: number };
    cast: CastResult;
    itemId: string | null; // padrão do lago (pf:...)
    chunkId: string | null; // chunk que vem junto (pc:...)
    quiz: WaterQuiz | null;
    success: boolean;
    result: CatchResult | null;
  };
  const [fishFlow, setFishFlow] = useState<FishFlow | null>(null);
  const [caught, setCaught] = useState<SceneFishing['caught']>(null);
  const fishTimers = useRef<number[]>([]);
  useEffect(() => () => fishTimers.current.forEach((t) => window.clearTimeout(t)), []);
  const fishing = snap?.fishing;
  // pescando junto: a outra pessoa online no quintal (mais chance de peixe raro)
  const together = !!others.find((o) => o.pos?.area === 'garden');

  const finishFish = useCallback(
    async (flow: FishFlow, success: boolean) => {
      const fish = FISH_BY_ID[flow.cast.fish_id];
      try {
        const result = await fishCatch(flow.cast.cast_id, success);
        // o padrão sobe (ou desce) na revisão; o chunk entra na revisão quando você pega o peixe
        if (flow.itemId && fish.rarity !== 'junk')
          void gradeItems([{ itemId: flow.itemId, grade: success ? 'good' : 'fail' }, ...(success && flow.chunkId ? [{ itemId: flow.chunkId, grade: 'good' as const }] : [])]).catch(() => undefined);
        if (success || fish.rarity === 'junk') setCaught({ emoji: fish.emoji, key: Date.now() });
        setFishFlow({ ...flow, phase: 'result', success, result });
      } catch {
        toast('O peixe fugiu com a isca… tente de novo 🎣');
        setFishFlow(null);
      }
    },
    [fishCatch, gradeItems],
  );

  const onFishCast = useCallback(
    async (at: { x: number; y: number }) => {
      if (fishFlow && fishFlow.phase !== 'result') return;
      let cast: CastResult;
      try {
        cast = await fishCast(together);
      } catch (e) {
        if (e instanceof Error && e.message.includes('bait')) {
          toast('Acabaram os lançamentos de hoje — compre iscas ou use ingredientes da horta 🪱');
          setFishFlow(null);
          setBaitOpen(true);
        } else toast('Não consegui lançar a linha. Tente de novo.');
        return;
      }
      const fish = FISH_BY_ID[cast.fish_id];
      const s0 = snap!;
      // cada peixe treina um padrão do dia a dia (mais raro = variação mais difícil) e traz um chunk
      const lesson = fishLesson(fish.rarity, s0.items, new Date());
      const quiz = lesson?.quiz ?? null;
      const flow: FishFlow = { phase: 'waiting', at, cast, itemId: lesson?.familyId ?? null, chunkId: lesson?.chunkId ?? null, quiz, success: false, result: null };
      setCaught(null);
      setFishFlow(flow);
      fishTimers.current.forEach((t) => window.clearTimeout(t));
      const wait = 3000 + Math.random() * 9000;
      fishTimers.current = [
        window.setTimeout(() => setFishFlow((f) => (f && f.cast.cast_id === cast.cast_id ? { ...f, phase: 'bite' } : f)), wait),
        window.setTimeout(() => {
          // lixo vem sem pergunta; o resto precisa acertar para puxar
          if (!quiz) void finishFish(flow, true);
          else setFishFlow((f) => (f && f.cast.cast_id === cast.cast_id ? { ...f, phase: 'quiz' } : f));
        }, wait + 1200),
      ];
    },
    [fishFlow, fishCast, together, snap, finishFish],
  );

  const sceneFishing = useMemo<SceneFishing>(
    () => ({ at: fishFlow && fishFlow.phase !== 'result' ? fishFlow.at : null, bite: fishFlow?.phase === 'bite' || fishFlow?.phase === 'quiz', caught }),
    [fishFlow, caught],
  );
  // sair do quintal cancela a pesca
  useEffect(() => {
    if (area !== 'garden') {
      fishTimers.current.forEach((t) => window.clearTimeout(t));
      setFishFlow(null);
    }
  }, [area]);
  const nameOf = useCallback((userId: string | null) => (!userId ? '?' : userId === myId ? 'você' : (snap?.partner?.display_name ?? '?')), [myId, snap?.partner?.display_name]);

  const onGardenPlot = useCallback((owner: number, plot: number) => setPlotOpen({ owner, plot }), []);
  const onGardenStand = useCallback(() => setStandOpen(true), []);

  // móveis: modo decorar e lojinha
  // "Where did you put the…?": revisão da preposição e do móvel, e +1 🪙 quando acerta
  const onQuiz = useCallback(
    (correct: boolean, itemId: string) => {
      void gradeItems([
        { itemId: 'g:prepositions_place', grade: correct ? 'good' : 'fail' },
        { itemId: `f:${itemId}`, grade: correct ? 'good' : 'ok' },
      ]).catch(() => undefined);
      if (correct)
        void prepReward()
          .then((r) => r.coins === 0 && toast('Moedas das preposições de hoje já ganhas — mas o treino vale! 💪'))
          .catch(() => undefined);
    },
    [gradeItems, prepReward],
  );
  const decor = useHouseDecor({ items: snap?.houseItems ?? NO_ITEMS, members: members ?? NO_MEMBERS, me: myId, myRoom: house.myRoom, place: placeHouseItem, store: storeHouseItem, onQuiz });
  // saiu de casa: sai do modo decorar
  const closeDecor = decor.close;
  useEffect(() => {
    if (area !== 'house') closeDecor();
  }, [area, closeDecor]);

  const buy = async (itemId: string, variant: number) => {
    try {
      const res = await buyHouseItem(itemId, variant);
      const f = FURNITURE_BY_ID[itemId];
      // a palavra do móvel entra na revisão (cards)
      if (!snap?.items[`f:${itemId}`]) void gradeItems([{ itemId: `f:${itemId}`, grade: 'ok' }]).catch(() => undefined);
      toast(`Comprado: ${variantName(f, variant)}! Está na sua mochila 🎒`, {
        action: {
          label: 'Colocar agora',
          onClick: () => {
            setShop(false);
            decor.startPlacing({ id: res.id, owner_id: myId, item_id: itemId, variant, room: null, x: 0, y: 0, flip: false, created_at: '' });
          },
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      toast(msg.includes('coins') ? 'Moedas insuficientes 🪙' : msg.includes('level') ? 'Seu nível ainda não libera esse móvel 🔒' : 'Não consegui comprar. Tente de novo.');
    }
  };

  // a outra pessoa: andando se estiver online no mesmo mapa; offline, parada no cantinho
  // dela (café) ou dormindo no quarto (casa); online no outro mapa, não aparece
  const sceneOthers = useMemo<SceneOther[]>(() => {
    const p = snap?.partner;
    if (!snap || !p) return [];
    const online = others.find((o) => o.user_id === p.user_id);
    const idx = Math.max(0, snap.cafe.members.indexOf(p.user_id));
    const theirArea = online ? (online.pos?.area ?? 'cafe') : null;
    if (online && theirArea !== area) return [];
    if (!online && area === 'garden') return [];
    return [
      {
        id: p.user_id,
        name: p.display_name,
        appearance: online?.appearance ?? p.appearance ?? appearanceFromSeed(p.user_id.length * 7919),
        online: !!online,
        pos: online?.pos ?? null,
        corner: area === 'house' ? SLEEP_SPOT[Math.min(1, idx)] : PERSONAL_CORNERS[idx % PERSONAL_CORNERS.length],
      },
    ];
  }, [snap, others, area]);

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
          house={house}
          houseItems={decor.sceneItems}
          decor={overlayOpen ? null : decor.view}
          onDecorTap={decor.onTap}
          stationBadges={stationBadges}
          onStation={onStation}
          garden={sceneGarden}
          onGardenPlot={onGardenPlot}
          onGardenStand={onGardenStand}
          fishing={sceneFishing}
          onFishCast={onFishCast}
          onMucego={() => {
            setMucegoLine(MUCEGO_LINES[Math.floor(Math.random() * MUCEGO_LINES.length)]);
            setMucegoOpen(true);
          }}
          onGardenDecorTap={gardenDecor.onTap}
          onInteract={onInteract}
          onObject={(id) => (id === 'chalkboard' ? setChunks(true) : id === 'gametable' ? setTable(true) : setBooks(true))}
          onMove={move}
          onArea={setArea}
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
          <div className="cc-hud pointer-events-auto flex shrink-0 items-center gap-1">
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
          {/* no celular os botões não cabem numa linha só: quebram para baixo, alinhados à direita */}
          <div className="pointer-events-auto flex min-w-0 flex-wrap justify-end gap-2">
            {area === 'garden' && (
              <>
                <button type="button" onClick={() => { setMucegoLine(MUCEGO_LINES[Math.floor(Math.random() * MUCEGO_LINES.length)]); setMucegoOpen(true); }} className="cc-hud flex items-center gap-1 whitespace-nowrap text-sm" title="Mucego Frutífero">
                  🐈‍⬛ <span className="hidden sm:inline">Mucego Frutífero</span>
                  {snap?.mucego.gift_ready && <span>🎁</span>}
                </button>
                <button type="button" onClick={() => (gardenDecor.active ? gardenDecor.close() : gardenDecor.open())} className={`cc-hud flex items-center gap-1 whitespace-nowrap text-sm ${gardenDecor.active ? '!bg-[#f2cc8f]' : ''}`} title="Decorar o jardim">
                  🎨 <span className="hidden sm:inline">Decorar</span>
                </button>
              </>
            )}
            {area === 'garden' && fishing && (
              <>
                <button type="button" onClick={() => setBaitOpen(true)} className="cc-hud flex items-center gap-1 whitespace-nowrap text-sm" title="Lançamentos e iscas">
                  🎣 {fishing.free_left}
                  {fishing.bait > 0 && <span className="opacity-70">· 🪱{fishing.bait}</span>}
                  {fishing.lucky > 0 && <span className="opacity-70">· 🍀{fishing.lucky}</span>}
                </button>
                <button type="button" onClick={() => setAlbumOpen(true)} className="cc-hud flex items-center gap-1 whitespace-nowrap text-sm" title="Álbum de peixes">
                  📖 <span className="hidden sm:inline">Álbum</span>
                </button>
              </>
            )}
            {(myReady > 0 || myThirsty > 0) && (
              <span className="cc-hud flex items-center gap-1 whitespace-nowrap text-sm" title="Sua horta (quintal, pela porta da cozinha)">
                🌱{myReady > 0 && <span>✨{myReady}</span>}
                {myThirsty > 0 && <span>💧{myThirsty}</span>}
              </span>
            )}
            {area === 'house' && (
              <>
                <ComfortChip comfort={comfort} onClick={() => setComfortOpen(true)} />
                <button type="button" onClick={() => setShop(true)} className="cc-hud flex items-center gap-1.5" title="Lojinha de móveis">
                  <Sofa className="h-4 w-4" /> <span className="hidden sm:inline">Loja</span>
                </button>
                <button
                  type="button"
                  onClick={() => (decor.active ? decor.close() : decor.open())}
                  className={`cc-hud relative flex items-center gap-1.5 ${decor.active ? '!bg-[#f2cc8f]' : ''}`}
                  title="Decorar a casa"
                >
                  <Paintbrush className="h-4 w-4" /> <span className="hidden sm:inline">Decorar</span>
                  {decor.bag.length > 0 && !decor.active && (
                    <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-[#5b6ea8] px-1 text-center text-[11px] font-bold leading-[18px] text-white">{decor.bag.length}</span>
                  )}
                </button>
              </>
            )}
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
      {appearance && !overlayOpen && decor.active && <DecorBar decor={decor} onShop={() => setShop(true)} />}
      {phone && snap && (
        <PhonePanel me={snap.me.user_id} partnerName={snap.partner?.display_name ?? null} notes={notes} onSend={sendNote} onRead={readNotes} onClose={() => setPhone(false)} />
      )}
      {plotOpen &&
        snap &&
        (() => {
          const mine = plotOpen.owner === myIdx;
          const ownerId = mine ? myId : partnerUserId;
          const plant = snap.garden.plants.find((p) => p.owner_id === ownerId && p.plot === plotOpen.plot) ?? null;
          const plots = mine ? snap.garden.plots : snap.garden.partnerPlots;
          return (
            <GardenPlotPanel
              plot={plotOpen.plot}
              mine={mine}
              ownerName={house.roomNames[plotOpen.owner] || 'outra pessoa'}
              locked={plotOpen.plot >= plots}
              plots={plots}
              plant={plant}
              view={plant ? plantNow(plant, new Date(nowMs)) : null}
              now={nowMs}
              seeds={snap.garden.seeds}
              coins={snap.me.coins}
              onPlant={async (cropId) => {
                const itemId = await plantSeed(plotOpen.plot, cropId);
                toast(`🌱 Plantou ${CROP_BY_ID[cropId]?.en}! Palavra nova: "${ITEMS[itemId]?.label ?? itemId}"`);
                return itemId;
              }}
              onWater={async () => {
                if (!plant) return;
                const r = await waterPlant(plant.id);
                if (r.xp) toast(`💧 Você regou a planta da ${house.roomNames[plotOpen.owner]}! +${r.xp} XP`);
              }}
              onQuiz={(correct) => {
                if (plant) void gradeItems([{ itemId: plant.item_id, grade: correct ? 'good' : 'fail' }]).catch(() => undefined);
              }}
              onHarvest={async () => {
                if (!plant) return;
                const r = await harvestPlant(plant.id);
                void gradeItems([{ itemId: plant.item_id, grade: 'good' }]).catch(() => undefined);
                toast(`🧺 Colheu ${CROP_BY_ID[r.crop]?.en}! +${r.coins} 🪙 · "${ITEMS[r.item]?.label ?? ''}" subiu na revisão`);
              }}
              onBuyPlot={async () => {
                try {
                  await buyPlot();
                } catch {
                  toast('Moedas insuficientes 🪙');
                }
              }}
              onShop={() => {
                setPlotOpen(null);
                setStandOpen(true);
              }}
              onClose={() => setPlotOpen(null)}
            />
          );
        })()}
      {fishFlow?.phase === 'quiz' && fishFlow.quiz && (
        <FishQuizPanel key={fishFlow.cast.cast_id} fish={FISH_BY_ID[fishFlow.cast.fish_id]} quiz={fishFlow.quiz} onDone={(ok) => void finishFish(fishFlow, ok)} />
      )}
      {fishFlow?.phase === 'result' && snap && (
        <CatchResultPanel
          fish={FISH_BY_ID[fishFlow.cast.fish_id]}
          success={fishFlow.success}
          result={fishFlow.result}
          itemId={fishFlow.itemId}
          chunkId={fishFlow.chunkId}
          quiz={fishFlow.quiz}
          canCastAgain={snap.fishing.free_left + snap.fishing.bait > 0}
          canFeed={fishFlow.success && !snap.fishing.fed_today && ['common', 'uncommon'].includes(FISH_BY_ID[fishFlow.cast.fish_id].rarity)}
          onAgain={() => void onFishCast(fishFlow.at)}
          onFeed={async () => {
            const xp = await feedMucego().catch(() => 0);
            toast(xp ? '🐈‍⬛ Mucego Frutífero: "Thank you! Fish is my second favorite food… after strawberries!" (+2 XP)' : '🐈‍⬛ A Mucego Frutífero já comeu hoje 😸');
            setFishFlow(null);
          }}
          onClose={() => setFishFlow(null)}
        />
      )}
      {mucegoOpen && snap && (
        <MucegoPanel
          m={snap.mucego}
          today={today}
          now={nowMs}
          pantry={snap.garden.pantry}
          line={mucegoLine}
          onPet={async () => {
            const r = await mucego.pet();
            setMucegoLine(r.ok ? PET_LINES[Math.floor(Math.random() * PET_LINES.length)] : PET_TIRED);
          }}
          onFeed={async (cropId) => {
            try {
              const r = await mucego.feed(cropId);
              const lines = FOOD_LINES[foodKind(cropId)];
              setMucegoLine(lines[Math.floor(Math.random() * lines.length)]);
              if (r.request) toast(`🐈‍⬛ Pedido do dia atendido! +${r.coins} 🪙 e +${r.gain}♥`);
            } catch (e) {
              toast(e instanceof Error && e.message.includes('full') ? 'Ela está cheia por hoje 😸' : 'Não deu certo. Tente de novo.');
            }
          }}
          onTreat={async (t) => {
            await mucego.treat(t);
            setMucegoLine(['Mmm! Delicious! You know me so well.', 'Hummm! Delícia! Você me conhece tão bem.']);
          }}
          onWear={async (a) => {
            await mucego.wear(a);
            setMucegoLine(a ? ['Do I look pretty? I think I look AMAZING.', 'Estou bonita? Acho que estou MARAVILHOSA.'] : ['Natural beauty. Classic.', 'Beleza natural. Clássico.']);
          }}
          onGift={async () => {
            const r = await mucego.gift();
            setMucegoLine(['I found this for you! Plant it, okay?', 'Achei isso para você! Planta, tá?']);
            toast(`🎁 A Mucego Frutífero te deu uma semente de ${CROP_BY_ID[r.crop]?.en ?? r.crop}!`);
          }}
          onShop={() => {
            setMucegoOpen(false);
            setMucegoShopOpen(true);
          }}
          onClose={() => setMucegoOpen(false)}
        />
      )}
      {mucegoShopOpen && snap && (
        <MucegoShop
          coins={snap.me.coins}
          level={level.level}
          owned={snap.mucego.accessories}
          onBuy={async (itemId) => {
            try {
              await mucego.buy(itemId);
              const g = THING_BY_ID[itemId];
              toast(
                g.kind === 'accessory'
                  ? `🎀 ${g.en} comprado! Vista nela no painel da Mucego Frutífero.`
                  : g.kind === 'treat'
                    ? `🍪 ${g.en} guardado para dar para ela!`
                    : `🎒 ${g.en} está na sua mochila do jardim — use 🎨 Decorar para colocar.`,
              );
            } catch (e) {
              const msg = e instanceof Error ? e.message : '';
              toast(msg.includes('coins') ? 'Moedas insuficientes 🪙' : msg.includes('level') ? 'Seu nível ainda não libera isso 🔒' : 'Não consegui comprar.');
            }
          }}
          onClose={() => setMucegoShopOpen(false)}
        />
      )}
      {appearance && !overlayOpen && gardenDecor.active && area === 'garden' && <GardenDecorBar decor={gardenDecor} onShop={() => setMucegoShopOpen(true)} />}
      {albumOpen && snap && <FishAlbum album={snap.fishing.album} names={nameOf} states={snap.items} now={new Date(nowMs)} onClose={() => setAlbumOpen(false)} />}
      {baitOpen && snap && (
        <BaitPanel
          freeLeft={snap.fishing.free_left}
          bait={snap.fishing.bait}
          lucky={snap.fishing.lucky}
          coins={snap.me.coins}
          pantry={snap.garden.pantry}
          onBuy={async (n) => {
            try {
              await buyBait(n);
            } catch {
              toast('Moedas insuficientes 🪙');
            }
          }}
          onPantry={async (cropId) => {
            const r = await baitFromPantry(cropId);
            toast(`🪱 +${r.bait} iscas${r.lucky ? ` e ${r.lucky} lançamentos de sorte 🍀` : ''}`);
          }}
          onClose={() => setBaitOpen(false)}
        />
      )}
      {standOpen && snap && (
        <SeedStand
          coins={snap.me.coins}
          level={level.level}
          seeds={snap.garden.seeds}
          pantry={snap.garden.pantry}
          onBuy={async (cropId) => {
            try {
              await buySeed(cropId, 1);
            } catch {
              toast('Moedas insuficientes 🪙');
            }
          }}
          onClose={() => setStandOpen(false)}
        />
      )}
      {tv && <TvPanel day={today} onReward={tvReward} onClose={() => setTv(false)} />}
      {comfortOpen && <ComfortPanel comfort={comfort} onClose={() => setComfortOpen(false)} />}
      {showMorning && morning && snap && <MorningCard bonus={morning} name={snap.me.display_name} onClose={dismissMorning} />}
      {shop && snap && <HouseShop coins={snap.me.coins} level={level.level} onBuy={buy} onClose={() => setShop(false)} />}
      {appearance && !overlayOpen && !decor.active && !gardenDecor.active && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <div className="cc-hud text-xs font-medium opacity-90">
            {area === 'garden' ? (
              <>
                <span className="hidden md:inline">🌱 Toque num canteiro · 🎣 toque no lago para pescar · 🧺 barraquinha lá em cima · toque na Mucego Frutífero 🐈‍⬛</span>
                <span className="md:hidden">Toque num canteiro · toque na Mucego Frutífero 🐈‍⬛</span>
              </>
            ) : area === 'house' ? (
              <>
                <span className="hidden md:inline">WASD/setas para andar · 🛋️ Loja e 🎨 Decorar lá em cima · a porta da sala leva ao café ☕</span>
                <span className="md:hidden">Toque para andar · a porta da sala leva ao café</span>
              </>
            ) : (
              <>
                <span className="hidden md:inline">WASD/setas para andar · E para atender · ☕ pedido · 💬 conversa · 📖 capítulo novo · 🏠 porta à direita</span>
                <span className="md:hidden">Toque num cliente para atender</span>
              </>
            )}
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
