// Estruturas gramaticais treinadas pelo SRS. Ids com prefixo "g:" (não renomeie ids existentes).
import type { Level } from './types';

export type GrammarItem = { id: string; name: string; pt: string; example: string; level: Level };

export const GRAMMAR: GrammarItem[] = [
  { id: 'g:can_could_requests', name: 'can / could (pedidos)', pt: 'Pedir algo: "Can I…?" é informal; "Could I…?" é mais educado.', example: 'Could I have a latte, please?', level: 'A2' },
  { id: 'g:would_like', name: "would like / I'd like", pt: 'Forma educada de dizer o que você quer.', example: "I'd like a slice of carrot cake.", level: 'A2' },
  { id: 'g:polite_indirect', name: 'pedidos indiretos', pt: '"Would it be possible to…?" e "I was wondering if…" deixam o pedido bem educado.', example: 'I was wondering if you could warm it up.', level: 'B1' },
  { id: 'g:third_person_s', name: 'presente simples (he/she/it + -s)', pt: 'Com he/she/it, o verbo no presente ganha -s: she needs, he works.', example: 'Maybe she just needs more time.', level: 'A2' },
  { id: 'g:past_simple', name: 'past simple', pt: 'Ações terminadas no passado (verbo + -ed, ou irregular: go → went).', example: 'I burned the lasagna last night.', level: 'A2' },
  { id: 'g:going_to', name: 'going to (planos)', pt: 'Planos e intenções para o futuro.', example: "We're going to visit Lisbon in May.", level: 'A2' },
  { id: 'g:present_continuous_future', name: 'present continuous (combinados)', pt: 'Compromissos já marcados: "I\'m meeting her tomorrow."', example: "I'm having dinner with my parents on Sunday.", level: 'A2+' },
  { id: 'g:present_perfect', name: 'present perfect (básico)', pt: 'Experiências e novidades sem data exata: "have/has + particípio".', example: "I've never cooked for anyone before.", level: 'A2+' },
  { id: 'g:will_offers', name: "will (ofertas e promessas: I'll…)", pt: 'Prometer ou oferecer algo na hora: "I\'ll tell her", "I\'ll let him know".', example: "I'll tell her you said hi.", level: 'A2' },
  { id: 'g:object_pronouns', name: 'pronomes objeto (her / him)', pt: 'Depois do verbo usa-se her/him/them, não she/he: "tell her", "ask him".', example: 'Can you tell him I was here?', level: 'A2' },
  { id: 'g:should_advice', name: 'should (conselhos)', pt: 'Dar conselho: should + verbo (sem "to").', example: 'You should try something easier first.', level: 'A2' },
  { id: 'g:comparatives', name: 'comparativos', pt: 'Comparar: -er than / more … than; good → better.', example: 'This one is lighter than the brownie.', level: 'A2' },
  { id: 'g:too_enough', name: 'too / enough', pt: '"too + adjetivo" = demais; "adjetivo + enough" = suficiente.', example: "It's too sweet for me.", level: 'A2+' },
  { id: 'g:first_conditional', name: 'first conditional', pt: 'If + presente, will + verbo: possibilidade real no futuro.', example: "If they meet my parents, it'll be fine.", level: 'B1' },
  { id: 'g:prepositions_place', name: 'preposições de lugar', pt: 'next to, under, behind, by the window…', example: "There's an outlet under the window.", level: 'A2' },
  { id: 'g:quantities', name: 'quantidades', pt: 'one, two… / a slice of / some / any.', example: 'Two lattes and one tea, please.', level: 'A2' },
  { id: 'g:prices', name: 'preços falados', pt: '"four fifty" = $4.50; "ten bucks" = $10.', example: "That's four fifty.", level: 'A2' },

  // das aulas (Talking about the past · Used to · Modern relationships)
  { id: 'g:irregular_past', name: 'past simple irregular ("diferentões")', pt: 'Verbos "conservativos" ganham -ed (worked); os "diferentões" mudam: meet→met, see→saw, take→took, give→gave, get→got, drink→drank, tell→told, go→went, speak→spoke, drive→drove.', example: 'I met her at a party and we drank way too much coffee.', level: 'A2' },
  { id: 'g:did_vs_was', name: 'perguntas: did × was/were', pt: 'Com verbo de ação use DID + verbo base ("Did you see it?"). Com estado/lugar use WAS/WERE ("Were you home?", "Was it good?").', example: 'Was the meeting long? Did they like the idea?', level: 'A2' },
  { id: 'g:who_questions', name: 'who + did?', pt: 'Se o WHO fez a ação, não use did ("Who called you?"). Se outra pessoa fez a ação, use did ("Who did you meet?").', example: 'Who made this? / Who did you invite?', level: 'A2+' },
  { id: 'g:used_to', name: "used to / didn't use to", pt: 'Hábitos do passado que não existem mais. Negativa e pergunta usam "use" sem -d: "didn\'t use to", "Did you use to…?"', example: "I used to travel by bus. I didn't use to book hotels online.", level: 'A2+' },
  { id: 'g:would_rather', name: "I'd rather…", pt: 'Preferência: "I\'d rather + verbo base" (prefiro…). Pergunta: "Would you rather…?"', example: "I'd rather sit by the window.", level: 'A2+' },
  { id: 'g:what_if', name: 'What if…? (sugestão)', pt: 'Para sugerir uma ideia: "What if + sujeito + verbo no passado?"', example: 'What if we tried the oat milk?', level: 'B1' },
  { id: 'g:comfortable_with', name: 'be comfortable with + -ing', pt: 'Depois de "comfortable with" o verbo vai com -ing.', example: "I'm not comfortable with sharing my password.", level: 'A2+' },
  { id: 'g:gerund_subject', name: 'verbo -ing como sujeito', pt: 'Para falar de uma atividade como sujeito: "Smoking kills", "Having slow breakfasts is my favorite thing".', example: 'Working from a café is my favorite thing.', level: 'A2+' },
  { id: 'g:it_has_been', name: 'It has been … since…', pt: 'Tempo desde que algo começou: "It has been a year since we opened the café."', example: "It's been three weeks since I quit.", level: 'B1' },
  { id: 'g:tell_say', name: 'tell × say', pt: '"Tell" pede a pessoa: tell HER, tell ME. "Say" não: say hi, say something.', example: 'Tell him I said hi.', level: 'A2' },
  { id: 'g:superlatives', name: 'superlativos', pt: 'O mais: the + -est (the laziest) ou the most + adjetivo longo (the most dramatic).', example: "She's the laziest cat in the world.", level: 'A2' },
  { id: 'g:register_formal', name: 'registro formal', pt: 'Educado e distante: "Would it be possible to…", "I was wondering if…", "Certainly", "I apologize".', example: 'Would it be possible to have the bill, please?', level: 'B1' },
  { id: 'g:register_informal', name: 'registro informal', pt: 'Entre amigos: gonna, wanna, kinda, "no way", "dude". Soa natural na conversa, estranho num e-mail formal.', example: "Dude, I'm gonna need a bigger coffee.", level: 'A2+' },
];

export const GRAMMAR_BY_ID: Record<string, GrammarItem> = Object.fromEntries(GRAMMAR.map((g) => [g.id, g]));
