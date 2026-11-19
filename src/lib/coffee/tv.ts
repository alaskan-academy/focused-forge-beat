// TV da casa: episódio de escuta do dia. Frases de exemplo dos chunks (com tradução); você ouve
// (voz do navegador) e escolhe o que ouviu entre 3 opções parecidas. Mesmo episódio o dia todo.
import { CHUNKS } from '@/content/coffee/chunks';

export type TvQuestion = { en: string; pt: string; options: string[]; answer: number };

export const TV_LINES: { en: string; pt: string }[] = CHUNKS.flatMap((c) => c.examples);

// gerador pseudoaleatório a partir de uma semente (mesmo dia → mesmo episódio)
function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/).filter(Boolean);

export function buildEpisode(day: string, n = 4, lines = TV_LINES): TvQuestion[] {
  const rand = rng(`tv:${day}`);
  const pool = [...lines];
  const out: TvQuestion[] = [];
  while (out.length < n && pool.length) {
    const line = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    // distrações: frases de tamanho parecido (as mais difíceis de separar só de ouvido)
    const len = words(line.en).length;
    const others = lines
      .filter((l) => l.en !== line.en)
      .map((l) => ({ l, d: Math.abs(words(l.en).length - len) + rand() * 3 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .map((x) => x.l.en);
    const options = [line.en, ...others];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    out.push({ en: line.en, pt: line.pt, options, answer: options.indexOf(line.en) });
  }
  return out;
}

const TV_DAY_KEY = 'coffee-cats:tv-day';
export function tvWatched(day: string): boolean {
  try {
    return localStorage.getItem(TV_DAY_KEY) === day;
  } catch {
    return false;
  }
}
export function markTvWatched(day: string) {
  try {
    localStorage.setItem(TV_DAY_KEY, day);
  } catch {
    /* ok */
  }
}
