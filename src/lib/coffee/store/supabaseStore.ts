// Armazenamento no Supabase (projeto "To-do"): o café compartilhado entre vocês dois.
// Regras de moedas, clientes e melhorias rodam nas funções SQL (migration add_coffee_cats);
// aqui só chamamos essas funções e lemos as tabelas (protegidas por RLS).
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { externalSupabase } from '@/integrations/supabase/externalClient';
import { normalizeAppearance, type Appearance } from '../character';
import type { ArcState } from '../arcs';
import type { VocabState } from '../srs';
import type { Pronoun } from '@/content/coffee/personalize';
import { dayKey, type SudokuProgress, type SudokuPuzzle, type SudokuSize } from '../sudoku';
import type { LandlordBill, LandlordPayInput, LandlordPayResult } from '../landlord';
import type {
  CafeCustomer,
  CustomItem,
  CustomItemInput,
  CoffeeStore,
  FeedEntry,
  FinishInput,
  FinishResult,
  PlayerRow,
  Position,
  PresenceHandle,
  PuzzleFinish,
  PuzzleReward,
  PuzzleRow,
  RemotePresence,
  Snapshot,
  UpgradeState,
} from './types';

// Mesmo cliente (e mesma sessão) do app; sem tipos gerados para as tabelas do jogo.
const db = externalSupabase as unknown as SupabaseClient;

type Row = Record<string, unknown>;

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const toPlayer = (r: Row): PlayerRow => ({
  user_id: r.user_id as string,
  display_name: (r.display_name as string) ?? 'Barista',
  pronoun: r.pronoun === 'he' ? 'he' : 'she',
  coins: (r.coins as number) ?? 0,
  xp: (r.xp as number) ?? 0,
  appearance: r.appearance ? normalizeAppearance(r.appearance) : null,
  recent_scenes: (r.recent_scenes as string[]) ?? [],
  last_theme: (r.last_theme as string | null) ?? null,
});

const toPuzzle = (r: Row): PuzzleRow => ({
  id: r.id as string,
  day: r.day as string,
  size: r.size as SudokuSize,
  data: r.data as SudokuPuzzle,
  // progresso vazio ({}) vira null: o app cria um novo ao começar
  progress: r.progress && (r.progress as SudokuProgress).filled ? (r.progress as SudokuProgress) : null,
  status: r.status === 'done' ? 'done' : 'playing',
  stars: (r.stars as number | null) ?? null,
});

export class SupabaseStore implements CoffeeStore {
  private cafeId: string | null = null;
  private listeners = new Set<() => void>();
  private dbChannel: RealtimeChannel | null = null;
  private notifyTimer: number | null = null;

  constructor(public userId: string) {}

  now() {
    return new Date();
  }

