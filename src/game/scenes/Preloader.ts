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
    this.load.image('background1', '../assets/bg_1_1.png');
    this.load.image('background', '../assets/bg_2.png');
    this.load.image('arrow', '../assets/arrow_4.png');
    this.load.image('ground', '../assets/ground_2.png');
    this.load.image('sword', 'assets/sword.png'); // gươm thần

    // --- Lê Lợi ---
    this.load.image('leloi1', '../assets/lt1.png');
    this.load.image('leloi2', '../assets/lt2.png');
    this.load.image('leloi3', '../assets/lt3.png');
    this.load.image('leloi4', '../assets/lt4.png');
    this.load.image('leloi5', '../assets/lt5.png');
    this.load.image('leloi6', '../assets/lt6.png');
    this.load.image('leloi7', '../assets/lt7.png');

    // --- Đinh Lễ ---
    this.load.image('dinhle1', '../assets/dl1.png');
    this.load.image('dinhle2', '../assets/dl2.png');
    this.load.image('dinhle3', '../assets/dl3.png');
    this.load.image('dinhle4', '../assets/dl4.png');
    this.load.image('dinhle5', '../assets/dl5.png');

    // --- Nguyễn Xí ---
    this.load.image('nx1', '../assets/nx1.png');
    this.load.image('nx2', '../assets/nx2.png');
    this.load.image('nx3', '../assets/nx3.png');
    this.load.image('nx4', '../assets/nx4.png');
    this.load.image('nx5', '../assets/nx5.png');

    // --- Nguyễn Trãi ---
    this.load.image('nt1', '../assets/nt1.png');
    this.load.image('nt2', '../assets/nt2.png');
    this.load.image('nt3', '../assets/nt3.png');
    this.load.image('nt4', '../assets/nt4.png');
    this.load.image('nt5', '../assets/nt5.png');

    // --- Boss ---
    this.load.image('boss1', '../assets/boss1.png');
    this.load.image('boss2', '../assets/boss2.png');
    this.load.image('boss3', '../assets/boss3.png');
    this.load.image('boss4', '../assets/boss4.png');
    this.load.image('boss5', '../assets/boss5.png');
    this.load.image('boss6', '../assets/boss6.png');
    this.load.image('boss7', '../assets/boss7.png');


    // --- Hiệu ứng kéo cung ---
    this.load.image('bancung1', '../assets/bancung_1.png');
    this.load.image('bancung2', '../assets/bancung_2.png');
    this.load.image('bancung3', '../assets/bancung_3.png');

    // --- Enemy ---
    this.load.image('enemy1', 'assets/m1_1.png');
    this.load.image('enemy2', 'assets/m1_2.png');
    this.load.image('enemy3', 'assets/m1_3.png');
    this.load.image('enemy3_2', 'assets/m1_3_2.png');
    this.load.image('enemy3_3', 'assets/m1_3_3.png');
    this.load.image('enemy3_4', 'assets/m1_3_4.png');
    this.load.image('enemy4', 'assets/m1_4.png');

    // --- NPC ---
    this.load.image('npc', 'assets/nguyentrai_1.png');
    // Boss
    this.load.image('boss', 'assets/boss_1.png');

    // --- Âm thanh ---
    this.load.audio('bgMusic', 'assets/ms_1.mp3'); // 🔥 nhạc nền
    this.load.audio('shoot', 'assets/shoot_1.ogg'); // 🔥 âm thanh bắn cung
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
