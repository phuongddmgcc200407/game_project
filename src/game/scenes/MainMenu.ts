import { Scene } from 'phaser';
import TouchControls from '../TouchControls';

export default class MainMenu extends Scene {
  private touchControls!: TouchControls;

  constructor() {
    super('MainMenu');
  }

  preload(): void {
    // 🔹 Nạp ảnh nền
    this.load.image('bg_mainmenu', 'assets/bg_mainmenu.jpg');
  }

  create(): void {
    const { width, height } = this.scale;

    // Khởi tạo Touch Controls
    this.touchControls = new TouchControls('game-container');
    this.touchControls.setContext('mainmenu');

    // 🔹 Thêm ảnh nền (phải thêm trước text để nằm phía sau)
    const bg = this.add.image(width / 2, height / 2, 'bg_mainmenu');
    bg.setDisplaySize(width, height); // co giãn vừa toàn màn hình

    
      // 🔹 Dòng hướng dẫn
      const startText = this.add.text(width / 2, height / 2 + 300, 'Bấm SPACE hoặc chạm màn hình để bắt đầu', {
        font: '20px Arial', 
        color: '#ffffff',
      }).setOrigin(0.5);

    // 🔹 Hiệu ứng nhấp nháy nhẹ cho dòng hướng dẫn
    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

   // SỬA LỖI: Truy cập KeyboardPlugin một cách an toàn và rõ ràng
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.startGame();
    });

    // 📱 Thêm hỗ trợ tap/touch để bắt đầu game
    this.input.once('pointerdown', () => {
      this.startGame();
    });
  }

  private startGame(): void {
    this.touchControls.destroy();
    this.scene.start('Lobby');
  }
}
