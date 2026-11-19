import { describe, expect, it } from 'vitest';
import { TV_LINES, buildEpisode } from './tv';

describe('episódio da TV', () => {
  it('tem frases suficientes', () => {
    expect(TV_LINES.length).toBeGreaterThan(30);
  });

  it('4 perguntas com 3 opções diferentes e a resposta certa entre elas', () => {
    const ep = buildEpisode('2026-11-18');
    expect(ep).toHaveLength(4);
    for (const q of ep) {
      expect(new Set(q.options).size).toBe(3);
      expect(q.options[q.answer]).toBe(q.en);
    }
    expect(new Set(ep.map((q) => q.en)).size).toBe(4);
  });

  it('mesmo dia, mesmo episódio; outro dia, outro', () => {
    expect(buildEpisode('2026-11-18')).toEqual(buildEpisode('2026-11-18'));
    expect(buildEpisode('2026-11-19').map((q) => q.en)).not.toEqual(buildEpisode('2026-11-18').map((q) => q.en));
  });
});
