// Armazenamento local (navegador) com as mesmas regras do banco, para testar sem Supabase.
// Inclui controles de teste: avançar o relógio, chamar um cliente, dar moedas, zerar, e simular a
// outra pessoa do café (por padrão "Jessica") atendendo os clientes recorrentes.
import { CUSTOMER_SPOTS } from '../map';
import { encounterCoins, xpFor } from '../activities';
import { appearanceFromSeed } from '../character';
import type { ArcState } from '../arcs';
import type { VocabState } from '../srs';
import { PUZZLE_COINS, dayKey, type SudokuProgress, type SudokuPuzzle, type SudokuSize } from '../sudoku';
import { computeBill, landlordXp, settle, type LandlordBill, type LandlordPayInput } from '../landlord';
import { levelFromXp } from '../activities';
import { FURNITURE_BY_ID, minLevelOf } from '@/content/coffee/furniture';
import { canEditRoom, type HouseItem } from '../houseItems';
import type { RoomId } from '../house';
import { COMFORT_TITLES, comfortLevel, houseComfort, type MorningBonus } from '../comfort';
import { BASE_PLOTS, CROPS, CROP_BY_ID, KIND_INFO, MAX_PLOTS, plantNow, plotPrice, waterPlant as waterPlantRule, type Plant } from '../garden';
import {
  CHARACTER_CHANCE,
  CAT_CORNER,
  CLAIM_TIMEOUT_MIN,
  QUEUE_CAP,
  SPAWN_EVERY_SEC,
  type CafeCustomer,
  type CustomItem,
  type CustomItemInput,
  type CoffeeStore,
  type FeedEntry,
  type Note,
  type DailyReward,
  type GardenData,
  type HarvestResult,
  type FinishInput,
  type Partner,
  type PlayerRow,
  type PresenceHandle,
  type PuzzleFinish,
  type PuzzleRow,
  type Snapshot,
  type UpgradeState,
} from './types';

type Data = {
  me: PlayerRow;
  partner: Partner | null;
  customers: (CafeCustomer & { leave_at: string; claimed_at: string | null })[];
  items: Record<string, VocabState>;
  arcs: Record<string, ArcState>;
  feed: FeedEntry[];
  upgrade: UpgradeState;
  puzzles: PuzzleRow[];
  custom: CustomItem[];
  house: HouseItem[];
  bonus_day: string | null; // último dia em que ganhou o bônus ao acordar
  notes: Note[];
  rewards: string[]; // "tipo:dia" das recompensas diárias já ganhas
  garden: { plots: number; seeds: Record<string, number>; pantry: Record<string, number>; seed_day: string | null; partnerPlots: number; plants: Plant[] };
  // Belmont: mesmas regras de coffee_landlord_compute/pay
  landlord: { debt: number; visits: number; last_visit_day: string | null; booked_by_me: boolean | null; earned_since: number; errors_since: number; active_day: string | null };
  last_spawn_at: string;
  clock_offset_ms: number;
};

const KEY = 'coffee-cats:local-v2';
const USER = 'local-player';
const PARTNER: Partner = { user_id: 'local-partner', display_name: 'Jessica', pronoun: 'she', appearance: appearanceFromSeed(2024) };

