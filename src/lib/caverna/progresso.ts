import { META_CHECKLIST, type ItemId } from './plano';

export function calcularPontos(itens: Partial<Record<ItemId, boolean>>, aguaMl: number, metaAgua: number): number {
  const marcados = (Object.keys(itens) as ItemId[]).filter((k) => k !== 'agua' && itens[k]).length;
  return Math.min(7, marcados + (aguaMl >= metaAgua ? 1 : 0));
}

/**
 * Sequência de dias seguidos com a meta batida (6 de 7), terminando no dia atual
 * (ou no dia anterior, se o dia atual ainda não bateu a meta), e o recorde.
 */
export function calcularSequencia(pontosPorDia: Map<number, number>, diaAtual: number) {
  const bateu = (d: number) => (pontosPorDia.get(d) ?? 0) >= META_CHECKLIST;

  let fim = bateu(diaAtual) ? diaAtual : diaAtual - 1;
  let atual = 0;
  while (fim >= 1 && bateu(fim)) {
    atual++;
    fim--;
  }

  let recorde = 0;
  let corrida = 0;
  for (let d = 1; d <= diaAtual; d++) {
    corrida = bateu(d) ? corrida + 1 : 0;
    recorde = Math.max(recorde, corrida);
  }
  return { atual, recorde };
}
