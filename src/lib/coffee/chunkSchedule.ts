// Chunk do dia: um chunk novo a cada 12 h, na ordem de content/coffee/chunks.ts.
// Se você ficar dias sem jogar, não pula nenhum: o próximo da fila espera por você.
// O progresso é o próprio SRS: um chunk "recebido" é um item c:... que já tem estado.
import { CHUNKS, type Chunk } from '@/content/coffee/chunks';
import type { VocabState } from './srs';

export const CHUNK_EVERY_HOURS = 12;
const PERIOD = CHUNK_EVERY_HOURS * 3_600_000;

export type ChunkStatus = {
  learned: Chunk[]; // na ordem em que foram recebidos
  next: Chunk | null; // null = acabaram os chunks
  available: boolean; // o próximo já pode ser aberto
  availableAt: Date | null;
};

export function chunkStatus(states: Record<string, VocabState>, now: Date): ChunkStatus {
  const learned = CHUNKS.filter((c) => states[c.id]).sort((a, b) => states[a.id].first_seen_at.localeCompare(states[b.id].first_seen_at));
  const next = CHUNKS.find((c) => !states[c.id]) ?? null;
  const last = learned.length ? new Date(states[learned[learned.length - 1].id].first_seen_at).getTime() : null;
  const at = last === null ? null : new Date(last + PERIOD);
  const available = !!next && (at === null || at.getTime() <= now.getTime());
  return { learned, next, available, availableAt: next && !available ? at : null };
}
