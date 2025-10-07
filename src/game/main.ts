import Phaser from 'phaser';
import Boot from './scenes/Boot';
import Preloader from './scenes/Preloader';
import MainMenu from './scenes/MainMenu';
import GameScene from './scenes/Game';
// import GameOver from './scenes/GameOver';
import LobbyScene from './scenes/Lobby';

export default function StartGame(parentId: string) {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parentId,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: {x:100, y: 600 },
        debug: false,
      },
    },
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1900,
        height: 1000,
      },
    scene: [Boot, Preloader, MainMenu, LobbyScene, GameScene],
  };

  return new Phaser.Game(config);
}