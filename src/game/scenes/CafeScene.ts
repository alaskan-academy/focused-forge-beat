import Phaser from 'phaser';
import { appearanceFromSeed, type Direction } from '@/lib/coffee/character';
import { CAT_BED, CAT_CUSHION, CAT_SCRATCHER, DOOR, INTERACTABLES, type Interactable, MAP_H, MAP_W, PLAYER_START, TILE, findPath, isWalkable, serveTiles, spotById, type Point } from '@/lib/coffee/map';
import { buildCatBed, buildCatSheet, buildScratcher } from '../art/cat';
import { buildChalkboard } from '../art/decor';
import { buildLayers, buildTilesetCanvas } from '../art/tiles';
import { ICON_SIZE, buildIconCanvas } from '../art/icons';
import type { GameBridge, GameState, SceneCustomer, SceneOther } from '../bridge';
import { Cat } from '../entities/Cat';
import { Walker, tileToFeet } from '../entities/Walker';

type OtherView = { data: SceneOther; walker: Walker; tag: Phaser.GameObjects.Text };

type CustomerView = {
  data: SceneCustomer;
  walker: Walker;
  bubble: Phaser.GameObjects.Image;
  nameTag: Phaser.GameObjects.Text | null;
  seated: boolean;
  leaving: boolean;
};

const INTERACT_DIST = 22; // px entre os pés

export class CafeScene extends Phaser.Scene {
  private bridge!: GameBridge;
  private player!: Walker;
  private customers = new Map<string, CustomerView>();
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private prompt!: Phaser.GameObjects.Image;
  private pendingInteract: string | null = null;
  private offState?: () => void;
  private cat!: Cat;
  private catDecor: Phaser.GameObjects.Image[] = [];
  private others = new Map<string, OtherView>();
  private objectBadges = new Map<string, Phaser.GameObjects.Image>();
  private lastSent = { x: 0, y: 0, dir: 'up' as Direction, t: 0 };

  constructor() {
    super('cafe');
  }

  init(data: { bridge: GameBridge }) {
    this.bridge = data.bridge;
  }

