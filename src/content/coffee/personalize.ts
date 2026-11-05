// Troca os marcadores {partner}, {sub}, {obj}… pelo nome e pronome do outro jogador.
import type { Scene } from './types';

export type Pronoun = 'she' | 'he';
export type PartnerInfo = { name: string; pronoun: Pronoun };

const FORMS: Record<Pronoun, Record<string, string>> = {
  she: { sub: 'she', Sub: 'She', obj: 'her', pos: 'her', ela: 'ela', Ela: 'Ela' },
  he: { sub: 'he', Sub: 'He', obj: 'him', pos: 'his', ela: 'ele', Ela: 'Ele' },
};

export function fillPlaceholders(text: string, p: PartnerInfo): string {
  const forms = FORMS[p.pronoun];
  return text.replace(/\{(\w+)\}/g, (m, key: string) => (key === 'partner' ? p.name : (forms[key] ?? m)));
}

// Cópia da cena com todos os textos personalizados (falas, opções, respostas, explicações).
export function personalize<T extends Scene>(scene: T, p: PartnerInfo): T {
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return fillPlaceholders(v, p);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(scene) as T;
}