function fresh(): Data {
  return {
    me: { user_id: USER, display_name: 'Lucas', pronoun: 'he', coins: 30, xp: 0, appearance: null, recent_scenes: [], last_theme: null },
    partner: { ...PARTNER },
    customers: [],
    items: {},
    arcs: {},
    feed: [{ id: 'f0', user_id: USER, kind: 'opened_cafe', data: {}, created_at: new Date().toISOString() }],
    upgrade: { id: 'local-upgrade', key: CAT_CORNER.key, cost: CAT_CORNER.cost, funded: 0, completed_at: null, contributions: {} },
    puzzles: [],
    house: [],
    bonus_day: null,
    notes: [],
    rewards: [],
    garden: { plots: BASE_PLOTS, seeds: {}, pantry: {}, seed_day: null, partnerPlots: BASE_PLOTS, plants: [] },
    landlord: { debt: 0, visits: 0, last_visit_day: null, booked_by_me: null, earned_since: 0, errors_since: 0, active_day: null },
    // uma anotação da "Jessica" de teste, para experimentar o copiar
    custom: [
      { id: 'local-partner-1', user_id: PARTNER.user_id, en: 'break a leg', pt: 'boa sorte (antes de uma apresentação)', example: 'Your interview is today? Break a leg!', source: 'aula de inglês', created_at: new Date().toISOString() },
    ],
    // café novo abre com ~2 clientes esperando
    last_spawn_at: new Date(Date.now() - 2 * SPAWN_EVERY_SEC * 1000).toISOString(),
    clock_offset_ms: 0,
  };
}

