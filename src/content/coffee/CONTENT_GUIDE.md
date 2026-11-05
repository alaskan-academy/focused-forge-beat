# Coffee Cats: guia de conteúdo

Este guia explica como escrever clientes, capítulos, conversas e pedidos para o Coffee Cats. Serve para você ou para o Claude.
O conteúdo é só dados (TypeScript tipado): **não é preciso mexer na lógica do jogo** para adicionar coisas.

| Arquivo | O que tem |
|---|---|
| `types.ts` | o formato de tudo (cenas, falas, atividades, personagens) |
| `vocab.ts` | vocabulário e expressões (itens do SRS) |
| `grammar.ts` | estruturas gramaticais (itens do SRS, ids com prefixo `g:`) |
| `menu.ts` | cardápio, preços e tags (alergias, doce/leve/pesado…) |
| `orders.ts` | pedidos (clientes avulsos) |
| `talks.ts` | conversas avulsas |
| `characters/<id>.ts` | um arquivo por cliente recorrente; registre em `index.ts` (`CHARACTERS`) |

Depois de escrever, rode `npx vitest run src/content`. O teste `content.test.ts` faz a **revisão automática** e diz exatamente o que corrigir.

---

## 1. Cena = falas + atividades

Tudo o que acontece num atendimento é uma **cena**: uma lista de `steps`, onde cada passo é uma **fala** do cliente ou uma **atividade** do jogador.

```ts
{
  id: 'talk-weekend-02',      // único no jogo todo; nunca renomeie depois de publicado
  kind: 'talk',               // 'order' | 'talk' | 'chapter' | 'regular'
  theme: 'smalltalk',         // usado para intercalar temas
  level: 'A2',                // 'A2' | 'A2+' | 'B1' (≈ 10–20% acima de A2)
  steps: [
    { say: 'Any plans for the weekend?', pt: 'Algum plano para o fim de semana?', mood: 'happy' },
    { activity: { /* ver seção 2 */ } },
  ],
}
```

**Regra de ouro:** toda cena tem **pelo menos uma atividade**. Nenhum atendimento é só texto para passar.

**Falas (`say`):**
- 1 a 3 frases curtas, inglês natural de café (contrações, "honestly", "I guess"…), nada de livro didático.
- `pt` é obrigatório. É a tradução que o jogador pode comprar como dica.
- `mood` mostra a emoção do cliente: `neutral`, `happy`, `excited`, `love`, `sad`, `worried`, `embarrassed`, `angry`, `thinking`, `tired`.
- `speaker` (opcional) serve para cenas com duas pessoas (ex.: Jun e Alex).

## 2. Atividades

Todas têm `id` (único dentro da cena) e `items`: os ids de vocabulário/gramática que a atividade treina. **O SRS só enxerga o que está em `items`.** Todo item de vocabulário listado precisa aparecer escrito na cena (o teste confere).

| Tipo | Para quê | Campos principais |
|---|---|---|
| `choose_reply` | resposta certa em gramática **e** tom | `options[]` com **exatamente uma** `correct: true`; as outras com `why_pt`; opcional `hearts` (+1 acolhedora, −1 fria/julgadora) e `reaction` (fala do cliente) |
| `build_reply` | montar a própria fala | `text`, `pt`, `distractors` (não podem estar no texto) |
| `gap` | lacuna (palavra ou tempo verbal) | `who: 'player' \| 'customer'`, `before`, `after`, `answers` (formas aceitas), `options` (opcional: começa em múltipla escolha e vira digitação quando o jogador domina) |
| `comprehension` | entendeu o que o cliente disse? | `question` (em inglês), `options`, `answer` (índice) |
| `recall` | lembrar de um capítulo anterior | igual a comprehension + `from: '<id do capítulo>'`; a pergunta é dita pelo cliente; a resposta tem que aparecer no capítulo `from` |
| `free_write` | escrever uma frase curta | `prompt`, `prompt_pt`, `keywords` (grupos de palavras: precisa de uma de **cada** grupo), `examples` (que passam na própria correção) |
| `build_order` | montar o pedido | `order: { size, drink, temp, milk, extras, food, where }` com nomes do `menu.ts`; `milk` aceita lista quando a fala é indireta ("plant milk") |
| `group_order` | pedido em grupo | `order: { latte: 2, … }`, `choices` (itens mostrados) |
| `safe_pick` | alergia/restrição | `avoid: ['nuts']`; **só a resposta** pode estar livre dessas tags (o teste confere pelo cardápio) |
| `recommend` | cliente indeciso | `wants: ['sweet', 'light']`; **só a resposta** tem todas essas tags |
| `change` | troco | `price_cents`, `paid_cents`, `options` como "$5.75"; a resposta tem que ser o troco exato |

**Uma resposta claramente certa:** se duas opções forem defensáveis, reescreva. Respostas erradas devem estar erradas por **um** motivo claro (gramática *ou* tom), explicado em `why_pt`.

**Atividades de tom:** a opção "errada por tom" é julgadora, fria ou desdenhosa. Ela fica marcada como errada e com explicação; isso ensina a responder com respeito.

## 3. Clientes recorrentes e capítulos

```ts
const luna: Character = {
  id: 'luna', name: 'Luna',
  look: { skin, hair: { style, color }, shirt, pants, shoes },   // opções em lib/coffee/character.ts
  personality_pt: '…', bio_pt: '…',                               // aparecem no caderninho
  chapters: [ /* 4–8 capítulos em ordem */ ],
  regulars: [ /* 2+ "bate-papos de cliente fiel" */ ],
};
```

