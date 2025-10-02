import Phaser from 'phaser';

// Import các scene
import Boot from './scenes/Boot';
import Preloader from './scenes/Preloader';
import MainMenu from './scenes/MainMenu';
import GameScene from './scenes/Game';
import GameOver from './scenes/GameOver';

export default function StartGame(parentId: string) {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: parentId, 
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 600 }, 
                debug: true          
            }
        }
        ,
        scene: [Boot, Preloader, MainMenu, GameScene, GameOver],
    };

    return new Phaser.Game(config);
}
