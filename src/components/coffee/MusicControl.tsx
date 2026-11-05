import { useEffect, useRef, useState } from 'react';
import { Music, VolumeX } from 'lucide-react';
import { CozyMusic, loadMusicPrefs, saveMusicPrefs, type MusicPrefs } from '@/lib/coffee/music';

// Botão de música do HUD: liga/desliga (mudo) e volume. A música começa no primeiro toque/clique
// na tela, porque os navegadores não deixam tocar som sozinho.
export default function MusicControl() {
  const [prefs, setPrefs] = useState<MusicPrefs>(loadMusicPrefs);
  const [open, setOpen] = useState(false);
  const music = useRef<CozyMusic | null>(null);

  useEffect(() => {
    const m = new CozyMusic(prefs);
    music.current = m;
    const kick = () => {
      if (!loadMusicPrefs().muted) m.start().catch(() => {});
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);
    return () => {
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
      m.dispose();
      music.current = null;
    };
    // a instância é criada uma vez; mudanças de volume vão por setPrefs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (p: MusicPrefs) => {
    setPrefs(p);
    saveMusicPrefs(p);
    const m = music.current;
    if (!m) return;
    m.setPrefs(p);
    if (p.muted) m.stop();
    else if (!m.playing) m.start().catch(() => {});
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="cc-hud flex items-center gap-1.5"
        aria-label={prefs.muted ? 'Música desligada' : 'Música'}
        title="Música"
      >
        {prefs.muted ? <VolumeX className="h-4 w-4" /> : <Music className="h-4 w-4" />}
      </button>
      {open && (
        <div className="cc-panel absolute right-0 top-11 z-30 w-56 p-3 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">🎵 Música do café</span>
            <button type="button" onClick={() => update({ ...prefs, muted: !prefs.muted })} className="cc-chip">
              {prefs.muted ? 'Ligar' : 'Mudo'}
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs">
            Volume
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(prefs.volume * 100)}
              onChange={(e) => update({ volume: Number(e.target.value) / 100, muted: false })}
              className="flex-1 accent-[#e07a5f]"
            />
            <span className="w-7 text-right">{Math.round(prefs.volume * 100)}</span>
          </label>
          <p className="mt-2 text-[11px] opacity-60">Trilha lo-fi composta no próprio jogo (sem direitos autorais).</p>
        </div>
      )}
    </div>
  );
}
