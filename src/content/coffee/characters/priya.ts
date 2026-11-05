import type { Character } from '../types';
import { ask, chapter, choose, gap, no, ok, order, recall, regular, say, write } from '../dsl';

// Priya: desenvolvedora sarcástica que quer virar confeiteira.
const priya: Character = {
  id: 'priya',
  name: 'Priya',
  look: {
    skin: '#9c6644',
    hair: { style: 'longo', color: '#2b1d16' },
    shirt: { style: 'moletom', color: '#9b6fae' },
    pants: { style: 'calça', color: '#3d405b' },
    shoes: { style: 'tênis', color: '#f2ead8' },
  },
  personality_pt: 'Sarcástica, cansada e muito engraçada. Fala de código como se fosse novela.',
  bio_pt: 'Priya é desenvolvedora de software e sonha em largar tudo para virar confeiteira.',
  chapters: [
    chapter('priya-1', 'Código em chamas', 'Priya é desenvolvedora e vive apagando incêndios no código. Ela diz que preferiria fazer bolos, porque bolos não travam na sexta-feira.', 'work', 'A2+', [
      say('Hi. One large latte with an extra shot. My code is on fire.', 'Oi. Um latte grande com uma dose extra. Meu código está pegando fogo.', 'tired'),
      order('order', ['large', 'latte', 'extra_shot'], { size: 'large', drink: 'latte', extras: ['extra shot'] }),
      say("I'm a software developer. I fix bugs all day. Then I make new bugs.", 'Sou desenvolvedora. Conserto bugs o dia todo. Depois crio bugs novos.', 'tired'),
      say("Honestly? I'd rather bake cakes. Cakes don't crash on Fridays.", 'Sinceramente? Eu preferia fazer bolos. Bolo não trava na sexta-feira.', 'thinking'),
      choose('rather', ['g:would_rather'], [
        ok("Ha! Why don't you try baking on weekends?", say('On weekends I sleep. Or debug. Mostly I cry.', 'No fim de semana eu durmo. Ou conserto bug. Mais choro.', 'tired'), 1),
        no("You'd rather to bake cakes? Weird.", 'Depois de "would rather" o verbo vem sem "to", e chamar de estranho não ajuda.', -1),
        no("Ha! Why you don't try baking on weekends?", 'Ordem da pergunta: "Why don\'t you…?"'),
      ]),
      ask('job', ['g:third_person_s'], 'What does Priya do all day?', ['She fixes bugs.', 'She bakes cakes.', 'She sells computers.']),
    ], { gapDays: 0 }),

    chapter('priya-2', 'O primeiro bolo', 'Priya assou o primeiro bolo de limão da vida: ficou achatado, mas gostoso. Usou três receitas e o Stack Overflow.', 'food', 'A2+', [
      recall('cakes', 'priya-1', ['g:would_rather'], 'Quick test: what would I rather do instead of coding?', ['bake cakes', 'play the drums', 'sleep forever']),
      say('So I baked a lemon cake last night. For the first time. Look!', 'Então, assei um bolo de limão ontem à noite. Pela primeira vez. Olha!', 'excited'),
      say("It's... flat. Like my career. But it tastes good!", 'Tá... achatado. Que nem a minha carreira. Mas o gosto é bom!', 'happy'),
      choose('taste', ['g:did_vs_was'], [
        ok('It looks delicious! Did you use a recipe?', say('I used three recipes. And Stack Overflow.', 'Usei três receitas. E o Stack Overflow.', 'happy'), 1),
        no("It's flat. Did you even try?", 'Ela está orgulhosa do primeiro bolo; isso é duro demais.', -1, say('Wow. OK. Rude.', 'Nossa. Ok. Grosso.', 'sad')),
        no('It looks delicious! Did you used a recipe?', 'Depois de "did", verbo base: "Did you use…?"'),
      ]),
      gap('never', ['g:present_perfect'], 'customer', "I've ", 'never', ' baked anything before. Not even toast.', 'Eu nunca tinha assado nada antes. Nem torrada.', ['never', 'ever', "didn't"]),
    ]),

    chapter('priya-3', 'Conversa com o chefe', 'Priya contou ao chefe que vai fazer um curso de confeitaria à noite. Ele perguntou se era piada; ela perguntou se o salário dela era piada.', 'work', 'A2+', [
      recall('cake', 'priya-2', ['remember'], 'Do you remember what cake I baked?', ['a lemon cake', 'a carrot cake', 'a brownie']),
      say("Big news. I told my boss I'm gonna take a pastry course. At night.", 'Grande novidade. Falei pro meu chefe que vou fazer um curso de confeitaria. À noite.', 'excited'),
      say("He said, 'Is this a joke?' I said, 'Is my salary a joke?'", 'Ele disse: "Isso é piada?" Eu disse: "Meu salário é piada?"', 'angry'),
      ask('course', ['g:going_to', 'gonna'], 'What is Priya gonna do?', ['take a pastry course at night', 'quit her job tomorrow', 'open a bakery today']),
      choose('react', ['g:register_informal'], [
        ok("No way! That's awesome. Your boss is gonna miss you.", say("He's gonna miss me fixing his bugs, sure.", 'Ele vai sentir falta de mim consertando os bugs dele, claro.', 'happy'), 1),
        no('Most certainly, madam. Your employer shall miss you.', 'Formal demais para uma conversa entre amigos no café; soa como um mordomo.', 0, say('Uh... thanks, butler?', 'Hã... valeu, mordomo?', 'thinking')),
        no("No way! That's awesome. Your boss is gonna to miss you.", '"Gonna" já é "going to"; não existe "gonna to".'),
      ]),
    ]),

    chapter('priya-4', 'Croissants de verdade', 'Três semanas de curso: Priya já faz croissants de verdade e não mexe no código à noite. Talvez venda croissants aqui no café.', 'life', 'B1', [
      recall('boss', 'priya-3', ['remember'], 'Remember what my boss said about the course?', ['Is this a joke?', 'Congratulations!', "You're fired."]),
      say('Week three of the course. I can make croissants now. Real ones!', 'Semana três do curso. Agora sei fazer croissants. De verdade!', 'excited'),
      gap('since', ['g:it_has_been'], 'customer', "And it's been three weeks ", 'since', ' I touched my code at night.', 'E faz três semanas que eu não mexo no código à noite.', ['since', 'for', 'ago']),
      say('I feel human again. Weird feeling.', 'Me sinto humana de novo. Sensação estranha.', 'love'),
      write('advice', ['g:should_advice'], 'Give Priya some advice about her new dream.', 'Dê um conselho para a Priya sobre o novo sonho dela.', [['should', 'could', "why don't", 'maybe', 'try', 'keep', 'give up', 'go for it']], [
        'You should sell your croissants here!',
        "Don't give up. Keep baking!",
      ]),
      say("Sell them here? With the cats? ...I'm writing that down.", 'Vender aqui? Com os gatos? ...Vou anotar isso.', 'excited'),
    ]),
  ],
  regulars: [
    regular('priya-r1', 'drinks', 'A2', [
      say('Iced latte. Large. I have a deploy in ten minutes.', 'Latte gelado. Grande. Tenho um deploy em dez minutos.', 'tired'),
      order('order', ['iced', 'large', 'latte'], { size: 'large', drink: 'latte', temp: 'iced' }),
    ]),
    regular('priya-r2', 'feelings', 'A2+', [
      say("My laptop is overwhelmed. I'm overwhelmed. Even your cat looks overwhelmed.", 'Meu notebook tá sobrecarregado. Eu tô sobrecarregada. Até o seu gato parece sobrecarregado.', 'tired'),
      choose('calm', ['overwhelmed'], [
        ok('Take a break. Want a cookie on the house?', say("You're my favorite human today.", 'Você é meu humano favorito hoje.', 'love')),
        no('Take a break. Want a cookie in the house?', 'A expressão é "on the house" (cortesia da casa).'),
        no('Everyone is busy. Deal with it.', 'Ríspido demais com quem está sobrecarregada.', -1),
      ]),
    ]),
  ],
};

export default priya;