let idSeq = 0;
const newId = () => `local-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;

export class LocalStore implements CoffeeStore {
  userId = USER;
  private data: Data;
  private listeners = new Set<() => void>();

  constructor() {
    this.data = this.read() ?? fresh();
  }

  now() {
    return new Date(Date.now() + this.data.clock_offset_ms);
  }

  async load(): Promise<Snapshot> {
    const { me, partner, customers, items, arcs, feed, upgrade, puzzles, custom, house, notes, garden } = this.data;
    const landlord = this.landlordBill();
    return {
      cafe: { id: 'local', name: 'Coffee Cats', invite_code: 'LOCAL1', reputation: 0, members: [USER, ...(partner ? [partner.user_id] : [])] },
      feed: [...feed],
      upgrade: { ...upgrade, contributions: { ...upgrade.contributions } },
      me: { ...me },
      partner: partner ? { ...partner } : null,
      customers: customers.map(({ leave_at, claimed_at, ...c }) => c),
      items: { ...items },
      arcs: { ...arcs },
      puzzles: puzzles.map((p) => ({ ...p })),
      customItems: custom.map((c) => ({ ...c })),
      landlord,
      houseItems: house.map((h) => ({ ...h })),
      notes: notes.map((n) => ({ ...n })),
      garden: { plots: garden.plots, seeds: { ...garden.seeds }, pantry: { ...garden.pantry }, partnerPlots: garden.partnerPlots, plants: garden.plants.map((p) => ({ ...p })) } satisfies GardenData,
    };
  }

  async spawn(characters: string[]) {
    const now = this.now();
    const d = this.data;
    d.customers = d.customers.filter((c) => !(c.status === 'waiting' && new Date(c.leave_at) < now));
    for (const c of d.customers)
      if (c.status === 'serving' && c.claimed_at && now.getTime() - new Date(c.claimed_at).getTime() > CLAIM_TIMEOUT_MIN * 60_000) {
        c.status = 'waiting';
        c.claimed_by = null;
        c.claimed_at = null;
      }
    const active = d.customers.length;
    const elapsed = now.getTime() - new Date(d.last_spawn_at).getTime();
    let n = Math.floor(elapsed / (SPAWN_EVERY_SEC * 1000));
    if (active === 0 && elapsed > 60_000) n = Math.max(n, 2);
    n = Math.min(n, QUEUE_CAP - active);
    if (n <= 0) {
      if (active >= QUEUE_CAP) d.last_spawn_at = now.toISOString();
      this.write(false);
      return;
    }
    for (let i = 0; i < n; i++) this.addCustomer(Math.random() < CHARACTER_CHANCE ? this.pickCharacter(characters) : null);
    d.last_spawn_at = now.toISOString();
    this.write();
  }

  async claim(id: string) {
    const c = this.data.customers.find((x) => x.id === id);
    if (!c || c.served_by.includes(USER) || (c.status === 'serving' && c.claimed_by !== USER)) return false;
    c.status = 'serving';
    c.claimed_by = USER;
    c.claimed_at = this.now().toISOString();
    this.write();
    return true;
  }

  async release(id: string) {
    const c = this.data.customers.find((x) => x.id === id);
    if (c && c.claimed_by === USER) {
      c.status = 'waiting';
      c.claimed_by = null;
      c.claimed_at = null;
      this.write();
    }
  }

  async spendCoins(cost: number) {
    if (this.data.me.coins < cost) throw new Error('not enough coins');
    this.data.me.coins -= cost;
    this.write();
    return this.data.me.coins;
  }

  async saveItems(states: VocabState[]) {
    for (const s of states) this.data.items[s.item_id] = s;
    this.write();
  }

  async saveArc(arc: ArcState) {
    this.data.arcs[arc.character_id] = arc;
    this.write();
  }

  async savePlayer(patch: Partial<PlayerRow>) {
    this.data.me = { ...this.data.me, ...patch };
    this.write();
  }

  async finish(input: FinishInput) {
    const money = encounterCoins(input.activities, input.mistakes);
    const xp = xpFor(input.stars, input.activities);
    const c = this.data.customers.find((x) => x.id === input.customerId);
    if (c) this.markServed(c, USER);
    this.data.me.coins += money.total;
    this.data.me.xp += xp;
    this.trackForLandlord(money.total, input.mistakes);
    this.log(USER, input.chapterId ? 'chapter' : 'served', { stars: input.stars, character: input.characterId, chapter: input.chapterId, walkout: money.walkout });
    this.write();
    return { coins: money.total, tip: money.tip, walkout: money.walkout, xp, total_coins: this.data.me.coins, total_xp: this.data.me.xp };
  }

  async contribute(_upgradeId: string, amount: number) {
    const u = this.data.upgrade;
    if (u.completed_at) throw new Error('upgrade already completed');
    const value = Math.min(amount, u.cost - u.funded);
    if (value <= 0) throw new Error('invalid amount');
    if (this.data.me.coins < value) throw new Error('not enough coins');
    this.data.me.coins -= value;
    u.funded += value;
    u.contributions[USER] = (u.contributions[USER] ?? 0) + value;
    if (u.funded >= u.cost) u.completed_at = this.now().toISOString();
    this.log(USER, u.completed_at ? 'upgrade_done' : 'contributed', { upgrade: u.key, amount: value });
    this.write();
  }

  // ── mesa de jogos (mesmas regras de coffee_start_puzzle / coffee_finish_puzzle) ──

  async startPuzzle(size: SudokuSize, puzzle: SudokuPuzzle): Promise<PuzzleRow> {
    const day = dayKey(this.now());
    let row = this.data.puzzles.find((p) => p.day === day && p.size === size);
    if (!row) {
      row = { id: newId(), day, size, data: puzzle, progress: null, status: 'playing', stars: null };
      this.data.puzzles = [row, ...this.data.puzzles].slice(0, 20);
      this.write(false);
    }
    return { ...row };
  }

  async savePuzzleProgress(id: string, progress: SudokuProgress) {
    const row = this.data.puzzles.find((p) => p.id === id && p.status === 'playing');
    if (!row) return;
    row.progress = progress;
    this.write(false);
  }

  async finishPuzzle(id: string, input: PuzzleFinish) {
    const row = this.data.puzzles.find((p) => p.id === id && p.status === 'playing');
    if (!row) throw new Error('puzzle not found or already finished');
    const coins = PUZZLE_COINS[row.size];
    const xp = input.stars * 5 + Math.min(10, Math.max(1, input.words)) * 5;
    Object.assign(row, { status: 'done', stars: input.stars, progress: input.progress });
    this.data.me.coins += coins;
    this.data.me.xp += xp;
    this.trackForLandlord(coins, input.mistakes);
    this.log(USER, 'puzzle', { size: row.size, stars: input.stars, theme: row.data.theme, mistakes: input.mistakes, hints: input.hints });
    this.write();
    return { coins, xp, total_coins: this.data.me.coins, total_xp: this.data.me.xp };
  }

  // ── Belmont Sulphur (senhorio) ─────────────────────────────────────────────

  private landlordBill(): LandlordBill {
    const l = this.data.landlord;
    const today = dayKey(this.now());
    const first = l.visits === 0;
    const upgrades = this.data.upgrade.completed_at ? 1 : 0;
    const coins = this.data.me.coins;
    const b = computeBill({ first, coins, earned: l.earned_since, errors: l.errors_since, upgrades, debt: l.debt });
    return {
      ready: l.active_day === today && l.last_visit_day !== today,
      first,
      visits: l.visits,
      earned: l.earned_since,
      errors: l.errors_since,
      upgrades,
      rent: b.rent,
      error_fee: b.error_fee,
      debt: l.debt,
      total: b.total,
      coins,
      booked_by_me: l.booked_by_me,
    };
  }

  // o que conta para o aluguel: moedas ganhas, erros e se já jogou hoje
  private trackForLandlord(coins: number, mistakes: number) {
    const l = this.data.landlord;
    l.earned_since += coins;
    l.errors_since += mistakes;
    l.active_day = dayKey(this.now());
  }

  async landlordPay(input: LandlordPayInput) {
    const bill = this.landlordBill();
    if (!bill.ready) throw new Error('landlord is not here today');
    const s = settle(bill, input.discount);
    const xp = landlordXp(input.stars, input.activities);
    const l = this.data.landlord;
    this.data.me.coins -= s.paid;
    this.data.me.xp += xp;
    Object.assign(l, {
      debt: s.debt,
      visits: l.visits + 1,
      last_visit_day: dayKey(this.now()),
      booked_by_me: input.bookedByMe ?? l.booked_by_me,
      earned_since: 0,
      errors_since: 0,
    });
    this.log(USER, 'rent', { paid: s.paid, debt: s.debt, first: bill.first, chapter: input.chapterId });
    this.write();
    return {
      paid: s.paid,
      debt: s.debt,
      discount: s.discount,
      first: bill.first,
      xp,
      rent: bill.rent,
      error_fee: bill.error_fee,
      previous_debt: bill.debt,
      total_coins: this.data.me.coins,
      total_xp: this.data.me.xp,
    };
  }

  // teste: o Belmont aparece agora (como se você já tivesse jogado hoje e ele ainda não tivesse vindo)
  callLandlord() {
    const l = this.data.landlord;
    l.active_day = dayKey(this.now());
    if (l.last_visit_day === l.active_day) l.last_visit_day = null;
    this.write();
  }

  // ── caderninho escrito à mão ──────────────────────────────────────────────

  async addCustomItem(input: CustomItemInput): Promise<CustomItem> {
    const item: CustomItem = { id: newId(), user_id: USER, ...input, created_at: this.now().toISOString() };
    this.data.custom = [item, ...this.data.custom];
    this.write();
    return { ...item };
  }

  async deleteCustomItem(id: string) {
    this.data.custom = this.data.custom.filter((c) => !(c.id === id && c.user_id === USER));
    delete this.data.items['u:' + id];
    this.write();
  }

  // ── casa (mesmas regras de coffee_house_buy/place/store) ───────────────────

  private members() {
    return [USER, ...(this.data.partner ? [this.data.partner.user_id] : [])];
  }

  async buyHouseItem(itemId: string, variant: number) {
    const f = FURNITURE_BY_ID[itemId];
    if (!f) throw new Error('unknown item');
    if (variant < 0 || variant >= f.variants.length) throw new Error('unknown variant');
    if (levelFromXp(this.data.me.xp).level < minLevelOf(f)) throw new Error('level too low');
    if (this.data.me.coins < f.price) throw new Error('not enough coins');
    this.data.me.coins -= f.price;
    const it: HouseItem = { id: newId(), owner_id: USER, item_id: itemId, variant, room: null, x: 0, y: 0, flip: false, created_at: this.now().toISOString() };
    this.data.house.push(it);
    this.log(USER, 'house_buy', { item: itemId, variant, price: f.price });
    this.write();
    return { id: it.id, total_coins: this.data.me.coins };
  }

  async placeHouseItem(id: string, room: RoomId, x: number, y: number, flip: boolean) {
    const it = this.data.house.find((h) => h.id === id);
    if (!it) throw new Error('item not found');
    const shared = (r: RoomId | null) => r === 'living' || r === 'kitchen';
    if (it.owner_id !== USER && (!shared(it.room) || !shared(room))) throw new Error('not your item');
    if (!canEditRoom(room, this.members(), USER)) throw new Error('not your room');
    Object.assign(it, { room, x, y, flip });
    this.write();
  }

  async storeHouseItem(id: string) {
    const it = this.data.house.find((h) => h.id === id);
    if (!it) throw new Error('item not found');
    if (it.owner_id !== USER && !(it.room === 'living' || it.room === 'kitchen')) throw new Error('not your item');
    it.room = null;
    this.write();
  }

  // ── estações de estudo (mesmas regras de coffee_house_gifts / send_note / tv_reward) ──

  async houseGifts() {
    const idx = Math.max(0, this.members().indexOf(USER));
    const room: RoomId = idx === 0 ? 'bedroom0' : 'bedroom1';
    const gifts = [
      { gift: 'pc', item: 'computer', personal: true, room, x: idx === 0 ? 10 : 22, y: 2 },
      { gift: 'phone', item: 'telephone', personal: true, room, x: idx === 0 ? 9 : 21, y: 2 },
      { gift: 'tv', item: 'television', personal: false, room: 'living' as RoomId, x: 3, y: 9 },
      { gift: 'bookshelf', item: 'bookshelf', personal: false, room: 'living' as RoomId, x: 11, y: 9 },
    ];
    let added = 0;
    for (const g of gifts) {
      const has = this.data.house.some((h) => (h as HouseItem & { gift?: string }).gift === g.gift && (!g.personal || h.owner_id === USER));
      if (has) continue;
      const busy = this.data.house.some((h) => {
        const f = FURNITURE_BY_ID[h.item_id];
        return h.room && f?.place === 'floor' && g.x >= h.x && g.x < h.x + f.w && g.y >= h.y && g.y < h.y + f.h;
      });
      const it = { id: newId(), owner_id: USER, item_id: g.item, variant: 0, room: busy ? null : g.room, x: g.x, y: g.y, flip: false, created_at: this.now().toISOString(), gift: g.gift };
      this.data.house.push(it);
      added++;
    }
    if (added) this.write();
    return added;
  }

  private reward(kind: string, coins: number): DailyReward {
    const key = `${kind}:${dayKey(this.now())}`;
    if (this.data.rewards.includes(key)) return { coins: 0, total_coins: this.data.me.coins };
    this.data.rewards.push(key);
    this.data.me.coins += coins;
    return { coins, total_coins: this.data.me.coins };
  }

  async sendNote(body: string, heart: boolean) {
    const p = this.data.partner;
    if (!p) throw new Error('nobody to call');
    const text = body.trim();
    if (!text || text.length > 300) throw new Error('bad note');
    this.data.notes = [{ id: newId(), from_user: USER, to_user: p.user_id, body: text, heart, created_at: this.now().toISOString(), read_at: null }, ...this.data.notes];
    this.log(USER, 'note', { heart });
    const r = this.reward('phone', 5);
    this.write();
    return r;
  }

  async readNotes() {
    const now = this.now().toISOString();
    for (const n of this.data.notes) if (n.to_user === USER && !n.read_at) n.read_at = now;
    this.write();
  }

  async tvReward(correct: number, total: number) {
    const r = this.reward('tv', correct * 2 >= Math.max(1, total) ? 5 : 2);
    this.write();
    return r;
  }

  // ── horta (mesmas regras de coffee_garden_*) ─────────────────────────────

  async gardenDaily() {
    const g = this.data.garden;
    const today = dayKey(this.now());
    if (g.seed_day === today) return [];
    const level = levelFromXp(this.data.me.xp).level;
    const pick = (kinds: string[]) => {
      const list = CROPS.filter((c) => kinds.includes(c.kind));
      return list[Math.floor(Math.random() * list.length)].id;
    };
    const given: string[] = [];
    for (let i = 0; i < 3; i++) {
      const roll = Math.random();
      given.push(i === 2 && level >= 5 && roll < 0.08 ? pick(['golden']) : i === 2 && level >= 3 && roll < 0.4 ? pick(['fruit']) : pick(['herb', 'veg']));
    }
    for (const c of given) g.seeds[c] = (g.seeds[c] ?? 0) + 1;
    g.seed_day = today;
    this.write();
    return given;
  }

  async buySeed(cropId: string, qty: number) {
    const crop = CROP_BY_ID[cropId];
    if (!crop) throw new Error('unknown crop');
    const k = KIND_INFO[crop.kind];
    const n = Math.min(10, Math.max(1, qty));
    if (levelFromXp(this.data.me.xp).level < k.minLevel) throw new Error('level too low');
    if (this.data.me.coins < k.price * n) throw new Error('not enough coins');
    this.data.me.coins -= k.price * n;
    this.data.garden.seeds[cropId] = (this.data.garden.seeds[cropId] ?? 0) + n;
    this.write();
  }

  async plantSeed(plot: number, cropId: string, itemId: string) {
    const g = this.data.garden;
    if (plot < 0 || plot >= g.plots) throw new Error('plot locked');
    if (g.plants.some((p) => p.owner_id === USER && p.plot === plot)) throw new Error('plot busy');
    if ((g.seeds[cropId] ?? 0) < 1) throw new Error('no seeds');
    g.seeds[cropId] -= 1;
    const now = this.now().toISOString();
    g.plants.push({ id: newId(), owner_id: USER, plot, crop_id: cropId, item_id: itemId, stage: 0, stage_started_at: now, watered: false, last_watered_by: null, planted_at: now });
    this.write();
  }

  // guarda o crescimento calculado (como coffee_garden_grow)
  private grow(p: Plant) {
    const v = plantNow(p, this.now());
    if (v.stage !== p.stage) {
      const dur = KIND_INFO[CROP_BY_ID[p.crop_id].kind].stageMinutes * 60_000;
      Object.assign(p, { stage: v.stage, stage_started_at: new Date(v.nextAt ? v.nextAt - dur : this.now().getTime()).toISOString(), watered: false });
    }
  }

  async waterPlant(plantId: string) {
    const p = this.data.garden.plants.find((x) => x.id === plantId);
    if (!p) throw new Error('plant not found');
    this.grow(p);
    if (p.stage >= 3 || p.watered) return { changed: false, xp: 0 };
    Object.assign(p, waterPlantRule(p, this.now()), { last_watered_by: USER });
    const xp = p.owner_id !== USER ? 2 : 0;
    this.data.me.xp += xp;
    this.write();
    return { changed: true, xp };
  }

  async harvestPlant(plantId: string): Promise<HarvestResult> {
    const g = this.data.garden;
    const p = g.plants.find((x) => x.id === plantId);
    if (!p) throw new Error('plant not found');
    if (p.owner_id !== USER) throw new Error('not your plant');
    this.grow(p);
    if (p.stage < 3) throw new Error('not ready');
    const crop = CROP_BY_ID[p.crop_id];
    const coins = KIND_INFO[crop.kind].coins;
    g.plants = g.plants.filter((x) => x.id !== plantId);
    this.data.me.coins += coins;
    g.pantry[crop.id] = (g.pantry[crop.id] ?? 0) + 1;
    if (crop.kind === 'golden') this.log(USER, 'harvest', { crop: crop.id });
    this.write();
    return { coins, total_coins: this.data.me.coins, crop: crop.id, item: p.item_id };
  }

  async buyPlot() {
    const g = this.data.garden;
    if (g.plots >= MAX_PLOTS) throw new Error('max plots');
    const price = plotPrice(g.plots);
    if (this.data.me.coins < price) throw new Error('not enough coins');
    this.data.me.coins -= price;
    g.plots += 1;
    this.write();
  }

  // teste: a outra pessoa planta um tomate (já com sede)
  partnerPlants() {
    const p = this.data.partner;
    if (!p) return;
    const g = this.data.garden;
    const used = new Set(g.plants.filter((x) => x.owner_id === p.user_id).map((x) => x.plot));
    const plot = [0, 1, 2, 3, 4, 5].find((i) => !used.has(i));
    if (plot === undefined) return;
    const now = this.now().toISOString();
    g.plants.push({ id: newId(), owner_id: p.user_id, plot, crop_id: 'tomato', item_id: 'c:on_my_way', stage: 0, stage_started_at: now, watered: false, last_watered_by: null, planted_at: now });
    this.write();
  }

  // teste: avança o relógio em horas (para ver a horta crescer)
  advanceHours(h: number) {
    this.data.clock_offset_ms += h * 3_600_000;
    this.write();
  }

  async prepReward() {
    const day = dayKey(this.now());
    const used = this.data.rewards.filter((r) => r.startsWith('prep') && r.endsWith(day)).length;
    const r = used < 5 ? this.reward(`prep${used + 1}`, 1) : { coins: 0, total_coins: this.data.me.coins };
    this.write();
    return r;
  }

  // teste: a outra pessoa liga para agradecer
  partnerCalls() {
    const p = this.data.partner;
    if (!p) return;
    this.data.notes = [{ id: newId(), from_user: p.user_id, to_user: USER, body: 'Thank you for making me coffee every morning. You made my day!', heart: true, created_at: this.now().toISOString(), read_at: null }, ...this.data.notes];
    this.log(p.user_id, 'note', { heart: true });
    this.write();
  }

  async claimMorningBonus(): Promise<MorningBonus> {
    const comfort = houseComfort(this.data.house);
    const level = comfortLevel(comfort);
    const today = dayKey(this.now());
    if (this.data.bonus_day === today) return { claimed: false, coins: 0, comfort, level, total_coins: this.data.me.coins };
    const coins = COMFORT_TITLES[level].bonus;
    this.data.me.coins += coins;
    this.data.bonus_day = today;
    this.write();
    return { claimed: true, coins, comfort, level, total_coins: this.data.me.coins };
  }

  // teste: a outra pessoa compra e põe uma planta na sala
  partnerDecorates() {
    const p = this.data.partner;
    if (!p) return;
    this.data.house.push({ id: newId(), owner_id: p.user_id, item_id: 'potted_plant', variant: 1, room: 'living', x: 10, y: 9, flip: false, created_at: this.now().toISOString() });
    this.log(p.user_id, 'house_buy', { item: 'potted_plant', variant: 1, price: 12 });
    this.write();
  }

  // café local já existe; criar/entrar não se aplicam
  async createCafe() {}
  async joinCafe() {}

  // no modo local a outra pessoa nunca está online (fica parada no cantinho dela)
  joinPresence(): PresenceHandle {
    return { move() {}, leave() {} };
  }

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  // ── Controles de teste ────────────────────────────────────────────────────

  // A outra pessoa conversa com todos os recorrentes que estão esperando por ela.
  partnerServesAll() {
    const p = this.data.partner;
    if (!p) return;
    for (const c of [...this.data.customers]) if (c.character_id && !c.served_by.includes(p.user_id) && c.status === 'waiting') this.markServed(c, p.user_id);
    this.log(p.user_id, 'served', { stars: 3, character: null, chapter: null, walkout: false });
    this.write();
  }

  hasPartner() {
    return !!this.data.partner;
  }

  // Liga/desliga a outra pessoa (para testar o café com uma pessoa só).
  togglePartner() {
    this.data.partner = this.data.partner ? null : { ...PARTNER };
    this.write();
  }

  advanceDays(days: number) {
    this.data.clock_offset_ms += days * 86_400_000;
    // o relógio de chegada acompanha, para não despejar a fila inteira de uma vez
    this.data.last_spawn_at = this.now().toISOString();
    this.write();
  }

  clockOffsetDays() {
    return Math.round(this.data.clock_offset_ms / 86_400_000);
  }

  callCustomer(characterId: string | null) {
    if (characterId) this.data.customers = this.data.customers.filter((c) => c.character_id !== characterId);
    if (this.data.customers.length >= CUSTOMER_SPOTS.length) this.data.customers.shift();
    this.addCustomer(characterId);
    this.write();
  }

  // apaga os puzzles (para testar um "dia novo" na mesa de jogos)
  resetPuzzles() {
    this.data.puzzles = [];
    this.write();
  }

  addXp(n: number) {
    this.data.me.xp += n;
    this.write();
  }

  addCoins(n: number) {
    this.data.me.coins += n;
    this.write();
  }

  reset() {
    const appearance = this.data.me.appearance;
    this.data = fresh();
    this.data.me.appearance = appearance;
    this.write();
  }

  // ── interno ───────────────────────────────────────────────────────────────

  private log(userId: string, kind: string, data: Record<string, unknown>) {
    this.data.feed = [{ id: newId(), user_id: userId, kind, data, created_at: this.now().toISOString() }, ...this.data.feed].slice(0, 40);
  }

  // Registra quem conversou. Recorrente fica no café até todos os membros conversarem; avulso sai.
  private markServed(c: Data['customers'][number], userId: string) {
    if (!c.served_by.includes(userId)) c.served_by.push(userId);
    const members = [USER, ...(this.data.partner ? [this.data.partner.user_id] : [])];
    const done = !c.character_id || members.every((m) => c.served_by.includes(m));
    if (done) this.data.customers = this.data.customers.filter((x) => x.id !== c.id);
    else {
      c.status = 'waiting';
      c.claimed_by = null;
      c.claimed_at = null;
    }
  }

  private pickCharacter(candidates: string[]): string | null {
    const present = new Set(this.data.customers.map((c) => c.character_id));
    return candidates.find((c) => !present.has(c)) ?? null;
  }

  private addCustomer(characterId: string | null) {
    const used = new Set(this.data.customers.map((c) => c.spot));
    const free = CUSTOMER_SPOTS.filter((s) => !used.has(s.id));
    const spot = free[Math.floor(Math.random() * free.length)];
    if (!spot) return;
    const now = this.now();
    this.data.customers.push({
      id: newId(),
      spot: spot.id,
      seed: Math.floor(Math.random() * 2 ** 31),
      character_id: characterId,
      status: 'waiting',
      claimed_by: null,
      claimed_at: null,
      served_by: [],
      arrived_at: now.toISOString(),
      leave_at: new Date(now.getTime() + (6 + Math.random() * 2) * 3_600_000).toISOString(),
    });
  }

  private read(): Data | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const d = { ...fresh(), ...JSON.parse(raw) } as Data;
      // dados salvos por versões anteriores
      const f = fresh();
      d.me = { ...f.me, ...d.me };
      if (d.partner) d.partner = { ...PARTNER, ...d.partner, appearance: d.partner.appearance ?? PARTNER.appearance };
      d.customers = d.customers.map((c) => ({ ...c, served_by: c.served_by ?? [] }));
      d.puzzles = d.puzzles ?? [];
      d.custom = d.custom ?? fresh().custom;
      d.house = d.house ?? [];
      d.bonus_day = d.bonus_day ?? null;
      d.notes = d.notes ?? [];
      d.rewards = d.rewards ?? [];
      d.garden = { ...fresh().garden, ...(d.garden ?? {}) };
      d.landlord = { ...fresh().landlord, ...(d.landlord ?? {}) };
      return d;
    } catch {
      return null;
    }
  }

  private write(notify = true) {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* sem armazenamento: fica só na memória */
    }
    if (notify) this.listeners.forEach((l) => l());
  }
}
