// Palavras do Sudoku de inglês (mesa de jogos). Cada tema precisa de pelo menos 9 palavras
// (o 9×9 usa 9 de uma vez). Cada palavra traz as 4 pistas que podem aparecer nas casas iniciais:
//  - emoji:  imagem
//  - pt:     tradução
//  - def:    definição simples em inglês (NUNCA pode conter a própria palavra)
//  - gap:    frase com lacuna "___" (a palavra encaixa sozinha ali)
// `vocab`: id de um item que já existe em vocab.ts com a mesma palavra (o SRS é o mesmo).
// Sem `vocab`, o item de revisão é `w:<id>`. Não renomeie ids: o progresso fica salvo por eles.
// Veja CONTENT_GUIDE.md → "Sudoku de inglês".
import type { Level } from './types';

export type SudokuWord = { id: string; en: string; pt: string; emoji: string; def: string; gap: string; level: Level; vocab?: string };
export type SudokuTheme = { id: string; name_pt: string; emoji: string; words: SudokuWord[] };

const w = (id: string, en: string, pt: string, emoji: string, def: string, gap: string, level: Level = 'A2', vocab?: string): SudokuWord => ({
  id,
  en,
  pt,
  emoji,
  def,
  gap,
  level,
  ...(vocab ? { vocab } : {}),
});

