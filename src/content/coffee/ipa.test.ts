import { describe, expect, it } from 'vitest';
import { VOCAB } from './vocab';
import { CHUNKS } from './chunks';
import { SUDOKU_WORDS } from './sudokuWords';
import { ipaFor } from './ipa';

describe('IPA', () => {
  it('todo vocabulário, chunk e palavra do Sudoku tem IPA (falta = acrescentar a palavra em ipa.ts)', () => {
    const missing = [...VOCAB.map((v) => v.en), ...CHUNKS.map((c) => c.en), ...SUDOKU_WORDS.map((w) => w.en)].filter((en) => !ipaFor(en));
    expect(missing).toEqual([]);
  });

  it('formas fracas dentro da expressão, fortes sozinhas ou no fim', () => {
    expect(ipaFor('take care of')).toBe('/teɪk kɛr əv/');
    expect(ipaFor('to')).toBe('/tu/');
    expect(ipaFor("I'm into")).toBe('/aɪm ˈɪntu/');
    expect(ipaFor('can I get')).toBe('/kən aɪ ɡɛt/');
  });

  it('"the" antes de vogal e pares especiais', () => {
    expect(ipaFor('the whole')).toBe('/ðə hoʊl/');
    expect(ipaFor('the apple')).toBe('/ði ˈæpəl/');
    expect(ipaFor('used to')).toBe('/ˈjustə/');
  });

  it('palavra desconhecida = sem IPA (as anotações à mão só ganham IPA se todas as palavras forem conhecidas)', () => {
    expect(ipaFor('supercalifragilistic')).toBeNull();
    expect(ipaFor('No worries!')).toBe('/noʊ ˈwɜriz/');
  });
});
