import { useEffect, useState } from 'react';
import { currentBuildId, latestBuildId } from '@/lib/coffee/updateCheck';

const CHECK_MS = 5 * 60_000;

// Confere de tempos em tempos (e quando a aba volta a ficar visível) se saiu versão nova.
// Devolve o id da versão nova, ou null.
export function useNewVersion(): string | null {
  const [latest, setLatest] = useState<string | null>(null);
  useEffect(() => {
    const running = currentBuildId();
    if (!running) return; // modo dev: não há build para comparar
    let alive = true;
    const check = async () => {
      if (document.hidden) return;
      try {
        const id = await latestBuildId();
        if (alive && id && id !== running) setLatest(id);
      } catch {
        // sem rede: tenta na próxima
      }
    };
    const timer = window.setInterval(check, CHECK_MS);
    const onVisible = () => !document.hidden && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return latest;
}