  create() {
    // texturas geradas em código (placeholder)
    this.textures.addCanvas('cafe-tiles', buildTilesetCanvas());
    this.textures.addCanvas('cat', buildCatSheet());
    this.textures.addCanvas('cat-bed', buildCatBed());
    this.textures.addCanvas('cat-scratcher', buildScratcher());
    this.textures.addCanvas('chalkboard', buildChalkboard());
    Object.keys(ICON_SIZE).forEach((name) => this.textures.addCanvas(`icon:${name}`, buildIconCanvas(name)));

    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: MAP_W, height: MAP_H });
    const tileset = map.addTilesetImage('cafe', 'cafe-tiles', TILE, TILE, 0, 0)!;
    const { ground, objects } = buildLayers();
    const g = map.createBlankLayer('ground', tileset)!.setDepth(0);
    const o = map.createBlankLayer('objects', tileset)!.setDepth(1);
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        g.putTileAt(ground[y][x], x, y);
        if (objects[y][x] >= 0) o.putTileAt(objects[y][x], x, y);
      }

    this.player = new Walker(this, this.bridge.state.appearance, PLAYER_START, 72);
    this.player.face('up');

    // Cantinho do gato (aparece quando a melhoria compartilhada é concluída)
    const bed = tileToFeet(CAT_BED);
    const post = tileToFeet(CAT_SCRATCHER);
    this.catDecor = [
      this.add.image(bed.x, bed.y + 3, 'cat-bed').setOrigin(0.5, 1).setDepth(2).setVisible(false),
      this.add.image(post.x, post.y + 3, 'cat-scratcher').setOrigin(0.5, 1).setDepth(100 + post.y).setVisible(false),
    ];
    this.cat = new Cat(this, { x: 17, y: 3 }, [CAT_CUSHION]);

    // objetos interativos: quadro-negro na parede + selos (❗) sobre eles
    const board = INTERACTABLES.find((o) => o.id === 'chalkboard')!;
    this.add.image(board.x * TILE + TILE / 2, board.y * TILE + 1, 'chalkboard').setOrigin(0.5, 0).setDepth(2);
    for (const o of INTERACTABLES) {
      const badge = this.add.image(o.x * TILE + TILE / 2, o.y * TILE + (o.id === 'chalkboard' ? 2 : -1), 'icon:alert').setOrigin(0.5, 1).setDepth(9_800).setVisible(false);
      this.objectBadges.set(o.id, badge);
    }

    this.prompt = this.add.image(0, 0, 'icon:keyE').setOrigin(0.5, 1).setDepth(10_000).setVisible(false);

    const kb = this.input.keyboard!;
    // enableCapture=false: não bloqueia digitação nos puzzles em cima do canvas
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE', false) as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onTap(p.worldX, p.worldY));

    this.scale.on('resize', this.layoutCamera, this);
    this.layoutCamera();

    this.applyState(this.bridge.state, null);
    this.offState = this.bridge.onState((s, prev) => this.applyState(s, prev));
    this.events.once('shutdown', () => this.offState?.());
    this.bridge.emit('ready', undefined);
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
    if (!prev || prev.customers !== s.customers) this.syncCustomers(s.customers);
    if (!prev || prev.others !== s.others) this.syncOthers(s.others);
    if (!prev || prev.objectBadges !== s.objectBadges)
      for (const [id, img] of this.objectBadges) img.setVisible(!!s.objectBadges[id as Interactable['id']]);
    if (!prev || prev.catCorner !== s.catCorner) {
      this.catDecor.forEach((d) => d.setVisible(s.catCorner));
      this.cat.setSleepSpots(s.catCorner ? [CAT_BED, CAT_BED, CAT_CUSHION] : [CAT_CUSHION]);
      if (prev && s.catCorner) this.catDecor.forEach((d) => this.tweens.add({ targets: d, scale: { from: 0, to: 1 }, duration: 400, ease: 'Back.out' }));
    }
  }

  // A outra pessoa: anda até a posição recebida (online) ou fica no cantinho dela (offline).
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
        const walker = new Walker(this, o.appearance, start, 72);
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

  private syncCustomers(list: SceneCustomer[]) {
    const ids = new Set(list.map((c) => c.id));
    for (const [id, view] of this.customers) if (!ids.has(id) && !view.leaving) this.leave(view);

    for (const c of list) {
      const existing = this.customers.get(c.id);
      if (existing) {
        if (!existing.data.doneForMe && c.doneForMe) this.popHeart(existing);
        existing.data = c;
        this.updateBubble(existing);
        continue;
      }
      const spot = spotById(c.spotId);
      if (!spot) continue;
      const walker = new Walker(this, c.look ?? appearanceFromSeed(c.seed), c.arriving ? DOOR : spot, 48);
      const bubble = this.add.image(0, 0, 'icon:coffee').setOrigin(0.5, 1).setVisible(false);
      const nameTag = c.name
        ? this.add
            .text(0, 0, c.name, { fontFamily: '"Pixelify Sans", monospace', fontSize: '16px', color: '#fffaf0', backgroundColor: '#3b2a20cc', padding: { x: 4, y: 1 } })
            .setOrigin(0.5, 0)
            .setScale(0.5)
            .setResolution(3)
        : null;
      const view: CustomerView = { data: c, walker, bubble, nameTag, seated: !c.arriving, leaving: false };
      this.customers.set(c.id, view);
      if (c.arriving) {
        walker.sprite.setAlpha(0);
        this.tweens.add({ targets: walker.sprite, alpha: 1, duration: 400 });
        walker.path = findPath(DOOR, spot, (x, y) => !isWalkable(x, y));
        walker.onArrive = () => {
          view.seated = true;
          walker.face(spot.face);
          this.updateBubble(view);
        };
      } else {
        walker.face(spot.face);
      }
      this.updateBubble(view);
    }
  }

  private updateBubble(v: CustomerView) {
    const show = v.seated && !v.leaving && !v.data.doneForMe;
    v.bubble.setVisible(show);
    if (!show) return;
    v.bubble.setTexture(v.data.busy ? 'icon:busy' : `icon:${v.data.bubble}`);
    if (!v.bubble.getData('bob')) {
      v.bubble.setData('bob', true);
      v.bubble.setScale(0);
      this.tweens.add({ targets: v.bubble, scale: 1, duration: 250, ease: 'Back.out' });
    }
  }

  private leave(v: CustomerView) {
    v.leaving = true;
    v.bubble.setVisible(false);
    this.popHeart(v);
    v.walker.speed = 56;
    v.walker.path = findPath(v.walker.tile, DOOR, (x, y) => !isWalkable(x, y));
    const done = () => {
      this.tweens.add({
        targets: v.walker.sprite,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          v.walker.destroy();
          v.bubble.destroy();
          v.nameTag?.destroy();
          this.customers.delete(v.data.id);
        },
      });
    };
    if (v.walker.path.length === 0) done();
    else v.walker.onArrive = done;
  }

  private popHeart(v: CustomerView) {
    const heart = this.add.image(v.walker.x, v.walker.y - 26, 'icon:heart').setDepth(10_000);
    this.tweens.add({ targets: heart, y: heart.y - 12, alpha: 0, duration: 900, onComplete: () => heart.destroy() });
  }

  // ── Interação ─────────────────────────────────────────────────────────────

  private canInteract(v: CustomerView) {
    return v.seated && !v.leaving && !v.data.busy && !v.data.doneForMe;
  }

  private isNear(v: CustomerView) {
    const spot = spotById(v.data.spotId);
    if (!spot) return false;
    const t = this.player.tile;
    if (serveTiles(spot).some((p) => p.x === t.x && p.y === t.y)) return true;
    return Math.hypot(this.player.x - v.walker.x, this.player.y - v.walker.y) < INTERACT_DIST;
  }

  private nearestInteractable(): CustomerView | null {
    let best: CustomerView | null = null;
    let bestD = Infinity;
    for (const v of this.customers.values()) {
      if (!this.canInteract(v) || !this.isNear(v)) continue;
      const d = Math.hypot(this.player.x - v.walker.x, this.player.y - v.walker.y);
      if (d < bestD) {
        best = v;
        bestD = d;
      }
    }
    return best;
  }

  private interact(v: CustomerView) {
    const dx = v.walker.x - this.player.x;
    const dy = v.walker.y - this.player.y;
    this.player.face(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down');
    this.bridge.emit('interact', { customerId: v.data.id });
  }

  // ── Objetos (quadro-negro, estante) ───────────────────────────────────────

  private nearObject(): Interactable | null {
    const t = this.player.tile;
    return INTERACTABLES.find((o) => o.serve.some((p) => p.x === t.x && p.y === t.y)) ?? null;
  }

  private useObject(o: Interactable) {
    this.player.face('up');
    this.bridge.emit('object', { id: o.id });
  }

  private onTap(wx: number, wy: number) {
    if (!this.bridge.state.inputEnabled) return;
    // tocou num objeto?
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    const obj = INTERACTABLES.find((o) => o.x === tx && o.y === ty);
    if (obj) {
      if (this.nearObject()?.id === obj.id) {
        this.useObject(obj);
        return;
      }
      const options = obj.serve.map((t) => findPath(this.player.tile, t)).filter((p) => p.length > 0).sort((a, b) => a.length - b.length);
      if (options.length === 0) return;
      this.player.path = options[0];
      this.pendingInteract = null;
      this.player.onArrive = () => {
        if (this.nearObject()?.id === obj.id) this.useObject(obj);
      };
      return;
    }
    // tocou num cliente?
    for (const v of this.customers.values()) {
      const s = v.walker.sprite;
      const hit = wx >= s.x - 8 && wx <= s.x + 8 && wy >= s.y - 26 && wy <= s.y + 2;
      if (!hit || !this.canInteract(v)) continue;
      if (this.isNear(v)) {
        this.interact(v);
        return;
      }
      const spot = spotById(v.data.spotId)!;
      const options = serveTiles(spot)
        .map((t) => findPath(this.player.tile, t))
        .filter((p) => p.length > 0)
        .sort((a, b) => a.length - b.length);
      if (options.length === 0) return;
      this.player.path = options[0];
      this.pendingInteract = v.data.id;
      this.player.onArrive = () => {
        const target = this.customers.get(this.pendingInteract ?? '');
        this.pendingInteract = null;
        if (target && this.canInteract(target) && this.isNear(target)) this.interact(target);
      };
      return;
    }
    // senão, anda até o ponto
    const target: Point = { x: Math.floor(wx / TILE), y: Math.floor(wy / TILE) };
    this.pendingInteract = null;
    this.player.onArrive = undefined;
    this.player.path = findPath(this.player.tile, target);
    this.showTapMarker(target);
  }

  private showTapMarker(t: Point) {
    const p = tileToFeet(t);
    const ring = this.add.circle(p.x, p.y - 2, 5).setStrokeStyle(1, 0xfffaf0, 0.9).setDepth(50);
    this.tweens.add({ targets: ring, scale: 0.3, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
  }

  // ── Loop ──────────────────────────────────────────────────────────────────

  update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (this.bridge.state.inputEnabled) {
      if (k.A.isDown || k.LEFT.isDown) dx -= 1;
      if (k.D.isDown || k.RIGHT.isDown) dx += 1;
      if (k.W.isDown || k.UP.isDown) dy -= 1;
      if (k.S.isDown || k.DOWN.isDown) dy += 1;
    }
    if (dx !== 0 || dy !== 0) {
      this.player.path = [];
      this.player.onArrive = undefined;
      this.pendingInteract = null;
      this.player.moveBy(dx, dy, dt);
    } else if (!this.player.followPath(dt)) {
      this.player.moveBy(0, 0, dt);
    }

    this.cat.update(time, dt);

    for (const v of this.others.values()) {
      const target = v.data.online && v.data.pos ? v.data.pos : { ...tileToFeet(v.data.corner), dir: 'down' as Direction };
      v.walker.moveTowards(target.x, target.y, dt, target.dir);
      v.tag.setPosition(Math.round(v.walker.x), Math.round(v.walker.y + 1)).setDepth(8_000 + v.walker.y);
    }

    // minha posição para a outra pessoa (no máximo ~8x por segundo, só quando muda)
    const me = this.player;
    if (time - this.lastSent.t > 120 && (Math.abs(me.x - this.lastSent.x) > 0.5 || Math.abs(me.y - this.lastSent.y) > 0.5 || me.dir !== this.lastSent.dir)) {
      this.lastSent = { x: me.x, y: me.y, dir: me.dir, t: time };
      this.bridge.emit('move', { x: Math.round(me.x), y: Math.round(me.y), dir: me.dir });
    }

    for (const v of this.customers.values()) {
      v.walker.followPath(dt);
      v.bubble.setPosition(v.walker.x, v.walker.y - 25).setDepth(9_000 + v.walker.y);
      v.nameTag?.setPosition(Math.round(v.walker.x), Math.round(v.walker.y + 1)).setDepth(8_000 + v.walker.y).setAlpha(v.walker.sprite.alpha);
    }

    const near = this.bridge.state.inputEnabled ? this.nearestInteractable() : null;
    const nearObj = !near && this.bridge.state.inputEnabled ? this.nearObject() : null;
    this.prompt.setVisible(!!near || !!nearObj);
    const pressed = Phaser.Input.Keyboard.JustDown(k.E) || Phaser.Input.Keyboard.JustDown(k.SPACE);
    if (near) {
      this.prompt.setPosition(near.walker.x + 9, Math.round(near.walker.y - 26 + Math.sin(time / 220)));
      if (pressed) this.interact(near);
    } else if (nearObj) {
      this.prompt.setPosition(nearObj.x * TILE + TILE / 2 + 9, Math.round(nearObj.y * TILE + 4 + Math.sin(time / 220)));
      if (pressed) this.useObject(nearObj);
    }
  }

  // ── Câmera ────────────────────────────────────────────────────────────────

  private layoutCamera() {
    const cam = this.cameras.main;
    const { width, height } = this.scale.gameSize;
    const mapW = MAP_W * TILE;
    const mapH = MAP_H * TILE;
    let zoom = Math.max(2, Math.floor(Math.min(width / mapW, height / mapH)));
    // celular em pé: sobra altura; aproxima mais se ainda couberem ~7 tiles de largura
    if (height / zoom > mapH && width / (zoom + 1) >= 7 * TILE) zoom++;
    cam.setZoom(zoom);
    cam.setRoundPixels(true);
    const viewW = width / zoom;
    const viewH = height / zoom;
    if (viewW >= mapW && viewH >= mapH) {
      cam.stopFollow();
      cam.removeBounds();
      cam.centerOn(mapW / 2, mapH / 2);
    } else {
      // limites da câmera; no eixo em que o mapa é menor que a tela, centraliza
      const bx = viewW > mapW ? -(viewW - mapW) / 2 : 0;
      const by = viewH > mapH ? -(viewH - mapH) / 2 : 0;
      cam.setBounds(bx, by, Math.max(mapW, viewW), Math.max(mapH, viewH), true);
      cam.startFollow(this.player.sprite, true, 0.15, 0.15);
    }
  }
}
