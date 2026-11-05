import Phaser from 'phaser';
import type { Appearance, Direction } from '@/lib/coffee/character';
import { TILE, isWalkable, type Point } from '@/lib/coffee/map';
import { ensureCharacterTexture, idleFrame } from '../characterTextures';

// Posição dos pés dentro de um tile.
export const FEET_OFFSET_Y = 12;
export const tileToFeet = (p: Point) => ({ x: p.x * TILE + TILE / 2, y: p.y * TILE + FEET_OFFSET_Y });
export const feetToTile = (x: number, y: number): Point => ({ x: Math.floor(x / TILE), y: Math.floor(y / TILE) });

// Um personagem que anda pelo café (jogador, outro jogador ou cliente).
export class Walker {
  sprite: Phaser.GameObjects.Sprite;
  dir: Direction = 'down';
  path: Point[] = [];
  speed: number;
  private texKey: string;
  private moving = false;
  onArrive?: () => void;

  constructor(
    private scene: Phaser.Scene,
    appearance: Appearance,
    start: Point,
    speed = 64,
  ) {
    this.texKey = ensureCharacterTexture(scene, appearance);
    const p = tileToFeet(start);
    this.sprite = scene.add.sprite(p.x, p.y, this.texKey, idleFrame('down')).setOrigin(0.5, 1);
    this.speed = speed;
    this.syncDepth();
  }

  get x() {
    return this.sprite.x;
  }
  get y() {
    return this.sprite.y;
  }
  get tile(): Point {
    return feetToTile(this.sprite.x, this.sprite.y);
  }

  setAppearance(a: Appearance) {
    this.texKey = ensureCharacterTexture(this.scene, a);
    this.sprite.setTexture(this.texKey, idleFrame(this.dir));
    this.moving = false;
  }

  face(dir: Direction) {
    this.dir = dir;
    if (!this.moving) this.sprite.setFrame(idleFrame(dir));
  }

  // Movimento livre (teclado) com colisão de caixa nos pés, eixo por eixo.
  moveBy(dx: number, dy: number, dtSec: number) {
    if (dx === 0 && dy === 0) {
      this.setMoving(false);
      return;
    }
    const len = Math.hypot(dx, dy);
    const step = (this.speed * dtSec) / len;
    const nx = this.sprite.x + dx * step;
    if (this.boxFree(nx, this.sprite.y)) this.sprite.x = nx;
    const ny = this.sprite.y + dy * step;
    if (this.boxFree(this.sprite.x, ny)) this.sprite.y = ny;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    this.setMoving(true);
    this.syncDepth();
  }

  // Segue `path` (tiles) até o fim. Retorna true enquanto ainda está andando.
  followPath(dtSec: number): boolean {
    if (this.path.length === 0) return false;
    const target = tileToFeet(this.path[0]);
    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dtSec;
    if (dist <= step) {
      this.sprite.setPosition(target.x, target.y);
      this.path.shift();
      if (this.path.length === 0) {
        this.setMoving(false);
        this.syncDepth();
        const cb = this.onArrive;
        this.onArrive = undefined;
        cb?.();
        return false;
      }
    } else {
      this.sprite.x += (dx / dist) * step;
      this.sprite.y += (dy / dist) * step;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      this.setMoving(true);
    }
    this.syncDepth();
    return true;
  }

  // Vai suavemente até (x, y) — usado para a outra pessoa (posição recebida em tempo real).
  // Se estiver muito longe (entrou agora / reconectou), teleporta.
  moveTowards(x: number, y: number, dtSec: number, dir?: Direction) {
    const dx = x - this.sprite.x;
    const dy = y - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    if (dist > TILE * 6) {
      this.sprite.setPosition(x, y);
    } else if (dist > 0.5) {
      const step = Math.min(dist, Math.max(this.speed, dist * 6) * dtSec);
      this.sprite.x += (dx / dist) * step;
      this.sprite.y += (dy / dist) * step;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      this.setMoving(true);
      this.syncDepth();
      return;
    }
    if (dir) this.dir = dir;
    this.setMoving(false);
    this.sprite.setFrame(idleFrame(this.dir));
    this.syncDepth();
  }

  stop() {
    this.path = [];
    this.onArrive = undefined;
    this.setMoving(false);
  }

  destroy() {
    this.sprite.destroy();
  }

  private setMoving(m: boolean) {
    const anim = `${this.texKey}:walk-${this.dir}`;
    if (m) {
      if (!this.moving || this.sprite.anims.currentAnim?.key !== anim) this.sprite.play(anim, true);
    } else if (this.moving) {
      this.sprite.stop();
      this.sprite.setFrame(idleFrame(this.dir));
    }
    this.moving = m;
  }

  private syncDepth() {
    this.sprite.setDepth(100 + this.sprite.y);
  }

  private boxFree(x: number, y: number) {
    const hw = 4;
    const top = y - 4;
    const bottom = y;
    const corners = [
      [x - hw, top],
      [x + hw - 0.01, top],
      [x - hw, bottom - 0.01],
      [x + hw - 0.01, bottom - 0.01],
    ];
    return corners.every(([cx, cy]) => isWalkable(Math.floor(cx / TILE), Math.floor(cy / TILE)));
  }
}
