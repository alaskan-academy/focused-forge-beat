import Phaser from 'phaser';
import type { Direction } from '@/lib/coffee/character';
import { TILE } from '@/lib/coffee/map';
import { pathIn, type Point } from '@/lib/coffee/grid';
import { CROP_BY_ID, FROM_HOUSE_TO_GARDEN, GARDEN_DOOR, GARDEN_MAP, GARDEN_SIGNS, MUCEGO_SPOTS, STAND, plotAt, plotTile } from '@/lib/coffee/garden';
import { buildGardenLayers, buildTilesetCanvas } from '../art/tiles';
import { MUCEGO, buildCatSheet } from '../art/cat';
import { drawPlant } from '../art/plants';
import { ICON_SIZE, buildIconCanvas } from '../art/icons';
import type { GameBridge, GameState, SceneGarden, SceneOther, ScenePlant } from '../bridge';
import { Walker, tileToFeet } from '../entities/Walker';
import { Cat } from '../entities/Cat';
import { Ambience } from '../effects/Ambience';
import { layoutCamera } from './camera';

type OtherView = { data: SceneOther; walker: Walker; tag: Phaser.GameObjects.Text };
type PlantView = { data: ScenePlant; img: Phaser.GameObjects.Image; icon: Phaser.GameObjects.Text | null };

// O que a Mucego Frutífero fala quando você toca nela (ela adora plantinhas, legumes e frutinhas).
const MUCEGO_LINES: [string, string][] = [
  ['Meow! I love the smell of fresh basil.', 'Miau! Eu amo o cheiro de manjericão fresquinho.'],
  ['Purr… strawberries are my favorite fruit.', 'Rrrr… morango é minha fruta favorita.'],
  ["Don't forget to water the plants!", 'Não esquece de regar as plantas!'],
  ["I'm guarding the tomatoes. Nobody touches them.", 'Estou vigiando os tomates. Ninguém mexe neles.'],
  ['Is it lunchtime yet? I could eat a carrot.', 'Já é hora do almoço? Eu comeria uma cenoura.'],
  ['The sunflowers are taller than me!', 'Os girassóis são mais altos que eu!'],
  ['I took a nap between the lettuces. Best nap ever.', 'Tirei uma soneca entre as alfaces. Melhor soneca da vida.'],
];

// Quintal: a horta de vocês dois, a barraquinha de sementes e a gatinha preta que mora lá.
export class GardenScene extends Phaser.Scene {
  private bridge!: GameBridge;
  private player!: Walker;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private offState?: () => void;
  private others = new Map<string, OtherView>();
  private plants = new Map<string, PlantView>();
  private locks: Phaser.GameObjects.Rectangle[] = [];
  private signs: Phaser.GameObjects.Text[] = [];
  private prompt!: Phaser.GameObjects.Image;
  private cat!: Cat;
  private bubble!: Phaser.GameObjects.Text;
  private bubbleUntil = 0;
  private nextVisit = 0;
  private lastSent = { x: 0, y: 0, dir: 'up' as Direction, t: 0 };
  private leaving = false;

  constructor() {
    super('garden');
  }

  init(data: { bridge: GameBridge }) {
    this.bridge = data.bridge;
    this.leaving = false;
    this.others = new Map();
    this.plants = new Map();
    this.locks = [];
  }