  async load(): Promise<Snapshot | null> {
    const member = check(await db.from('coffee_members').select('cafe_id').eq('user_id', this.userId).maybeSingle()) as Row | null;
    if (!member) {
      this.cafeId = null;
      return null;
    }
    const cid = member.cafe_id as string;
    if (this.cafeId !== cid) {
      this.cafeId = cid;
      this.openDbChannel();
    }

    const yesterday = dayKey(new Date(Date.now() - 86_400_000));
    const [cafe, members, players, customers, items, arcs, feed, upgrades, puzzles, custom, landlord] = await Promise.all([
      db.from('coffee_cafes').select('id, name, invite_code, reputation').eq('id', cid).single(),
      db.from('coffee_members').select('user_id, joined_at').eq('cafe_id', cid).order('joined_at'),
      db.from('coffee_players').select('*').eq('cafe_id', cid),
      db
        .from('coffee_customers')
        .select('id, spot, seed, character_id, status, claimed_by, served_by, arrived_at')
        .eq('cafe_id', cid)
        .in('status', ['waiting', 'serving']),
      db.from('coffee_player_items').select('*').eq('user_id', this.userId),
      db.from('coffee_player_arcs').select('*').eq('user_id', this.userId),
      db.from('coffee_activity').select('id, user_id, kind, data, created_at').eq('cafe_id', cid).order('created_at', { ascending: false }).limit(30),
      db.from('coffee_upgrades').select('id, key, cost, funded, completed_at, coffee_upgrade_contributions(user_id, amount)').eq('cafe_id', cid),
      db.from('coffee_puzzles').select('id, day, size, data, progress, status, stars').eq('user_id', this.userId).gte('day', yesterday),
      db.from('coffee_custom_items').select('id, user_id, en, pt, example, source, created_at').eq('cafe_id', cid).order('created_at', { ascending: false }),
      db.rpc('coffee_landlord_bill'),
    ]);

    const cafeRow = check(cafe) as Row;
    const playerRows = (check(players) as Row[]) ?? [];
    const meRow = playerRows.find((p) => p.user_id === this.userId);
    if (!meRow) throw new Error('Jogador não encontrado neste café.');
    const partnerRow = playerRows.find((p) => p.user_id !== this.userId);

    const upgradeRow = ((check(upgrades) as Row[]) ?? []).find((u) => u.key === 'cat_corner');
    const upgrade: UpgradeState | null = upgradeRow
      ? {
          id: upgradeRow.id as string,
          key: upgradeRow.key as string,
          cost: upgradeRow.cost as number,
          funded: upgradeRow.funded as number,
          completed_at: (upgradeRow.completed_at as string | null) ?? null,
          contributions: ((upgradeRow.coffee_upgrade_contributions as Row[]) ?? []).reduce<Record<string, number>>((acc, c) => {
            acc[c.user_id as string] = (acc[c.user_id as string] ?? 0) + (c.amount as number);
            return acc;
          }, {}),
        }
      : null;

    return {
      cafe: {
        id: cafeRow.id as string,
        name: cafeRow.name as string,
        invite_code: cafeRow.invite_code as string,
        reputation: cafeRow.reputation as number,
        members: ((check(members) as Row[]) ?? []).map((m) => m.user_id as string),
      },
      me: toPlayer(meRow),
      partner: partnerRow
        ? (() => {
            const p = toPlayer(partnerRow);
            return { user_id: p.user_id, display_name: p.display_name, pronoun: p.pronoun, appearance: p.appearance };
          })()
        : null,
      customers: ((check(customers) as Row[]) ?? []).map(
        (c): CafeCustomer => ({
          id: c.id as string,
          spot: c.spot as string,
          seed: c.seed as number,
          character_id: (c.character_id as string | null) ?? null,
          status: c.status as 'waiting' | 'serving',
          claimed_by: (c.claimed_by as string | null) ?? null,
          served_by: (c.served_by as string[]) ?? [],
          arrived_at: c.arrived_at as string,
        }),
      ),
      items: Object.fromEntries(((check(items) as Row[]) ?? []).map((r) => [r.item_id as string, r as unknown as VocabState])),
      arcs: Object.fromEntries(
        ((check(arcs) as Row[]) ?? []).map((r) => [
          r.character_id as string,
          {
            character_id: r.character_id as string,
            done: (r.done as string[]) ?? [],
            last_chapter_at: (r.last_chapter_at as string | null) ?? null,
            hearts: (r.hearts as number) ?? 0,
            unlocks: (r.unlocks as string[]) ?? [],
          } satisfies ArcState,
        ]),
      ),
      feed: ((check(feed) as Row[]) ?? []).map((f) => f as unknown as FeedEntry),
      upgrade,
      // sem a tabela (migration ainda não aplicada) a mesa só fica vazia; o resto do café funciona
      puzzles: puzzles.error ? [] : ((puzzles.data as Row[]) ?? []).map(toPuzzle),
      customItems: custom.error ? [] : ((custom.data as unknown as CustomItem[]) ?? []),
      // sem a função no banco (migration não aplicada) o Belmont simplesmente não aparece
      landlord: landlord.error ? null : ((landlord.data as LandlordBill | null) ?? null),
    };
  }

  async createCafe(displayName: string, pronoun: Pronoun) {
    check(await db.rpc('coffee_create_cafe', { p_display_name: displayName }));
    await this.savePlayer({ pronoun });
  }

  async joinCafe(code: string, displayName: string, pronoun: Pronoun) {
    check(await db.rpc('coffee_join_cafe', { p_code: code, p_display_name: displayName }));
    await this.savePlayer({ pronoun });
  }

  async spawn(characters: string[]) {
    if (!this.cafeId) return;
    check(await db.rpc('coffee_spawn_arrivals', { p_cafe: this.cafeId, p_characters: characters }));
  }

  async claim(customerId: string) {
    return Boolean(check(await db.rpc('coffee_claim_customer', { p_customer: customerId })));
  }

  async release(customerId: string) {
    check(await db.rpc('coffee_release_customer', { p_customer: customerId }));
  }

  async spendCoins(cost: number) {
    return check(await db.rpc('coffee_spend_hint', { p_cost: cost })) as number;
  }

  async saveItems(states: VocabState[]) {
    if (!states.length) return;
    check(await db.from('coffee_player_items').upsert(states.map((s) => ({ ...s, user_id: this.userId })), { onConflict: 'user_id,item_id' }));
  }

