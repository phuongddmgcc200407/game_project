import { Scene } from 'phaser';

export default class MainMenu extends Scene {
  constructor() {
    super('MainMenu');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 100, 'Hành Trình Anh Hùng Việt', {
      font: '28px Arial',
      color: '#FFD700',
    }).setOrigin(0.5);

    const startText = this.add.text(width / 2, height / 2, 'Bấm SPACE để bắt đầu', {
      font: '20px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('Game');
    });
  }
}