- **Capítulo** = cena com `kind: 'chapter'`, `title_pt` e `summary_pt` (o resumo vai para o caderninho).
- Um capítulo por visita. O próximo só aparece `gapDays` dias depois do anterior (padrão 2; use `gapDays: 0` no primeiro).
- Comece capítulos do 2 em diante com um **`recall`** do capítulo anterior ("Do you remember…?").
- **Capítulos especiais** têm `minHearts` (ex.: 5) e só aparecem com amizade alta. Ficam no fim da lista.
- **Bate-papos de fiel** (`regulars`) são usados quando não há capítulo liberado. São curtos, com pelo menos uma atividade, e podem incluir o pedido favorito.
- Cada jogador tem o seu próprio progresso e os seus corações (0–10). Os corações sobem com respostas acolhedoras (+1) e a cada 2 atividades acertadas de primeira (+1). Com 7 corações o cliente dá um presente; com 10, uma foto no caderninho.

## 4. Pedidos

`kind: 'order'` com `orderType`:

| `orderType` | Atividades típicas |
|---|---|
| `basic`, `modified`, `food`, `where` | `build_order`, depois `build_reply` ou `change` |
| `allergy` | `safe_pick` + `gap`/`choose_reply` |
| `polite` | "Would it be possible to…", "I was wondering if…" → `comprehension` + `build_order` |
| `indecisive` | `recommend` + `choose_reply` (comparativos) |
| `group` | `group_order` |
| `complaint` | `comprehension` (qual é o problema?) + `choose_reply` (resposta educada) |
| `payment` | `change` com o preço dito por extenso ("four fifty") |
| `menu_question` | `comprehension` ("What's the difference between a latte and a flat white?") |
| `phone` | `channel: 'phone'`: só texto, sem retrato |

Conversas avulsas (`talks.ts`) com `withOrder: true` ganham um pedido emendado no fim.

## 4b. Despedidas: "esperar a outra pessoa" (`handoffs.ts`)

Cada um de vocês conversa **uma vez** com cada cliente recorrente por visita. Quando você termina e o(a) parceiro(a) ainda não conversou com aquele cliente, o atendimento acaba com uma **despedida** (`kind: 'handoff'`): o cliente pergunta pela outra pessoa e fica no café esperando por ela.

As despedidas usam marcadores, trocados pelo nome e pelo pronome do(a) parceiro(a) (o pronome é escolhido no criador de personagem):

| Marcador | she | he |
|---|---|---|
| `{partner}` | nome (ex.: Jessica) | nome (ex.: Lucas) |
| `{sub}` / `{Sub}` | she / She | he / He |
| `{obj}` | her | him |
| `{pos}` | her | his |
| `{ela}` / `{Ela}` (no `pt`) | ela / Ela | ele / Ele |

Escreva frases em que o verbo não muda entre she/he (ex.: "{Sub}'s not here right now"). Elas são ótimas para treinar pronomes objeto ("tell **her**", não "tell she") e *will* para promessas ("I'll let him know"). O teste confere as duas versões (she e he).

## 5. Tom e sensibilidade

- Tratar **todos os arranjos de relacionamento** com naturalidade e respeito: monogâmicos, casais abertos, poliamor, divórcio, namoro, amizade. Sem estereótipo, sem julgamento, sem lição de moral.
- Conversa de café: sentimentos, logística, ciúme, confiança, limites, comunicação. **Sem conteúdo sexual.**
- Desabafos (luto, solidão, ansiedade) com empatia; a resposta certa acolhe, não conserta nem minimiza.

## 6. Vocabulário e gramática novos

- **Vocabulário:** adicione em `vocab.ts` (`id` único, `en` exatamente como aparece nas falas, `pt`, `theme`, `level`).
- **Gramática:** adicione em `grammar.ts` (`id` começando com `g:`, explicação curta em `pt` e um `example`).
- **Nunca renomeie ids existentes:** o progresso de cada jogador é guardado por id.

## 6b. Atalhos (`dsl.ts`) e registros

O conteúdo novo (personagens, `talks-more.ts`, `orders-more.ts`) usa atalhos que geram o mesmo formato com menos texto:

```ts
say('Coffee. Black.', 'Café. Preto.', 'angry'),
order('order', ['black_coffee'], { drink: 'black coffee' }),
choose('reply', ['g:register_formal'], [
  ok('Certainly. Anything else?', say('No. Go away.', 'Não. Vai embora.', 'angry')),
  no('Sure, dude.', 'Informal demais com um cliente formal.'),
]),
ask('q', ['g:used_to'], 'What did he use to do?', ['resposta certa PRIMEIRO', 'errada', 'errada']),
```

Nas perguntas de escolha a resposta certa vem **primeiro** (o jogo embaralha). `change(...)` calcula o troco sozinho.

**Registros:** varie de propósito: cliente grosso e seco, formal ("Would it be possible…", "I was wondering if…"), muito informal ("bro", "no cap", "gonna", "kinda") e irônico. Uma boa atividade de registro tem uma resposta certa no tom adequado e uma errada só por **tom** (formal demais para um "yo, dude", ou grosseira com um cliente formal).

## 7. Checklist antes de publicar

- [ ] `npx vitest run src/content` passa.
- [ ] Toda cena tem atividade; toda fala tem `pt`.
- [ ] Cada atividade tem uma única resposta claramente certa.
- [ ] Inglês natural, frases curtas; cerca de 80–90% A2.
- [ ] Novos capítulos começam com `recall` e terminam com algo que puxa o próximo.
