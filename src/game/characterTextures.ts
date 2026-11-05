import Phaser from 'phaser';
import { DIRECTIONS, FRAME_H, FRAME_W, WALK_FRAMES, appearanceKey, bakeCharacterSheet, type Appearance, type Direction } from '@/lib/coffee/character';

// Gera (uma vez) a spritesheet e as animações de uma aparência. Retorna a chave da textura.
export function ensureCharacterTexture(scene: Phaser.Scene, a: Appearance): string {
  const key = 'char:' + appearanceKey(a);
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.addCanvas(key, bakeCharacterSheet(a));
  if (!tex) return key;
  DIRECTIONS.forEach((dir, row) => {
    for (let f = 0; f < WALK_FRAMES; f++) tex.add(row * WALK_FRAMES + f, 0, f * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
    scene.anims.create({
      key: `${key}:walk-${dir}`,
      frames: Array.from({ length: WALK_FRAMES }, (_, f) => ({ key, frame: row * WALK_FRAMES + f })),
      frameRate: 8,
      repeat: -1,
    });
  });
  return key;
}

export function idleFrame(dir: Direction): number {
  return DIRECTIONS.indexOf(dir) * WALK_FRAMES;
}
