import { useEffect, useRef } from 'react';
import { FURNITURE_BY_ID } from '@/content/coffee/furniture';
import { drawFurniture } from '@/game/art/furniture';
import kenneyIndoorUrl from '@/game/art/kenney/roguelike-indoor.png';

// folha do pacote Kenney carregada uma vez para todas as prévias
let sheet: Promise<HTMLImageElement> | null = null;
function loadSheet() {
  sheet ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = kenneyIndoorUrl;
  });
  return sheet;
}

// Prévia em pixel art de um móvel (mesmo desenho do jogo), cabendo numa caixa de `box` px.
export default function FurniturePreview({ itemId, variant = 0, box = 48, flip = false, className }: { itemId: string; variant?: number; box?: number; flip?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = FURNITURE_BY_ID[itemId];
  const scale = f ? Math.max(1, Math.floor(box / (Math.max(f.w, f.h) * 16))) : 1;

  useEffect(() => {
    if (!f) return;
    let alive = true;
    loadSheet()
      .catch(() => null)
      .then((img) => {
        const c = ref.current;
        if (!alive || !c) return;
        const art = drawFurniture(f, variant, img);
        const ctx = c.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.save();
        if (flip) {
          ctx.translate(c.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(art, 0, 0, c.width, c.height);
        ctx.restore();
      });
    return () => {
      alive = false;
    };
  }, [f, variant, flip]);

  if (!f) return null;
  return <canvas ref={ref} width={f.w * 16 * scale} height={f.h * 16 * scale} className={className} style={{ imageRendering: 'pixelated' }} />;
}
