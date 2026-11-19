import Phaser from 'phaser';
import { MAP_H, MAP_W, TILE } from '@/lib/coffee/map';
import { PHASE_LOOK, brasiliaHour, phaseFor, type DayPhase } from './dayPhase';

// Vida do café: vapor da máquina, luz das janelas com poeira, e a cor da hora do dia
// (horário de Brasília): manhã clara, tarde neutra, fim de tarde dourado, noite azulada com
// as arandelas acesas. Para testar outro horário: window.dispatchEvent(new CustomEvent('coffee-hour', { detail: 19 })).

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  scene.textures.addCanvas(key, c);
}

// horário de teste vale para todas as cenas (café, casa, quintal) até voltar para a hora real
let hourOverride: number | null = null;

// machine: de onde sai vapor (opcional) · windows: colunas das janelas (linha 1) · size: tamanho do mapa em tiles
type Options = { machine?: { x: number; y: number }; windows: number[]; lamps: { x: number; y: number }[]; size?: { w: number; h: number } };

export class Ambience {
  private overlay: Phaser.GameObjects.Rectangle;
  private beams: Phaser.GameObjects.Image[] = [];
  private lamps: Phaser.GameObjects.Image[] = [];
  private dust: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private timer: Phaser.Time.TimerEvent;
  private onHour = (e: Event) => {
    const h = (e as CustomEvent<number | null>).detail;
    hourOverride = typeof h === 'number' ? h : null;
    this.apply();
  };

  constructor(
    private scene: Phaser.Scene,
    opts: Options,
  ) {
    canvasTexture(scene, 'fx-dot', 2, 2, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 2, 2);
    });
    canvasTexture(scene, 'fx-glow', 64, 64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,214,150,0.9)');
      g.addColorStop(0.4, 'rgba(255,190,120,0.35)');
      g.addColorStop(1, 'rgba(255,170,100,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    });
    canvasTexture(scene, 'fx-beam', 40, 72, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 72);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(28, 0);
      ctx.lineTo(40, 72);
      ctx.lineTo(0, 72);
      ctx.closePath();
      ctx.fill();
    });

    // vapor da máquina de café (ou do fogão)
    if (opts.machine) {
      scene.add
        .particles(opts.machine.x, opts.machine.y, 'fx-dot', {
          speedY: { min: -12, max: -7 },
          speedX: { min: -3, max: 3 },
          lifespan: 1700,
          alpha: { start: 0.55, end: 0 },
          scale: { start: 0.8, end: 1.8 },
          frequency: 320,
          quantity: 1,
        })
        .setDepth(9_600);
    }

    // luz das janelas (com poeira dançando dentro)
    for (const wx of opts.windows) {
      const x = wx * TILE + TILE / 2;
      const y = 2 * TILE - 4;
      this.beams.push(scene.add.image(x, y, 'fx-beam').setOrigin(0.5, 0).setBlendMode(Phaser.BlendModes.ADD).setDepth(7_850).setAlpha(0));
      this.dust.push(
        scene.add
          .particles(0, 0, 'fx-dot', {
            emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(x - 14, y + 6, 28, 56) } as Phaser.Types.GameObjects.Particles.EmitZoneData,
            speedY: { min: -2, max: 3 },
            speedX: { min: -3, max: 3 },
            lifespan: 4000,
            alpha: { start: 0, end: 0.5, ease: 'Sine.easeInOut' },
            scale: 0.5,
            frequency: 500,
            quantity: 1,
          })
          .setDepth(7_860)
          .setBlendMode(Phaser.BlendModes.ADD),
      );
    }

    // cor da hora do dia (multiplica as cores do café; fica abaixo dos nomes e balões)
    this.overlay = scene.add
      .rectangle(0, 0, (opts.size?.w ?? MAP_W) * TILE, (opts.size?.h ?? MAP_H) * TILE, 0xffffff, 0)
      .setOrigin(0, 0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(7_900);

    // luzes acesas à noite (arandelas, quadro-negro, balcão)
    for (const l of opts.lamps)
      this.lamps.push(scene.add.image(l.x, l.y, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(7_950).setAlpha(0).setScale(1.4));

    this.apply();
    this.timer = scene.time.addEvent({ delay: 60_000, loop: true, callback: () => this.apply() });
    window.addEventListener('coffee-hour', this.onHour);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  get phase(): DayPhase {
    return phaseFor(hourOverride ?? brasiliaHour());
  }

  // aplica a fase atual com uma transição suave
  apply() {
    const look = PHASE_LOOK[this.phase];
    this.overlay.setFillStyle(look.tint, 1);
    this.scene.tweens.add({ targets: this.overlay, alpha: look.tintAlpha, duration: 1200 });
    for (const b of this.beams) {
      b.setTint(look.beamTint);
      this.scene.tweens.add({ targets: b, alpha: look.beams, duration: 1200 });
    }
    for (const d of this.dust) d.emitting = look.dust;
    // lâmpadas "respiram" de leve quando acesas
    for (const [i, l] of this.lamps.entries()) {
      this.scene.tweens.killTweensOf(l);
      this.scene.tweens.add({ targets: l, alpha: look.lamps, duration: 1200 });
      if (look.lamps > 0)
        this.scene.tweens.add({ targets: l, scale: { from: 1.35, to: 1.5 }, duration: 1800 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  destroy() {
    window.removeEventListener('coffee-hour', this.onHour);
    this.timer.remove();
  }
}
