import Phaser from 'phaser';
// Import các scene
import Boot from './scenes/Boot';
import Preloader from './scenes/Preloader';
import MainMenu from './scenes/MainMenu';
import GameScene from './scenes/Game';
import GameOver from './scenes/GameOver';
// ✨ THÊM: Import LobbyScene
import LobbyScene from './scenes/Lobby';

export default function StartGame(parentId: string) {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 1900,
        height: 1000,
        parent: parentId, 
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 600 }, 
                debug: false          
            }
        }
        ,
        scene: [Boot, Preloader, MainMenu, LobbyScene, GameScene, GameOver],
    };

    return new Phaser.Game(config);
}
