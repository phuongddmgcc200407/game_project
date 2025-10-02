// GameScene.ts
import { Scene } from "phaser";

export default class GameScene extends Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key; // phím A bắn tên
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private arrows!: Phaser.Physics.Arcade.Group;

  private mapWidth: number = 900 * 6;

  // Máu nhân vật
  private playerHealth: number = 4;
  private healthText!: Phaser.GameObjects.Text;
  private isInvincible: boolean = false;

  constructor() {
    super("Game");
  }

  preload(): void {
    this.load.image("ground", "assets/ground.png");
    this.load.image("leloi", "assets/leloi.png");
    this.load.image("background", "assets/background.png");
    this.load.image("enemy", "assets/enemy.png");
    this.load.image("arrow", "assets/arrow.png"); // thêm sprite mũi tên
  }

  create(): void {
    // Background
    const bgWidth = 900;
    for (let i = 0; i < 6; i++) {
      this.add.image(i * bgWidth, 0, "background").setOrigin(0, 0);
    }

    // Ground
    this.ground = this.physics.add.staticGroup();
    this.ground.create(600, 580, "ground").setScale(300, 6).refreshBody();

    // Player
    this.player = this.physics.add.sprite(200, 450, "leloi");
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setOrigin(0.5, 1);

    // Collider
    this.physics.add.collider(this.player, this.ground);

    // Control
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);

    // Camera
    this.cameras.main.setBounds(0, 0, bgWidth * 6, 600);
    this.physics.world.setBounds(0, 0, bgWidth * 6, 600);
    this.cameras.main.startFollow(this.player);

    // Enemy group
    this.enemies = this.physics.add.group();
    for (let i = 0; i < 3; i++) {
      const enemy = this.enemies.create(
        this.mapWidth - 50 - i * 100,
        450,
        "enemy"
      ) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      enemy.setCollideWorldBounds(true);
      enemy.setVelocityX(-80 - i * 80);
      enemy.setBounce(0.2);
    }
    this.physics.add.collider(this.enemies, this.ground);

    // Hiển thị máu
    this.healthText = this.add.text(16, 16, `HP: ${this.playerHealth}`, {
      fontSize: "24px",
      color: "#ff0000",
    }).setScrollFactor(0);

    // Arrow group
    this.arrows = this.physics.add.group();

    // Khi mũi tên bắn trúng enemy
    this.physics.add.overlap(this.arrows, this.enemies, this.handleArrowHit, undefined, this);

    // Enemy chạm player
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerHit, undefined, this);
  }

  // Khi player bị enemy đánh
  private handlePlayerHit(player: any, enemy: any): void {
    if (this.isInvincible) return;

    this.playerHealth -= 1;
    this.healthText.setText(`HP: ${this.playerHealth}`);

    if (this.playerHealth <= 0) {
      window.location.reload();
    } else {
      this.isInvincible = true;
      this.player.setTint(0xff0000);

      this.time.delayedCall(200, () => {
        this.player.clearTint();
      });

      this.time.delayedCall(1000, () => {
        this.isInvincible = false;
      });

      this.player.setVelocityY(-200);
    }
  }

  // Khi mũi tên trúng enemy
  private handleArrowHit(arrow: any, enemy: any): void {
    arrow.destroy();
    enemy.destroy();
  }

  update(): void {
    // Move left / right
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-260);
      this.player.setFlipX(true);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(260);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    if ((this.cursors.up?.isDown || this.cursors.space?.isDown) && this.player.body.blocked.down) {
      this.player.setVelocityY(-350);
    }

    // Attack (shoot arrow)
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.shootArrow();
    }

    // --- 👇 Enemy luôn hướng vào player ---
    this.enemies.getChildren().forEach((enemy: Phaser.GameObjects.GameObject) => {
      const e = enemy as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

      if (!e.active) return;

      // Nếu player ở bên trái → enemy đi sang trái
      if (this.player.x < e.x) {
        e.setVelocityX(-100);
        e.setFlipX(false);
      }
      // Nếu player ở bên phải → enemy đi sang phải
      else {
        e.setVelocityX(100);
        e.setFlipX(true);
      }
    });
  }


  private shootArrow(): void {
    const arrow = this.arrows.create(
      this.player.x,
      this.player.y - 55,
      "arrow"
    ) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    // Tắt gravity cho mũi tên
    arrow.body.setAllowGravity(false);

    // Xác định tốc độ bay theo hướng nhân vật
    const speed = this.player.flipX ? -400 : 400;
    arrow.setVelocityX(speed);

    if (this.player.flipX) {
      arrow.setFlipX(true);
    }

    this.time.delayedCall(1500, () => {
      if (arrow.active) arrow.destroy();
    });
  }

}
