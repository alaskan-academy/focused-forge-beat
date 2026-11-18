import { describe, expect, it } from 'vitest';
import { brasiliaHour, phaseFor } from './dayPhase';

describe('hora do dia no café', () => {
  it('fases pelo horário de Brasília', () => {
    expect(phaseFor(7)).toBe('morning');
    expect(phaseFor(13)).toBe('day');
    expect(phaseFor(17)).toBe('golden');
    expect(phaseFor(19)).toBe('evening');
    expect(phaseFor(23)).toBe('night');
    expect(phaseFor(3)).toBe('night');
  });

  it('converte para o horário de Brasília', () => {
    expect(Math.floor(brasiliaHour(new Date('2026-11-18T22:30:00Z')))).toBe(19); // 19:30 em Brasília
  });
});
