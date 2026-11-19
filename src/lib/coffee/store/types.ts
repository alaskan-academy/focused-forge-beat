// Contrato de armazenamento do jogo. Há duas implementações:
//  - LocalStore: tudo no navegador, com relógio ajustável (página de teste /coffee-dev)
//  - SupabaseStore: banco compartilhado entre vocês dois (aba /coffee)
import type { Appearance, Direction } from '../character';
import type { ArcState } from '../arcs';
import type { Grade, VocabState } from '../srs';
import type { Pronoun } from '@/content/coffee/personalize';
import type { SudokuProgress, SudokuPuzzle, SudokuSize } from '../sudoku';
import type { LandlordBill, LandlordPayInput, LandlordPayResult } from '../landlord';
import type { HouseItem } from '../houseItems';
import type { RoomId } from '../house';
import type { MorningBonus } from '../comfort';
import type { Plant } from '../garden';

export type { HouseItem } from '../houseItems';

export type CafeCustomer = {
  id: string;
  spot: string;
  seed: number;
  character_id: string | null;
  status: 'waiting' | 'serving';
  claimed_by: string | null;
  // quem já conversou com este cliente nesta visita (recorrentes ficam até todos conversarem)
  served_by: string[];
  arrived_at: string;
};

export type PlayerRow = {
  user_id: string;
  display_name: string;
  pronoun: Pronoun; // como os clientes falam desta pessoa (she/he)
  coins: number;
  xp: number;
  appearance: Appearance | null;
  recent_scenes: string[];
  last_theme: string | null;
};

// O outro jogador do café.
export type Partner = { user_id: string; display_name: string; pronoun: Pronoun; appearance: Appearance | null };

export type CafeInfo = { id: string; name: string; invite_code: string; reputation: number; members: string[] };

// Linha do mural. O texto é montado no app (ver lib/coffee/feed.ts).
export type FeedEntry = { id: string; user_id: string | null; kind: string; data: Record<string, unknown>; created_at: string };

export type UpgradeState = {
  id: string;
  key: string;
  cost: number;
  funded: number;
  completed_at: string | null;
  contributions: Record<string, number>; // user_id → total
};

export type Snapshot = {
  cafe: CafeInfo;
  me: PlayerRow;
  partner: Partner | null;
  customers: CafeCustomer[];
  items: Record<string, VocabState>;
  arcs: Record<string, ArcState>;
  feed: FeedEntry[];
  upgrade: UpgradeState | null;
  puzzles: PuzzleRow[]; // meus puzzles de hoje e de ontem (mesa de jogos)
  customItems: CustomItem[]; // caderninho escrito à mão (meus e da outra pessoa, para copiar)
  landlord: LandlordBill | null; // conta de hoje do Belmont (null = indisponível)
  houseItems: HouseItem[]; // móveis da casa (colocados e nas mochilas)
  notes: Note[]; // recados do telefone (que eu mandei ou recebi), mais novos primeiro
  garden: GardenData; // horta do quintal
};

// Horta: meus canteiros, sementes e despensa; quantos canteiros a outra pessoa tem; plantas dos dois.
export type GardenData = {
  plots: number;
  seeds: Record<string, number>;
  pantry: Record<string, number>;
  partnerPlots: number;
  plants: Plant[];
};
export type HarvestResult = { coins: number; total_coins: number; crop: string; item: string };

// Recado do telefone: agradecimento em inglês para a outra pessoa.
export type Note = { id: string; from_user: string; to_user: string; body: string; heart: boolean; created_at: string; read_at: string | null };
export type DailyReward = { coins: number; total_coins: number };

// Palavra anotada à mão no caderninho. Na revisão o item é `u:<id>` (ver content/coffee/custom.ts).
export type CustomItem = {
  id: string;
  user_id: string;
  en: string;
  pt: string;
  example: string | null;
  source: string | null; // de onde veio (aula, série, música…)
  created_at: string;
};
export type CustomItemInput = Pick<CustomItem, 'en' | 'pt' | 'example' | 'source'>;

// Puzzle do dia (mesa de jogos). `day` = data no horário de Brasília (AAAA-MM-DD).
export type PuzzleRow = {
  id: string;
  day: string;
  size: SudokuSize;
  data: SudokuPuzzle;
  progress: SudokuProgress | null;
  status: 'playing' | 'done';
  stars: number | null;
};

export type PuzzleFinish = { stars: 1 | 2 | 3; mistakes: number; hints: number; words: number; progress: SudokuProgress };
export type PuzzleReward = { coins: number; xp: number; total_coins: number; total_xp: number };

