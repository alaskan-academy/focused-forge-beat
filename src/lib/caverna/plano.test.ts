import { describe, it, expect } from 'vitest';
import { diaDaSemana, fase, metaAgua, roteiroDoDia, treinoDoDia, TOTAL_DIAS } from './plano';
import { calcularPontos, calcularSequencia } from './progresso';

describe('plano do Modo Caverna', () => {
  it('o dia da semana vem da data real e os dias 29–30 seguem a fase 4', () => {
    expect(diaDaSemana(new Date(2026, 9, 26))).toBe(0); // segunda, 26/10/2026
    expect(diaDaSemana(new Date(2026, 9, 29))).toBe(3); // quinta
    expect(diaDaSemana(new Date(2026, 10, 1))).toBe(6); // domingo
    expect(fase(8)).toBe(2);
    expect(fase(29)).toBe(4);
  });

  it('a água do roteiro soma a meta de cada um, nos dois papéis', () => {
    for (let dia = 1; dia <= TOTAL_DIAS; dia++) {
      for (let sem = 0; sem < 7; sem++) {
        const domingo = sem === 6;
        for (const papel of ['casa', 'suporte'] as const) {
          expect(metaAgua(dia, papel, 'lucas', sem)).toBe(domingo ? 3400 : 3900);
          expect(metaAgua(dia, papel, 'jessica', sem)).toBe(domingo ? 2500 : 3000);
        }
      }
    }
  });

  it('o horário de dormir acompanha a fase, não o dia da semana', () => {
    expect(roteiroDoDia(1, 'casa', 3).at(-1)?.hora).toBe('23:30');
    expect(roteiroDoDia(15, 'casa', 3).at(-1)?.hora).toBe('22:30');
  });

  it('o roteiro segue o dia da semana real, mesmo começando fora da segunda', () => {
    // Dia 1 numa quinta: roteiro de quinta (sessão de música), não de segunda.
    expect(roteiroDoDia(1, 'casa', 3).some((l) => l.oque.startsWith('Sessão de música'))).toBe(true);
    expect(roteiroDoDia(1, 'casa', 2).some((l) => l.oque.startsWith('Compras'))).toBe(true);
  });

  it('tarefas de casa só aparecem para quem está na casa', () => {
    expect(roteiroDoDia(1, 'casa', 0).some((l) => l.oque === 'Casa e pets')).toBe(true);
    expect(roteiroDoDia(1, 'suporte', 0).some((l) => l.oque === 'Casa e pets')).toBe(false);
  });

  it('treinos alternam A/B/A e B/A/B entre semanas', () => {
    expect([0, 3, 4].map((sem) => treinoDoDia(3, sem)?.letra)).toEqual(['A', 'B', 'A']);
    expect([0, 3, 4].map((sem) => treinoDoDia(10, sem)?.letra)).toEqual(['B', 'A', 'B']);
    expect(treinoDoDia(1, 1)).toBeNull();
    expect(treinoDoDia(1, 4)?.lucasComecaComPuxadores).toBe(false);
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

  it('toda linha do roteiro tem explicação, nos dois papéis', () => {
    for (let sem = 0; sem < 7; sem++) {
      for (const papel of ['casa', 'suporte'] as const) {
        for (const l of roteiroDoDia(1, papel, sem)) {
          expect(l.explica?.length, `${sem} ${papel} ${l.hora} ${l.oque}`).toBeGreaterThan(0);
        }
      }
    }
  });
});
