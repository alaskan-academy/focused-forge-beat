import type { Character, Scene, Step } from '../types';
import { ask, build, chapter, choose, gap, no, ok, recall, say, spot, write } from '../dsl';

// Belmont Sulphur: o senhorio. Um diabo elegante, irônico e entediado, dono do prédio do café.
// Sabe que é um personagem escrito por uma IA e que vocês estão aqui para aprender inglês, e trata
// tudo com desdém. Cobra o aluguel uma vez por dia (ver lib/coffee/landlord.ts) e guarda o mistério
// do pacto da cabana. Nível B1, falas longas (cenas `long`).
//
// Marcadores além dos de personalize.ts ({partner}, {Sub}…):
//  - números da conta: {rent} {fee} {debt} {total} {earned} {errors} {coins}  (lib/coffee/landlord.ts)
//  - quem reservou a cabana: {booker} / {Booker} = "you"/"You" ou o nome da outra pessoa

const B = 'Belmont';

// visita de cobrança do dia a dia (quando não há capítulo novo) e cena da conta
const visit = (id: string, steps: Step[]): Scene => ({ id, kind: 'regular', theme: 'life', level: 'B1', steps, long: true });
const bill = (id: string, steps: Step[]): Scene => ({ id, kind: 'regular', theme: 'life', level: 'B1', steps, long: true });

// Pergunta pessoal do capítulo 1: as duas respostas curtas valem e a escolha fica guardada.
const whoBooked: Step = {
  activity: {
    id: 'booked',
    type: 'choose_reply',
    either: true,
    items: ['g:short_answers', 'g:aux_do'],
    prompt_pt: 'Quem reservou a cabana? (as duas respostas certas valem: escolha a verdade)',
    options: [
      {
        text: 'I did.',
        correct: true,
        value: 'me',
        reaction: say('You did? How romantic. And how expensive. I remember the invoice. I framed it.', 'Foi você? Que romântico. E que caro. Lembro da fatura. Coloquei num quadro.', 'happy', B),
      },
      {
        text: '{Sub} did.',
        correct: true,
        value: 'partner',
        reaction: say('{Sub} did? So you just showed up and ate the brigadeiros. Classic.', 'Foi {ela}? Então você só apareceu e comeu os brigadeiros. Clássico.', 'happy', B),
      },
      { text: 'Me did.', why_pt: 'Para responder "quem fez", use sujeito + auxiliar: "I did." ou "She/He did."' },
    ],
  },
};