  async saveArc(arc: ArcState) {
    check(await db.from('coffee_player_arcs').upsert({ ...arc, user_id: this.userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id,character_id' }));
  }

  async savePlayer(patch: Partial<Pick<PlayerRow, 'appearance' | 'display_name' | 'pronoun' | 'recent_scenes' | 'last_theme'>>) {
    check(await db.from('coffee_players').update({ ...patch, updated_at: new Date().toISOString() }).eq('user_id', this.userId));
    this.notify();
  }

  async finish(input: FinishInput): Promise<FinishResult> {
    const res = check(
      await db.rpc('coffee_finish_encounter', {
        p_customer: input.customerId,
        p_scene_ids: input.sceneIds,
        p_character: input.characterId,
        p_chapter: input.chapterId,
        p_stars: input.stars,
        p_activities: input.activities,
        p_mistakes: input.mistakes,
        p_hints: input.hints,
        p_duration_ms: Math.round(input.durationMs),
        p_hearts_delta: input.heartsDelta,
        p_items: input.items,
      }),
    ) as FinishResult;
    return res;
  }

  async contribute(upgradeId: string, amount: number) {
    check(await db.rpc('coffee_contribute', { p_upgrade: upgradeId, p_amount: amount }));
  }

  // ── mesa de jogos ─────────────────────────────────────────────────────────

  async startPuzzle(size: SudokuSize, puzzle: SudokuPuzzle): Promise<PuzzleRow> {
    return toPuzzle(check(await db.rpc('coffee_start_puzzle', { p_size: size, p_theme: puzzle.theme, p_data: puzzle })) as Row);
  }

  async savePuzzleProgress(id: string, progress: SudokuProgress) {
    check(await db.from('coffee_puzzles').update({ progress: progress, updated_at: new Date().toISOString() }).eq('id', id));
  }

  async finishPuzzle(id: string, input: PuzzleFinish): Promise<PuzzleReward> {
    return check(
      await db.rpc('coffee_finish_puzzle', {
        p_puzzle: id,
        p_stars: input.stars,
        p_mistakes: input.mistakes,
        p_hints: input.hints,
        p_words: input.words,
        p_progress: input.progress,
      }),
    ) as PuzzleReward;
  }

  // ── caderninho escrito à mão ──────────────────────────────────────────────

  async addCustomItem(input: CustomItemInput): Promise<CustomItem> {
    if (!this.cafeId) throw new Error('Sem café');
    return check(
      await db
        .from('coffee_custom_items')
        .insert({ cafe_id: this.cafeId, user_id: this.userId, ...input })
        .select('id, user_id, en, pt, example, source, created_at')
        .single(),
    ) as CustomItem;
  }

  async deleteCustomItem(id: string) {
    check(await db.from('coffee_custom_items').delete().eq('id', id).eq('user_id', this.userId));
    check(await db.from('coffee_player_items').delete().eq('user_id', this.userId).eq('item_id', 'u:' + id));
  }

  async landlordPay(input: LandlordPayInput): Promise<LandlordPayResult> {
    return check(
      await db.rpc('coffee_landlord_pay', {
        p_stars: input.stars,
        p_activities: input.activities,
        p_mistakes: input.mistakes,
        p_discount: input.discount,
        p_booked_by_me: input.bookedByMe,
        p_chapter: input.chapterId,
      }),
    ) as LandlordPayResult;
  }

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  // Tempo real: clientes, mural, melhoria e jogadores mudando enquanto a outra pessoa joga.
  private openDbChannel() {
    if (this.dbChannel) db.removeChannel(this.dbChannel);
    const cid = this.cafeId!;
    let ch = db.channel(`coffee-db-${cid}`);
    for (const table of ['coffee_customers', 'coffee_activity', 'coffee_upgrades', 'coffee_players'])
      ch = ch.on('postgres_changes', { event: '*', schema: 'public', table, filter: `cafe_id=eq.${cid}` }, () => this.notify());
    this.dbChannel = ch.subscribe();
  }

  private notify() {
    if (this.notifyTimer) window.clearTimeout(this.notifyTimer);
    this.notifyTimer = window.setTimeout(() => this.listeners.forEach((l) => l()), 250);
  }

  // Presença: quem está online agora e onde está o personagem de cada um.
  // Recebe o id do café de quem chama (não depende de load() já ter rodado nesta instância).
  joinPresence(cafeId: string, self: { name: string; appearance: Appearance | null }, onChange: (others: RemotePresence[]) => void): PresenceHandle {
    const positions = new Map<string, Position>();
    let last: Position | null = null;
    const channel = db.channel(`coffee-presence-${cafeId}`,{ config: { presence: { key: this.userId }, broadcast: { self: false } } });

    const emit = () => {
      const state = channel.presenceState<{ user_id: string; name: string; appearance: Appearance | null }>();
      const others: RemotePresence[] = Object.entries(state)
        .filter(([key]) => key !== this.userId)
        .map(([key, metas]) => {
          const m = metas[0];
          return { user_id: key, name: m?.name ?? '', appearance: m?.appearance ? normalizeAppearance(m.appearance) : null, pos: positions.get(key) ?? null };
        });
      onChange(others);
    };

    channel
      .on('presence', { event: 'sync' }, emit)
      // quem acabou de entrar recebe a minha posição atual
      .on('presence', { event: 'join' }, () => {
        if (last) channel.send({ type: 'broadcast', event: 'pos', payload: { ...last, user_id: this.userId } });
      })
      .on('broadcast', { event: 'pos' }, ({ payload }) => {
        const p = payload as Position & { user_id: string };
        positions.set(p.user_id, { x: p.x, y: p.y, dir: p.dir });
        emit();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track({ user_id: this.userId, name: self.name, appearance: self.appearance });
      });

    return {
      move: (p) => {
        last = p;
        channel.send({ type: 'broadcast', event: 'pos', payload: { ...p, user_id: this.userId } });
      },
      leave: () => {
        channel.untrack();
        db.removeChannel(channel);
      },
    };
  }
}
