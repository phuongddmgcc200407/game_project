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
    this.load.image('arrow', '../assets/arrow_4.png');
    this.load.image('ground', '../assets/ground.png');
    this.load.image('sword', 'assets/sword.png'); // gươm thần
    // nhân vật chính 1
    this.load.image('leloi1', '../assets/leloi_1.png'); 
    this.load.image('leloi2', '../assets/leloi_2.png'); 
    this.load.image('leloi3', '../assets/leloi_3.png'); 
    this.load.image('leloi4', '../assets/leloi_4.png'); 
    this.load.image('leloi5', '../assets/leloi_5.png'); 
    this.load.image('leloi6', '../assets/leloi_6.png'); 

    //enemy minh_1
    this.load.image('enemy1', 'assets/m1_1.png');
    this.load.image('enemy2', 'assets/m1_2.png');
    this.load.image('enemy3', 'assets/m1_3.png');
    this.load.image('enemy3_2', 'assets/m1_3_2.png');
    this.load.image('enemy3_3', 'assets/m1_3_3.png');
    this.load.image('enemy3_4', 'assets/m1_3_4.png');
    this.load.image('enemy4', 'assets/m1_4.png');

  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