const belmont: Character = {
  id: 'belmont',
  name: 'Belmont Sulphur',
  look: {
    skin: '#d98c7a',
    hair: { style: 'curto', color: '#1f1414' },
    shirt: { style: 'manga longa', color: '#6b1f2a' },
    pants: { style: 'calça', color: '#2a1a1f' },
    shoes: { style: 'bota', color: '#120c0c' },
    horns: true,
  },
  personality_pt: 'Diabo elegante, irônico e entediado. Sabe que foi escrito por uma IA e acha tudo isso abaixo dele.',
  bio_pt: 'Dono do prédio do café. Cobra o aluguel todo dia, coleciona seus erros de inglês num pote e guarda um contrato que vocês assinaram numa cabana em Florianópolis.',
  chapters: [
    chapter(
      'belmont-1',
      'O contrato',
      'Belmont Sulphur, o dono do prédio, apareceu para cobrar o aluguel. Explicou as regras (aluguel variável e uma moeda por erro de inglês) e falou de um contrato assinado numa cabana em Florianópolis, num Dia dos Namorados. Levou todo o seu dinheiro.',
      'life',
      'B1',
      [
        say(
          "Good afternoon. Don't get up. You weren't going to get up anyway. I'm Belmont Sulphur, the owner of this building, this café and, technically, the chair you're sitting on.",
          'Boa tarde. Não se levante. Você não ia se levantar mesmo. Sou Belmont Sulphur, dono deste prédio, deste café e, tecnicamente, da cadeira em que você está sentado.',
          'neutral',
          B,
        ),
        say(
          "Yes, I'm a devil. Horns, tail, excellent taste in suits. And yes, I know I was written by an AI at three in the morning. I've read my own code. It's mostly comments in Portuguese.",
          'Sim, sou um diabo. Chifres, rabo, ótimo gosto para ternos. E sim, sei que fui escrito por uma IA às três da manhã. Li meu próprio código. É quase tudo comentário em português.',
          'thinking',
          B,
        ),
        ask('owns', ['g:aux_be'], 'What does Belmont own?', ['the building and the café', 'only the coffee machine', 'the cat']),
        say(
          "Here's how this works. Every day, after you start working, I come to collect the rent. The rent changes: if you earn more, I take more. My husband, Gerald, calls it capitalism. I call it Tuesday.",
          'Funciona assim. Todo dia, depois que você começa a trabalhar, eu venho cobrar o aluguel. O aluguel muda: se você ganha mais, eu levo mais. Meu marido, Gerald, chama isso de capitalismo. Eu chamo de terça-feira.',
          'neutral',
          B,
        ),
        say(
          "And every mistake you make in English costs you one coin. Every 'I am agree'. Every 'did you went'. I collect them personally and keep them in a jar.",
          'E cada erro que você comete em inglês custa uma moeda. Cada "I am agree". Cada "did you went". Eu recolho pessoalmente e guardo num pote.',
          'happy',
          B,
        ),
        spot('jar', ['g:aux_be'], 'I *am* agree with the rules.', 'I agree with the rules.', '"Agree" já é verbo: não precisa de "am". É só "I agree".'),
        say(
          "Now, about the contract. You don't remember it, do you? Florianópolis. June the twelfth. A small cabin in the woods. You were… very relaxed.",
          'Agora, sobre o contrato. Você não lembra, né? Florianópolis. Doze de junho. Uma cabaninha no meio do mato. Você estava… muito relaxado.',
          'thinking',
          B,
        ),
        say('Tell me something. Who booked the cabin? You, or {partner}?', 'Me diz uma coisa. Quem reservou a cabana? Você ou {partner}?', 'thinking', B),
        whoBooked,
        say(
          "Anyway, you both signed. You traded something very valuable for one perfect night. I won't tell you what. Not yet. It's more fun this way.",
          'Enfim, vocês dois assinaram. Trocaram algo muito valioso por uma noite perfeita. Não vou dizer o quê. Ainda não. É mais divertido assim.',
          'happy',
          B,
        ),
        gap('what', ['g:aux_do'], 'player', 'Wait. What ', 'did', ' we trade?', 'Espera. O que a gente trocou?', ['did', 'do', 'were']),
        say("Wouldn't you like to know.", 'Bem que você queria saber.', 'happy', B),
        say(
          "Finally, the first payment. First month's rent, the deposit, and a small fee for my emotional damage. That's {coins} coins. Exactly what you have. What a coincidence.",
          'Por fim, o primeiro pagamento. Aluguel do primeiro mês, o depósito e uma taxinha pelos meus danos emocionais. São {coins} moedas. Exatamente o que você tem. Que coincidência.',
          'happy',
          B,
        ),
        choose('protest', ['g:aux_modals', 'g:register_formal'], [
          ok(
            'Could we discuss this? It seems a little unfair.',
            say("We could. We won't. Take it easy, darling. It's only money. Well, it was.", 'Poderíamos. Não vamos. Relaxa, querido. É só dinheiro. Bom, era.', 'happy', B),
          ),
          no('Can we to discuss this? It seems a little unfair.', 'Depois de can/could/should o verbo vem direto, sem "to": "Can we discuss…?"'),
          no('Bro, chill. That is a LOT of money.', 'Informal demais para negociar com o dono do prédio (e com um demônio). Ele respeita formalidade.'),
        ]),
        say(
          "See you tomorrow. And the day after. And the day after that. I'm very consistent. Don't take it personally.",
          'Até amanhã. E depois de amanhã. E no dia seguinte. Sou muito constante. Não leve para o lado pessoal.',
          'neutral',
          B,
        ),
      ],
      { gapDays: 0, long: true },
    ),
    chapter(
      'belmont-2',
      'A cabana',
      'Belmont contou detalhes da cabana em Florianópolis, reservada de presente: vista para o mar, uma lareira que ninguém sabia acender e a chave embaixo do tapete. Ele confessou que a cabana era dele.',
      'life',
      'B1',
      [
        say("You again. Wonderful. I've been thinking about our little cabin. Mostly because I own it.", 'Você de novo. Maravilha. Andei pensando na nossa cabaninha. Principalmente porque ela é minha.', 'neutral', B),
        recall('city', 'belmont-1', ['g:aux_be'], 'Where was the cabin?', ['Florianópolis', 'Lisbon', 'Gramado']),
        say(
          "{Booker} booked it as a gift. A wooden cabin, a view of the sea, a fireplace nobody knew how to use. Very romantic. Very flammable. I took the reservation myself.",
          '{Booker_pt} reservou de presente. Uma cabana de madeira, vista para o mar, uma lareira que ninguém sabia usar. Muito romântico. Muito inflamável. Eu mesmo peguei a reserva.',
          'thinking',
          B,
        ),
        gap('took', ['g:take_forms'], 'customer', 'I ', 'took', ' the reservation myself.', 'Eu mesmo peguei a reserva.', ['took', 'taken', 'take']),
        say('I owned that cabin for three hundred years. Before that, it was a tree. I owned the tree too.', 'Fui dono daquela cabana por trezentos anos. Antes disso, era uma árvore. A árvore também era minha.', 'happy', B),
        choose('echo', ['g:echo_questions', 'g:aux_do'], [
          ok('Did you?', say('I did. Trees are cheap if you are patient.', 'Fui. Árvore sai barato se você for paciente.', 'happy', B)),
          no('Do you did?', 'Para reagir com surpresa, repita só o auxiliar no passado: "Did you?"'),
          no('Was you?', 'Com "you" é WERE, e aqui a frase original usa "owned" (ação), então a reação é "Did you?".'),
        ]),
        say(
          "You two arrived late, of course. You couldn't find the key. It was under the mat. It is always under the mat. Humans never check the mat.",
          'Vocês chegaram atrasados, claro. Não acharam a chave. Estava embaixo do tapete. Sempre está embaixo do tapete. Humanos nunca olham o tapete.',
          'tired',
          B,
        ),
        ask('key', ['g:aux_be'], 'Where was the key?', ['under the mat', 'in the fireplace', 'in his pocket']),
        spot('fire', ['g:aux_do'], "We didn't *knew* how to use the fireplace.", "We didn't know how to use the fireplace.", 'Depois de "didn\'t", o verbo volta para a forma base: "didn\'t KNOW".'),
        say(
          "Tomorrow I'll tell you about the brigadeiros. Bring your shame. Take care.",
          'Amanhã eu conto dos brigadeiros. Traga sua vergonha. Se cuida.',
          'happy',
          B,
        ),
      ],
      { gapDays: 1, long: true },
    ),
    chapter(
      'belmont-3',
      'Os brigadeiros',
      'Belmont lembrou dos brigadeiros "mágicos" da cabana: vocês comeram onze, riram por três horas de uma colher e ficaram mais relaxados do que nunca. Foi nesse estado que vocês assinaram o contrato.',
      'life',
      'B1',
      [
        say("Let's talk about the brigadeiros. The 'magic' ones. I use quotation marks because I'm a professional.", 'Vamos falar dos brigadeiros. Os "mágicos". Uso aspas porque sou profissional.', 'happy', B),
        recall('gift', 'belmont-2', ['g:aux_be'], 'What was the cabin?', ['a gift', 'a hotel', 'a restaurant']),
        say(
          "The plan was to eat one each. You ate eleven. Eleven. I wrote it down. I was impressed and slightly concerned.",
          'O plano era comer um cada. Vocês comeram onze. Onze. Eu anotei. Fiquei impressionado e um pouco preocupado.',
          'excited',
          B,
        ),
        ask('eleven', ['g:take_forms'], 'How many brigadeiros did they eat?', ['eleven', 'one each', 'three']),
        say(
          "For three hours, you laughed at a spoon. A normal spoon. Then one of you tried to take a picture of the moon with the microwave. That was the moment I knew. These are my people.",
          'Por três horas, vocês riram de uma colher. Uma colher normal. Depois um de vocês tentou tirar foto da lua com o micro-ondas. Foi aí que eu soube. Essa é a minha gente.',
          'happy',
          B,
        ),
        gap('picture', ['g:take_phrases'], 'customer', 'One of you tried to ', 'take', ' a picture of the moon.', 'Um de vocês tentou tirar foto da lua.', ['take', 'make', 'do']),
        spot('taken', ['g:take_forms', 'g:aux_have'], 'Have you ever *took* eleven brigadeiros?', 'Have you ever taken eleven brigadeiros?', 'Depois de have/has vem o particípio: TAKEN, não "took".'),
        say("And that, darling, is when you signed. Very relaxed people sign very interesting contracts.", 'E foi aí, querido, que vocês assinaram. Gente muito relaxada assina contratos muito interessantes.', 'thinking', B),
        choose('signed', ['g:short_answers', 'g:aux_do'], [
          ok("No, we didn't! …Did we?", say('You did. Twice. One of you signed with a brigadeiro.', 'Assinaram. Duas vezes. Um de vocês assinou com um brigadeiro.', 'happy', B)),
          no("No, we didn't signed!", 'Depois de "didn\'t", o verbo fica na forma base: "we didn\'t sign". Ou só a resposta curta: "No, we didn\'t!"'),
          no("No, we don't!", 'Ele está falando do passado (signed), então o auxiliar é DID: "No, we didn\'t!"'),
        ]),
        say("Tomorrow, the clause. The part you really should have read. Take it easy until then.", 'Amanhã, a cláusula. A parte que vocês realmente deveriam ter lido. Relaxa até lá.', 'neutral', B),
      ],
      { gapDays: 1, long: true },
    ),
    chapter(
      'belmont-4',
      'A cláusula',
      'Belmont revelou o que vocês trocaram no pacto: o inglês de vocês, por uma noite perfeita. É por isso que "though, thought, through" não fazem sentido. O café é o jeito de comprar o inglês de volta, aluguel por aluguel.',
      'life',
      'B1',
      [
        say(
          "Today I'll read you the clause. Sit down. Oh, you're already sitting. You're always sitting.",
          'Hoje vou ler a cláusula para você. Sente-se. Ah, você já está sentado. Você está sempre sentado.',
          'neutral',
          B,
        ),
        recall('count', 'belmont-3', ['g:take_forms'], 'How many brigadeiros did they eat in the cabin?', ['eleven', 'two', 'twenty']),
        say(
          "Clause seven: 'In exchange for one perfect night, the signers give Belmont Sulphur their English.' All of it. The grammar, the vocabulary, the confidence. That's why 'though', 'thought' and 'through' make no sense to you. That was me.",
          'Cláusula sete: "Em troca de uma noite perfeita, os signatários entregam a Belmont Sulphur o seu inglês." Todo ele. A gramática, o vocabulário, a confiança. É por isso que "though", "thought" e "through" não fazem sentido pra você. Fui eu.',
          'happy',
          B,
        ),
        ask('trade', ['g:aux_do'], 'What did they trade for one perfect night?', ['their English', 'their cat', 'their café']),
        choose('echo2', ['g:echo_questions', 'g:aux_have'], [
          ok("You've taken our English? Have you?", say('I have. I keep it in a jar, next to your mistakes.', 'Tirei. Guardo num pote, do lado dos seus erros.', 'happy', B)),
          no("You've took our English? Have you?", 'Depois de have, o particípio é TAKEN: "You\'ve taken…"'),
          no("You've taken our English? Did you?", 'A frase usa "have" (you\'ve taken), então a reação repete HAVE: "Have you?"'),
        ]),
        say(
          "But there's good news. Every day you work here and pay me, you buy a little of it back, a word here, an auxiliary there. That's why I come every day. I'm basically your teacher. A very expensive one.",
          'Mas tem uma boa notícia. Cada dia que você trabalha aqui e me paga, você compra um pouquinho de volta. Uma palavra aqui, um auxiliar ali. É por isso que eu venho todo dia. Basicamente sou seu professor. Um bem caro.',
          'thinking',
          B,
        ),
        spot('does', ['g:aux_do'], "Belmont *don't* give anything for free.", "Belmont doesn't give anything for free.", 'Com he/she/it (Belmont), o auxiliar é DOES: "Belmont doesn\'t…"'),
        gap('should', ['g:aux_modals'], 'customer', 'You ', 'should', ' always read the fine print.', 'Você sempre deveria ler as letras miúdas.', ['should', 'should to', 'shoulds']),
        say("Tomorrow we finish this. Don't take it personally. Actually, do. It's more fun.", 'Amanhã a gente encerra isso. Não leve pro lado pessoal. Na verdade, leve. É mais divertido.', 'happy', B),
      ],
      { gapDays: 1, long: true },
    ),
    chapter(
      'belmont-5',
      'Rescisão',
      'Belmont declarou o pacto encerrado: vocês já compraram o inglês de volta, aluguel por aluguel. O dinheiro ele não devolve. Continua sendo o dono do prédio e continua cobrando todo dia.',
      'life',
      'B1',
      [
        say(
          "I checked my jar this morning. Fewer mistakes than last week. It's disgusting. I'm almost proud.",
          'Olhei meu pote hoje de manhã. Menos erros que semana passada. É nojento. Estou quase orgulhoso.',
          'thinking',
          B,
        ),
        recall('clause', 'belmont-4', ['g:aux_do'], 'What did they give Belmont in the contract?', ['their English', 'a brigadeiro', 'the cabin']),
        say(
          "So, officially: the contract is void. You bought your English back, one rent at a time. Clause seven is gone. 'Though', 'thought' and 'through' are your problem now, not mine.",
          'Então, oficialmente: o contrato está anulado. Vocês compraram o inglês de volta, um aluguel de cada vez. A cláusula sete acabou. "Though", "thought" e "through" agora são problema seu, não meu.',
          'neutral',
          B,
        ),
        choose('refund', ['g:aux_modals', 'g:register_formal'], [
          ok(
            'Could we have our money back, then?',
            say(
              "Refund? Darling, I'm a devil, not a customer service department. The pact is void. The money is mine. Character development is your reward.",
              'Reembolso? Querido, sou um diabo, não um SAC. O pacto acabou. O dinheiro é meu. Seu amadurecimento é a recompensa.',
              'happy',
              B,
            ),
          ),
          no('Could we to have our money back, then?', 'Depois de "could", o verbo vem direto, sem "to".'),
          no('Give money back now, devil.', 'Grosso e sem verbo auxiliar de pedido. Com o dono do prédio, um pedido educado funciona melhor (e mesmo assim não funciona).'),
        ]),
        say(
          "And, of course, I still own the building. So I'll see you tomorrow, for the rent. Some things are eternal. Me, for example.",
          'E, claro, o prédio continua sendo meu. Então te vejo amanhã, para o aluguel. Algumas coisas são eternas. Eu, por exemplo.',
          'neutral',
          B,
        ),
        write(
          'english',
          ['g:aux_modals', 'g:aux_have'],
          'Tell Belmont one thing you can do in English now.',
          'Conte para o Belmont uma coisa que você consegue fazer em inglês agora.',
          [['can', 'could', 'have', 'am able', "i'm able"]],
          ['I can order a coffee without panic.', 'Now I can understand my English teacher.', 'I have learned the past simple.'],
        ),
        build('bye', ['c:dont_take_it_personally', 'g:aux_do'], "Don't take it personally, Belmont.", 'Não leve pro lado pessoal, Belmont.', ['took', 'doesn', 'personal']),
      ],
      { gapDays: 1, long: true },
    ),
  ],
  regulars: [
    visit('belmont-v-gerald', [
      say(
        "Gerald says hello. He reviewed your numbers last night and had to lie down. He's a demon of spreadsheets. He's seen things.",
        'O Gerald mandou um oi. Ele revisou seus números ontem à noite e precisou deitar. Ele é um demônio das planilhas. Já viu coisas.',
        'happy',
        B,
      ),
      choose('gerald', ['g:echo_questions', 'g:aux_be'], [
        ok('Is he OK?', say("He is. He's taking a break. Demons need breaks too.", 'Está. Está fazendo uma pausa. Demônios também precisam de pausa.', 'neutral', B)),
        no('Is he is OK?', 'O auxiliar vai uma vez só, antes do sujeito: "Is he OK?"'),
        no('Does he is OK?', 'Com o verbo "be" não se usa "does": "Is he OK?"'),
      ]),
      spot('break', ['g:take_phrases', 'c:take_a_break'], 'He needs to *make* a break today.', 'He needs to take a break today.', 'Em inglês é TAKE a break, não "make".'),
    ]),
    visit('belmont-v-lie', [
      say(
        "Tell me about your day. Lie to me, if you want. I prefer lies, they have better grammar. But use the past simple, or I charge extra.",
        'Me conta do seu dia. Pode mentir, se quiser. Prefiro mentiras, têm gramática melhor. Mas use o past simple, ou cobro extra.',
        'thinking',
        B,
      ),
      write(
        'day',
        ['g:past_simple', 'g:irregular_past'],
        'Tell Belmont something you did yesterday (past simple).',
        'Conte para o Belmont algo que você fez ontem (no passado).',
        [['went', 'took', 'ate', 'had', 'saw', 'made', 'worked', 'watched', 'played', 'cooked', 'slept', 'drank', 'met', 'studied', 'did', 'was', 'were', 'got', 'bought']],
        ['I went to the gym and took a long shower.', 'I worked all day and watched a movie.', 'Yesterday I cooked pasta.'],
      ),
      say("Fascinating. I've heard more exciting stories from a toaster. Next.", 'Fascinante. Já ouvi histórias mais empolgantes de uma torradeira. Próximo.', 'tired', B),
    ]),
    visit('belmont-v-writer', [
      say(
        "Do you know what's humiliating? An AI wrote me in one night. It gave me horns, a husband and a jar of your mistakes. It didn't give me a vacation.",
        'Sabe o que é humilhante? Uma IA me escreveu em uma noite. Me deu chifres, um marido e um pote dos seus erros. Não me deu férias.',
        'tired',
        B,
      ),
      ask('vacation', ['g:aux_do'], "What didn't the AI give Belmont?", ['a vacation', 'horns', 'a husband']),
      say('Do you feel sorry for me? Short answer, please. I bill by the word.', 'Você sente pena de mim? Resposta curta, por favor. Eu cobro por palavra.', 'thinking', B),
      choose('short', ['g:short_answers'], [
        ok('Yes, I do.', say('Of course you do. Everyone does.', 'Claro que sim. Todo mundo.', 'neutral', B)),
        no('Yes, I know do.', 'Resposta curta: só sujeito + auxiliar: "Yes, I do."'),
        no('Yes, I am.', 'A pergunta usa DO ("Do you…?"), então a resposta repete DO: "Yes, I do."'),
      ]),
    ]),
    visit('belmont-v-take', [
      say(
        "Today's lesson is free, which never happens. Take for the present, took for the past, taken after 'have'. If you say 'have took', I take a coin. See? Three forms in one sentence.",
        'A aula de hoje é grátis, o que nunca acontece. Take: presente. Took: passado. Taken: depois de "have". Se você disser "have took", eu levo uma moeda. Viu? Três formas numa frase.',
        'happy',
        B,
      ),
      gap('t1', ['g:take_forms'], 'player', 'Yesterday I ', 'took', ' the bus to work.', 'Ontem peguei o ônibus pro trabalho.', ['took', 'taken', 'take']),
      gap('t2', ['g:take_forms', 'g:aux_have'], 'player', "I've never ", 'taken', ' a taxi in London.', 'Nunca peguei um táxi em Londres.', ['taken', 'took', 'take']),
      say('Acceptable. Annoyingly acceptable.', 'Aceitável. Irritantemente aceitável.', 'neutral', B),
    ]),
    visit('belmont-v-aux', [
      say(
        "I collected four 'she don't' this week. Four. It's 'she DOESN'T'. He, she, it: does, doesn't. I'm going to put it on a T-shirt.",
        'Recolhi quatro "she don\'t" esta semana. Quatro. É "she DOESN\'T". He, she, it: does, doesn\'t. Vou estampar numa camiseta.',
        'angry',
        B,
      ),
      spot('she', ['g:aux_do', 'g:third_person_s'], "{Sub} *don't* like my jokes.", "{Sub} doesn't like my jokes.", 'Com she/he/it o auxiliar é DOES: "doesn\'t".'),
      choose('does', ['g:aux_do'], [
        ok('Does Gerald like your jokes?', say('Gerald laughs at spreadsheets. So yes.', 'O Gerald ri de planilhas. Então sim.', 'happy', B)),
        no('Do Gerald like your jokes?', 'Gerald = he, então o auxiliar é DOES: "Does Gerald…?"'),
        no('Does Gerald likes your jokes?', 'Com "does", o verbo volta para a forma base: "like", sem -s.'),
      ]),
    ]),
    visit('belmont-v-were', [
      say(
        "When I arrived yesterday, you were sleeping on the counter. Customers were waiting. The cat was running the café. Honestly, he was better.",
        'Quando cheguei ontem, você estava dormindo no balcão. Clientes estavam esperando. O gato estava tocando o café. Sinceramente, ele foi melhor.',
        'thinking',
        B,
      ),
      ask('cat', ['g:aux_be'], 'Who was running the café?', ['the cat', 'Gerald', 'Belmont']),
      gap('were', ['g:aux_be'], 'player', 'I ', 'was', " only resting my eyes!", 'Eu só estava descansando os olhos!', ['was', 'were', 'did']),
      say("Of course you were. Take your time. Not really, the rent is due.", 'Claro que estava. Com calma. Brincadeira, o aluguel venceu.', 'happy', B),
    ]),
    visit('belmont-v-modals', [
      say(
        "Let me give you some advice, for free, which is unusual. You should read contracts. You shouldn't eat eleven brigadeiros. And you could at least pretend to be happy to see me.",
        'Deixa eu te dar um conselho, de graça, o que é raro. Você deveria ler contratos. Não deveria comer onze brigadeiros. E poderia pelo menos fingir que está feliz em me ver.',
        'neutral',
        B,
      ),
      spot('can', ['g:aux_modals'], 'I can *to* pay you tomorrow.', 'I can pay you tomorrow.', 'Depois de can/could/should/will, o verbo vem direto, sem "to".'),
      choose('happy', ['g:aux_modals', 'g:register_formal'], [
        ok("I'm delighted to see you, Mr. Sulphur.", say('Liar. But a polite liar. I respect that.', 'Mentiroso. Mas um mentiroso educado. Respeito isso.', 'happy', B)),
        no('I can to be happy to see you.', 'Sem "to" depois de can. E ele pediu para você FINGIR alegria, com educação.'),
        no('Ugh. You again?', 'Sincero, mas ele pediu educação. Com o senhorio, o formal funciona melhor.'),
      ]),
    ]),
    visit('belmont-v-echo', [
      say(
        "I've been married for three hundred years. Gerald and I met at a tax office. It was love at first audit.",
        'Sou casado há trezentos anos. Gerald e eu nos conhecemos numa repartição de impostos. Foi amor à primeira auditoria.',
        'love',
        B,
      ),
      choose('echo3', ['g:echo_questions', 'g:aux_have'], [
        ok('Have you? That is so romantic.', say('It is. He still sends me invoices with little hearts.', 'É. Ele ainda me manda faturas com coraçõezinhos.', 'love', B)),
        no('Did you? That is so romantic.', 'A frase dele usa "I\'ve been" (have), então a reação repete HAVE: "Have you?"'),
        no('Are you? That is so romantic.', 'A frase dele usa "I\'ve been" (have), não "I am". A reação é "Have you?"'),
      ]),
      ask('met', ['g:aux_do'], 'Where did Belmont and Gerald meet?', ['at a tax office', 'in the cabin', 'at a café']),
    ]),
  ],
};

