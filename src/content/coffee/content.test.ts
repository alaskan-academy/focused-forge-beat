// Revisão automática do conteúdo. Se um teste daqui falhar, a mensagem diz qual cena/atividade corrigir.
import { describe, expect, it } from 'vitest';
import { ALL_SCENES as BASE_SCENES, CHARACTERS as BASE_CHARACTERS, HANDOFFS, ITEMS, sceneText } from '.';
import belmont, { BELMONT_BILLS } from './characters/belmont';
import { fillPlaceholders, personalize } from './personalize';
import { CHUNKS } from './chunks';
import { BOOK_PAGES } from './books';
import { MENU, MENU_BY_NAME, formatPrice } from './menu';
import { isLine, type Activity, type Scene } from './types';
import { checkFreeWrite, parseSpot, tokenize } from '@/lib/coffee/activities';

// o Belmont fica fora da fila de clientes, mas o conteúdo dele passa pelas mesmas verificações
const ALL_SCENES: Scene[] = [...BASE_SCENES, ...belmont.chapters, ...belmont.regulars, ...BELMONT_BILLS];
const CHARACTERS = [...BASE_CHARACTERS, belmont];

const acts = (s: Scene) => s.steps.flatMap((st) => (isLine(st) ? [] : [{ a: st.activity, where: `${s.id}/${st.activity.id}` }]));
const allActs = ALL_SCENES.flatMap(acts);
const of = <T extends Activity['type']>(t: T) => allActs.filter((x) => x.a.type === t) as { a: Extract<Activity, { type: T }>; where: string }[];
const menuNames = new Set<string>([...MENU.drink, ...MENU.food]);

