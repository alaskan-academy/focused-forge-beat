import { useEffect, useRef } from 'react';
import type { Appearance, Direction } from '@/lib/coffee/character';
import type { Area, GameBridge, GameState, SceneCustomer, SceneOther } from '@/game/bridge';
import type { Station } from '@/content/coffee/furniture';
import type { GameHandle } from '@/game/createGame';

type Props = {
  appearance: Appearance;
  customers: SceneCustomer[];
  others: SceneOther[];
  catCorner: boolean;
  objectBadges: GameState['objectBadges'];
  inputEnabled: boolean;
  house: GameState['house'];
  houseItems: GameState['houseItems'];
  decor: GameState['decor'];
  stationBadges: GameState['stationBadges'];
  garden: GameState['garden'];
  fishing: GameState['fishing'];
  onFishCast?: (p: { x: number; y: number }) => void;
  onMucego?: () => void;
  onGardenDecorTap?: (p: { x: number; y: number }) => void;
  onGardenPlot?: (owner: number, plot: number) => void;
  onGardenStand?: () => void;
  onStation?: (station: Station, id: string) => void;
  onDecorTap?: (p: { x: number; y: number }) => void;
  onInteract: (customerId: string) => void;
  onObject?: (id: 'chalkboard' | 'bookshelf' | 'gametable') => void;
  onMove?: (p: { x: number; y: number; dir: Direction; area: Area }) => void;
  onArea?: (area: Area) => void;
};

// Canvas do Phaser. O motor é carregado sob demanda (import dinâmico), só quando a aba abre.
export default function GameCanvas({ appearance, customers, others, catCorner, objectBadges, inputEnabled, house, houseItems, decor, stationBadges, garden, fishing, onInteract, onObject, onMove, onArea, onDecorTap, onStation, onGardenPlot, onGardenStand, onFishCast, onMucego, onGardenDecorTap }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<GameBridge | null>(null);
  const initial = useRef<GameState>({ appearance, customers, others, catCorner, objectBadges, inputEnabled, house, houseItems, decor, stationBadges, garden, fishing });
  const interactRef = useRef(onInteract);
  interactRef.current = onInteract;
  const moveRef = useRef(onMove);
  moveRef.current = onMove;
  const objectRef = useRef(onObject);
  objectRef.current = onObject;
  const areaRef = useRef(onArea);
  areaRef.current = onArea;
  const decorRef = useRef(onDecorTap);
  decorRef.current = onDecorTap;
  const stationRef = useRef(onStation);
  stationRef.current = onStation;
  const plotRef = useRef(onGardenPlot);
  plotRef.current = onGardenPlot;
  const standRef = useRef(onGardenStand);
  standRef.current = onGardenStand;
  const castRef = useRef(onFishCast);
  castRef.current = onFishCast;
  const mucegoRef = useRef(onMucego);
  mucegoRef.current = onMucego;
  const gDecorRef = useRef(onGardenDecorTap);
  gDecorRef.current = onGardenDecorTap;

  useEffect(() => {
    let handle: GameHandle | null = null;
    let cancelled = false;
    import('@/game/createGame').then(({ createGame }) => {
      if (cancelled || !hostRef.current) return;
      handle = createGame(hostRef.current, initial.current);
      bridgeRef.current = handle.bridge;
      handle.bridge.on('interact', ({ customerId }) => interactRef.current(customerId));
      handle.bridge.on('move', (p) => moveRef.current?.(p));
      handle.bridge.on('object', ({ id }) => objectRef.current?.(id));
      handle.bridge.on('area', ({ area }) => areaRef.current?.(area));
      handle.bridge.on('decorTap', (p) => decorRef.current?.(p));
      handle.bridge.on('station', ({ station, id }) => stationRef.current?.(station, id));
      handle.bridge.on('gardenPlot', ({ owner, plot }) => plotRef.current?.(owner, plot));
      handle.bridge.on('gardenStand', () => standRef.current?.());
      handle.bridge.on('fishCast', (p) => castRef.current?.(p));
      handle.bridge.on('mucegoTap', () => mucegoRef.current?.());
      handle.bridge.on('gardenDecorTap', (p) => gDecorRef.current?.(p));
    });
    return () => {
      cancelled = true;
      bridgeRef.current = null;
      handle?.destroy();
    };
  }, []);

  useEffect(() => {
    initial.current = { appearance, customers, others, catCorner, objectBadges, inputEnabled, house, houseItems, decor, stationBadges, garden, fishing };
    bridgeRef.current?.setState({ appearance, customers, others, catCorner, objectBadges, inputEnabled, house, houseItems, decor, stationBadges, garden, fishing });
  }, [appearance, customers, others, catCorner, objectBadges, inputEnabled, house, houseItems, decor, stationBadges, garden, fishing]);

  return <div ref={hostRef} className="absolute inset-0 touch-none select-none [&_canvas]:block" />;
}
