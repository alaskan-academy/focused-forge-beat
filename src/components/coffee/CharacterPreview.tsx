import { useEffect, useRef } from 'react';
import { DIRECTIONS, FRAME_H, FRAME_W, WALK_FRAMES, drawCharacterFrame, type Appearance } from '@/lib/coffee/character';

type Props = { appearance: Appearance; scale?: number; animate?: boolean; className?: string };

// Personagem desenhado num <canvas> (mesmas funções do jogo), girando e andando no lugar.
export default function CharacterPreview({ appearance, scale = 6, animate = true, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let tick = 0;
    const paint = () => {
      ctx.clearRect(0, 0, FRAME_W, FRAME_H);
      const dir = animate ? DIRECTIONS[Math.floor(tick / 16) % 4] : 'down';
      drawCharacterFrame(ctx, appearance, dir, animate ? tick % WALK_FRAMES : 0);
    };
    paint();
    if (!animate) return;
    const id = window.setInterval(() => {
      tick++;
      paint();
    }, 160);
    return () => window.clearInterval(id);
  }, [appearance, animate]);

  return (
    <canvas
      ref={ref}
      width={FRAME_W}
      height={FRAME_H}
      className={className}
      style={{ width: FRAME_W * scale, height: FRAME_H * scale, imageRendering: 'pixelated' }}
    />
  );
}
