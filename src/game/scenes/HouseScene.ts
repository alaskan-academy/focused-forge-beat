import Phaser from 'phaser';
import type { Direction } from '@/lib/coffee/character';
import { TILE } from '@/lib/coffee/map';
import { pathIn, type Point } from '@/lib/coffee/grid';
import { BEDROOM_DOORS, CAFE_DOOR, FROM_CAFE, HOUSE_MAP, HOUSE_WINDOWS_X, SLEEP_SPOT, WAKE_UP } from '@/lib/coffee/house';
import { FURNITURE_BY_ID, type Furniture, type Station } from '@/content/coffee/furniture';
import { ICON_SIZE, buildIconCanvas } from '../art/icons';
import { buildHouseLayers, buildTilesetCanvas } from '../art/tiles';
import { drawFurniture } from '../art/furniture';
import kenneyIndoorUrl from '../art/kenney/roguelike-indoor.png';
import type { DecorView, GameBridge, GameState, SceneHouseItem, SceneOther } from '../bridge';
import { Walker, tileToFeet } from '../entities/Walker';
import { Ambience } from '../effects/Ambience';
import { fitCamera, layoutCamera } from './camera';

type OtherView = { data: SceneOther; walker: Walker; tag: Phaser.GameObjects.Text };
type ItemView = { data: SceneHouseItem; img: Phaser.GameObjects.Image; badge: Phaser.GameObjects.Image | null };

// De onde o jogador chega: acordando no quarto (começo do dia) ou vindo do café.
export type HouseSpawn = 'wake' | 'cafe';

// profundidade: tapete logo acima do chão, parede atrás de tudo, móveis de chão pela linha de baixo
function depthOf(f: Furniture, y: number) {
  if (f.place === 'rug') return 1.5;
  if (f.place === 'wall') return 3;
  return 100 + (y + f.h) * TILE - 4;
}

// A casa de vocês: dois quartos, sala e cozinha. Pisar na porta da sala leva de volta ao café.
export class HouseScene extends Phaser.Scene {
  private bridge!: GameBridge;
  private spawn: HouseSpawn = 'wake';
  private player!: Walker;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private offState?: () => void;
  private others = new Map<string, OtherView>();
  private items = new Map<string, ItemView>();
  private plates: Phaser.GameObjects.Text[] = [];
  private ghost!: Phaser.GameObjects.Image;
  private marks!: Phaser.GameObjects.Graphics;
  private prompt!: Phaser.GameObjects.Image;
  private lastSent = { x: 0, y: 0, dir: 'up' as Direction, t: 0 };
  private leaving = false;

  constructor() {
    super('house');
  }

  init(data: { bridge: GameBridge; spawn?: HouseSpawn }) {
    this.bridge = data.bridge;
    this.spawn = data.spawn ?? 'wake';
    this.leaving = false;
    this.others = new Map();
    this.items = new Map();
  }

  preload() {
    if (!this.textures.exists('kenney-indoor')) this.load.image('kenney-indoor', kenneyIndoorUrl);
  }

