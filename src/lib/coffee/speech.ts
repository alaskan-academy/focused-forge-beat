// Fala em inglês com a voz do próprio navegador/celular (Web Speech API): grátis e sem serviço externo.
// Preferimos uma voz en-US; se não houver, qualquer voz em inglês.

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /^en[-_]US$/i.test(v.lang) && /google|samantha|aria|jenny|microsoft/i.test(v.name)) ??
    voices.find((v) => /^en[-_]US$/i.test(v.lang)) ??
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
    null
  );
}

export function speak(text: string, rate = 0.9) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  const v = pickVoice();
  if (v) u.voice = v;
  synth.speak(u);
}
