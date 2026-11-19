import Phaser from 'phaser';
import { CAFE_MAP, TILE, type Point } from '@/lib/coffee/map';
import { pathIn, walkable, type GameMap } from '@/lib/coffee/grid';
import { CAT_FRAMES, CAT_H, CAT_W } from '../art/cat';
import { feetToTile, tileToFeet } from './Walker';

type State = 'sit' | 'walk' | 'sleep';

// textura (folha de quadros) e mapa onde o gato vive; padrão: o Elias no café
export type CatOptions = { texture?: string; map?: GameMap; frameH?: number };

// Elias: passeia pelo café, senta e dorme na almofada (ou na cama do Cantinho, quando existir).
// Às vezes sobe num móvel (`perches`, ex.: a mesa de jogos) e dorme lá em cima.
export class Cat {
  sprite: Phaser.GameObjects.Sprite;
  private path: Point[] = [];
  private state: State = 'sit';
  private until = 0;
  private sleepSpots: Point[];
  private zzz: Phaser.GameObjects.Text;

  private perch: Point | null = null; // móvel onde vai deitar (ou está deitado)

  private map: GameMap;
  private walkAnim: string;

  constructor(private scene: Phaser.Scene, start: Point, sleepSpots: Point[], private perches: Point[] = [], opts: CatOptions = {}) {
    const key = opts.texture ?? 'cat';
    this.map = opts.map ?? CAFE_MAP;
    this.walkAnim = `${key}-walk`;
    // a textura é criada pela cena; aqui só recortamos os quadros (uma vez)
    if (!scene.anims.exists(this.walkAnim)) {
      const tex = scene.textures.get(key);
      const fh = opts.frameH ?? CAT_H;
      for (let f = 0; f < CAT_FRAMES; f++) if (!tex.has(String(f))) tex.add(f, 0, f * CAT_W, 0, CAT_W, fh);
      scene.anims.create({ key: this.walkAnim, frames: [0, 1].map((frame) => ({ key, frame })), frameRate: 6, repeat: -1 });
    }
    const p = tileToFeet(start);
    this.sprite = scene.add.sprite(p.x, p.y + 2, key, 2).setOrigin(0.5, 1);
    this.sleepSpots = sleepSpots;
    this.zzz = scene.add
      .text(0, 0, 'z', { fontFamily: 'monospace', fontSize: '16px', color: '#fffaf0' })
      .setScale(0.5)
      .setResolution(3)
      .setVisible(false);
    this.decide(0);
  }

  setSleepSpots(spots: Point[]) {
    this.sleepSpots = spots;
  }

  update(time: number, dtSec: number) {
    if (this.state === 'walk') {
      if (this.path.length === 0) {
        this.arrive(time);
      } else {
        const t = tileToFeet(this.path[0]);
        const tx = t.x;
        const ty = t.y + 2;
        const dx = tx - this.sprite.x;
        const dy = ty - this.sprite.y;
        const dist = Math.hypot(dx, dy);
        const step = 26 * dtSec;
        if (dist <= step) {
          this.sprite.setPosition(tx, ty);
          this.path.shift();
        } else {
          this.sprite.x += (dx / dist) * step;
          this.sprite.y += (dy / dist) * step;
          if (Math.abs(dx) > 0.5) this.sprite.setFlipX(dx < 0);
        }
      }
    } else if (time > this.until) {
      this.decide(time);
    }
    this.sprite.setDepth(100 + this.sprite.y);
    // respira (mais devagar quando dorme)
    this.sprite.setScale(1, this.state === 'walk' ? 1 : 1 + (this.state === 'sleep' ? 0.05 : 0.03) * Math.sin(time / (this.state === 'sleep' ? 900 : 500)));
    if (this.state === 'sleep') {
      this.zzz.setVisible(true).setPosition(this.sprite.x + 5, this.sprite.y - 16 - ((time / 400) % 4)).setDepth(9_500);
    } else this.zzz.setVisible(false);
  }

