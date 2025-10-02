import { Scene } from 'phaser';

export default class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // load hình logo nhỏ hoặc background
    this.load.image('logo', 'assets/logo.png');
  }

  create(): void {
    // chuyển sang Preloader
    this.scene.start('Preloader');
  }
}
