// Detecta versão nova do site: o index.html publicado aponta para um script com hash
// (/assets/index-XXXX.js). Se o hash mudou desde que a página abriu, saiu um deploy novo.

const SCRIPT_RE = /\/assets\/index-[\w-]+\.js/;

export function buildIdFromHtml(html: string): string | null {
  return html.match(SCRIPT_RE)?.[0] ?? null;
}

// hash da versão que está rodando agora (null no modo dev, onde não há build)
export function currentBuildId(doc: Document = document): string | null {
  for (const s of Array.from(doc.querySelectorAll('script[src]'))) {
    const id = buildIdFromHtml((s as HTMLScriptElement).getAttribute('src') ?? '');
    if (id) return id;
  }
  return null;
}

export async function latestBuildId(fetcher: typeof fetch = fetch): Promise<string | null> {
  const res = await fetcher(`/?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return buildIdFromHtml(await res.text());
}

export type UpdateNote = { emoji: string; title: string; body: string; english: string };

// Avisos de atualização (um sorteado por versão nova). {partner} = nome da outra pessoa.
export const UPDATE_NOTES: UpdateNote[] = [
  {
    emoji: '🐱☕',
    title: 'O Elias derrubou o café',
    body: 'Ops! O Elias pulou no balcão e derrubou o café em cima do código. Já limpamos tudo, só falta você atualizar.',
    english: 'Sorry about the mess!',
  },
  {
    emoji: '📋',
    title: 'Cardápio novo no quadro',
    body: 'Atenção, barista! Tem coisa nova no quadro do café. Atualize antes que os clientes percebam que você está com o cardápio velho.',
    english: 'Out with the old, in with the new!',
  },
  {
    emoji: '😤',
    title: 'O Gary reclamou',
    body: 'O Gary disse que esse café está desatualizado e que no tempo dele as coisas funcionavam. Atualize só pra ele ficar quieto.',
    english: 'Back in my day, we refreshed pages by hand!',
  },
  {
    emoji: '♨️',
    title: 'Café requentado',
    body: 'Esse café aqui já está frio! Saiu uma versão fresquinha, direto da máquina. Atualize para pegar a sua.',
    english: 'Fresh out of the oven!',
  },
  {
    emoji: '👀',
    title: 'Fofoca do café',
    body: '{partner} já está jogando na versão nova. Vai ficar pra trás?',
    english: "Don't get left behind!",
  },
];

export function pickUpdateNote(partner: string | null, rng: () => number = Math.random): UpdateNote {
  const pool = partner ? UPDATE_NOTES : UPDATE_NOTES.filter((n) => !n.body.includes('{partner}'));
  const note = pool[Math.floor(rng() * pool.length)];
  return { ...note, body: note.body.replace('{partner}', partner ?? '') };
}