  private decide(time: number) {
    const roll = Math.random();
    let target: Point | null = null;
    let sleepAfter = false;
    this.perch = null;
    if (roll < 0.1 && this.perches.length) {
      // sobe num móvel: anda até o lado dele (o caminho para no vizinho andável) e pula
      target = this.perches[Math.floor(Math.random() * this.perches.length)];
      this.perch = target;
      sleepAfter = true;
    } else if (roll < 0.35 && this.sleepSpots.length) {
      target = this.sleepSpots[Math.floor(Math.random() * this.sleepSpots.length)];
      sleepAfter = true;
    } else {
      for (let i = 0; i < 20 && !target; i++) {
        const p = { x: 1 + Math.floor(Math.random() * (this.map.w - 2)), y: 2 + Math.floor(Math.random() * (this.map.h - 3)) };
        if (walkable(this.map, p.x, p.y)) target = p;
      }
    }
    let from = feetToTile(this.sprite.x, this.sprite.y - 2);
    // descendo de um móvel: começa do primeiro vizinho andável
    if (!walkable(this.map, from.x, from.y)) {
      const near = [{ x: from.x, y: from.y - 1 }, { x: from.x - 1, y: from.y }, { x: from.x + 1, y: from.y }, { x: from.x, y: from.y + 1 }].find((p) => walkable(this.map, p.x, p.y));
      if (near) {
        from = near;
        const p = tileToFeet(near);
        this.sprite.setPosition(p.x, p.y + 2);
      }
    }
    this.path = target ? pathIn(this.map, from, target) : [];
    this.sleepNext = sleepAfter;
    if (this.path.length) {
      this.state = 'walk';
      this.sprite.play(this.walkAnim, true);
    } else this.arrive(time);
  }

  private sleepNext = false;

  private arrive(time: number) {
    this.sprite.stop();
    if (this.sleepNext && this.perch) {
      // pula para cima do móvel
      const p = tileToFeet(this.perch);
      this.scene.tweens.add({ targets: this.sprite, x: p.x, y: p.y - 2, duration: 260, ease: 'Quad.out' });
    }
    if (this.sleepNext) {
      this.state = 'sleep';
      this.sprite.setFrame(3);
      this.until = time + 15_000 + Math.random() * 20_000;
    } else {
      this.state = 'sit';
      this.sprite.setFrame(2);
      this.until = time + 3_000 + Math.random() * 6_000;
    }
  }

  // troca a folha de quadros (ex.: a Mucego com outro acessório), mantendo o que ela está fazendo
  retexture(key: string, frameH = CAT_H) {
    const anim = `${key}-walk`;
    if (!this.scene.anims.exists(anim)) {
      const tex = this.scene.textures.get(key);
      for (let f = 0; f < CAT_FRAMES; f++) if (!tex.has(String(f))) tex.add(f, 0, f * CAT_W, 0, CAT_W, frameH);
      this.scene.anims.create({ key: anim, frames: [0, 1].map((frame) => ({ key, frame })), frameRate: 6, repeat: -1 });
    }
    this.walkAnim = anim;
    const frame = Number(this.sprite.frame.name) || 0;
    if (this.state === 'walk') this.sprite.play(anim, true);
    else this.sprite.setTexture(key, frame);
  }

  setPerches(perches: Point[]) {
    this.perches = perches;
  }

  // vai até um lugar e senta lá (ex.: a Mucego do lado de uma planta pronta)
  visit(target: Point) {
    const from = feetToTile(this.sprite.x, this.sprite.y - 2);
    const path = pathIn(this.map, from, target);
    if (!path.length) return;
    this.perch = null;
    this.sleepNext = false;
    this.path = path;
    this.state = 'walk';
    this.sprite.play(this.walkAnim, true);
  }

  get busy() {
    return this.state === 'walk';
  }

  get tilePos(): Point {
    return { x: Math.floor(this.sprite.x / TILE), y: Math.floor((this.sprite.y - 2) / TILE) };
  }
}