// Cobrança do dia (vem depois do capítulo ou da visita, a partir da 2ª visita). A atividade
// `negotiate` sem erro dá desconto (até 5 moedas, ver lib/coffee/landlord.ts).
export const BELMONT_BILLS: Scene[] = [
  bill('belmont-bill-1', [
    say(
      'Now, the boring part, which is my favorite. You earned {earned} coins since my last visit, so the rent today is {rent}.',
      'Agora, a parte chata, que é a minha favorita. Você ganhou {earned} moedas desde a minha última visita, então o aluguel hoje é {rent}.',
      'happy',
      B,
    ),
    say(
      'You made {errors} mistakes, so {fee} more. Plus {debt} you still owe me. Total: {total}.',
      'Você cometeu {errors} erros, então mais {fee}. Mais {debt} que você ainda me deve. Total: {total}.',
      'happy',
      B,
    ),
    choose('negotiate', ['g:aux_modals', 'g:register_formal'], [
      ok('Would it be possible to pay a little less today?', say('It would. Five coins less. Your conditional was adequate.', 'Seria. Cinco moedas a menos. Seu condicional foi adequado.', 'neutral', B)),
      no('Would it be possible to paying a little less today?', 'Depois de "to", o verbo vai na forma base: "to pay".'),
      no('Can you make it cheaper, bro?', 'Informal demais. Com o Belmont, só o pedido educado ganha desconto.'),
    ], 'Peça um desconto com educação (acertando de primeira, ganha 5 moedas)'),
  ]),
  bill('belmont-bill-2', [
    say(
      "Let's do the math, since you clearly won't. You earned {earned} coins, so my rent is {rent}. Your mistakes: {errors}, that's {fee} coins.",
      'Vamos fazer as contas, já que você claramente não vai. Você ganhou {earned} moedas, então meu aluguel é {rent}. Seus erros: {errors}, ou seja, {fee} moedas.',
      'happy',
      B,
    ),
    say(
      "Old debt: {debt}. Total: {total}. I love numbers. Numbers never say 'I am agree'.",
      'Dívida antiga: {debt}. Total: {total}. Amo números. Números nunca dizem "I am agree".',
      'happy',
      B,
    ),
    choose('negotiate', ['g:aux_modals', 'g:polite_indirect'], [
      ok("I was wondering if you could give me a small discount.", say("You were wondering. How elegant. Five coins off. Don't get used to it.", 'Você estava se perguntando. Que elegante. Cinco moedas de desconto. Não se acostuma.', 'neutral', B)),
      no('I was wondering if you can to give me a discount.', 'Sem "to" depois de can/could. E no pedido indireto o mais natural é "could".'),
      no('Discount. Now.', 'Seco demais. Para ganhar desconto do Belmont, só com um pedido educado.'),
    ], 'Peça um desconto com educação (acertando de primeira, ganha 5 moedas)'),
  ]),
  bill('belmont-bill-3', [
    say(
      "Invoice time. Rent: {rent}. Errors: {errors}, and I counted every single one, so that's {fee} more.",
      'Hora da fatura. Aluguel: {rent}. Erros: {errors}, e contei um por um, então mais {fee}.',
      'happy',
      B,
    ),
    say(
      'Debt from before: {debt}. Total: {total}. Gerald checked it twice. He was thrilled.',
      'Dívida de antes: {debt}. Total: {total}. O Gerald conferiu duas vezes. Ficou encantado.',
      'happy',
      B,
    ),
    choose('negotiate', ['g:aux_modals', 'g:register_formal'], [
      ok('Could you possibly take a little less this time?', say('I could. I will. Five coins. Take it as a sign of weakness.', 'Poderia. Vou. Cinco moedas. Encare como um sinal de fraqueza.', 'neutral', B)),
      no('Could you possibly took a little less this time?', 'Depois de could, o verbo fica na forma base: "take", não "took".'),
      no('Take less, OK?', 'Curto e sem educação. Com o senhorio, use "Could you possibly…?"'),
    ], 'Peça um desconto com educação (acertando de primeira, ganha 5 moedas)'),
  ]),
];

export default belmont;
