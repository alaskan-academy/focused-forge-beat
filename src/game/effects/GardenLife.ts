import Phaser from 'phaser';
import { TILE } from '@/lib/coffee/map';
import { charAt } from '@/lib/coffee/grid';
import { GARDEN_MAP } from '@/lib/coffee/garden';
import { BUTTERFLY_COLORS, buildButterfly, buildFlower, buildTuft } from '../art/gardenWorld';
import type { Ambience } from './Ambience';

// Vida do quintal: grama e flores balançando, borboletas de dia, vaga-lumes à noite, pétalas
// caindo, brilho e peixinhos pulando no lago, sombra de nuvens passando e luz de sol quente.
// Tudo leve: poucas dezenas de objetos e partículas pequenas.

type Butterfly = { s: Phaser.GameObjects.Sprite; tx: number; ty: number; speed: number; phase: number };

function tex(scene: Phaser.Scene, key: string, make: () => HTMLCanvasElement) {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, make());
}

function softBlob(w: number, h: number, inner: string, outer: string) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.scale(1, h / w);
  const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
  return c;
}

const isGrass = (x: number, y: number) => charAt(GARDEN_MAP, x, y) === 'G';

export class GardenLife {
  private butterflies: Butterfly[] = [];
  private clouds: Phaser.GameObjects.Image[] = [];
  private sun: Phaser.GameObjects.Image;
  private fireflies: Phaser.GameObjects.Particles.ParticleEmitter;
  private petals: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkles: Phaser.GameObjects.Particles.ParticleEmitter;
  private nextJump = 0;
  private W = GARDEN_MAP.w * TILE;
  private H = GARDEN_MAP.h * TILE;
  private onHour = () => this.apply();

