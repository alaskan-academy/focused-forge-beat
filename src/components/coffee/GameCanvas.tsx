import { useEffect, useRef } from 'react';
import type { Appearance, Direction } from '@/lib/coffee/character';
import type { GameBridge, GameState, SceneCustomer, SceneOther } from '@/game/bridge';
import type { GameHandle } from '@/game/createGame';

type Props = {
  appearance: Appearance;
  customers: SceneCustomer[];
  others: SceneOther[];
  catCorner: boolean;
  objectBadges: GameState['objectBadges'];
  inputEnabled: boolean;
  onInteract: (customerId: string) => void;
  onObject?: (id: 'chalkboard' | 'bookshelf') => void;
  onMove?: (p: { x: number; y: number; dir: Direction }) => void;
};

// Canvas do Phaser. O motor é carregado sob demanda (import dinâmico), só quando a aba abre.
export default function GameCanvas({ appearance, customers, others, catCorner, objectBadges, inputEnabled, onInteract, onObject, onMove }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<GameBridge | null>(null);
  const initial = useRef<GameState>({ appearance, customers, others, catCorner, objectBadges, inputEnabled });
  const interactRef = useRef(onInteract);
  interactRef.current = onInteract;
  const moveRef = useRef(onMove);
  moveRef.current = onMove;
  const objectRef = useRef(onObject);
  objectRef.current = onObject;

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
    });
    return () => {
      cancelled = true;
      bridgeRef.current = null;
      handle?.destroy();
    };
  }, []);

  useEffect(() => {
    initial.current = { appearance, customers, others, catCorner, objectBadges, inputEnabled };
    bridgeRef.current?.setState({ appearance, customers, others, catCorner, objectBadges, inputEnabled });
  }, [appearance, customers, others, catCorner, objectBadges, inputEnabled]);

  return <div ref={hostRef} className="absolute inset-0 touch-none select-none [&_canvas]:block" />;
}