export type FinishInput = {
  customerId: string;
  sceneIds: string[];
  characterId: string | null;
  chapterId: string | null;
  stars: 1 | 2 | 3;
  activities: number;
  mistakes: number;
  hints: number;
  durationMs: number;
  heartsDelta: number;
  items: { item_id: string; grade: Grade }[];
};

export type FinishResult = { coins: number; tip: number; walkout: boolean; xp: number; total_coins: number; total_xp: number };

// Presença em tempo real: onde a outra pessoa está agora.
// area: em que mapa a pessoa está (versões antigas não mandam: café)
export type Area = 'cafe' | 'house' | 'garden';
export type Position = { x: number; y: number; dir: Direction; area?: Area };
export type RemotePresence = { user_id: string; name: string; appearance: Appearance | null; pos: Position | null };
export type PresenceHandle = { move(p: Position): void; leave(): void };

export interface CoffeeStore {
  userId: string;
  now(): Date;
  // null = ainda não está em nenhum café (mostrar "criar / entrar com código")
  load(): Promise<Snapshot | null>;
  createCafe(displayName: string, pronoun: Pronoun): Promise<void>;
  joinCafe(code: string, displayName: string, pronoun: Pronoun): Promise<void>;
  // `characters`: personagens que podem visitar, os com capítulo disponível primeiro
  spawn(characters: string[]): Promise<void>;
  claim(customerId: string): Promise<boolean>;
  release(customerId: string): Promise<void>;
  spendCoins(cost: number): Promise<number>;
  saveItems(states: VocabState[]): Promise<void>;
  saveArc(arc: ArcState): Promise<void>;
  savePlayer(patch: Partial<Pick<PlayerRow, 'appearance' | 'display_name' | 'pronoun' | 'recent_scenes' | 'last_theme'>>): Promise<void>;
  // conclui o atendimento; clientes recorrentes continuam no café até todos conversarem com eles
  finish(input: FinishInput): Promise<FinishResult>;
  contribute(upgradeId: string, amount: number): Promise<void>;
  // mesa de jogos: começa (ou devolve o de hoje, se já existe), salva o andamento e conclui
  startPuzzle(size: SudokuSize, puzzle: SudokuPuzzle): Promise<PuzzleRow>;
  savePuzzleProgress(id: string, progress: SudokuProgress): Promise<void>;
  finishPuzzle(id: string, input: PuzzleFinish): Promise<PuzzleReward>;
  // caderninho escrito à mão (cada um o seu)
  addCustomItem(input: CustomItemInput): Promise<CustomItem>;
  deleteCustomItem(id: string): Promise<void>;
  // Belmont Sulphur, o senhorio: paga a conta do dia no fim da visita
  landlordPay(input: LandlordPayInput): Promise<LandlordPayResult>;
  // casa: comprar (vai para a mochila), colocar/mover e guardar de volta
  buyHouseItem(itemId: string, variant: number): Promise<{ id: string; total_coins: number }>;
  placeHouseItem(id: string, room: RoomId, x: number, y: number, flip: boolean): Promise<void>;
  storeHouseItem(id: string): Promise<void>;
  // bônus do dia ao acordar (pelo conforto da casa); null = indisponível (migration não aplicada)
  claimMorningBonus(): Promise<MorningBonus | null>;
  // estações de estudo: presentes (PC, telefone, TV, estante), recados e episódio da TV
  houseGifts(): Promise<number>;
  sendNote(body: string, heart: boolean): Promise<DailyReward>;
  readNotes(): Promise<void>;
  tvReward(correct: number, total: number): Promise<DailyReward>;
  // acertou "Where did you put the…?" (+1 🪙, até 5 por dia)
  prepReward(): Promise<DailyReward>;
  // horta: sementes grátis do dia, barraquinha, plantar, regar, colher e canteiro extra
  gardenDaily(): Promise<string[]>;
  buySeed(cropId: string, qty: number): Promise<void>;
  plantSeed(plot: number, cropId: string, itemId: string): Promise<void>;
  waterPlant(plantId: string): Promise<{ changed: boolean; xp: number }>;
  harvestPlant(plantId: string): Promise<HarvestResult>;
  buyPlot(): Promise<void>;
  subscribe(cb: () => void): () => void;
  joinPresence(cafeId: string, self: { name: string; appearance: Appearance | null }, onChange: (others: RemotePresence[]) => void): PresenceHandle;
}

// Regras de chegada (iguais às da função SQL coffee_spawn_arrivals).
export const SPAWN_EVERY_SEC = 90;
export const QUEUE_CAP = 6;
export const CHARACTER_CHANCE = 0.35;
export const CLAIM_TIMEOUT_MIN = 10;

// Melhoria compartilhada da Fase 1.
export const CAT_CORNER = { key: 'cat_corner', cost: 300 };
