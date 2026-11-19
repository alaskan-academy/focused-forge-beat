import Phaser from 'phaser';
import { GameBridge, type GameState } from './bridge';
import { CafeScene } from './scenes/CafeScene';
import { HouseScene } from './scenes/HouseScene';

// Monta o jogo dentro de `parent` e devolve a ponte de comunicação com o React.
export function createGame(parent: HTMLElement, initial: GameState) {
  const bridge = new GameBridge(initial);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#24170f',
    pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth || 320, height: parent.clientHeight || 240 },
    input: { activePointers: 2 },
    banner: false,
    audio: { noAudio: true },
  });
  // o dia sempre começa no quarto; a porta da sala leva ao café
  game.scene.add('cafe', CafeScene, false);
  game.scene.add('house', HouseScene, true, { bridge, spawn: 'wake' });
  return {
    bridge,
    destroy() {
      bridge.clear();
      game.destroy(true);
    },
  };
}

export type GameHandle = ReturnType<typeof createGame>;
