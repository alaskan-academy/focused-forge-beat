// Fases do dia no café (horário de Brasília) e o visual de cada uma. Lógica pura (testável sem Phaser).

export type DayPhase = 'morning' | 'day' | 'golden' | 'evening' | 'night';

export function phaseFor(hour: number): DayPhase {
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 16) return 'day';
  if (hour >= 16 && hour < 18.5) return 'golden';
  if (hour >= 18.5 && hour < 21) return 'evening';
  return 'night';
}

// cor e força de cada camada por fase
export const PHASE_LOOK: Record<DayPhase, { tint: number; tintAlpha: number; beams: number; beamTint: number; lamps: number; dust: boolean }> = {
  morning: { tint: 0xfff1d6, tintAlpha: 0.18, beams: 0.2, beamTint: 0xfff6dc, lamps: 0, dust: true },
  day: { tint: 0xffffff, tintAlpha: 0, beams: 0.13, beamTint: 0xffffff, lamps: 0, dust: true },
  golden: { tint: 0xffbf80, tintAlpha: 0.3, beams: 0.24, beamTint: 0xffc070, lamps: 0.2, dust: true },
  evening: { tint: 0x8c7cc0, tintAlpha: 0.42, beams: 0, beamTint: 0xffffff, lamps: 0.55, dust: false },
  night: { tint: 0x2e3a78, tintAlpha: 0.62, beams: 0, beamTint: 0xffffff, lamps: 0.75, dust: false },
};

export function brasiliaHour(d = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 12) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h + m / 60;
}
