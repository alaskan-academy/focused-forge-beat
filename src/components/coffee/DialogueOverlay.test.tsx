// Joga um capítulo inteiro pela interface (sem o Phaser) para garantir que o fluxo fecha.
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DialogueOverlay, { type EncounterSummary } from './DialogueOverlay';
import { CHARACTER_BY_ID, ORDERS } from '@/content/coffee';
import type { ActivityResult } from '@/lib/coffee/activities';

HTMLCanvasElement.prototype.getContext = (() => null) as never;
Element.prototype.scrollTo = (() => {}) as never;

const summary: EncounterSummary = { stars: 3, coins: 10, tip: 8, walkout: false, mistakes: 0, xp: 20, heartsDelta: 2, hearts: 2, newUnlocks: [], items: ['g:should_advice'], weak: ['g:should_advice'], chapterTitle: 'Vida nova', feedback: { headline: 'Muito bom! Faltou pouco para as 3 estrelas.', notes: ['Para ⭐⭐⭐: evitar 1 erro.'] } };
const cont = () => fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));

describe('tela de diálogo', () => {
  it('capítulo 1 do Tom: falas, escolha de tom, compreensão e lacuna até o resumo', async () => {
    const tom = CHARACTER_BY_ID.tom;
    const onComplete = vi.fn(async (_r: ActivityResult[]) => summary);
    render(
      <DialogueOverlay
        encounter={{ kind: 'chapter', characterId: 'tom', chapterId: 'tom-1', scenes: [tom.chapters[0]] }}
        name="Tom"
        look={tom.look}
        states={{}}
        coins={30}
        onSpend={async () => true}
        onCancel={() => {}}
        onComplete={onComplete}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText(/first time here/)).toBeInTheDocument();
    cont(); // 2ª fala
    cont(); // escolha

    // resposta fria: mostra o porquê e a reação, e deixa tentar de novo
    fireEvent.click(screen.getByRole('button', { name: 'Oh. OK. Next, please!' }));
    expect(screen.getByText(/frio demais/)).toBeInTheDocument();
    expect(screen.getByText('Ah... right. Sorry.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "I'm sorry to hear that. How are you doing?" }));
    expect(screen.getAllByText("I'm sorry to hear that. How are you doing?").length).toBeGreaterThan(0);

    // ordem do chat: cada fala do jogador vem antes da reação do cliente
    const chat = document.body.textContent!;
    const order = ['Oh. OK. Next, please!', 'Ah... right. Sorry.', "I'm sorry to hear that. How are you doing?", 'Better, thanks.'].map((t) => chat.indexOf(t));
    order.forEach((pos) => expect(pos).toBeGreaterThanOrEqual(0));
    expect([...order].sort((x, y) => x - y)).toEqual(order);

    cont(); // pizza
    cont(); // compreensão
    fireEvent.click(screen.getByRole('button', { name: 'pizza' }));
    cont(); // massa
    cont(); // lacuna
    fireEvent.click(screen.getByRole('button', { name: 'should' }));
    expect(screen.getByText('You should start with a simple tomato sauce.')).toBeInTheDocument();
    await act(async () => cont());

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const results = onComplete.mock.calls[0][0];
    expect(results.map((r) => r.activityId)).toEqual(['sorry', 'pizza', 'tip']);
    expect(results[0]).toMatchObject({ mistakes: 1, hearts: 0 }); // -1 da resposta fria, +1 da acolhedora
    expect(results[1].mistakes).toBe(0);
    expect(await screen.findByText(/Voltar ao café/)).toBeInTheDocument();
    expect(screen.getByText(/2 💛/)).toBeInTheDocument();
    expect(screen.getByText('Muito bom! Faltou pouco para as 3 estrelas.')).toBeInTheDocument();
    expect(screen.getByText('Para ⭐⭐⭐: evitar 1 erro.')).toBeInTheDocument();
    expect(screen.getByText(/volta logo na revisão para você fixar/)).toBeInTheDocument();
  });

  it('pedido por telefone: pedido em grupo com quantidades', async () => {
    const phone = ORDERS.find((o) => o.id === 'ord-phone-01')!;
    const onComplete = vi.fn(async () => ({ ...summary, heartsDelta: null, hearts: null, chapterTitle: null }));
    render(
      <DialogueOverlay
        encounter={{ kind: 'order', characterId: null, chapterId: null, scenes: [phone] }}
        name="Cliente"
        look={CHARACTER_BY_ID.tom.look}
        states={{}}
        coins={30}
        onSpend={async () => true}
        onCancel={() => {}}
        onComplete={onComplete}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Pedido por telefone')).toBeInTheDocument();
    cont();
    cont();
    const plus = (name: string, times: number) => {
      // a linha do pedido (o mesmo nome também aparece destacado como dica na fala do cliente)
      const row = screen.getByText(name, { selector: 'span.font-medium' }).parentElement!;
      for (let i = 0; i < times; i++) fireEvent.click(row.querySelector('[aria-label="mais"]')!);
    };
    plus('latte', 2);
    plus('green tea', 1);
    plus('chocolate cookie', 3);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
    cont();
    // montar "Sure! It'll be ready in ten minutes."
    for (const w of ['Sure!', "It'll", 'be', 'ready', 'in', 'ten', 'minutes.']) fireEvent.click(screen.getByRole('button', { name: w }));
    fireEvent.click(screen.getByRole('button', { name: 'Conferir' }));
    await act(async () => cont());
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect((onComplete.mock.calls[0] as unknown as [ActivityResult[]])[0].every((r) => r.mistakes === 0)).toBe(true);
  });
});
