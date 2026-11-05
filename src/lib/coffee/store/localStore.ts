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
    const { me, partner, customers, items, arcs, feed, upgrade, puzzles, custom } = this.data;
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
