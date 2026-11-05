import Phaser from 'phaser';
import { GameBridge, type GameState } from './bridge';
import { CafeScene } from './scenes/CafeScene';

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
  game.scene.add('cafe', CafeScene, true, { bridge });
  return {
    bridge,
    destroy() {
      bridge.clear();
      game.destroy(true);
    },
  };
}

export type GameHandle = ReturnType<typeof createGame>;
