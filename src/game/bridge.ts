// Ponte entre o jogo (Phaser) e o React. O React manda o estado (aparência, clientes, se o
// jogo recebe teclado) e o jogo devolve eventos (ex.: "o jogador quer atender o cliente X").
// Não importa Phaser, para o React não carregar o motor só por causa dos tipos.
import type { Appearance, Direction } from '@/lib/coffee/character';
import type { Station } from '@/content/coffee/furniture';

// Lugares do jogo: o café e a casa de vocês (cenas diferentes do Phaser).
export type Area = 'cafe' | 'house';

export type SceneCustomer = {
  id: string;
  spotId: string;
  seed: number;
  status: 'waiting' | 'serving';
  // true quando outra pessoa está atendendo (não dá para interagir)
  busy: boolean;
  // eu já conversei com este cliente nesta visita (ele está esperando a outra pessoa)
  doneForMe: boolean;
  // chegou agora: entra andando pela porta
  arriving: boolean;
  // balão: pedido, conversa ou capítulo novo
  bubble: 'coffee' | 'talk' | 'book' | 'bill';
  // clientes recorrentes: nome e aparência fixa
  name?: string;
  look?: Appearance;
};

// A outra pessoa do café: andando (online, com posição) ou parada no cantinho dela (offline).
export type SceneOther = {
  id: string;
  name: string;
  appearance: Appearance;
  online: boolean;
  pos: { x: number; y: number; dir: Direction } | null;
  corner: { x: number; y: number };
};

export type GameState = {
  appearance: Appearance;
  customers: SceneCustomer[];
  inputEnabled: boolean;
  others: SceneOther[];
  // melhoria compartilhada concluída: cama e arranhador aparecem no mapa
  catCorner: boolean;
  // selo sobre objetos interativos (ex.: chunk novo no quadro-negro)
  objectBadges: Partial<Record<'chalkboard' | 'bookshelf' | 'gametable', 'alert' | null>>;
  // casa: qual quarto é meu (0 = esquerda, 1 = direita) e o nome na porta de cada um
  house: { myRoom: number; roomNames: [string, string] };
  // móveis colocados na casa (editable: posso mexer nele no modo decorar)
  houseItems: SceneHouseItem[];
  // modo decorar: prévia do móvel sendo colocado e o móvel selecionado (null = fora do modo)
  decor: DecorView | null;
  // selo ❗ sobre as estações de estudo (ex.: recado novo no telefone)
  stationBadges: Partial<Record<Station, boolean>>;
};

export type SceneHouseItem = { id: string; item_id: string; variant: number; x: number; y: number; flip: boolean; editable: boolean };
export type DecorView = {
  ghost: { item_id: string; variant: number; flip: boolean; x: number; y: number; ok: boolean } | null;
  selected: string | null;
};

export type GameEvents = {
  interact: { customerId: string };
  // interagiu com um objeto do café (quadro-negro, estante)
  object: { id: 'chalkboard' | 'bookshelf' | 'gametable' };
  // posição do meu personagem (em pixels), para a presença em tempo real
  move: { x: number; y: number; dir: Direction; area: Area };
  // entrei num lugar (café ou casa)
  area: { area: Area };
  // toque num tile no modo decorar
  decorTap: { x: number; y: number };
  // usou uma estação de estudo da casa (computador, telefone, TV…)
  station: { station: Station; id: string };
  ready: undefined;
};

type Listener<T> = (payload: T) => void;

export class GameBridge {
  state: GameState;
  private listeners: Partial<Record<keyof GameEvents, Set<Listener<never>>>> = {};
  private stateListeners = new Set<(s: GameState, prev: GameState) => void>();

  constructor(initial: GameState) {
    this.state = initial;
  }

  setState(patch: Partial<GameState>) {
    const prev = this.state;
    this.state = { ...prev, ...patch };
    this.stateListeners.forEach((l) => l(this.state, prev));
  }

  onState(l: (s: GameState, prev: GameState) => void) {
    this.stateListeners.add(l);
    return () => this.stateListeners.delete(l);
  }

  on<K extends keyof GameEvents>(event: K, l: Listener<GameEvents[K]>) {
    const set = (this.listeners[event] ??= new Set()) as unknown as Set<Listener<GameEvents[K]>>;
    set.add(l);
    return () => set.delete(l);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]) {
    (this.listeners[event] as unknown as Set<Listener<GameEvents[K]>> | undefined)?.forEach((l) => l(payload));
  }

  clear() {
    this.listeners = {};
    this.stateListeners.clear();
  }
}
