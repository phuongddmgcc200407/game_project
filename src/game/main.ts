import Phaser from 'phaser';
import Boot from './scenes/Boot';
import Preloader from './scenes/Preloader';
import MainMenu from './scenes/MainMenu';
import GameScene from './scenes/Game';
// import GameOver from './scenes/GameOver';
import LobbyScene from './scenes/Lobby';

export default function StartGame(parentId: string) {
  // Lấy tỷ lệ màn hình (luôn lấy chiều dài / chiều rộng)
  const ratio = Math.max(window.innerWidth / window.innerHeight, window.innerHeight / window.innerWidth);
  const DEFAULT_HEIGHT = 1000;
  
  // Tính toán chiều rộng sao cho vừa khít tỷ lệ màn hình điện thoại (tránh viền đen 2 bên)
  const dynamicWidth = Math.floor(DEFAULT_HEIGHT * ratio);

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parentId,
    input: {
      activePointers: 3, // Hỗ trợ multi-touch
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: {x:100, y: 600 },
        debug: false,
      },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: dynamicWidth,
        height: DEFAULT_HEIGHT,
      },
    scene: [Boot, Preloader, MainMenu, LobbyScene, GameScene],
  };

  const game = new Phaser.Game(config);

  // Khắc phục lỗi sai kích thước trên mobile browser khi load màn hình ngang
  const refreshScale = () => {
    if (game && game.scale) {
      game.scale.refresh();
    }
  };

  window.addEventListener('resize', () => {
    setTimeout(refreshScale, 100);
    setTimeout(refreshScale, 500);
  });

  // Tự động refresh sau khi trang vừa load xong
  setTimeout(refreshScale, 500);
  setTimeout(refreshScale, 1500);

  return game;
}