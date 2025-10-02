// GameScene.ts
import { Scene } from "phaser";

export default class GameScene extends Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private ground!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super("Game");
  }

  preload(): void {
    // ⚠️ Bạn nhớ thay đường dẫn cho đúng với project của mình
    this.load.image("ground", "assets/ground.png"); 
    this.load.image("leloi", "assets/leloi.png");
    this.load.image("background", "assets/background.png");
  }

  create(): void {
    // Background
    const bgWidth = 900;
    for (let i = 0; i < 6; i++) {
      this.add.image(i * bgWidth, 0, "background").setOrigin(0, 0);
    }

    // Ground
    this.ground = this.physics.add.staticGroup();
    this.ground.create(600, 580, "ground").setScale(50,6).refreshBody();

    // Player
    this.player = this.physics.add.sprite(200, 450, "leloi");
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setOrigin(0.5, 1); // đứng trên đất bằng chân

    // Collider
    this.physics.add.collider(this.player, this.ground);

    // Control
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Camera
    this.cameras.main.setBounds(0, 0, bgWidth * 6, 600);
    this.physics.world.setBounds(0, 0, bgWidth * 6, 600);
    this.cameras.main.startFollow(this.player);
  }

  update(): void {
    // Move left / right
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-120);
      this.player.setFlipX(true);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(120);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump (space hoặc mũi tên lên)
    if ((this.cursors.up?.isDown || this.cursors.space?.isDown) && this.player.body.blocked.down) {
      this.player.setVelocityY(-350); // chỉnh -350 để nhảy vừa phải
    }
  }
}




