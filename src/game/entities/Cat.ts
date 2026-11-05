import Phaser from 'phaser';
import { MAP_H, MAP_W, TILE, findPath, isWalkable, type Point } from '@/lib/coffee/map';
import { CAT_FRAMES, CAT_H, CAT_W } from '../art/cat';
import { feetToTile, tileToFeet } from './Walker';

type State = 'sit' | 'walk' | 'sleep';

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

  constructor(private scene: Phaser.Scene, start: Point, sleepSpots: Point[], private perches: Point[] = []) {
    // a textura 'cat' é criada pela cena; aqui só recortamos os quadros (uma vez)
    if (!scene.anims.exists('cat-walk')) {
      const tex = scene.textures.get('cat');
      for (let f = 0; f < CAT_FRAMES; f++) tex.add(f, 0, f * CAT_W, 0, CAT_W, CAT_H);
      scene.anims.create({ key: 'cat-walk', frames: [0, 1].map((frame) => ({ key: 'cat', frame })), frameRate: 6, repeat: -1 });
    }
    const p = tileToFeet(start);
    this.sprite = scene.add.sprite(p.x, p.y + 2, 'cat', 2).setOrigin(0.5, 1);
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
        const p = { x: 1 + Math.floor(Math.random() * (MAP_W - 2)), y: 2 + Math.floor(Math.random() * (MAP_H - 3)) };
        if (isWalkable(p.x, p.y)) target = p;
      }
    }
    let from = feetToTile(this.sprite.x, this.sprite.y - 2);
    // descendo de um móvel: começa do primeiro vizinho andável
    if (!isWalkable(from.x, from.y)) {
      const near = [{ x: from.x, y: from.y - 1 }, { x: from.x - 1, y: from.y }, { x: from.x + 1, y: from.y }, { x: from.x, y: from.y + 1 }].find((p) => isWalkable(p.x, p.y));
      if (near) {
        from = near;
        const p = tileToFeet(near);
        this.sprite.setPosition(p.x, p.y + 2);
      }
    }
    this.path = target ? findPath(from, target) : [];
    this.sleepNext = sleepAfter;
    if (this.path.length) {
      this.state = 'walk';
      this.sprite.play('cat-walk', true);
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

  get tilePos(): Point {
    return { x: Math.floor(this.sprite.x / TILE), y: Math.floor((this.sprite.y - 2) / TILE) };
  }
}