describe('cenas', () => {
  it('ids de cena são únicos', () => {
    const ids = ALL_SCENES.map((s) => s.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('toda cena tem pelo menos uma atividade (nenhum atendimento é só texto)', () => {
    for (const s of ALL_SCENES) expect(acts(s).length, s.id).toBeGreaterThan(0);
  });

  it('ids de atividade são únicos dentro da cena', () => {
    for (const s of ALL_SCENES) {
      const ids = acts(s).map((x) => x.a.id);
      expect(new Set(ids).size, s.id).toBe(ids.length);
    }
  });

  it('toda fala tem tradução e no máximo 3 frases (5 nas cenas `long`, como as do Belmont)', () => {
    for (const s of ALL_SCENES)
      for (const st of s.steps) {
        if (!isLine(st)) continue;
        expect(st.pt.trim().length, `${s.id}: "${st.say}" sem pt`).toBeGreaterThan(0);
        // fragmentos de uma palavra ("Every. Single. Night.") não contam como frase
        const sentences = st.say.split(/(?<=[.!?])\s+/).filter((x) => x.trim().split(/\s+/).length >= 2).length;
        expect(sentences, `${s.id}: "${st.say}"`).toBeLessThanOrEqual(s.long ? 5 : 3);
      }
  });

  it('itens marcados existem; vocabulário marcado aparece no texto da cena', () => {
    for (const s of ALL_SCENES) {
      const text = sceneText(s).toLowerCase();
      for (const { a, where } of acts(s)) {
        expect(a.items.length, `${where} sem items`).toBeGreaterThan(0);
        for (const id of a.items) {
          const item = ITEMS[id];
          expect(item, `${where}: item "${id}" não existe`).toBeDefined();
          if (item.en) expect(text.includes(item.en.toLowerCase()), `${where}: "${item.en}" não aparece na cena`).toBe(true);
        }
      }
    }
  });
});

describe('uma resposta claramente certa', () => {
  it('choose_reply: exatamente uma correta (escolha pessoal `either`: cada certa com valor); as erradas explicam por quê', () => {
    for (const { a, where } of of('choose_reply')) {
      if (a.either) a.options.filter((o) => o.correct).forEach((o) => expect(o.value, `${where}: "${o.text}" sem value`).toBeTruthy());
      else expect(a.options.filter((o) => o.correct).length, where).toBe(1);
      a.options.filter((o) => !o.correct).forEach((o) => expect(o.why_pt, `${where}: "${o.text}" sem why_pt`).toBeTruthy());
      expect(new Set(a.options.map((o) => o.text)).size, where).toBe(a.options.length);
    }
  });

  it('build_reply: peças falsas não aparecem na resposta', () => {
    for (const { a, where } of of('build_reply')) {
      const words = tokenize(a.text);
      a.distractors.forEach((d) => expect(words, `${where}: "${d}"`).not.toContain(d));
      expect(a.pt, where).toBeTruthy();
    }
  });

  it('gap: com opções, só uma delas é aceita', () => {
    for (const { a, where } of of('gap')) {
      expect(a.answers.length, where).toBeGreaterThan(0);
      if (a.options) expect(a.options.filter((o) => a.answers.includes(o)), where).toEqual([a.options.find((o) => a.answers.includes(o))]);
      if (a.options) expect(a.options.filter((o) => a.answers.includes(o)).length, where).toBe(1);
    }
  });

  it('perguntas de escolha: índice válido e opções diferentes', () => {
    for (const t of ['comprehension', 'recall', 'safe_pick', 'recommend', 'change'] as const)
      for (const { a, where } of of(t)) {
        expect(a.options[a.answer], where).toBeDefined();
        expect(new Set(a.options).size, where).toBe(a.options.length);
      }
  });

  it('recall: aponta para um capítulo anterior do mesmo personagem que contém a resposta', () => {
    for (const ch of CHARACTERS) {
      ch.chapters.forEach((chapter, idx) => {
        for (const { a, where } of acts(chapter)) {
          if (a.type !== 'recall') continue;
          const fromIdx = ch.chapters.findIndex((c) => c.id === a.from);
          expect(fromIdx, `${where}: from "${a.from}"`).toBeGreaterThanOrEqual(0);
          expect(fromIdx, `${where}: from precisa ser anterior`).toBeLessThan(idx);
          const prev = sceneText(ch.chapters[fromIdx]).toLowerCase();
          expect(prev.includes(a.options[a.answer].toLowerCase()), `${where}: resposta não aparece em ${a.from}`).toBe(true);
        }
      });
    }
    expect(of('recall').length).toBeGreaterThan(0);
  });

  it('safe_pick: só a resposta é segura', () => {
    for (const { a, where } of of('safe_pick'))
      a.options.forEach((name, i) => {
        const item = MENU_BY_NAME[name];
        expect(item, `${where}: "${name}" não está no cardápio`).toBeDefined();
        const unsafe = a.avoid.some((t) => item.tags.includes(t as never));
        expect(unsafe, `${where}: "${name}"`).toBe(i !== a.answer);
      });
  });

  it('recommend: só a resposta tem tudo o que o cliente quer', () => {
    for (const { a, where } of of('recommend'))
      a.options.forEach((name, i) => {
        const item = MENU_BY_NAME[name];
        expect(item, `${where}: "${name}"`).toBeDefined();
        const fits = a.wants.every((t) => item.tags.includes(t as never));
        expect(fits, `${where}: "${name}"`).toBe(i === a.answer);
      });
  });

  it('spot_error: exatamente uma palavra marcada, e a correção muda a frase', () => {
    for (const { a, where } of of('spot_error')) {
      const { words, wrong } = parseSpot(a.sentence);
      expect(wrong, `${where}: marque a palavra errada com *asteriscos*`).toBeGreaterThanOrEqual(0);
      expect(a.sentence.split('*').length, `${where}: só uma palavra marcada`).toBe(3);
      expect(a.fix, where).not.toBe(words.join(' '));
      expect(a.why_pt, where).toBeTruthy();
    }
  });

  it('change: a resposta é o troco certo', () => {
    for (const { a, where } of of('change')) expect(a.options[a.answer], where).toBe(formatPrice(a.paid_cents - a.price_cents));
  });

  it('free_write: os exemplos passam na própria correção', () => {
    for (const { a, where } of of('free_write')) a.examples.forEach((ex) => expect(checkFreeWrite(a, ex).ok, `${where}: "${ex}"`).toBe(true));
  });

  it('pedidos usam itens do cardápio', () => {
    for (const { a, where } of of('build_order'))
      for (const [field, want] of Object.entries(a.order)) {
        const list = MENU[field as keyof typeof MENU] as readonly string[];
        (Array.isArray(want) ? want : [want]).forEach((w) => expect(list, `${where}.${field}`).toContain(w));
      }
    for (const { a, where } of of('group_order')) {
      a.choices.forEach((c) => expect(menuNames.has(c), `${where}: ${c}`).toBe(true));
      Object.keys(a.order).forEach((k) => expect(a.choices, where).toContain(k));
    }
  });
});

describe('despedidas personalizadas (she e he)', () => {
  const variants = [
    { name: 'Jessica', pronoun: 'she' as const },
    { name: 'Lucas', pronoun: 'he' as const },
  ];

  it('não sobra marcador e as respostas continuam únicas nas duas versões', () => {
    for (const p of variants)
      for (const raw of HANDOFFS) {
        const s = personalize(raw, p);
        const json = JSON.stringify(s);
        expect(json, `${s.id} (${p.pronoun})`).not.toMatch(/\{(partner|sub|Sub|obj|pos|ela|Ela)\}/);
        expect(json).toContain(p.name);
        for (const { a, where } of acts(s)) {
          if (a.type === 'build_reply') a.distractors.forEach((d) => expect(tokenize(a.text), `${where} (${p.pronoun}): ${d}`).not.toContain(d));
          if (a.type === 'choose_reply') expect(new Set(a.options.map((o) => o.text)).size, where).toBe(a.options.length);
          if (a.type === 'free_write') a.examples.forEach((ex) => expect(checkFreeWrite(a, ex).ok, `${where}: ${ex}`).toBe(true));
        }
      }
  });

  it('troca pronomes certo', () => {
    expect(fillPlaceholders("Tell {obj} {sub}'s late, {partner}!", { name: 'Lucas', pronoun: 'he' })).toBe("Tell him he's late, Lucas!");
    expect(fillPlaceholders('{Sub} disse para {ela}', { name: 'Jessica', pronoun: 'she' })).toBe('She disse para ela');
  });
});

describe('personagens', () => {
  it('cada personagem tem pelo menos 4 capítulos principais e 1 bate-papo', () => {
    for (const c of CHARACTERS) {
      expect(c.chapters.filter((ch) => !ch.minHearts).length, c.id).toBeGreaterThanOrEqual(4);
      expect(c.regulars.length, c.id).toBeGreaterThan(0);
      c.chapters.forEach((ch) => expect(ch.summary_pt, ch.id).toBeTruthy());
    }
  });

  it('banco de conteúdo: 8–10 recorrentes, ~30 conversas, ~40 pedidos de todos os tipos', () => {
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(8);
    expect(ALL_SCENES.filter((s) => s.kind === 'talk').length).toBeGreaterThanOrEqual(30);
    const orders = ALL_SCENES.filter((s) => s.kind === 'order');
    expect(orders.length).toBeGreaterThanOrEqual(40);
    const types = new Set(orders.map((o) => o.orderType));
    for (const t of ['basic', 'modified', 'food', 'where', 'allergy', 'polite', 'indecisive', 'group', 'complaint', 'payment', 'menu_question', 'phone'])
      expect(types.has(t as never), `falta pedido do tipo ${t}`).toBe(true);
  });

  it('o sistema cobre os 12 tipos de atividade', () => {
    const types = new Set(allActs.map((x) => x.a.type));
    expect([...types].sort()).toEqual(
      ['build_order', 'build_reply', 'change', 'choose_reply', 'comprehension', 'free_write', 'gap', 'group_order', 'recall', 'recommend', 'safe_pick', 'spot_error'].sort(),
    );
  });
});

describe('chunks e estante', () => {
  it('chunks: ids únicos, exemplos usam o chunk, exercício treina o chunk e tem uma resposta certa', () => {
    expect(new Set(CHUNKS.map((c) => c.id)).size).toBe(CHUNKS.length);
    expect(CHUNKS.length).toBeGreaterThanOrEqual(30);
    for (const ch of CHUNKS) {
      expect(ch.id.startsWith('c:'), ch.id).toBe(true);
      expect(ch.examples.length, ch.id).toBeGreaterThanOrEqual(2);
      ch.examples.forEach((e) => expect(e.pt, ch.id).toBeTruthy());
      const a = ch.exercise;
      expect(a.items, ch.id).toContain(ch.id);
      a.items.forEach((id) => expect(ITEMS[id], `${ch.id}: ${id}`).toBeDefined());
      if (a.type === 'choose_reply') expect(a.options.filter((o) => o.correct).length, ch.id).toBe(1);
      if (a.type === 'build_reply') a.distractors.forEach((d) => expect(tokenize(a.text), `${ch.id}: ${d}`).not.toContain(d));
      if (a.type === 'gap' && a.options) expect(a.options.filter((o) => a.answers.includes(o)).length, ch.id).toBe(1);
    }
  });

  it('estante: folhas completas e ids únicos', () => {
    expect(new Set(BOOK_PAGES.map((p) => p.id)).size).toBe(BOOK_PAGES.length);
    for (const p of BOOK_PAGES) for (const k of ['author', 'title', 'idea_pt', 'practice_pt', 'english', 'english_pt'] as const) expect(p[k], `${p.id}.${k}`).toBeTruthy();
  });
});