  constructor(
    private scene: Phaser.Scene,
    private ambience: Ambience,
  ) {
    tex(scene, 'g-tuft', buildTuft);
    ['#fffaf0', '#ffe27a', '#ff9fb8', '#c9a8ff'].forEach((col, i) => tex(scene, `g-flower${i}`, () => buildFlower(col)));
    BUTTERFLY_COLORS.forEach((col, i) => {
      tex(scene, `g-bfly${i}`, () => buildButterfly(col));
      const t = scene.textures.get(`g-bfly${i}`);
      if (!t.has('0')) {
        t.add(0, 0, 0, 0, 7, 5);
        t.add(1, 0, 7, 0, 7, 5);
      }
      if (!scene.anims.exists(`g-bfly${i}`)) scene.anims.create({ key: `g-bfly${i}`, frames: [0, 1].map((frame) => ({ key: `g-bfly${i}`, frame })), frameRate: 8, repeat: -1 });
    });
    tex(scene, 'g-cloud', () => softBlob(160, 90, 'rgba(40,60,90,1)', 'rgba(40,60,90,0)'));
    tex(scene, 'g-sun', () => softBlob(256, 256, 'rgba(255,226,160,1)', 'rgba(255,200,120,0)'));
    tex(scene, 'g-glow', () => softBlob(10, 10, 'rgba(255,250,170,1)', 'rgba(220,255,120,0)'));
    tex(scene, 'g-petal', () => {
      const c = document.createElement('canvas');
      c.width = 2;
      c.height = 2;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffb3c8';
      ctx.fillRect(0, 0, 2, 1);
      ctx.fillStyle = '#ff8fb1';
      ctx.fillRect(0, 1, 1, 1);
      return c;
    });

    // tufos de grama e flores que balançam com o vento (embaixo de tudo)
    const rand = new Phaser.Math.RandomDataGenerator(['garden-life']);
    for (let i = 0; i < 90; i++) {
      const tx = rand.between(1, GARDEN_MAP.w - 2);
      const ty = rand.between(1, GARDEN_MAP.h - 2);
      if (!isGrass(tx, ty)) continue;
      const flower = rand.frac() < 0.35;
      const s = scene.add
        .image(tx * TILE + rand.between(2, 14), ty * TILE + rand.between(6, 15), flower ? `g-flower${rand.between(0, 3)}` : 'g-tuft')
        .setOrigin(0.5, 1)
        .setDepth(1.2);
      scene.tweens.add({ targets: s, angle: { from: -7, to: 7 }, duration: rand.between(1300, 2000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rand.between(0, 1500) });
    }

    // luz de sol quente vindo de cima/esquerda
    this.sun = scene.add.image(this.W * 0.2, -20, 'g-sun').setScale(3).setBlendMode(Phaser.BlendModes.ADD).setDepth(7_960).setAlpha(0);

    // sombras de nuvens passando devagar
    for (let i = 0; i < 2; i++)
      this.clouds.push(
        scene.add
          .image(rand.between(0, this.W), rand.between(40, this.H - 40), 'g-cloud')
          .setScale(1.4 + i * 0.4)
          .setDepth(7_800)
          .setAlpha(0),
      );

    // borboletas
    for (let i = 0; i < 4; i++) {
      const s = scene.add.sprite(rand.between(40, this.W - 40), rand.between(40, this.H - 40), `g-bfly${i}`, 0).setDepth(9_200);
      s.play({ key: `g-bfly${i}`, startFrame: i % 2 });
      this.butterflies.push({ s, tx: s.x, ty: s.y, speed: rand.between(10, 16), phase: rand.frac() * 6 });
    }

    // vaga-lumes (fim de tarde e noite)
    this.fireflies = scene.add
      .particles(0, 0, 'g-glow', {
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(TILE, TILE, this.W - TILE * 2, this.H - TILE * 2) } as Phaser.Types.GameObjects.Particles.EmitZoneData,
        speedX: { min: -5, max: 5 },
        speedY: { min: -5, max: 3 },
        lifespan: { min: 3000, max: 5000 },
        alpha: { values: [0, 1, 0.3, 1, 0] },
        scale: { min: 1, max: 1.5 },
        frequency: 260,
        maxAliveParticles: 26,
        blendMode: 'ADD',
      })
      .setDepth(9_250);

    // pétalas caindo com o vento
    this.petals = scene.add
      .particles(0, 0, 'g-petal', {
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-40, -10, this.W, 10) } as Phaser.Types.GameObjects.Particles.EmitZoneData,
        speedX: { min: 6, max: 14 },
        speedY: { min: 8, max: 14 },
        rotate: { min: 0, max: 360 },
        lifespan: 16_000,
        alpha: { start: 1, end: 0.6 },
        frequency: 1400,
        maxAliveParticles: 14,
      })
      .setDepth(9_150);

    // brilhinhos no lago
    const water: Phaser.Geom.Rectangle[] = [];
    for (let y = 0; y < GARDEN_MAP.h; y++)
      for (let x = 0; x < GARDEN_MAP.w; x++)
        if (charAt(GARDEN_MAP, x, y) === 'w' && charAt(GARDEN_MAP, x, y - 1) === 'w') water.push(new Phaser.Geom.Rectangle(x * TILE + 2, y * TILE + 1, TILE - 4, TILE - 4));
    const lake = { getRandomPoint: (p: Phaser.Types.Math.Vector2Like) => Phaser.Geom.Rectangle.Random(water[Math.floor(Math.random() * water.length)], p as Phaser.Geom.Point) };
    this.sparkles = scene.add
      .particles(0, 0, 'fx-dot', {
        emitZone: { type: 'random', source: lake } as Phaser.Types.GameObjects.Particles.EmitZoneData,
        lifespan: 900,
        alpha: { values: [0, 0.9, 0] },
        scale: { start: 0.5, end: 1 },
        frequency: 220,
        blendMode: 'ADD',
      })
      .setDepth(1.4);
    this.water = water;

    this.apply();
    const timer = scene.time.addEvent({ delay: 60_000, loop: true, callback: () => this.apply() });
    window.addEventListener('coffee-hour', this.onHour);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      timer.remove();
      window.removeEventListener('coffee-hour', this.onHour);
    });
  }

  private water: Phaser.Geom.Rectangle[] = [];
  private dayish = true;

  // liga/desliga cada coisa conforme a hora do dia
  apply() {
    const phase = this.ambience.phase;
    const day = phase === 'morning' || phase === 'day' || phase === 'golden';
    this.dayish = day;
    const sun = phase === 'golden' ? 0.32 : phase === 'morning' ? 0.24 : phase === 'day' ? 0.16 : 0;
    this.scene.tweens.add({ targets: this.sun, alpha: sun, duration: 1200 });
    if (phase === 'golden') this.sun.setTint(0xffb070);
    else this.sun.clearTint();
    for (const c of this.clouds) this.scene.tweens.add({ targets: c, alpha: day ? 0.13 : 0, duration: 1200 });
    for (const b of this.butterflies) b.s.setVisible(day);
    this.fireflies.emitting = !day;
    this.petals.emitting = day;
  }

  update(time: number, dt: number) {
    // nuvens atravessam o mapa e voltam pelo outro lado
    for (const c of this.clouds) {
      c.x += 4 * dt;
      if (c.x - c.displayWidth / 2 > this.W) c.x = -c.displayWidth / 2;
    }
    // borboletas: voam até um ponto, escolhem outro; sobem e descem de leve
    if (this.dayish)
      for (const b of this.butterflies) {
        const dx = b.tx - b.s.x;
        const dy = b.ty - b.s.y;
        const d = Math.hypot(dx, dy);
        if (d < 3) {
          b.tx = Phaser.Math.Between(TILE * 2, this.W - TILE * 2);
          b.ty = Phaser.Math.Between(TILE * 2, this.H - TILE * 2);
        } else {
          b.s.x += (dx / d) * b.speed * dt;
          b.s.y += (dy / d) * b.speed * dt + Math.sin(time / 180 + b.phase) * 0.35;
          b.s.setFlipX(dx < 0);
        }
      }
    // peixinho pulando no lago (só um anel de água e um respingo)
    if (time > this.nextJump && this.water.length) {
      this.nextJump = time + Phaser.Math.Between(5_000, 11_000);
      const r = this.water[Math.floor(Math.random() * this.water.length)];
      const x = r.centerX;
      const y = r.centerY;
      const ring = this.scene.add.ellipse(x, y, 4, 2).setStrokeStyle(1, 0xe8fbff, 0.9).setDepth(1.45);
      this.scene.tweens.add({ targets: ring, scaleX: 4, scaleY: 4, alpha: 0, duration: 1400, ease: 'Sine.out', onComplete: () => ring.destroy() });
      const drop = this.scene.add.rectangle(x, y, 1, 2, 0xe8fbff).setDepth(1.46);
      this.scene.tweens.add({ targets: drop, y: y - 6, duration: 220, yoyo: true, ease: 'Sine.out', onComplete: () => drop.destroy() });
    }
  }
}
