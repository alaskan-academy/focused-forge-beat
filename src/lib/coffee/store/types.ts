// Contrato de armazenamento do jogo. Há duas implementações:
//  - LocalStore: tudo no navegador, com relógio ajustável (página de teste /coffee-dev)
//  - SupabaseStore: banco compartilhado entre vocês dois (aba /coffee)
import type { Appearance, Direction } from '../character';
import type { ArcState } from '../arcs';
import type { Grade, VocabState } from '../srs';
import type { Pronoun } from '@/content/coffee/personalize';

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
};

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
export type Position = { x: number; y: number; dir: Direction };
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
  subscribe(cb: () => void): () => void;
  joinPresence(self: { name: string; appearance: Appearance | null }, onChange: (others: RemotePresence[]) => void): PresenceHandle;
}

// Regras de chegada (iguais às da função SQL coffee_spawn_arrivals).
export const SPAWN_EVERY_SEC = 90;
export const QUEUE_CAP = 6;
export const CHARACTER_CHANCE = 0.35;
export const CLAIM_TIMEOUT_MIN = 10;

// Melhoria compartilhada da Fase 1.
export const CAT_CORNER = { key: 'cat_corner', cost: 300 };
