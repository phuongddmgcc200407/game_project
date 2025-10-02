import { Scene } from 'phaser';

export default class GameOver extends Scene {
  constructor() {
    super('GameOver');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'Game Over\nBấm SPACE để chơi lại', {
      font: '20px Arial',
      color: '#ff0000',
      align: 'center',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MainMenu');
    });
  }
}
