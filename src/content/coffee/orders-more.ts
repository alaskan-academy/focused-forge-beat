// Mais pedidos, cobrindo todos os tipos. Registros variados: grosso, formal, muito informal, irônico.
import type { Scene } from './types';
import { ask, build, change, choose, group, no, ok, ord, order, price, recommend, safe, say } from './dsl';

export const MORE_ORDERS: Scene[] = [
  // ── básicos ──────────────────────────────────────────────────────────────
  ord('ord-basic-02', 'basic', 'drinks', 'A2', [
    say("Latte. Medium. Oat milk. Don't make it weird.", 'Latte. Médio. Leite de aveia. Não inventa moda.', 'angry'),
    order('order', ['medium', 'latte', 'oat_milk'], { size: 'medium', drink: 'latte', milk: 'oat milk' }),
  ]),
  ord('ord-basic-03', 'basic', 'drinks', 'A2', [
    say('Yo! Can I get a small mocha? Thanks, dude.', 'E aí! Me vê um mocha pequeno? Valeu, mano.', 'happy'),
    order('order', ['small', 'mocha', 'can_i_get'], { size: 'small', drink: 'mocha' }),
    choose('reply', ['g:register_informal'], [
      ok('Sure thing! One small mocha, coming up.', say('Legend.', 'Lenda.', 'happy')),
      no('Certainly, sir. Your beverage shall be prepared shortly.', 'Formal demais para um "Yo, dude"; soa como um robô.'),
      no('Sure thing! One small mocha, come up.', 'A expressão é "coming up" (já sai).'),
    ], 'Qual resposta combina com o jeito dele?'),
  ]),
  ord('ord-basic-04', 'basic', 'drinks', 'A2', [
    say("Good evening. I'd like a large hot chocolate, please.", 'Boa noite. Eu gostaria de um chocolate quente grande, por favor.', 'neutral'),
    order('order', ['id_like', 'large', 'hot_chocolate'], { size: 'large', drink: 'hot chocolate' }),
    build('else', ['anything_else', 'g:register_formal'], 'Of course. Would you like anything else?', 'Claro. Gostaria de mais alguma coisa?', ['some', 'other', 'want']),
  ]),

  // ── com modificações ─────────────────────────────────────────────────────
  ord('ord-mod-01', 'modified', 'drinks', 'A2+', [
    say("Iced latte, large, less ice, extra shot. I'm a complicated person.", 'Latte gelado, grande, menos gelo, dose extra. Sou uma pessoa complicada.', 'thinking'),
    order('order', ['iced', 'less_ice', 'extra_shot'], { size: 'large', drink: 'latte', temp: 'iced', extras: ['less ice', 'extra shot'] }),
  ]),
  ord('ord-mod-02', 'modified', 'drinks', 'A2+', [
    say('A cappuccino with almond milk. Decaf. My doctor says no caffeine. My heart says yes.', 'Um cappuccino com leite de amêndoas. Descafeinado. Meu médico diz sem cafeína. Meu coração diz sim.', 'sad'),
    order('order', ['decaf', 'almond_milk', 'cappuccino'], { drink: 'cappuccino', milk: 'almond milk', extras: ['decaf'] }),
  ]),
  ord('ord-mod-03', 'modified', 'drinks', 'A2', [
    say('Black coffee. No sugar. Sugar is a lie the government tells us.', 'Café preto. Sem açúcar. Açúcar é uma mentira que o governo conta pra gente.', 'thinking'),
    order('order', ['black_coffee', 'no_sugar'], { drink: 'black coffee', extras: ['no sugar'] }),
    ask('why', ['g:tell_say'], 'What does he think about sugar?', ["It's a lie.", "It's healthy.", "It's too expensive."]),
  ]),
  ord('ord-mod-04', 'modified', 'drinks', 'A2+', [
    say('Can I get a chai latte, but with oat milk instead of whole milk?', 'Pode me ver um chai latte, mas com leite de aveia em vez de integral?', 'neutral'),
    order('order', ['instead_of', 'oat_milk', 'chai_latte'], { drink: 'chai latte', milk: 'oat milk' }),
  ]),

  // ── comida ───────────────────────────────────────────────────────────────
  ord('ord-food-01', 'food', 'food', 'A2', [
    say('One croissant and a blueberry muffin, please. Breakfast of champions.', 'Um croissant e um muffin de mirtilo, por favor. Café da manhã dos campeões.', 'happy'),
    order('order', ['blueberry_muffin', 'breakfast'], { food: ['croissant', 'blueberry muffin'] }),
  ]),
  ord('ord-food-02', 'food', 'food', 'A2', [
    say("Do you have anything savory? Oh, the egg sandwich! I'll take it.", 'Tem alguma coisa salgada? Ah, o sanduíche de ovo! Vou levar.', 'happy'),
    order('order', ['savory'], { food: ['egg sandwich'] }),
  ]),
  ord('ord-food-03', 'food', 'food', 'A2', [
    say("A brownie and a chocolate cookie. Don't judge me. It's been a long week.", 'Um brownie e um cookie de chocolate. Não me julga. Foi uma semana longa.', 'tired'),
    order('order', ['g:quantities'], { food: ['brownie', 'chocolate cookie'] }),
    choose('reply', ['g:register_informal'], [
      ok('No judging here. You deserve it!', say('Thank you. Finally, someone understands me.', 'Obrigada. Finalmente alguém me entende.', 'love')),
      no('Two desserts? Are you sure?', 'Ela pediu literalmente para não julgar.'),
      no('No judging here. You deserves it!', 'Com "you", o verbo não leva -s: "you deserve".'),
    ]),
  ]),

  // ── para viagem × aqui ──────────────────────────────────────────────────
  ord('ord-where-01', 'where', 'ordering', 'A2', [
    say('A medium latte for here, please. I need to sit down and stare at a wall.', 'Um latte médio para tomar aqui, por favor. Preciso sentar e encarar uma parede.', 'tired'),
    order('order', ['for_here', 'medium', 'latte'], { size: 'medium', drink: 'latte', where: 'for here' }),
  ]),
  ord('ord-where-02', 'where', 'ordering', 'A2', [
    say("Espresso to go. I'm always late. It's my brand.", 'Expresso para viagem. Sempre tô atrasado. É a minha marca.', 'worried'),
    order('order', ['to_go', 'espresso'], { drink: 'espresso', where: 'to go' }),
  ]),
  ord('ord-where-03', 'where', 'ordering', 'A2', [
    say('A cappuccino, please.', 'Um cappuccino, por favor.', 'neutral'),
    build('ask', ['for_here', 'to_go'], 'Is that for here or to go?', 'É para tomar aqui ou para viagem?', ['four', 'where', 'take']),
    say('To go. My cat is waiting in the car. Kidding. Or am I?', 'Para viagem. Meu gato tá me esperando no carro. Brincadeira. Ou não?', 'happy'),
    order('order', ['cappuccino'], { drink: 'cappuccino', where: 'to go' }),
  ]),

  // ── alergias e restrições ───────────────────────────────────────────────
  ord('ord-allergy-02', 'allergy', 'food', 'A2+', [
    say("Is anything here vegan? I mean, really vegan. No milk, no eggs, no lies.", 'Tem alguma coisa vegana aqui? Quer dizer, vegana de verdade. Sem leite, sem ovo, sem mentira.', 'thinking'),
    safe('safe', ['vegan', 'i_mean'], 'Which one can she eat?', ['dairy', 'egg'], ['fruit cup', 'croissant', 'lemon cake', 'gluten-free muffin'], 'Croissant e bolo de limão levam leite; o muffin sem glúten leva leite e ovo.'),
  ]),
  ord('ord-allergy-03', 'allergy', 'food', 'A2+', [
    say("I can't eat gluten. Doctor's orders. Which one is safe for me?", 'Não posso comer glúten. Ordens médicas. Qual é seguro pra mim?', 'worried'),
    safe('safe', ['gluten'], 'Which one can he eat?', ['gluten'], ['gluten-free muffin', 'croissant', 'brownie', 'banana bread']),
    choose('confirm', ['gluten', 'g:third_person_s'], [
      ok("This one doesn't have any gluten.", say('My stomach thanks you.', 'Meu estômago agradece.', 'happy')),
      no("This one don't have any gluten.", 'Com "this one" (ele/ela), use "doesn\'t".'),
      no("This one isn't have any gluten.", 'Com o verbo "have", a negativa é com "doesn\'t", não "isn\'t".'),
    ]),
  ]),
  ord('ord-allergy-04', 'allergy', 'drinks', 'A2+', [
    say("I'm lactose intolerant. Which drink can I have without dying?", 'Tenho intolerância à lactose. Que bebida eu posso tomar sem morrer?', 'worried'),
    safe('safe', ['lactose_intolerant'], 'Which drink is safe?', ['dairy'], ['black coffee', 'latte', 'cappuccino', 'mocha'], 'Latte, cappuccino e mocha levam leite.'),
  ]),

  // ── pedidos indiretos e muito educados ──────────────────────────────────
  ord('ord-polite-01', 'polite', 'ordering', 'B1', [
    say('Excuse me. I was wondering if you could warm up my croissant, please.', 'Com licença. Eu queria saber se você poderia esquentar meu croissant, por favor.', 'neutral'),
    choose('reply', ['i_was_wondering', 'g:register_formal'], [
      ok("Of course! I'll warm it up for you.", say('How lovely. Thank you.', 'Que gentil. Obrigada.', 'happy')),
      no("Of course! I'll warm up it for you.", 'Com pronome, ele fica no meio: "warm IT up".'),
      no('No. The microwave is for emergencies.', 'Ríspido; o pedido foi super educado.'),
    ]),
  ]),
  ord('ord-polite-02', 'polite', 'drinks', 'B1', [
    say('Good afternoon. Would it be possible to have a small latte with oat milk?', 'Boa tarde. Seria possível um latte pequeno com leite de aveia?', 'neutral'),
    order('order', ['would_it_be_possible', 'small', 'oat_milk'], { size: 'small', drink: 'latte', milk: 'oat milk' }),
  ]),
  ord('ord-polite-03', 'polite', 'ordering', 'A2+', [
    say('So sorry to bother you. Could I possibly have a glass of water as well?', 'Desculpa incomodar. Será que eu poderia ter um copo de água também?', 'embarrassed'),
    ask('want', ['sorry_to_bother', 'g:can_could_requests'], 'What does she want?', ['a glass of water', 'the bill', 'a bigger cup']),
    build('reply', ['g:can_could_requests'], "Of course! I'll bring it right away.", 'Claro! Já trago.', ['brought', 'way', 'take']),
  ]),
  ord('ord-polite-04', 'polite', 'ordering', 'B1', [
    say('Pardon me. Would you be so kind as to bring my cappuccino before I die of old age?', 'Perdão. Você teria a gentileza de trazer meu cappuccino antes que eu morra de velhice?', 'angry'),
    ask('feel', ['g:register_formal'], 'How does he really feel?', ['impatient', 'relaxed', 'grateful'], 'É educado na forma, mas irônico: ele está impaciente.'),
    choose('reply', ['so_sorry'], [
      ok("I'm so sorry for the wait. It's coming right now.", say('Splendid. I shall try to stay alive.', 'Esplêndido. Tentarei continuar vivo.', 'neutral')),
      no('Relax, grandpa. It\'s coming.', 'Desrespeitoso, mesmo que ele tenha sido irônico.'),
      no("I'm so sorry for the waiting. It's coming right now.", 'O substantivo é "the wait" (a espera).'),
    ]),
  ]),

  // ── indecisos ────────────────────────────────────────────────────────────
  ord('ord-indecisive-02', 'indecisive', 'food', 'A2+', [
    say("I'm starving. I want something savory and big. Like, really big.", 'Tô morrendo de fome. Quero algo salgado e grande. Tipo, grande mesmo.', 'tired'),
    recommend('rec', ['starving', 'savory'], 'What do you recommend?', ['savory', 'heavy'], ['cheese toastie', 'egg sandwich', 'fruit cup', 'lemon cake'], 'O sanduíche de ovo é salgado mas leve; frutas e bolo de limão são doces.'),
  ]),
  ord('ord-indecisive-03', 'indecisive', 'food', 'A2+', [
    say("Something savory for breakfast, please. I'm not a dessert-for-breakfast person.", 'Algo salgado para o café da manhã, por favor. Não sou do tipo sobremesa no café da manhã.', 'thinking'),
    recommend('rec', ['breakfast', 'savory'], 'What do you recommend?', ['breakfast', 'savory'], ['egg sandwich', 'croissant', 'blueberry muffin', 'yogurt bowl'], 'Croissant, muffin e iogurte não são salgados.'),
    choose('why', ['g:comparatives'], [
      ok("The egg sandwich is more filling than the croissant.", say("Filling is my favorite adjective.", 'Que sustenta é o meu adjetivo favorito.', 'happy')),
      no('The egg sandwich is filling than the croissant.', 'Falta o comparativo: "MORE filling than".'),
      no('The egg sandwich is more filling that the croissant.', 'No comparativo é "than", não "that".'),
    ], 'Explique a sua sugestão:'),
  ]),

  // ── grupo ────────────────────────────────────────────────────────────────
  ord('ord-group-01', 'group', 'drinks', 'A2', [
    say('OK, one for me and two for my friends. Three iced teas!', 'Ok, um pra mim e dois pros meus amigos. Três chás gelados!', 'happy'),
    group('order', ['g:quantities', 'iced_tea'], { 'iced tea': 3 }, ['iced tea', 'green tea', 'orange juice', 'latte']),
  ]),
  ord('ord-group-02', 'group', 'food', 'A2+', [
    say("Gimme two mochas and, like, four chocolate cookies. It's a study group. We're not studying.", 'Me vê dois mochas e, tipo, quatro cookies de chocolate. É um grupo de estudo. A gente não tá estudando.', 'happy'),
    group('order', ['g:quantities', 'g:register_informal'], { mocha: 2, 'chocolate cookie': 4 }, ['mocha', 'latte', 'chocolate cookie', 'brownie']),
  ]),
  ord('ord-group-03', 'group', 'work', 'B1', [
    say('For the board meeting: three espressos and two slices of lemon cake, please.', 'Para a reunião da diretoria: três expressos e duas fatias de bolo de limão, por favor.', 'neutral'),
    group('order', ['g:quantities', 'g:register_formal'], { espresso: 3, 'lemon cake': 2 }, ['espresso', 'black coffee', 'lemon cake', 'carrot cake']),
  ]),

  // ── reclamações ──────────────────────────────────────────────────────────
  ord('ord-complaint-02', 'complaint', 'ordering', 'A2+', [
    say('This is not what I ordered. I asked for oat milk, not almond milk. Are you kidding me?', 'Não foi isso que eu pedi. Pedi leite de aveia, não de amêndoas. Tá de brincadeira?', 'angry'),
    ask('problem', ['are_you_kidding', 'oat_milk'], "What's the problem?", ['Wrong milk: almond instead of oat.', 'The drink is too cold.', 'The cup is too small.']),
    choose('reply', ['so_sorry', 'g:register_formal'], [
      ok("I'm so sorry about that. I'll make you a new one with oat milk.", say('Thank you. That was fast. Fine.', 'Obrigado. Foi rápido. Tá bom.', 'neutral')),
      no('Milk is milk. Just drink it.', 'Grosseiro e ainda erra o pedido de novo.'),
      no("I'm so sorry about that. I'll make you a new one with oats milk.", 'É "oat milk" (sem -s em oat).'),
    ]),
  ]),
  ord('ord-complaint-03', 'complaint', 'ordering', 'B1', [
    say("I'm afraid my cappuccino is rather cold. Would it be possible to have a hot one?", 'Receio que meu cappuccino esteja bem frio. Seria possível um quente?', 'neutral'),
    choose('reply', ['i_apologize', 'right_away'], [
      ok("I apologize. I'll make you a fresh one right away.", say('Most kind. Thank you.', 'Muita gentileza. Obrigado.', 'happy')),
      no("I apologize. I'll make you a fresh one right way.", 'A expressão é "right away" (imediatamente).'),
      no("It's not cold. It's... cool.", 'Discutir com o cliente não resolve nada.'),
    ]),
  ]),
  ord('ord-complaint-04', 'complaint', 'cats', 'A2+', [
    say("Excuse me, there's a cat in my chair. I'm not complaining. Just... informing.", 'Com licença, tem um gato na minha cadeira. Não tô reclamando. Só... informando.', 'thinking'),
    choose('reply', ['g:can_could_requests'], [
      ok("Ah, that's Elias! I can move him, or you can share the chair.", say("I'll share. He was here first.", 'Vou dividir. Ele chegou primeiro.', 'love')),
      no("Ah, that's Elias! I can to move him.", 'Depois de "can", o verbo vem sem "to".'),
      no('Cats have priority here. Find another chair.', 'Engraçado, mas grosseiro com o cliente.'),
    ]),
  ]),

  // ── pagamento e troco ───────────────────────────────────────────────────
  ord('ord-pay-01', 'payment', 'ordering', 'A2', [
    say("A cappuccino and a croissant. That's seven fifty, right? Here's a ten.", 'Um cappuccino e um croissant. Dá sete e cinquenta, né? Aqui tem uma de dez.', 'neutral'),
    change('change', ['change', 'g:prices'], 'How much change do you give?', price('cappuccino') + price('croissant'), 1000, [350, 150, 275]),
  ]),
  ord('ord-pay-02', 'payment', 'ordering', 'A2+', [
    say('A mocha is five dollars? It used to cost three. Unbelievable.', 'Um mocha custa cinco dólares? Custava três. Inacreditável.', 'angry'),
    say("Fine. Here's a twenty. Don't tell my wife.", 'Tá. Aqui tem uma nota de vinte. Não conta pra minha mulher.', 'tired'),
    change('change', ['g:used_to', 'g:prices'], 'How much change does he get?', price('mocha'), 2000, [1600, 1400, 1550]),
  ]),
  ord('ord-pay-03', 'payment', 'ordering', 'A2', [
    say('One orange juice. Card or cash? Cash. I\'m old school.', 'Um suco de laranja. Cartão ou dinheiro? Dinheiro. Sou das antigas.', 'happy'),
    change('change', ['card_or_cash', 'change'], 'The orange juice is three seventy-five. He pays with ten dollars. Change?', price('orange juice'), 1000, [725, 525, 675]),
  ]),

  // ── perguntas sobre o cardápio ──────────────────────────────────────────
  ord('ord-menu-01', 'menu_question', 'drinks', 'A2+', [
    say("What's the difference between a latte and a flat white? Be honest. Is it just marketing?", 'Qual a diferença entre um latte e um flat white? Seja sincero. É só marketing?', 'thinking'),
    ask('diff', ['flat_white', 'latte'], 'Which answer is correct?', ['A flat white is stronger, with less milk.', 'A flat white has no coffee.', 'A latte is always iced.']),
  ]),
  ord('ord-menu-02', 'menu_question', 'drinks', 'A2', [
    say('Is the chai latte spicy? I am a baby with spices.', 'O chai latte é apimentado? Sou um bebê com temperos.', 'worried'),
    ask('spicy', ['spicy', 'chai_latte'], 'What do you tell him?', ["It's a little spicy, with cinnamon and ginger.", "It's made with orange juice.", "It's not a drink."]),
    say("A little spicy. OK. I'm brave today. Let's go.", 'Um pouco apimentado. Ok. Hoje tô corajoso. Bora.', 'excited'),
  ]),
  ord('ord-menu-03', 'menu_question', 'drinks', 'A2+', [
    say("I hate coffee. Don't ask why I'm in a café. What do you recommend?", 'Odeio café. Não pergunta por que tô num café. O que você recomenda?', 'neutral'),
    choose('rec', ['g:can_could_requests'], [
      ok('You could try a hot chocolate or a green tea.', say('Green tea. I\'m a sophisticated coffee hater.', 'Chá verde. Sou uma pessoa sofisticada que odeia café.', 'happy')),
      no('You could trying a hot chocolate or a green tea.', 'Depois de "could", verbo base: "could try".'),
      no('Then why are you here?', 'Ele avisou para não perguntar!'),
    ]),
  ]),

  // ── telefone ─────────────────────────────────────────────────────────────
  ord('ord-phone-02', 'phone', 'work', 'A2+', [
    say("Hi, I'm calling from the dentist's office next door. Can I order a large green tea and a fruit cup?", 'Oi, tô ligando do consultório do dentista aqui do lado. Posso pedir um chá verde grande e um copo de frutas?', 'neutral'),
    say("The doctor will pick it up at three. She's the one with the scary smile.", 'A doutora vai buscar às três. É a do sorriso assustador.', 'happy'),
    order('order', ['green_tea', 'large'], { size: 'large', drink: 'green tea', food: ['fruit cup'] }),
    ask('when', ['pick_up'], 'When will the doctor pick up the order?', ['at three', 'at noon', 'tomorrow']),
  ], true),
];