  create() {
    if (!this.textures.exists('cafe-tiles')) this.textures.addCanvas('cafe-tiles', buildTilesetCanvas());
    if (!this.textures.exists('cat-mucego')) this.textures.addCanvas('cat-mucego', buildCatSheet(MUCEGO));
    Object.keys(ICON_SIZE).forEach((name) => {
      if (!this.textures.exists(`icon:${name}`)) this.textures.addCanvas(`icon:${name}`, buildIconCanvas(name));
    });

    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: GARDEN_MAP.w, height: GARDEN_MAP.h });
    const tileset = map.addTilesetImage('cafe', 'cafe-tiles', TILE, TILE, 0, 0)!;
    const { ground } = buildGardenLayers();
    const g = map.createBlankLayer('ground', tileset)!.setDepth(0);
    for (let y = 0; y < GARDEN_MAP.h; y++) for (let x = 0; x < GARDEN_MAP.w; x++) g.putTileAt(ground[y][x], x, y);

    this.player = new Walker(this, this.bridge.state.appearance, FROM_HOUSE_TO_GARDEN, 72, GARDEN_MAP);
    this.player.face('right');

    // plaquinha de cada horta e cadeados dos canteiros ainda não comprados
    this.signs = GARDEN_SIGNS.map((p) =>
      this.add
        .text(p.x * TILE, p.y * TILE + 8, '', { fontFamily: '"Pixelify Sans", monospace', fontSize: '16px', color: '#fffaf0', backgroundColor: '#7d4f33', padding: { x: 4, y: 1 } })
        .setOrigin(0.5, 0.5)
        .setScale(0.5)
        .setResolution(3)
        .setDepth(9_000),
    );
    for (let owner = 0; owner < 2; owner++)
      for (let plot = 0; plot < 12; plot++) {
        const t = plotTile(owner, plot);
        this.locks.push(this.add.rectangle(t.x * TILE + 8, t.y * TILE + 8, 14, 13, 0x2a1d18, 0.45).setDepth(2));
      }
    this.add
      .text(12 * TILE, 2 * TILE - 3, 'Seeds', { fontFamily: '"Pixelify Sans", monospace', fontSize: '16px', color: '#7d4f33', backgroundColor: '#fffaf0', padding: { x: 3, y: 0 } })
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setResolution(3)
      .setDepth(9_000);

    // a gatinha preta da horta
    this.cat = new Cat(this, { x: 12, y: 8 }, MUCEGO_SPOTS, [], { texture: 'cat-mucego', map: GARDEN_MAP });
    this.bubble = this.add
      .text(0, 0, '', { fontFamily: '"Pixelify Sans", monospace', fontSize: '16px', color: '#3a2a24', backgroundColor: '#fffaf0', padding: { x: 5, y: 3 }, align: 'center', wordWrap: { width: 260 } })
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setResolution(3)
      .setDepth(10_500)
      .setVisible(false);
    this.prompt = this.add.image(0, 0, 'icon:keyE').setOrigin(0.5, 1).setDepth(10_000).setVisible(false);

    new Ambience(this, { windows: [], size: { w: GARDEN_MAP.w, h: GARDEN_MAP.h }, lamps: [{ x: 12 * TILE, y: 2 * TILE + 8 }] });

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
    });
    this.bridge.emit('area', { area: 'garden' });
    this.bridge.emit('ready', undefined);
  }

  private relayout() {
    layoutCamera(this, this.player.sprite, GARDEN_MAP.w, GARDEN_MAP.h);
  }

  private plantTexture(cropId: string, stage: number) {
    const key = `plant:${cropId}:${stage}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, drawPlant(cropId, stage));
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
    if (!prev || prev.others !== s.others) this.syncOthers(s.others);
    if (!prev || prev.garden !== s.garden) this.syncGarden(s.garden);
  }

  private syncGarden(gd: SceneGarden) {
    this.signs.forEach((t, i) => t.setText(gd.names[i] ? `${gd.names[i]}'s garden` : '').setVisible(!!gd.names[i]));
    for (let owner = 0; owner < 2; owner++)
      for (let plot = 0; plot < 12; plot++) this.locks[owner * 12 + plot].setVisible(plot >= gd.plots[owner]);

    const ids = new Set(gd.plants.map((p) => p.id));
    for (const [id, v] of this.plants)
      if (!ids.has(id)) {
        v.img.destroy();
        v.icon?.destroy();
        this.plants.delete(id);
      }
    for (const p of gd.plants) {
      const t = plotTile(p.owner, p.plot);
      let v = this.plants.get(p.id);
      if (!v) {
        v = { data: p, img: this.add.image(t.x * TILE, t.y * TILE, this.plantTexture(p.crop_id, p.stage)).setOrigin(0, 0).setDepth(100 + t.y * TILE + 10), icon: null };
        this.plants.set(p.id, v);
        this.tweens.add({ targets: v.img, scaleY: { from: 0.4, to: 1 }, duration: 300, ease: 'Back.out' });
      }
      if (v.data.stage !== p.stage) this.tweens.add({ targets: v.img, scaleY: { from: 0.6, to: 1 }, duration: 300, ease: 'Back.out' });
      v.data = p;
      v.img.setTexture(this.plantTexture(p.crop_id, p.stage)).setPosition(t.x * TILE, t.y * TILE);
      // 💧 com sede · ✨ pronta para colher
      const mark = p.ready ? '✨' : p.thirsty ? '💧' : '';
      if (mark && !v.icon) {
        v.icon = this.add.text(0, 0, '', { fontSize: '16px' }).setOrigin(0.5, 1).setScale(0.5).setResolution(3).setDepth(9_700);
        this.tweens.add({ targets: v.icon, y: '-=2', duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      if (v.icon) v.icon.setText(mark).setVisible(!!mark).setPosition(t.x * TILE + 8, t.y * TILE + 2);
    }
  }

  // A outra pessoa: só aparece aqui se estiver online no quintal.
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
        const start = o.pos ? { x: Math.floor(o.pos.x / TILE), y: Math.floor(o.pos.y / TILE) } : o.corner;
        const walker = new Walker(this, o.appearance, start, 72, GARDEN_MAP);
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
      v.tag.setText(o.name);
    }
  }

  // ── Interação ─────────────────────────────────────────────────────────────

  // canteiro ou barraquinha encostado no jogador
  private nearThing(): { kind: 'plot'; owner: number; plot: number; at: Point } | { kind: 'stand'; at: Point } | null {
    const t = this.player.tile;
    for (const d of [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ]) {
      const p = { x: t.x + d.x, y: t.y + d.y };
      const pl = plotAt(p.x, p.y);
      if (pl) return { kind: 'plot', ...pl, at: p };
      if (STAND.some((s) => s.x === p.x && s.y === p.y)) return { kind: 'stand', at: p };
    }
    return null;
  }

  private use(n: NonNullable<ReturnType<GardenScene['nearThing']>>) {
    this.player.stop();
    if (n.kind === 'stand') this.bridge.emit('gardenStand', undefined);
    else this.bridge.emit('gardenPlot', { owner: n.owner, plot: n.plot });
  }

  private sayMucego(time: number) {
    const gd = this.bridge.state.garden;
    const mine = gd.plants.filter((p) => p.mine);
    const ready = mine.find((p) => p.ready);
    const thirsty = gd.plants.find((p) => p.thirsty);
    let line: [string, string];
    if (ready) line = [`Psst! Your ${CROP_BY_ID[ready.crop_id]?.en ?? 'plant'} is ready to pick!`, 'Psiu! Sua planta está pronta para colher!'];
    else if (thirsty) line = [`The ${CROP_BY_ID[thirsty.crop_id]?.en ?? 'plant'} looks thirsty…`, 'Essa plantinha está com sede…'];
    else line = MUCEGO_LINES[Math.floor(Math.random() * MUCEGO_LINES.length)];
    this.bubble.setText(`🐈‍⬛ ${line[0]}\n(${line[1]})`).setVisible(true);
    this.bubbleUntil = time + 5_000;
  }

  private onTap(wx: number, wy: number) {
    if (!this.bridge.state.inputEnabled || this.leaving) return;
    const target: Point = { x: Math.floor(wx / TILE), y: Math.floor(wy / TILE) };
    // tocou na gatinha
    const c = this.cat.sprite;
    if (Math.abs(wx - c.x) < 10 && wy > c.y - 14 && wy < c.y + 2) {
      this.sayMucego(this.time.now);
      return;
    }
    const pl = plotAt(target.x, target.y);
    const isStand = STAND.some((s) => s.x === target.x && s.y === target.y);
    if (pl || isStand) {
      const near = this.nearThing();
      if (near && near.at.x === target.x && near.at.y === target.y) {
        this.use(near);
        return;
      }
      this.player.path = pathIn(GARDEN_MAP, this.player.tile, target);
      this.player.onArrive = () => {
        const n = this.nearThing();
        if (n) this.use(n);
      };
      return;
    }
    this.player.onArrive = undefined;
    this.player.path = pathIn(GARDEN_MAP, this.player.tile, target);
    const p = tileToFeet(target);
    const ring = this.add.circle(p.x, p.y - 2, 5).setStrokeStyle(1, 0xfffaf0, 0.9).setDepth(50);
    this.tweens.add({ targets: ring, scale: 0.3, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
  }

  private goHome() {
    if (this.leaving) return;
    this.leaving = true;
    this.player.stop();
    this.cameras.main.fadeOut(300, 36, 23, 15);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('house', { bridge: this.bridge, spawn: 'garden' }));
  }

  // ── Loop ──────────────────────────────────────────────────────────────────

  update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (this.bridge.state.inputEnabled && !this.leaving) {
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
    if (t.x === GARDEN_DOOR.x && t.y === GARDEN_DOOR.y) this.goHome();

    // a Mucego: passeia, dorme entre os canteiros e senta do lado das plantas prontas
    this.cat.update(time, dt);
    if (time > this.nextVisit) {
      this.nextVisit = time + 25_000;
      const ready = this.bridge.state.garden.plants.find((p) => p.ready);
      if (ready && !this.cat.busy) {
        const pt = plotTile(ready.owner, ready.plot);
        this.cat.visit({ x: pt.x, y: pt.y + 1 });
      }
    }
    if (this.bubble.visible) {
      this.bubble.setPosition(Math.round(this.cat.sprite.x), Math.round(this.cat.sprite.y - 14));
      if (time > this.bubbleUntil) this.bubble.setVisible(false);
    }

    // perto de um canteiro ou da barraquinha: tecla E
    const near = this.bridge.state.inputEnabled && !this.leaving ? this.nearThing() : null;
    this.prompt.setVisible(!!near);
    if (near) {
      this.prompt.setPosition(near.at.x * TILE + 8 + 9, Math.round(near.at.y * TILE + 2 + Math.sin(time / 220)));
      if (Phaser.Input.Keyboard.JustDown(k.E) || Phaser.Input.Keyboard.JustDown(k.SPACE)) this.use(near);
    }

    for (const v of this.others.values()) {
      if (!v.data.pos) continue;
      v.walker.moveTowards(v.data.pos.x, v.data.pos.y, dt, v.data.pos.dir);
      v.walker.breathe(time);
      v.tag.setPosition(Math.round(v.walker.x), Math.round(v.walker.y + 1)).setDepth(8_000 + v.walker.y);
    }

    const me = this.player;
    if (time - this.lastSent.t > 120 && (Math.abs(me.x - this.lastSent.x) > 0.5 || Math.abs(me.y - this.lastSent.y) > 0.5 || me.dir !== this.lastSent.dir)) {
      this.lastSent = { x: me.x, y: me.y, dir: me.dir, t: time };
      this.bridge.emit('move', { x: Math.round(me.x), y: Math.round(me.y), dir: me.dir, area: 'garden' });
    }
  }
}
