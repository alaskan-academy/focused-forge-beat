// Trilha do café: lo-fi aconchegante composto em código (Web Audio), sem arquivos e sem direitos autorais.
// Acordes suaves + baixo + melodia pentatônica que varia a cada volta + percussão bem baixinha.

const BPM = 72;
const STEP = 60 / BPM / 2; // colcheia
const STEPS_PER_BAR = 8;

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Fá maior: Fmaj7 – Dm7 – Gm7 – C9 | Fmaj7 – Am7 – Bbmaj7 – C7sus
const CHORDS: number[][] = [
  [53, 57, 60, 64],
  [50, 53, 57, 60],
  [55, 58, 62, 65],
  [48, 52, 55, 62],
  [53, 57, 60, 64],
  [57, 60, 64, 67],
  [58, 62, 65, 69],
  [48, 53, 55, 58],
];
const PENTA = [65, 67, 69, 72, 74, 77, 79, 81]; // F G A C D F G A

const PREFS_KEY = 'coffee-cats:music';
export type MusicPrefs = { volume: number; muted: boolean };

export function loadMusicPrefs(): MusicPrefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}');
    return { volume: typeof p.volume === 'number' ? Math.min(1, Math.max(0, p.volume)) : 0.5, muted: p.muted === true };
  } catch {
    return { volume: 0.5, muted: false };
  }
}

export function saveMusicPrefs(p: MusicPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ok */
  }
}

export class CozyMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private delay: DelayNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private loop = 0;
  private prefs: MusicPrefs;

  constructor(prefs: MusicPrefs) {
    this.prefs = prefs;
  }

  get playing() {
    return this.timer !== null;
  }

  // Precisa ser chamado a partir de um clique/toque (regra de autoplay dos navegadores).
  async start() {
    if (this.timer !== null) return;
    if (!this.ctx) this.setup();
    await this.ctx!.resume();
    this.nextTime = this.ctx!.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 100);
    this.applyVolume();
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.ctx?.suspend();
  }

  dispose() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }

  setPrefs(p: MusicPrefs) {
    this.prefs = p;
    this.applyVolume();
  }

  private applyVolume() {
    if (!this.master || !this.ctx) return;
    const v = this.prefs.muted ? 0 : this.prefs.volume * 0.4;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.15);
  }

  private setup() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    // filtro geral para deixar tudo "abafado" (lo-fi)
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2600;
    this.master.connect(tone).connect(ctx.destination);
    // eco leve para a melodia
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = STEP * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    this.delay.connect(fb).connect(this.delay);
    this.delay.connect(wet).connect(this.master);
    // ruído para chiado/percussão
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
  }

  private schedule() {
    const ctx = this.ctx!;
    while (this.nextTime < ctx.currentTime + 0.4) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += STEP * (this.step % 2 === 0 ? 1.08 : 0.92); // leve "swing"
      this.step++;
      if (this.step >= CHORDS.length * STEPS_PER_BAR) {
        this.step = 0;
        this.loop++;
      }
    }
  }

  private playStep(step: number, t: number) {
    const bar = Math.floor(step / STEPS_PER_BAR);
    const beat = step % STEPS_PER_BAR;
    const chord = CHORDS[bar];

    if (beat === 0) {
      chord.forEach((n, i) => this.pad(midi(n), t + i * 0.03, STEP * STEPS_PER_BAR * 0.98));
      this.bass(midi(chord[0] - 12), t, STEP * 3);
    }
    if (beat === 4) this.bass(midi(chord[0] - 12 + (bar % 2 ? 7 : 0)), t, STEP * 2.5);

    // percussão bem suave
    if (beat === 0 || beat === 5) this.kick(t);
    if (beat === 4) this.snare(t);
    if (beat % 2 === 1) this.hat(t, beat === 7 ? 0.05 : 0.03);

    // melodia: varia a cada volta, mas é sempre consonante (pentatônica)
    const seed = Math.sin((step + 1) * 12.9898 + this.loop * 78.233) * 43758.5453;
    const r = seed - Math.floor(seed);
    if (r < (beat % 2 === 0 ? 0.55 : 0.25)) {
      const note = PENTA[Math.floor(r * 997) % PENTA.length];
      this.pluck(midi(note), t, STEP * (r < 0.15 ? 2.5 : 1.4));
    }
  }

  private env(g: GainNode, t: number, peak: number, attack: number, dur: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  private pad(freq: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    o.detune.value = (Math.random() - 0.5) * 8;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const g = ctx.createGain();
    this.env(g, t, 0.05, 0.6, dur);
    o.connect(f).connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  private bass(freq: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = ctx.createGain();
    this.env(g, t, 0.22, 0.02, dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private pluck(freq: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = freq * 2;
    const g = ctx.createGain();
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    this.env(g, t, 0.09, 0.01, dur);
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(this.master!);
    g.connect(this.delay!);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
  }

  private kick(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    const g = ctx.createGain();
    this.env(g, t, 0.28, 0.005, 0.25);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.3);
  }

  private noiseHit(t: number, type: BiquadFilterType, freq: number, peak: number, dur: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    this.env(g, t, peak, 0.003, dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  private snare(t: number) {
    this.noiseHit(t, 'bandpass', 1800, 0.07, 0.16);
  }

  private hat(t: number, peak: number) {
    this.noiseHit(t, 'highpass', 7000, peak, 0.05);
  }
}
