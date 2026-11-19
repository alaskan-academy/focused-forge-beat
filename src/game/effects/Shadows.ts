import type Phaser from 'phaser';
import { buildSoftShadow } from '../art/gardenWorld';

// Sombra macia embaixo de quem anda (jogador, a outra pessoa, gatos). Segue o sprite e some
// junto com ele. Fica logo acima do chão e abaixo dos móveis.
export class Shadows {
  private list = new Map<Phaser.GameObjects.Sprite, Phaser.GameObjects.Image>();

  constructor(private scene: Phaser.Scene) {
    if (!scene.textures.exists('soft-shadow')) scene.textures.addCanvas('soft-shadow', buildSoftShadow());
  }

  track(sprite: Phaser.GameObjects.Sprite, scale = 1) {
    this.list.set(sprite, this.scene.add.image(sprite.x, sprite.y, 'soft-shadow').setScale(scale).setDepth(1.8));
  }

  update() {
    for (const [s, sh] of this.list) {
      if (!s.active) {
        sh.destroy();
        this.list.delete(s);
      } else sh.setPosition(Math.round(s.x), Math.round(s.y) - 1).setVisible(s.visible);
    }
  }
}