  create() {
    if (!this.textures.exists('cafe-tiles')) this.textures.addCanvas('cafe-tiles', buildTilesetCanvas());
    Object.keys(ICON_SIZE).forEach((name) => {
      if (!this.textures.exists(`icon:${name}`)) this.textures.addCanvas(`icon:${name}`, buildIconCanvas(name));
    });

    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: HOUSE_MAP.w, height: HOUSE_MAP.h });
    const tileset = map.addTilesetImage('cafe', 'cafe-tiles', TILE, TILE, 0, 0)!;
    const kenney = map.addTilesetImage('kenney', 'kenney-indoor', TILE, TILE, 0, 1)!;
    const { ground, furniture, objects } = buildHouseLayers();
    const g = map.createBlankLayer('ground', tileset)!.setDepth(0);
    const fu = map.createBlankLayer('furniture', kenney)!.setDepth(1);
    const o = map.createBlankLayer('objects', tileset)!.setDepth(1);
    for (let y = 0; y < HOUSE_MAP.h; y++)
      for (let x = 0; x < HOUSE_MAP.w; x++) {
        g.putTileAt(ground[y][x], x, y);
        if (furniture[y][x] >= 0) fu.putTileAt(furniture[y][x], x, y);
        if (objects[y][x] >= 0) o.putTileAt(objects[y][x], x, y);
      }

    const myRoom = this.bridge.state.house.myRoom;
    const start = this.spawn === 'cafe' ? FROM_CAFE : WAKE_UP[myRoom];
    this.player = new Walker(this, this.bridge.state.appearance, start, 72, HOUSE_MAP);
    this.player.face(this.spawn === 'cafe' ? 'right' : 'down');

    // plaquinha com o nome na porta de cada quarto
    this.plates = BEDROOM_DOORS.map((d) =>
      this.add
        .text(d.x * TILE + TILE / 2, d.y * TILE + 3, '', { fontFamily: '"Pixelify Sans", monospace', fontSize: '16px', color: '#fffaf0', backgroundColor: '#7d4f33', padding: { x: 4, y: 1 } })
        .setOrigin(0.5, 0.5)
        .setScale(0.5)
        .setResolution(3)
        .setDepth(9_000),
    );

    // modo decorar: prévia do móvel e marcações dos tiles
    this.marks = this.add.graphics().setDepth(9_500);
    this.ghost = this.add.image(0, 0, '__DEFAULT').setOrigin(0, 0).setAlpha(0.75).setDepth(9_400).setVisible(false);
    this.prompt = this.add.image(0, 0, 'icon:keyE').setOrigin(0.5, 1).setDepth(10_000).setVisible(false);

    // luz das janelas, hora do dia e vapor do fogão
    new Ambience(this, {
      machine: { x: 15 * TILE + 8, y: 9 * TILE + 2 },
      windows: HOUSE_WINDOWS_X,
      size: { w: HOUSE_MAP.w, h: HOUSE_MAP.h },
      lamps: [
        { x: 2 * TILE, y: 2 * TILE + 8 },
        { x: 21 * TILE, y: 2 * TILE + 8 },
        { x: 4 * TILE, y: 10 * TILE },
        { x: 17 * TILE, y: 10 * TILE },
      ],
    });

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE', false) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onTap(p.worldX, p.worldY));

    this.scale.on('resize', this.relayout, this);
    this.relayout();
    this.cameras.main.fadeIn(350, 36, 23, 15);

    this.applyState(this.bridge.state, null);
    this.offState = this.bridge.onState((s, prev) => this.applyState(s, prev));
    this.events.once('shutdown', () => {
      this.offState?.();
      this.scale.off('resize', this.relayout, this);
      HOUSE_MAP.blocked.clear();
    });
    this.bridge.emit('area', { area: 'house' });
    this.bridge.emit('ready', undefined);
  }

  private relayout() {
    // a barra do modo decorar ocupa ~150 px embaixo
    if (this.bridge.state.decor) fitCamera(this, HOUSE_MAP.w, HOUSE_MAP.h, 150);
    else layoutCamera(this, this.player.sprite, HOUSE_MAP.w, HOUSE_MAP.h);
  }

  // textura de cada variante de móvel (gerada uma vez)
  private furnitureTexture(f: Furniture, variant: number) {
    const key = `fur:${f.id}:${variant}`;
    if (!this.textures.exists(key)) {
      const sheet = this.textures.get('kenney-indoor').getSourceImage() as HTMLImageElement;
      this.textures.addCanvas(key, drawFurniture(f, variant, sheet));
    }
    return key;
  }

  // ── Estado vindo do React ─────────────────────────────────────────────────

  private applyState(s: GameState, prev: GameState | null) {
    if (!prev || prev.appearance !== s.appearance) this.player.setAppearance(s.appearance);
    if (!prev || prev.inputEnabled !== s.inputEnabled) {
      this.input.keyboard!.enabled = s.inputEnabled;
      if (!s.inputEnabled) {
        this.input.keyboard!.resetKeys();
        this.player.stop();
      }
    }
    if (!prev || prev.house !== s.house) this.plates.forEach((p, i) => p.setText(s.house.roomNames[i] || 'Quarto').setVisible(!!s.house.roomNames[i]));
    if (!prev || prev.others !== s.others) this.syncOthers(s.others);
    if (!prev || prev.houseItems !== s.houseItems) this.syncItems(s.houseItems);
    if (!prev || prev.houseItems !== s.houseItems || prev.stationBadges !== s.stationBadges) this.syncBadges(s.stationBadges);
    if (!prev || prev.decor !== s.decor || prev.houseItems !== s.houseItems) this.drawDecor(s.decor);
    if (prev && !!prev.decor !== !!s.decor) {
      if (s.decor) this.player.stop();
      this.relayout();
    }
  }

  private syncItems(list: SceneHouseItem[]) {
    const ids = new Set(list.map((i) => i.id));
    for (const [id, v] of this.items)
      if (!ids.has(id)) {
        v.img.destroy();
        v.badge?.destroy();
        this.items.delete(id);
      }
    HOUSE_MAP.blocked.clear();
    for (const it of list) {
      const f = FURNITURE_BY_ID[it.item_id];
      if (!f) continue;
      let v = this.items.get(it.id);
      if (!v) {
        v = { data: it, img: this.add.image(0, 0, this.furnitureTexture(f, it.variant)).setOrigin(0, 0), badge: null };
        this.items.set(it.id, v);
      }
      v.data = it;
      v.img
        .setTexture(this.furnitureTexture(f, it.variant))
        .setPosition(it.x * TILE, it.y * TILE)
        .setFlipX(it.flip)
        .setDepth(depthOf(f, it.y));
      if (f.place === 'floor') for (let j = 0; j < f.h; j++) for (let i = 0; i < f.w; i++) HOUSE_MAP.blocked.add((it.y + j) * HOUSE_MAP.w + it.x + i);
    }
  }

  // ❗ sobre a primeira estação de cada tipo que tem novidade
  private syncBadges(badges: Partial<Record<Station, boolean>>) {
    const shown = new Set<Station>();
    for (const v of this.items.values()) {
      const f = FURNITURE_BY_ID[v.data.item_id];
      const st = f?.station;
      const on = !!st && !!badges[st] && !shown.has(st);
      if (on && st) shown.add(st);
      if (on && f && !v.badge) {
        v.badge = this.add.image(0, 0, 'icon:alert').setOrigin(0.5, 1).setDepth(9_800);
        this.tweens.add({ targets: v.badge, y: '-=2', duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      if (v.badge) {
        v.badge.setVisible(on);
        if (f) v.badge.setPosition(v.data.x * TILE + (f.w * TILE) / 2, v.data.y * TILE - 1);
      }
    }
  }

  // estação de estudo ao alcance do jogador (encostado no móvel, inclusive na diagonal)
  private nearStation(): ItemView | null {
    const t = this.player.tile;
    for (const v of this.items.values()) {
      const f = FURNITURE_BY_ID[v.data.item_id];
      if (!f?.station) continue;
      if (t.x >= v.data.x - 1 && t.x <= v.data.x + f.w && t.y >= v.data.y - 1 && t.y <= v.data.y + f.h) return v;
    }
    return null;
  }

  private useStation(v: ItemView) {
    const f = FURNITURE_BY_ID[v.data.item_id];
    if (!f?.station) return;
    this.player.stop();
    this.bridge.emit('station', { station: f.station, id: v.data.id });
  }

  // modo decorar: prévia (verde = cabe, vermelho = não cabe) e contorno do móvel selecionado
  private drawDecor(d: DecorView | null) {
    this.marks.clear();
    this.ghost.setVisible(false);
    for (const v of this.items.values()) v.img.setAlpha(1);
    if (!d) return;

    // contorno leve em tudo que eu posso mexer
    for (const v of this.items.values()) {
      const f = FURNITURE_BY_ID[v.data.item_id];
      if (!f || !v.data.editable) continue;
      this.marks.lineStyle(1, 0xfffaf0, 0.35).strokeRect(v.data.x * TILE + 0.5, v.data.y * TILE + 0.5, f.w * TILE - 1, f.h * TILE - 1);
    }
    if (d.selected) {
      const v = this.items.get(d.selected);
      const f = v && FURNITURE_BY_ID[v.data.item_id];
      if (v && f) {
        if (d.ghost) v.img.setAlpha(0.35);
        else this.marks.lineStyle(2, 0xf2cc8f, 1).strokeRect(v.data.x * TILE, v.data.y * TILE, f.w * TILE, f.h * TILE);
      }
    }
    const gh = d.ghost;
    const f = gh && FURNITURE_BY_ID[gh.item_id];
    if (gh && f) {
      const color = gh.ok ? 0x6aa36f : 0xc4554d;
      this.marks.fillStyle(color, 0.35).fillRect(gh.x * TILE, gh.y * TILE, f.w * TILE, f.h * TILE);
      this.marks.lineStyle(1, color, 1).strokeRect(gh.x * TILE + 0.5, gh.y * TILE + 0.5, f.w * TILE - 1, f.h * TILE - 1);
      this.ghost
        .setTexture(this.furnitureTexture(f, gh.variant))
        .setPosition(gh.x * TILE, gh.y * TILE)
        .setFlipX(gh.flip)
        .setTint(gh.ok ? 0xffffff : 0xffa0a0)
        .setVisible(true);
    }
  }

  // A outra pessoa: andando pela casa (online, aqui) ou dormindo no quarto dela (offline).
  private syncOthers(list: SceneOther[]) {
    const ids = new Set(list.map((o) => o.id));
    for (const [id, v] of this.others)
      if (!ids.has(id)) {
        v.walker.destroy();
        v.tag.destroy();
        this.others.delete(id);
      }
    for (const o of list) {
      let v = this.others.get(o.id);
      if (!v) {
        const start = o.online && o.pos ? { x: Math.floor(o.pos.x / TILE), y: Math.floor(o.pos.y / TILE) } : o.corner;
        const walker = new Walker(this, o.appearance, start, 72, HOUSE_MAP);
        walker.face('down');
        const tag = this.add
          .text(0, 0, '', { fontFamily: '"Pixelify Sans", monospace', fontSize: '16px', color: '#fffaf0', backgroundColor: '#5b6ea8cc', padding: { x: 4, y: 1 } })
          .setOrigin(0.5, 0)
          .setScale(0.5)
          .setResolution(3);
        v = { data: o, walker, tag };
        this.others.set(o.id, v);
      }
      if (v.data.appearance !== o.appearance) v.walker.setAppearance(o.appearance);
      v.data = o;
      v.tag.setText(o.online ? o.name : `${o.name} 💤`);
      v.walker.sprite.setAlpha(o.online ? 1 : 0.8);
    }
  }

  // ── Interação ─────────────────────────────────────────────────────────────

  private onTap(wx: number, wy: number) {
    const target: Point = { x: Math.floor(wx / TILE), y: Math.floor(wy / TILE) };
    if (this.bridge.state.decor) {
      if (target.x >= 0 && target.y >= 0 && target.x < HOUSE_MAP.w && target.y < HOUSE_MAP.h) this.bridge.emit('decorTap', target);
      return;
    }
    if (!this.bridge.state.inputEnabled || this.leaving) return;
    // tocou numa estação de estudo: anda até ela e usa
    const st = [...this.items.values()].find((v) => {
      const f = FURNITURE_BY_ID[v.data.item_id];
      return !!f?.station && target.x >= v.data.x && target.x < v.data.x + f.w && target.y >= v.data.y && target.y < v.data.y + f.h;
    });
    if (st) {
      if (this.nearStation() === st) {
        this.useStation(st);
        return;
      }
      this.player.path = pathIn(HOUSE_MAP, this.player.tile, target);
      this.player.onArrive = () => {
        if (this.nearStation() === st) this.useStation(st);
      };
      return;
    }
    this.player.onArrive = undefined;
    this.player.path = pathIn(HOUSE_MAP, this.player.tile, target);
    const p = tileToFeet(target);
    const ring = this.add.circle(p.x, p.y - 2, 5).setStrokeStyle(1, 0xfffaf0, 0.9).setDepth(50);
    this.tweens.add({ targets: ring, scale: 0.3, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
  }

  // pisou na porta da sala: volta para o café
  private goToCafe() {
    if (this.leaving) return;
    this.leaving = true;
    this.player.stop();
    this.cameras.main.fadeOut(300, 36, 23, 15);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('cafe', { bridge: this.bridge, spawn: 'house' }));
  }

  // ── Loop ──────────────────────────────────────────────────────────────────

  update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (this.bridge.state.inputEnabled && !this.leaving && !this.bridge.state.decor) {
      if (k.A.isDown || k.LEFT.isDown) dx -= 1;
      if (k.D.isDown || k.RIGHT.isDown) dx += 1;
      if (k.W.isDown || k.UP.isDown) dy -= 1;
      if (k.S.isDown || k.DOWN.isDown) dy += 1;
    }
    if (dx !== 0 || dy !== 0) {
      this.player.path = [];
      this.player.onArrive = undefined;
      this.player.moveBy(dx, dy, dt);
    } else if (!this.player.followPath(dt)) {
      this.player.moveBy(0, 0, dt);
    }
    this.player.breathe(time);

    const t = this.player.tile;
    if (t.x === CAFE_DOOR.x && t.y === CAFE_DOOR.y) this.goToCafe();

    // perto de uma estação: tecla E (ou espaço) para usar
    const near = this.bridge.state.inputEnabled && !this.bridge.state.decor && !this.leaving ? this.nearStation() : null;
    this.prompt.setVisible(!!near);
    if (near) {
      const f = FURNITURE_BY_ID[near.data.item_id];
      this.prompt.setPosition(near.data.x * TILE + (f.w * TILE) / 2 + 9, Math.round(near.data.y * TILE + 2 + Math.sin(time / 220)));
      if (Phaser.Input.Keyboard.JustDown(k.E) || Phaser.Input.Keyboard.JustDown(k.SPACE)) this.useStation(near);
    }

    for (const v of this.others.values()) {
      const target = v.data.online && v.data.pos ? v.data.pos : { ...tileToFeet(v.data.corner), dir: 'down' as Direction };
      v.walker.moveTowards(target.x, target.y, dt, target.dir);
      v.walker.breathe(time);
      v.tag.setPosition(Math.round(v.walker.x), Math.round(v.walker.y + 1)).setDepth(8_000 + v.walker.y);
    }

    // minha posição para a outra pessoa (no máximo ~8x por segundo, só quando muda)
    const me = this.player;
    if (time - this.lastSent.t > 120 && (Math.abs(me.x - this.lastSent.x) > 0.5 || Math.abs(me.y - this.lastSent.y) > 0.5 || me.dir !== this.lastSent.dir)) {
      this.lastSent = { x: me.x, y: me.y, dir: me.dir, t: time };
      this.bridge.emit('move', { x: Math.round(me.x), y: Math.round(me.y), dir: me.dir, area: 'house' });
    }
  }
}

// onde a outra pessoa fica dormindo quando está offline
export const sleepSpot = (room: number) => SLEEP_SPOT[room] ?? SLEEP_SPOT[0];
