import Phaser from 'phaser';
import type { Direction } from '@/lib/coffee/character';
import { TILE } from '@/lib/coffee/map';
import { pathIn, type Point } from '@/lib/coffee/grid';
import { isWater, shoreNear, waterNear } from '@/lib/coffee/fishing';
import { FROM_HOUSE_TO_GARDEN, GARDEN_DOOR, GARDEN_MAP, GARDEN_ROWS, GARDEN_SIGNS, MUCEGO_SPOTS, STAND, plotAt, plotTile } from '@/lib/coffee/garden';
import { STALL_H, TREE_KINDS, buildGardenGround, buildStall, buildTree } from '../art/gardenWorld';
import { Shadows } from '../effects/Shadows';
import { GardenLife } from '../effects/GardenLife';
import { ACCESSORY_PAD, CAT_H, MUCEGO, buildCatSheetWithAccessory } from '../art/cat';
import { drawThing } from '../art/gardenArt';
import { THING_BY_ID } from '@/content/coffee/gardenShop';
import { thingTiles } from '@/lib/coffee/gardenItems';
import { drawPlant } from '../art/plants';
import { ICON_SIZE, buildIconCanvas } from '../art/icons';
import type { GameBridge, GameState, GardenDecorView, SceneFishing, SceneGarden, SceneGardenItem, SceneOther, ScenePlant } from '../bridge';
import { Walker, tileToFeet } from '../entities/Walker';
import { Cat } from '../entities/Cat';
import { Ambience } from '../effects/Ambience';
import { fitCamera, layoutCamera } from './camera';

