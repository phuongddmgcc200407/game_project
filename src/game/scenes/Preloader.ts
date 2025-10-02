import { Scene } from 'phaser';

export default class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  preload(): void {
    // Thanh loading
    const { width, height } = this.scale;
    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      font: '20px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Load tài nguyên cho game
    this.load.image('background', '../assets/bg_1.png'); 
    this.load.image('arrow', '../assets/arrow_1.png'); 
    this.load.image('ground', '../assets/ground.png'); 
    this.load.image('leloi', '../assets/leloi_1.png'); // nhân vật chính
    this.load.image('enemy', 'assets/minh_soldier.png'); // lính Minh
    this.load.image('sword', 'assets/sword.png'); // gươm thần
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
