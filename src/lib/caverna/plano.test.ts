import { describe, it, expect } from 'vitest';
import { diaDaSemana, fase, metaAgua, roteiroDoDia, treinoDoDia, TOTAL_DIAS } from './plano';
import { calcularPontos, calcularSequencia } from './progresso';

describe('plano do Modo Caverna', () => {
  it('dia 1 é segunda e os dias 29–30 seguem a fase 4', () => {
    expect(diaDaSemana(1)).toBe(0);
    expect(diaDaSemana(7)).toBe(6);
    expect(fase(8)).toBe(2);
    expect(fase(29)).toBe(4);
  });

  it('a água do roteiro soma a meta de cada um, nos dois papéis', () => {
    for (let dia = 1; dia <= TOTAL_DIAS; dia++) {
      const domingo = diaDaSemana(dia) === 6;
      for (const papel of ['casa', 'suporte'] as const) {
        expect(metaAgua(dia, papel, 'lucas')).toBe(domingo ? 3400 : 3900);
        expect(metaAgua(dia, papel, 'jessica')).toBe(domingo ? 2500 : 3000);
      }
    }
  });

  it('o horário de dormir acompanha a fase', () => {
    expect(roteiroDoDia(1, 'casa').at(-1)?.hora).toBe('23:30');
    expect(roteiroDoDia(15, 'casa').at(-1)?.hora).toBe('22:30');
  });

  it('tarefas de casa só aparecem para quem está na casa', () => {
    expect(roteiroDoDia(1, 'casa').some((l) => l.oque === 'Casa e pets')).toBe(true);
    expect(roteiroDoDia(1, 'suporte').some((l) => l.oque === 'Casa e pets')).toBe(false);
  });

  it('treinos alternam A/B/A e B/A/B entre semanas', () => {
    expect([1, 4, 5].map((d) => treinoDoDia(d)?.letra)).toEqual(['A', 'B', 'A']);
    expect([8, 11, 12].map((d) => treinoDoDia(d)?.letra)).toEqual(['B', 'A', 'B']);
    expect(treinoDoDia(2)).toBeNull();
    expect(treinoDoDia(5)?.lucasComecaComPuxadores).toBe(false);
  });
});

describe('progresso', () => {
  it('conta a água pela meta, não pelo item marcado', () => {
    expect(calcularPontos({ acordar: true, agua: true }, 1000, 3000)).toBe(1);
    expect(calcularPontos({ acordar: true }, 3000, 3000)).toBe(2);
  });

  it('sequência ignora o dia atual ainda em aberto', () => {
    const p = new Map([[1, 7], [2, 6], [3, 3], [4, 6], [5, 6], [6, 2]]);
    expect(calcularSequencia(p, 6)).toEqual({ atual: 2, recorde: 2 });
    p.set(6, 6);
    expect(calcularSequencia(p, 6)).toEqual({ atual: 3, recorde: 3 });
  });
});
