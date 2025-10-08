import { Scene } from 'phaser';

export default class MainMenu extends Scene {
  constructor() {
    super('MainMenu');
  }

  preload(): void {
    // 🔹 Nạp ảnh nền
    this.load.image('bg_mainmenu', 'assets/bg_mainmenu.jpg');
  }

  create(): void {
    const { width, height } = this.scale;

    // 🔹 Thêm ảnh nền (phải thêm trước text để nằm phía sau)
    const bg = this.add.image(width / 2, height / 2, 'bg_mainmenu');
    bg.setDisplaySize(width, height); // co giãn vừa toàn màn hình

    
      // 🔹 Dòng hướng dẫn
      const startText = this.add.text(width / 2, height / 2 + 300, 'Bấm SPACE để bắt đầu', {
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
this.input.keyboard!.once('keydown-SPACE', () => { // Thêm dấu ! (Non-null assertion)
    this.scene.start('Lobby');
});
  }
}


