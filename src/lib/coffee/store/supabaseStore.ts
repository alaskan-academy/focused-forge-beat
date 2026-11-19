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
import type { RoomId } from '../house';
import type { MorningBonus } from '../comfort';
import type { AlbumRow, CastResult, CatchResult, FishingData } from '../fishing';
import type { MucegoData } from '../mucego';
import type { GardenItem } from '../gardenItems';
import type {
  CafeCustomer,
  CustomItem,
  CustomItemInput,
  CoffeeStore,
  FeedEntry,
  FinishInput,
  FinishResult,
  HouseItem,
  Note,
  DailyReward,
  GardenData,
  HarvestResult,
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
    const [cafe, members, players, customers, items, arcs, feed, upgrades, puzzles, custom, landlord, house, notes, gardens, plants, fishState, album, mucego, gardenItems] = await Promise.all([
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
      db.from('coffee_house_items').select('id, owner_id, item_id, variant, room, x, y, flip, created_at').eq('cafe_id', cid).order('created_at'),
      db.from('coffee_notes').select('id, from_user, to_user, body, heart, created_at, read_at').eq('cafe_id', cid).order('created_at', { ascending: false }).limit(40),
      db.from('coffee_garden').select('user_id, plots, seeds, pantry').eq('cafe_id', cid),
      db.from('coffee_garden_plants').select('id, owner_id, plot, crop_id, item_id, stage, stage_started_at, watered, last_watered_by, planted_at').eq('cafe_id', cid),
      db.rpc('coffee_fishing_state'),
      db.from('coffee_fish_album').select('fish_id, first_by, first_at, counts').eq('cafe_id', cid),
      db.rpc('coffee_mucego_state'),
      db.from('coffee_garden_items').select('id, owner_id, item_id, placed, x, y, flip, created_at').eq('cafe_id', cid).order('created_at'),
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
      // sem a tabela (migration não aplicada) a casa fica só com os móveis de fábrica
      houseItems: house.error ? [] : ((house.data as unknown as HouseItem[]) ?? []),
      notes: notes.error ? [] : ((notes.data as unknown as Note[]) ?? []),
      garden: (() => {
        const rows = gardens.error ? [] : ((gardens.data as Row[]) ?? []);
        const mine = rows.find((r) => r.user_id === this.userId);
        const theirs = rows.find((r) => r.user_id !== this.userId);
        return {
          plots: (mine?.plots as number) ?? 6,
          seeds: (mine?.seeds as Record<string, number>) ?? {},
          pantry: (mine?.pantry as Record<string, number>) ?? {},
          partnerPlots: (theirs?.plots as number) ?? 6,
          plants: plants.error ? [] : ((plants.data as unknown as GardenData['plants']) ?? []),
        } satisfies GardenData;
      })(),
      // sem a migration da pescaria: 0 lançamentos (o lago só não funciona)
      fishing: {
        ...((fishState.error ? { free_left: 0, bait: 0, lucky: 0, fed_today: true } : fishState.data) as Omit<FishingData, 'album'>),
        album: album.error ? [] : ((album.data as unknown as AlbumRow[]) ?? []),
      },
      // sem a migration da Mucego: estado vazio (ela só passeia)
      mucego: mucego.error
        ? { friendship: 0, accessory: null, accessories: [], request_done: true, last_pet_at: null, feeds_today: 5, treats: {}, gift_ready: false }
        : (mucego.data as MucegoData),
      gardenItems: gardenItems.error ? [] : ((gardenItems.data as unknown as GardenItem[]) ?? []),
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

  // ── casa ──────────────────────────────────────────────────────────────────

  async buyHouseItem(itemId: string, variant: number) {
    const res = check(await db.rpc('coffee_house_buy', { p_item: itemId, p_variant: variant })) as { id: string; total_coins: number };
    this.notify();
    return res;
  }

  async placeHouseItem(id: string, room: RoomId, x: number, y: number, flip: boolean) {
    check(await db.rpc('coffee_house_place', { p_id: id, p_room: room, p_x: x, p_y: y, p_flip: flip }));
    this.notify();
  }

  async storeHouseItem(id: string) {
    check(await db.rpc('coffee_house_store', { p_id: id }));
    this.notify();
  }

  async houseGifts() {
    const res = await db.rpc('coffee_house_gifts');
    if (res.error) return 0;
    const n = (res.data as number) ?? 0;
    if (n > 0) this.notify();
    return n;
  }

  async sendNote(body: string, heart: boolean) {
    const res = check(await db.rpc('coffee_send_note', { p_body: body, p_heart: heart })) as DailyReward;
    this.notify();
    return res;
  }

  async readNotes() {
    check(await db.rpc('coffee_read_notes'));
    this.notify();
  }

  async tvReward(correct: number, total: number) {
    const res = check(await db.rpc('coffee_tv_reward', { p_correct: correct, p_total: total })) as DailyReward;
    this.notify();
    return res;
  }

  // ── horta ─────────────────────────────────────────────────────────────────

  async gardenDaily() {
    const res = await db.rpc('coffee_garden_daily');
    if (res.error) return [];
    const given = ((res.data as { given: string[] }).given ?? []) as string[];
    if (given.length) this.notify();
    return given;
  }

  async buySeed(cropId: string, qty: number) {
    check(await db.rpc('coffee_garden_buy_seed', { p_crop: cropId, p_qty: qty }));
    this.notify();
  }

  async plantSeed(plot: number, cropId: string, itemId: string) {
    check(await db.rpc('coffee_garden_plant', { p_plot: plot, p_crop: cropId, p_item: itemId }));
    this.notify();
  }

  async waterPlant(plantId: string) {
    const res = check(await db.rpc('coffee_garden_water', { p_plant: plantId })) as { changed: boolean; xp: number };
    this.notify();
    return res;
  }

  async harvestPlant(plantId: string) {
    const res = check(await db.rpc('coffee_garden_harvest', { p_plant: plantId })) as HarvestResult;
    this.notify();
    return res;
  }

  async buyPlot() {
    check(await db.rpc('coffee_garden_buy_plot'));
    this.notify();
  }

  // ── pescaria ──────────────────────────────────────────────────────────────

  async fishCast(together: boolean) {
    return check(await db.rpc('coffee_fish_cast', { p_together: together })) as CastResult;
  }

  async fishCatch(castId: string, success: boolean) {
    const res = check(await db.rpc('coffee_fish_catch', { p_cast: castId, p_success: success })) as CatchResult;
    this.notify();
    return res;
  }

  async buyBait(qty: number) {
    check(await db.rpc('coffee_fish_buy_bait', { p_qty: qty }));
    this.notify();
  }

  async baitFromPantry(cropId: string) {
    const res = check(await db.rpc('coffee_fish_bait_from_pantry', { p_crop: cropId })) as { bait: number; lucky: number };
    this.notify();
    return res;
  }

  async feedMucego() {
    const res = check(await db.rpc('coffee_fish_feed_mucego')) as { xp: number };
    this.notify();
    return res.xp;
  }

  // ── Mucego Frutífero e lojinha do jardim ──────────────────────────────────

  async mucegoPet() {
    const r = check(await db.rpc('coffee_mucego_pet')) as { ok: boolean; friendship: number };
    this.notify();
    return r;
  }

  async mucegoFeed(cropId: string) {
    const r = check(await db.rpc('coffee_mucego_feed', { p_crop: cropId })) as { friendship: number; gain: number; request: boolean; coins: number };
    this.notify();
    return r;
  }

  async mucegoTreat(treatId: string) {
    const r = check(await db.rpc('coffee_mucego_treat', { p_treat: treatId })) as { friendship: number; gain: number };
    this.notify();
    return r;
  }

  async mucegoGift() {
    const r = check(await db.rpc('coffee_mucego_gift')) as { crop: string };
    this.notify();
    return r;
  }

  async mucegoWear(accessory: string | null) {
    check(await db.rpc('coffee_mucego_wear', { p_accessory: accessory }));
    this.notify();
  }

  async gardenBuy(itemId: string) {
    check(await db.rpc('coffee_garden_buy', { p_item: itemId }));
    this.notify();
  }

  async gardenItemPlace(id: string, x: number, y: number, flip: boolean) {
    check(await db.rpc('coffee_garden_item_place', { p_id: id, p_x: x, p_y: y, p_flip: flip }));
    this.notify();
  }

  async gardenItemStore(id: string) {
    check(await db.rpc('coffee_garden_item_store', { p_id: id }));
    this.notify();
  }

  async prepReward() {
    const res = check(await db.rpc('coffee_prep_reward')) as DailyReward;
    if (res.coins) this.notify();
    return res;
  }

  async claimMorningBonus(): Promise<MorningBonus | null> {
    const res = await db.rpc('coffee_house_morning');
    if (res.error) return null;
    const b = res.data as MorningBonus;
    if (b.claimed) this.notify();
    return b;
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
    for (const table of ['coffee_customers', 'coffee_activity', 'coffee_upgrades', 'coffee_players', 'coffee_house_items', 'coffee_notes', 'coffee_garden', 'coffee_garden_plants', 'coffee_fish_album', 'coffee_mucego', 'coffee_garden_items'])
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
        positions.set(p.user_id, { x: p.x, y: p.y, dir: p.dir, area: p.area ?? 'cafe' });
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
