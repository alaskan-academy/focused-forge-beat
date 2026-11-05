import type { Character } from '../types';
import { ask, chapter, choose, gap, no, ok, order, recall, regular, say, write } from '../dsl';

// Sofia: intercambista chilena, muito informal, com saudade de casa e zero filtro.
const sofia: Character = {
  id: 'sofia',
  name: 'Sofia',
  look: {
    skin: '#e8b48f',
    hair: { style: 'longo', color: '#e06a4e' },
    shirt: { style: 'camiseta', color: '#e07a5f' },
    pants: { style: 'short', color: '#5b6ea8' },
    shoes: { style: 'tênis', color: '#f2ead8' },
  },
  personality_pt: 'Animada, dramática e informal até demais. Fala "like" a cada três palavras.',
  bio_pt: 'Sofia é uma intercambista do Chile. Sente saudade de casa e está tentando fazer amigos na cidade nova.',
  chapters: [
    chapter('sofia-1', 'Saudade das empanadas', 'Sofia é intercambista chilena, na segunda semana. Já está com saudade das empanadas da mãe. Descobriu que pode sentar com os gatos.', 'feelings', 'A2', [
      say('Heyyy. Can I get, like, a hot chocolate? With whipped cream. Lots.', 'Oiii. Me vê, tipo, um chocolate quente? Com chantilly. Muito.', 'happy'),
      order('order', ['can_i_get', 'hot_chocolate', 'whipped_cream'], { drink: 'hot chocolate', extras: ['whipped cream'] }),
      say("I'm Sofia, from Chile. I'm an exchange student.", 'Sou a Sofia, do Chile. Sou intercambista.', 'happy'),
      say("Week two and I already miss my mom's empanadas. Like, a lot.", 'Segunda semana e eu já sinto falta das empanadas da minha mãe. Tipo, muito.', 'sad'),
      choose('homesick', ['homesick', 'g:gerund_subject'], [
        ok('Aww, being homesick is the worst. Wanna sit with the cats?', say('Wait, the cats are allowed? Best café ever.', 'Peraí, pode ficar com os gatos? Melhor café do mundo.', 'excited'), 1),
        no('Aww, be homesick is the worst.', 'Como sujeito, o verbo vai com -ing: "BEING homesick is the worst".'),
        no('Dear Madam, I regret to inform you that homesickness is common.', 'Formal demais para uma estudante falando assim; parece um e-mail do banco.', 0, say('Uh... OK, robot.', 'Hã... tá, robô.', 'thinking')),
      ]),
      ask('miss', ['miss_someone'], 'What does Sofia miss?', ["her mom's empanadas", 'her dog', 'the snow']),
    ], { gapDays: 0 }),

    chapter('sofia-2', 'Embarrassed × embarazada', 'Numa festa, Sofia quis dizer "I\'m embarrassed" (estou com vergonha) e disse "I\'m pregnant" (estou grávida). Três pessoas deram parabéns. Virou amizade.', 'smalltalk', 'A2+', [
      recall('food', 'sofia-1', ['miss_someone'], 'OK so, remember what food I miss from home?', ['empanadas', 'pizza', 'sushi']),
      say("So, at a party I wanted to say 'I'm embarrassed'. But I said 'I'm pregnant'.", 'Então, numa festa eu quis dizer "tô com vergonha". Mas eu disse "tô grávida".', 'embarrassed'),
      say('Three people said congratulations. One guy offered me his chair.', 'Três pessoas me deram parabéns. Um cara me ofereceu a cadeira dele.', 'embarrassed'),
      choose('awkward', ['awkward'], [
        ok("Haha, that's awkward, but it's a great icebreaker!", say("Wait... you're right. Two people added me on Instagram.", 'Peraí... você tem razão. Duas pessoas me adicionaram no Instagram.', 'excited'), 1),
        no("Haha, that's awkward, but it's a great ice breaking!", 'A palavra é "icebreaker" (algo que quebra o gelo).'),
        no('Yeah, that was embarrassing. Maybe you should go home.', 'Piorou! Ela já está com saudade de casa.', -1, say('Wow. Thanks a lot.', 'Nossa. Valeu mesmo.', 'sad')),
      ]),
      gap('told', ['g:tell_say', 'g:irregular_past'], 'customer', 'Then I ', 'told', ' them the truth and we laughed for an hour.', 'Aí eu contei a verdade pra eles e a gente riu por uma hora.', ['told', 'said', 'tell']),
    ]),

    chapter('sofia-3', 'É um encontro?', 'O cara que ofereceu a cadeira se chama Mateo, e os dois vão a um show na sexta. Sofia não sabe se é encontro e está pensando demais.', 'relationships', 'A2+', [
      recall('party', 'sofia-2', ['g:irregular_past'], 'Remember my party disaster? What did I say by mistake?', ["I'm pregnant", "I'm a doctor", "I'm married"]),
      say("Plot twist: the guy with the chair? Mateo. We're going to a concert on Friday.", 'Reviravolta: o cara da cadeira? Mateo. A gente vai num show na sexta.', 'love'),
      say("Is it a date? Is it not a date? I'm overthinking. Help.", 'É encontro? Não é encontro? Tô pensando demais. Socorro.', 'worried'),
      choose('date', ['g:register_informal'], [
        ok("Just have fun! You'll know if it's a date.", say("OK. Chill. I'm chill. I'm so chill.", 'Ok. De boa. Tô de boa. Tô muito de boa.', 'worried'), 1),
        no("Just have fun! You'll knowing if it's a date.", 'Depois de "will" vem o verbo base: "you\'ll know".'),
        no("Obviously it's not a date.", 'Desanimador e sem motivo.', -1, say('Wow. OK. Ouch.', 'Nossa. Ok. Ai.', 'sad')),
      ]),
      ask('friday', ['g:present_continuous_future'], 'What is Sofia doing on Friday?', ['going to a concert with Mateo', 'flying back to Chile', 'working at the café']),
    ]),

    chapter('sofia-4', 'Era um encontro!', 'Era um encontro! Mateo também é chileno, da mesma cidade. Sofia achava a cidade fria e triste; agora acha "meio aconchegante".', 'relationships', 'A2+', [
      recall('name', 'sofia-3', ['remember'], 'Do you remember the name of the chair guy?', ['Mateo', 'Marco', 'Martin']),
      say("It WAS a date! And guess what? He's from Chile too, from my city!", 'ERA um encontro! E adivinha? Ele também é do Chile, da minha cidade!', 'excited'),
      say("I used to think this city was cold and sad. Now it's kinda cozy.", 'Eu achava que essa cidade era fria e triste. Agora é meio aconchegante.', 'love'),
      ask('city', ['g:used_to', 'cozy', 'kinda'], 'How did Sofia use to feel about the city?', ['She thought it was cold and sad.', 'She thought it was exciting.', 'She never thought about it.']),
      write('happy', ['happy_for_you'], 'Tell Sofia how you feel about her news.', 'Diga para a Sofia o que você acha da novidade.', [['happy', 'glad', 'great', 'amazing', 'awesome', 'yay', 'love', 'cute', 'nice', 'wow']], [
        "I'm so happy for you, Sofia!",
        "That's amazing! You two are cute.",
      ]),
      say('Next week I bring him here. The cats need to approve.', 'Semana que vem eu trago ele aqui. Os gatos precisam aprovar.', 'happy'),
    ]),
  ],
  regulars: [
    regular('sofia-r1', 'drinks', 'A2', [
      say("Can I get an iced tea? Like, the biggest one. It's so hot today.", 'Me vê um chá gelado? Tipo, o maior. Tá muito quente hoje.', 'tired'),
      order('order', ['iced_tea', 'g:superlatives'], { size: 'large', drink: 'iced tea' }),
    ]),
    regular('sofia-r2', 'smalltalk', 'A2+', [
      say("Wait, what does 'no cap' mean? My friends say it all the time.", 'Peraí, o que significa "no cap"? Meus amigos falam isso toda hora.', 'thinking'),
      ask('cap', ['g:register_informal'], "What does 'no cap' mean?", ['no lie, for real', 'no hat', 'no money']),
      say('Oh! So, no cap, this hot chocolate is the best.', 'Ah! Então, sem mentira, esse chocolate quente é o melhor.', 'happy'),
    ]),
  ],
};

export default sofia;