type OtherView = { data: SceneOther; walker: Walker; tag: Phaser.GameObjects.Text };
type PlantView = { data: ScenePlant; img: Phaser.GameObjects.Image; icon: Phaser.GameObjects.Text | null };
type ThingView = { data: SceneGardenItem; img: Phaser.GameObjects.Image };


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
  private catName!: Phaser.GameObjects.Text;
  private things = new Map<string, ThingView>();
  private ghost!: Phaser.GameObjects.Image;
  private marks!: Phaser.GameObjects.Graphics;
  private accessory: string | null | undefined = undefined;
  private nextPlay = 0;
  private bubbleUntil = 0;
  private nextVisit = 0;
  private lastSent = { x: 0, y: 0, dir: 'up' as Direction, t: 0 };
  private bobber!: Phaser.GameObjects.Container;
  private line!: Phaser.GameObjects.Graphics;
  private biteMark!: Phaser.GameObjects.Text;
  private leaving = false;
  private life!: GardenLife;
  private shadows!: Shadows;

  constructor() {
    super('garden');
  }

  init(data: { bridge: GameBridge }) {
    this.bridge = data.bridge;
    this.leaving = false;
    this.others = new Map();
    this.plants = new Map();
    this.things = new Map();
    this.locks = [];
    this.accessory = undefined;
  }

  create() {
    if (!this.textures.exists('garden-ground')) this.textures.addCanvas('garden-ground', buildGardenGround());
    if (!this.textures.exists('garden-stall')) this.textures.addCanvas('garden-stall', buildStall());
    TREE_KINDS.forEach((k) => {
      if (!this.textures.exists(`garden-tree:${k}`)) this.textures.addCanvas(`garden-tree:${k}`, buildTree(k));
    });
    Object.keys(ICON_SIZE).forEach((name) => {
      if (!this.textures.exists(`icon:${name}`)) this.textures.addCanvas(`icon:${name}`, buildIconCanvas(name));
    });

    // chão desenhado inteiro (grama, caminho, lago, canteiros elevados)
    this.add.image(0, 0, 'garden-ground').setOrigin(0, 0).setDepth(0);
    this.cameras.main.setBackgroundColor('#3f7a3c');
    // árvores com volume na borda (a de baixo fica na frente de quem passa)
    for (let y = 0; y < GARDEN_MAP.h; y++)
      for (let x = 0; x < GARDEN_MAP.w; x++) {
        if (GARDEN_ROWS[y][x] !== 'T') continue;
        const k = TREE_KINDS[(x * 5 + y * 3) % 7 === 0 ? 1 : (x * 3 + y * 7) % 5 === 0 ? 2 : 0];
        const ox = ((x * 13 + y * 7) % 5) - 2;
        const bottom = y * TILE + TILE + ((x + y) % 2 ? 1 : -1);
        this.add.image(x * TILE + 8 + ox, bottom, `garden-tree:${k}`).setOrigin(0.5, 1).setDepth(100 + bottom);
      }
    // barraquinha de sementes
    this.add.image((STAND[0].x + 1) * TILE, (STAND[0].y + 1) * TILE + 1, 'garden-stall').setOrigin(0.5, 1).setDepth(100 + (STAND[0].y + 1) * TILE);

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
      .text(12 * TILE, (STAND[0].y + 1) * TILE + 1 - STALL_H + 4, 'Seeds', { fontFamily: '"Pixelify Sans", monospace', fontSize: '16px', color: '#7d4f33', backgroundColor: '#fffaf0', padding: { x: 3, y: 0 } })
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setResolution(3)
      .setDepth(9_000);

    // a gatinha preta da horta
    const acc = this.bridge.state.garden.accessory;
    this.cat = new Cat(this, { x: 12, y: 8 }, MUCEGO_SPOTS, [], { texture: this.catTexture(acc), map: GARDEN_MAP, frameH: CAT_H + ACCESSORY_PAD });
    this.accessory = acc;
    // modo decorar: prévia e marcações
    this.marks = this.add.graphics().setDepth(9_500);
    this.ghost = this.add.image(0, 0, '__DEFAULT').setOrigin(0, 0).setAlpha(0.75).setDepth(9_400).setVisible(false);
    // plaquinha com o nome dela, sempre embaixo dela
    this.catName = this.add
      .text(0, 0, 'Mucego Frutífero', { fontFamily: '"Pixelify Sans", monospace', fontSize: '16px', color: '#fffaf0', backgroundColor: '#4a2f5acc', padding: { x: 4, y: 1 } })
      .setOrigin(0.5, 0)
      .setScale(0.5)
      .setResolution(3);
    this.bubble = this.add
      .text(0, 0, '', { fontFamily: '"Pixelify Sans", monospace', fontSize: '16px', color: '#3a2a24', backgroundColor: '#fffaf0', padding: { x: 5, y: 3 }, align: 'center', wordWrap: { width: 260 } })
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setResolution(3)
      .setDepth(10_500)
      .setVisible(false);
    this.prompt = this.add.image(0, 0, 'icon:keyE').setOrigin(0.5, 1).setDepth(10_000).setVisible(false);

    // pescaria: linha, boia (vermelha e branca) e o "!" da fisgada
    this.line = this.add.graphics().setDepth(9_300);
    const top = this.add.circle(0, -1, 2, 0xd9463e);
    const bottom = this.add.circle(0, 1, 2, 0xfffaf0);
    const ripple = this.add.ellipse(0, 2, 10, 3).setStrokeStyle(1, 0xd8eef2, 0.8);
    this.bobber = this.add.container(0, 0, [ripple, bottom, top]).setDepth(9_310).setVisible(false);
    this.biteMark = this.add
      .text(0, 0, '!', { fontFamily: '"Pixelify Sans", monospace', fontSize: '32px', color: '#d9463e', stroke: '#fffaf0', strokeThickness: 6 })
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setResolution(3)
      .setDepth(10_600)
      .setVisible(false);

    const ambience = new Ambience(this, { windows: [], size: { w: GARDEN_MAP.w, h: GARDEN_MAP.h }, lamps: [{ x: 12 * TILE, y: 2 * TILE + 8 }], tintScale: 0.85, pad: 600 });
    this.life = new GardenLife(this, ambience);
    // sombra macia embaixo de quem anda
    this.shadows = new Shadows(this);
    this.shadows.track(this.player.sprite);
    this.shadows.track(this.cat.sprite, 0.9);

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
    if (this.bridge.state.garden.decor) fitCamera(this, GARDEN_MAP.w, GARDEN_MAP.h, 150);
    else layoutCamera(this, this.player.sprite, GARDEN_MAP.w, GARDEN_MAP.h);
  }

  // folha da Mucego com o acessório (uma textura por acessório)
  private catTexture(acc: string | null) {
    const key = `cat-mucego:${acc ?? 'none'}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, buildCatSheetWithAccessory(MUCEGO, acc));
    return key;
  }

  private thingTexture(itemId: string) {
    const key = `thing:${itemId}`;
    const g = THING_BY_ID[itemId];
    if (!this.textures.exists(key) && g) this.textures.addCanvas(key, drawThing(g));
    return key;
  }

  // itens do jardim + o que a Mucego faz com eles (dormir na caminha, subir na torre)
  private syncThings(list: SceneGardenItem[]) {
    const ids = new Set(list.map((i) => i.id));
    for (const [id, v] of this.things)
      if (!ids.has(id)) {
        v.img.destroy();
        this.things.delete(id);
      }
    GARDEN_MAP.blocked.clear();
    const beds: Point[] = [];
    const perches: Point[] = [];
    for (const it of list) {
      const g = THING_BY_ID[it.item_id];
      if (!g) continue;
      let v = this.things.get(it.id);
      if (!v) {
        v = { data: it, img: this.add.image(0, 0, this.thingTexture(it.item_id)).setOrigin(0, 0) };
        this.things.set(it.id, v);
      }
      v.data = it;
      v.img
        .setPosition(it.x * TILE, it.y * TILE)
        .setFlipX(it.flip)
        .setDepth(g.place === 'flat' ? 1.5 : 100 + (it.y + g.h) * TILE - 4);
      if (g.place === 'floor') for (const p of thingTiles(g, it.x, it.y)) GARDEN_MAP.blocked.add(p.y * GARDEN_MAP.w + p.x);
      if (g.use === 'bed') beds.push({ x: it.x, y: it.y });
      if (g.use === 'perch') perches.push({ x: it.x, y: it.y });
    }
    this.cat.setSleepSpots(beds.length ? [...beds, ...beds, ...MUCEGO_SPOTS.slice(0, 2)] : MUCEGO_SPOTS);
    this.cat.setPerches(perches);
  }

  // modo decorar: prévia (verde/vermelho) e contorno do selecionado
  private drawDecor(d: GardenDecorView | null) {
    this.marks.clear();
    this.ghost.setVisible(false);
    for (const v of this.things.values()) v.img.setAlpha(1);
    if (!d) return;
    for (const v of this.things.values()) {
      const g = THING_BY_ID[v.data.item_id];
      if (g) this.marks.lineStyle(1, 0xfffaf0, 0.35).strokeRect(v.data.x * TILE + 0.5, v.data.y * TILE + 0.5, g.w * TILE - 1, g.h * TILE - 1);
    }
    if (d.selected) {
      const v = this.things.get(d.selected);
      const g = v && THING_BY_ID[v.data.item_id];
      if (v && g) {
        if (d.ghost) v.img.setAlpha(0.35);
        else this.marks.lineStyle(2, 0xf2cc8f, 1).strokeRect(v.data.x * TILE, v.data.y * TILE, g.w * TILE, g.h * TILE);
      }
    }
    const gh = d.ghost;
    const g = gh && THING_BY_ID[gh.item_id];
    if (gh && g) {
      const color = gh.ok ? 0x6aa36f : 0xc4554d;
      this.marks.fillStyle(color, 0.35).fillRect(gh.x * TILE, gh.y * TILE, g.w * TILE, g.h * TILE);
      this.ghost.setTexture(this.thingTexture(gh.item_id)).setPosition(gh.x * TILE, gh.y * TILE).setFlipX(gh.flip).setTint(gh.ok ? 0xffffff : 0xffa0a0).setVisible(true);
    }
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
    if (!prev || prev.garden.items !== s.garden.items) this.syncThings(s.garden.items);
    if (!prev || prev.garden.decor !== s.garden.decor || prev.garden.items !== s.garden.items) this.drawDecor(s.garden.decor);
    if (prev && !!prev.garden.decor !== !!s.garden.decor) {
      if (s.garden.decor) this.player.stop();
      this.relayout();
    }
    if (this.accessory !== undefined && s.garden.accessory !== this.accessory) {
      this.accessory = s.garden.accessory;
      this.cat.retexture(this.catTexture(s.garden.accessory), CAT_H + ACCESSORY_PAD);
    }
    if (!prev || prev.fishing !== s.fishing) this.syncFishing(s.fishing, prev?.fishing ?? null);
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
        v = { data: p, img: this.add.image(t.x * TILE, t.y * TILE - 2, this.plantTexture(p.crop_id, p.stage)).setOrigin(0, 0).setDepth(100 + t.y * TILE + 10), icon: null };
        this.plants.set(p.id, v);
        this.tweens.add({ targets: v.img, scaleY: { from: 0.4, to: 1 }, duration: 300, ease: 'Back.out' });
      }
      if (v.data.stage !== p.stage) this.tweens.add({ targets: v.img, scaleY: { from: 0.6, to: 1 }, duration: 300, ease: 'Back.out' });
      v.data = p;
      v.img.setTexture(this.plantTexture(p.crop_id, p.stage)).setPosition(t.x * TILE, t.y * TILE - 2);
      // 💧 com sede · ✨ pronta para colher
      const mark = p.ready ? '✨' : p.thirsty ? '💧' : '';
      if (mark && !v.icon) {
        v.icon = this.add.text(0, 0, '', { fontSize: '16px' }).setOrigin(0.5, 1).setScale(0.5).setResolution(3).setDepth(9_700);
        this.tweens.add({ targets: v.icon, y: '-=2', duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      if (v.icon) v.icon.setText(mark).setVisible(!!mark).setPosition(t.x * TILE + 8, t.y * TILE + 2);
    }
  }

  private syncFishing(f: SceneFishing, prev: SceneFishing | null) {
    this.bobber.setVisible(!!f.at);
    this.biteMark.setVisible(!!f.at && f.bite);
    if (f.at) {
      this.bobber.setPosition(f.at.x * TILE + 8, f.at.y * TILE + 8);
      // de frente para a água e a Mucego vem sentar do lado, esperando um peixinho
      const p = this.player.tile;
      this.player.face(f.at.x > p.x ? 'right' : f.at.x < p.x ? 'left' : f.at.y > p.y ? 'down' : 'up');
      if (!prev?.at && !this.cat.busy) this.cat.visit({ x: p.x - (f.at.x < p.x ? -1 : 1), y: p.y });
    }
    if (f.bite && !prev?.bite) this.tweens.add({ targets: this.bobber, y: '+=3', duration: 120, yoyo: true, repeat: 3 });
    // peixe saindo da água
    if (f.caught && f.caught.key !== prev?.caught?.key && (f.at ?? prev?.at)) {
      const at = f.at ?? prev!.at!;
      const t = this.add.text(at.x * TILE + 8, at.y * TILE + 8, f.caught.emoji, { fontSize: '32px' }).setOrigin(0.5).setScale(0.5).setResolution(3).setDepth(10_700);
      this.tweens.add({ targets: t, y: this.player.y - 18, x: this.player.x, scale: 0.7, duration: 600, ease: 'Quad.out', onComplete: () => this.tweens.add({ targets: t, alpha: 0, delay: 900, duration: 400, onComplete: () => t.destroy() }) });
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
        this.shadows.track(walker.sprite);
        this.others.set(o.id, v);
      }
      if (v.data.appearance !== o.appearance) v.walker.setAppearance(o.appearance);
      v.data = o;
      v.tag.setText(o.name);
    }
  }

  // ── Interação ─────────────────────────────────────────────────────────────

  // canteiro ou barraquinha encostado no jogador
  private nearThing(): { kind: 'plot'; owner: number; plot: number; at: Point } | { kind: 'stand'; at: Point } | { kind: 'water'; at: Point } | null {
    const t = this.player.tile;
    const water = waterNear(t);
    if (water) return { kind: 'water', at: water };
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
    else if (n.kind === 'water') this.bridge.emit('fishCast', n.at);
    else this.bridge.emit('gardenPlot', { owner: n.owner, plot: n.plot });
  }



  private onTap(wx: number, wy: number) {
    const target: Point = { x: Math.floor(wx / TILE), y: Math.floor(wy / TILE) };
    if (this.bridge.state.garden.decor) {
      if (target.x >= 0 && target.y >= 0 && target.x < GARDEN_MAP.w && target.y < GARDEN_MAP.h) this.bridge.emit('gardenDecorTap', target);
      return;
    }
    if (!this.bridge.state.inputEnabled || this.leaving) return;
    // tocou na gatinha: abre o painel da Mucego Frutífero
    const c = this.cat.sprite;
    if (Math.abs(wx - c.x) < 10 && wy > c.y - 16 && wy < c.y + 3) {
      this.player.stop();
      this.bridge.emit('mucegoTap', undefined);
      return;
    }
    // pescando: tocar em qualquer lugar não faz nada até o peixe sair
    if (this.bridge.state.fishing.at) return;
    const pl = plotAt(target.x, target.y);
    const isStand = STAND.some((s) => s.x === target.x && s.y === target.y);
    const lake = isWater(target.x, target.y);
    if (pl || isStand || lake) {
      const near = this.nearThing();
      if (near && near.at.x === target.x && near.at.y === target.y) {
        this.use(near);
        return;
      }
      // no lago: vai até a margem mais perto do ponto tocado
      const goal = lake ? (shoreNear(target) ?? target) : target;
      const here = this.player.tile;
      if (lake && goal.x === here.x && goal.y === here.y) {
        const n = this.nearThing();
        if (n) this.use(n);
        return;
      }
      this.player.path = pathIn(GARDEN_MAP, this.player.tile, goal);
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
    if (this.bridge.state.inputEnabled && !this.leaving && !this.bridge.state.fishing.at && !this.bridge.state.garden.decor) {
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
    this.life.update(time, dt);
    this.shadows.update();

    const t = this.player.tile;
    if (t.x === GARDEN_DOOR.x && t.y === GARDEN_DOOR.y) this.goHome();

    // a Mucego: passeia, dorme entre os canteiros e senta do lado das plantas prontas
    this.cat.update(time, dt);
    this.catName.setPosition(Math.round(this.cat.sprite.x), Math.round(this.cat.sprite.y + 1)).setDepth(8_000 + this.cat.sprite.y);
    if (time > this.nextPlay) {
      this.nextPlay = time + 40_000;
      const toys = [...this.things.values()].filter((v) => THING_BY_ID[v.data.item_id]?.use === 'play');
      if (toys.length && !this.cat.busy && Math.random() < 0.5) {
        const toy = toys[Math.floor(Math.random() * toys.length)];
        this.cat.visit({ x: toy.data.x, y: toy.data.y });
        const name = THING_BY_ID[toy.data.item_id].en;
        this.bubble.setText(`🐈‍⬛ Mucego Frutífero:\n*plays with the ${name}*`).setVisible(true);
        this.bubbleUntil = time + 4_000;
      }
    }
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

    // linha de pesca e boia balançando
    const fish = this.bridge.state.fishing;
    this.line.clear();
    if (fish.at) {
      const bx = fish.at.x * TILE + 8;
      const by = fish.at.y * TILE + 8 + (fish.bite ? 0 : Math.sin(time / 300) * 0.8);
      this.bobber.y = by;
      const hx = this.player.x + (fish.at.x * TILE + 8 > this.player.x ? 5 : -5);
      const hy = this.player.y - 12;
      this.line.lineStyle(1, 0x7d4f33, 1).lineBetween(hx, hy, hx + (bx - hx) * 0.3, hy - 8);
      this.line.lineStyle(1, 0xfffaf0, 0.8).lineBetween(hx + (bx - hx) * 0.3, hy - 8, bx, by - 2);
      this.biteMark.setPosition(bx, by - 6 + Math.sin(time / 80));
    }

    // perto de um canteiro, da barraquinha ou do lago: tecla E
    const near = this.bridge.state.inputEnabled && !this.leaving && !fish.at ? this.nearThing() : null;
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