export const SUDOKU_THEMES: SudokuTheme[] = [
  {
    id: 'animals',
    name_pt: 'Animais',
    emoji: '🐾',
    words: [
      w('cat', 'cat', 'gato', '🐱', 'A small pet that says "meow".', 'Elias is the ___ of our café.'),
      w('dog', 'dog', 'cachorro', '🐶', 'A pet that barks and loves walks.', 'My ___ barks at the mailman.'),
      w('bird', 'bird', 'pássaro', '🐦', 'An animal with wings and feathers.', 'A little ___ is singing outside.'),
      w('fish', 'fish', 'peixe', '🐟', 'An animal that lives in water and swims.', 'There is a gold ___ in the tank.'),
      w('horse', 'horse', 'cavalo', '🐴', 'A big animal people ride.', 'She rides a ___ on the farm.'),
      w('cow', 'cow', 'vaca', '🐮', 'A farm animal that gives us milk.', 'The ___ says "moo".'),
      w('rabbit', 'rabbit', 'coelho', '🐰', 'A small animal with long ears that eats carrots.', 'The ___ hops in the garden.'),
      w('mouse', 'mouse', 'rato / camundongo', '🐭', 'A tiny animal that cats like to chase.', 'Elias is chasing a toy ___.'),
      w('duck', 'duck', 'pato', '🦆', 'A bird that swims and says "quack".', 'A ___ is swimming in the lake.'),
      w('bee', 'bee', 'abelha', '🐝', 'A small insect that makes honey.', 'Be careful! That ___ can sting.'),
    ],
  },
  {
    id: 'food',
    name_pt: 'Comidas',
    emoji: '🍞',
    words: [
      w('apple', 'apple', 'maçã', '🍎', 'A round red or green fruit.', 'An ___ a day keeps the doctor away.'),
      w('banana', 'banana', 'banana', '🍌', 'A long yellow fruit.', 'Monkeys love to eat a ___.'),
      w('bread', 'bread', 'pão', '🍞', 'You make sandwiches with it.', 'I buy fresh ___ at the bakery.'),
      w('cheese', 'cheese', 'queijo', '🧀', 'A yellow food made from milk. Mice love it.', 'I want a sandwich with ham and ___.'),
      w('egg', 'egg', 'ovo', '🥚', 'Chickens lay it. You can fry it.', 'I eat a fried ___ for breakfast.'),
      w('cake', 'cake', 'bolo', '🍰', 'A sweet food for birthdays.', 'Happy birthday! Here is your ___.'),
      w('rice', 'rice', 'arroz', '🍚', 'Small white grains. People eat it with beans.', 'In Brazil we eat ___ and beans.'),
      w('soup', 'soup', 'sopa', '🍲', 'A hot liquid food you eat with a spoon.', 'On cold days I make chicken ___.'),
      w('pizza', 'pizza', 'pizza', '🍕', 'A round Italian food with cheese and tomato.', "Let's order a ___ tonight!"),
      w('salad', 'salad', 'salada', '🥗', 'A cold dish of lettuce and vegetables.', 'For lunch I only want a green ___.'),
    ],
  },
  {
    id: 'drinks',
    name_pt: 'Bebidas do café',
    emoji: '☕',
    words: [
      w('coffee', 'coffee', 'café', '☕', 'A hot dark drink that wakes you up.', 'I need a cup of ___ every morning.'),
      w('tea', 'tea', 'chá', '🍵', 'A hot drink made with leaves.', 'The British love a cup of ___.'),
      w('milk', 'milk', 'leite', '🥛', 'A white drink that comes from cows.', 'Do you want ___ in your coffee?'),
      w('water', 'water', 'água', '💧', 'The clear drink everybody needs.', "I'm thirsty. Can I have some ___?"),
      w('juice', 'juice', 'suco', '🧃', 'A drink made from fruit.', 'I want a glass of orange ___.'),
      w('latte', 'latte', 'café com leite (latte)', '🥤', 'Espresso with a lot of hot milk.', "A large oat milk ___, please.", 'A2', 'latte'),
      w('espresso', 'espresso', 'expresso', '⚡', 'A very small, very strong coffee.', 'One ___ shot, please. I need energy!', 'A2', 'espresso'),
      w('mocha', 'mocha', 'mocha (café com chocolate)', '🍫', 'Coffee mixed with chocolate and milk.', 'I love chocolate, so I always order a ___.', 'A2', 'mocha'),
      w('hot_chocolate', 'hot chocolate', 'chocolate quente', '🔥', 'A warm sweet drink with no coffee, made with cocoa.', "Kids can't have coffee, so they get ___.", 'A2', 'hot_chocolate'),
      w('green_tea', 'green tea', 'chá verde', '🍃', 'A light, healthy tea from Japan and China.', "I don't drink coffee. I prefer ___.", 'A2', 'green_tea'),
    ],
  },
  {
    id: 'feelings',
    name_pt: 'Emoções',
    emoji: '😊',
    words: [
      w('happy', 'happy', 'feliz', '😊', 'How you feel when something good happens.', "I'm so ___ to see you again!"),
      w('sad', 'sad', 'triste', '😢', 'How you feel when you want to cry.', 'The movie was so ___. I cried.'),
      w('angry', 'angry', 'bravo / com raiva', '😠', 'How you feel when someone is unfair to you.', "Don't be ___. It was an accident!"),
      w('tired', 'tired', 'cansado', '😴', 'How you feel after a long day. You need sleep.', "I worked twelve hours. I'm so ___.", 'A2', 'tired'),
      w('scared', 'scared', 'com medo', '😱', 'How you feel in a horror movie.', "I'm ___ of spiders."),
      w('bored', 'bored', 'entediado', '🥱', 'How you feel when nothing interesting happens.', "There's nothing to do. I'm so ___."),
      w('excited', 'excited', 'animado / empolgado', '🤩', 'How you feel before a great trip or party.', "We travel tomorrow! I'm so ___!"),
      w('nervous', 'nervous', 'nervoso', '😬', 'How you feel before an important test.', "I have a job interview today. I'm ___.", 'A2', 'nervous'),
      w('proud', 'proud', 'orgulhoso', '🥹', 'How you feel when someone you love does something great.', "You passed the exam! I'm so ___ of you."),
      w('hungry', 'hungry', 'com fome', '🤤', 'How you feel when you need food.', "I didn't eat breakfast. I'm really ___."),
    ],
  },
  {
    id: 'weather',
    name_pt: 'Tempo e clima',
    emoji: '🌦️',
    words: [
      w('sun', 'sun', 'sol', '☀️', 'The big yellow star in the sky during the day.', 'Wear sunscreen. The ___ is very strong today.'),
      w('rain', 'rain', 'chuva', '🌧️', 'Water that falls from the clouds.', "Take an umbrella. There's a lot of ___."),
      w('snow', 'snow', 'neve', '❄️', 'Cold white flakes that fall in winter.', 'The kids made a man out of ___.'),
      w('wind', 'wind', 'vento', '🌬️', 'Moving air. It can blow your hat away.', 'The ___ is so strong today!'),
      w('cloud', 'cloud', 'nuvem', '☁️', 'A white or grey shape in the sky.', 'That ___ looks like a cat!'),
      w('storm', 'storm', 'tempestade', '⛈️', 'Bad weather with rain, wind and thunder.', "Stay home. There's a big ___ tonight."),
      w('hot', 'hot', 'quente', '🥵', 'The opposite of cold.', "It's 40 degrees. It's so ___!"),
      w('cold', 'cold', 'frio', '🥶', 'The opposite of hot.', 'Wear a jacket. It is very ___ outside.'),
      w('rainbow', 'rainbow', 'arco-íris', '🌈', 'Seven colors in the sky after the rain.', 'Look! A ___ after the storm!'),
      w('fog', 'fog', 'neblina', '🌫️', 'A thick cloud near the ground. You can\'t see far.', "Drive slowly. There's a lot of ___."),
    ],
  },
  {
    id: 'home',
    name_pt: 'Casa',
    emoji: '🏠',
    words: [
      w('bed', 'bed', 'cama', '🛏️', 'Where you sleep at night.', "I'm tired. I'm going to ___."),
      w('chair', 'chair', 'cadeira', '🪑', 'You sit on it at a table.', 'Elias is sleeping on my ___ again.'),
      w('door', 'door', 'porta', '🚪', 'You open it to go in or out of a room.', 'Please close the ___. It\'s cold.'),
      w('window', 'window', 'janela', '🪟', 'Glass in the wall. You look outside through it.', 'Open the ___. I need some fresh air.'),
      w('lamp', 'lamp', 'luminária / abajur', '💡', 'It gives light next to your bed.', 'Turn on the ___. I want to read.'),
      w('sofa', 'sofa', 'sofá', '🛋️', 'A long soft seat in the living room.', 'We watch movies on the ___.'),
      w('kitchen', 'kitchen', 'cozinha', '🍳', 'The room where you cook.', "Dinner is ready! Come to the ___."),
      w('shower', 'shower', 'chuveiro / banho', '🚿', 'You stand under it to wash your body.', 'I take a hot ___ every night.'),
      w('key', 'key', 'chave', '🔑', 'You use it to open a door.', "I can't open the door. I lost my ___!"),
      w('mirror', 'mirror', 'espelho', '🪞', 'You see your face in it.', 'She looks in the ___ before she leaves.'),
    ],
  },
  {
    id: 'jobs',
    name_pt: 'Profissões',
    emoji: '💼',
    words: [
      w('doctor', 'doctor', 'médico', '🩺', 'A person who helps sick people get better.', "You're sick. Go see a ___."),
      w('teacher', 'teacher', 'professor', '🧑‍🏫', 'A person who works in a school and helps you learn.', 'Our English ___ is very funny.'),
      w('chef', 'chef', 'chef de cozinha', '🧑‍🍳', 'A person who cooks in a restaurant.', 'The ___ made an amazing pasta.'),
      w('driver', 'driver', 'motorista', '🚕', 'A person who drives a car, bus or taxi for work.', 'The taxi ___ knows every street.'),
      w('nurse', 'nurse', 'enfermeiro(a)', '💉', 'A person who takes care of patients in a hospital.', 'The ___ gave me an injection.'),
      w('farmer', 'farmer', 'fazendeiro / agricultor', '🚜', 'A person who grows food and keeps animals.', 'The ___ wakes up at 5 a.m. to feed the cows.'),
      w('pilot', 'pilot', 'piloto', '✈️', 'A person who flies a plane.', 'The ___ says we are landing soon.'),
      w('waiter', 'waiter', 'garçom', '🍽️', 'A person who brings food to your table.', 'Excuse me, ___! Can we have the menu?'),
      w('artist', 'artist', 'artista', '🎨', 'A person who paints or draws.', 'That ___ painted the mural in our café.'),
      w('barista', 'barista', 'barista', '☕', 'A person who makes coffee in a café. Like you!', 'The ___ drew a heart in my latte.'),
    ],
  },
  {
    id: 'verbs',
    name_pt: 'Ações (verbos)',
    emoji: '🏃',
    words: [
      w('run', 'run', 'correr', '🏃', 'To move very fast with your legs.', "We're late! We need to ___!"),
      w('eat', 'eat', 'comer', '🍴', 'To put food in your mouth.', "I'm hungry. Let's ___ something."),
      w('sleep', 'sleep', 'dormir', '💤', 'What you do in bed at night.', 'Cats ___ about 15 hours a day.'),
      w('read', 'read', 'ler', '📖', 'What you do with a book.', 'I like to ___ before bed.'),
      w('swim', 'swim', 'nadar', '🏊', 'To move in the water with your arms and legs.', 'Can you ___? The pool is deep.'),
      w('cook', 'cook', 'cozinhar', '🥘', 'To make food hot and ready to eat.', 'My husband loves to ___ pasta.'),
      w('sing', 'sing', 'cantar', '🎤', 'To make music with your voice.', 'She loves to ___ in the shower.'),
      w('dance', 'dance', 'dançar', '💃', 'To move your body to music.', "Come on, let's ___! I love this song."),
      w('write', 'write', 'escrever', '✍️', 'What you do with a pen and paper.', 'Please ___ your name here.'),
      w('drink', 'drink', 'beber', '🥤', 'To take water or juice into your mouth.', 'You should ___ more water.'),
    ],
  },
];

export const SUDOKU_WORDS: SudokuWord[] = SUDOKU_THEMES.flatMap((t) => t.words);

// id do item de revisão (SRS) de uma palavra
export const sudokuItemId = (word: SudokuWord) => word.vocab ?? `w:${word.id}`;
export const SUDOKU_WORD_BY_ID: Record<string, SudokuWord> = Object.fromEntries(SUDOKU_WORDS.map((w) => [w.id, w]));
export const SUDOKU_THEME_BY_ID: Record<string, SudokuTheme> = Object.fromEntries(SUDOKU_THEMES.map((t) => [t.id, t]));
