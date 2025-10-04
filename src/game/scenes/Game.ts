// GameScene.ts
import { Scene } from "phaser";

export default class GameScene extends Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private arrows!: Phaser.Physics.Arcade.Group;

  private mapWidth: number = 900 * 6;
  private playerHealth: number = 4;
  private healthText!: Phaser.GameObjects.Text;
  private isInvincible: boolean = false;

  private isCharging: boolean = false;
  private chargePower: number = 0;
  private chargeBar!: Phaser.GameObjects.Graphics;

  private isGameOver: boolean = false;
  private gameOverText!: Phaser.GameObjects.Text;

  // --- NPC ---
  private npc!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private dialogueBox!: Phaser.GameObjects.Rectangle;
  private dialogueText!: Phaser.GameObjects.Text;
  private dialogueLines: string[] = [
    "Chào ngươi, ta là Nguyễn Trãi – mưu sĩ của nghĩa quân Lam Sơn.",
    "Phía trước là đồn quân Minh, chúng đang chiếm giữ kho lương.",
    "Nhiệm vụ của ngươi là tiêu diệt bọn chúng, mở đường cho nghĩa quân!",
    "Hãy cẩn thận, chiến trường này đầy hiểm nguy...",
    "Giờ thì lên đường đi, Lê Lợi!",
  ];
  private currentLineIndex: number = 0;
  private isInDialogue: boolean = false;
  private hasTalkedToNpc: boolean = false;

  constructor() {
    super("Game");
  }

  preload(): void {
    this.load.image("ground", "assets/ground_2.png");
    this.load.image("background", "assets/background.png");
    this.load.image("arrow", "assets/arrow.png");
    this.load.image("npc", "assets/nguyentrai_1.png");

    // --- Frames Lê Lợi ---
    this.load.image('leloi1', '../assets/lt1.png'); 
    this.load.image('leloi2', '../assets/lt2.png'); 
    this.load.image('leloi3', '../assets/lt3.png'); 
    this.load.image('leloi4', '../assets/lt4.png'); 
    this.load.image('leloi5', '../assets/lt5.png'); 
    this.load.image('leloi6', '../assets/lt6.png'); 
    this.load.image('leloi7', '../assets/lt7.png'); 

    // --- Enemy frames ---
    this.load.image("enemy1", "assets/m1_1.png");
    this.load.image("enemy2", "assets/m1_2.png");
    this.load.image("enemy3", "assets/m1_3.png");
    this.load.image("enemy3_2", "assets/m1_3_2.png");
    this.load.image("enemy3_3", "assets/m1_3_3.png");
    this.load.image("enemy3_4", "assets/m1_3_4.png");
    this.load.image("enemy4", "assets/m1_4.png");
  }

  create(): void {
    // --- Background ---
    const bgWidth = 900;
    for (let i = 0; i < 6; i++) {
      this.add.image(i * bgWidth, 0, "background").setOrigin(0, 0);
    }

    // --- Ground ---
    this.ground = this.physics.add.staticGroup();
    this.ground.create(600, 580, "ground").setScale(300, 6).refreshBody();

    // --- Player ---
    this.player = this.physics.add.sprite(200, 450, "leloi1");
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setOrigin(0.5, 1);
    this.physics.add.collider(this.player, this.ground);

    // --- NPC ---
    this.npc = this.physics.add.sprite(400, 450, "npc");
    this.npc.setImmovable(true);
    this.npc.body.allowGravity = false;
    this.physics.add.collider(this.npc, this.ground);

    // --- Dialogue UI ---
    this.dialogueBox = this.add
      .rectangle(
        this.cameras.main.width / 2,
        this.cameras.main.height - 100,
        700,
        120,
        0x000000,
        0.6
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false);

    this.dialogueText = this.add
      .text(
        this.cameras.main.width / 2 - 320,
        this.cameras.main.height - 150,
        "",
        { fontSize: "20px", color: "#ffffff", wordWrap: { width: 640 } }
      )
      .setScrollFactor(0)
      .setVisible(false);

    this.physics.add.overlap(
      this.player,
      this.npc,
      this.startDialogue,
      undefined,
      this
    );

    // --- Animations ---
    this.anims.create({
      key: "leloi-walk-left",
      frames: [
        { key: "leloi1" },
        { key: "leloi2" },
        { key: "leloi3" },
        { key: "leloi4" },
        { key: "leloi5" },
        { key: "leloi6" },
        { key: "leloi7" },
      ],
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "leloi-walk-right",
      frames: [
        { key: "leloi1" },
        { key: "leloi2" },
        { key: "leloi3" },
        { key: "leloi4" },
        { key: "leloi5" },
        { key: "leloi6" },
        { key: "leloi7" },
      ],
      frameRate: 10,
      repeat: -1,
    });

    // --- Enemy animations ---
    this.anims.create({
      key: "enemy-walk-left",
      frames: [
        { key: "enemy1" },
        { key: "enemy2" },
        { key: "enemy3" },
        { key: "enemy4" },
      ],
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "enemy-walk-right",
      frames: [
        { key: "enemy1" },
        { key: "enemy2" },
        { key: "enemy3_2" },
        { key: "enemy3_3" },
        { key: "enemy3_4" },
        { key: "enemy4" },
      ],
      frameRate: 8,
      repeat: -1,
    });

    // --- Enemy group ---
    this.enemies = this.physics.add.group();
    for (let i = 0; i < 3; i++) {
      const enemy = this.enemies.create(
        this.mapWidth - 50 - i * 100,
        450,
        "enemy1"
      ) as any;
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(0.2);
      enemy.play("enemy-walk-left");
      enemy.maxHealth = 3;
      enemy.health = enemy.maxHealth;
      enemy.healthBar = this.add.graphics();
    }
    this.physics.add.collider(this.enemies, this.ground);

    // --- UI ---
    this.healthText = this.add
      .text(16, 16, `HP: ${this.playerHealth}`, {
        fontSize: "24px",
        color: "#ff0000",
      })
      .setScrollFactor(0);

    // --- Arrow group ---
    this.arrows = this.physics.add.group();
    this.physics.add.overlap(
      this.arrows,
      this.enemies,
      this.handleArrowHit,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerHit,
      undefined,
      this
    );

    // --- Controls ---
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.A
    );

    // --- Camera ---
    this.cameras.main.setBounds(0, 0, this.mapWidth, 600);
    this.physics.world.setBounds(0, 0, this.mapWidth, 600);
    this.cameras.main.startFollow(this.player);

    // --- Charge bar ---
    this.chargeBar = this.add.graphics().setScrollFactor(0);
  }

  // ===== NPC Dialogue =====
  private startDialogue(): void {
    if (this.isInDialogue || this.hasTalkedToNpc) return;
    this.isInDialogue = true;
    this.player.setVelocity(0);
    this.player.anims.stop();

    this.dialogueBox.setVisible(true);
    this.dialogueText.setVisible(true);
    this.currentLineIndex = 0;
    this.dialogueText.setText(this.dialogueLines[this.currentLineIndex]);
    this.input.keyboard!.on("keydown-SPACE", this.nextDialogueLine, this);
  }

  private nextDialogueLine(): void {
    if (!this.isInDialogue) return;
    this.currentLineIndex++;
    if (this.currentLineIndex >= this.dialogueLines.length) {
      this.endDialogue();
      this.hasTalkedToNpc = true;
    } else {
      this.dialogueText.setText(this.dialogueLines[this.currentLineIndex]);
    }
  }

  private endDialogue(): void {
    this.isInDialogue = false;
    this.dialogueBox.setVisible(false);
    this.dialogueText.setVisible(false);
    this.input.keyboard!.off("keydown-SPACE", this.nextDialogueLine, this);
  }

  // ===== Combat =====
  private handleArrowHit(arrow: any, enemy: any): void {
    if (!arrow || !arrow.body || !enemy || !enemy.body) return;
    if (!arrow.active || !enemy.active) return;

    const direction = arrow.body.velocity.x > 0 ? 1 : -1;
    arrow.destroy();

    enemy.health -= 1;
    enemy.setTint(0xff0000);
    this.time.delayedCall(150, () => enemy?.clearTint());

    // --- Hiệu ứng đẩy lùi + rung camera ---
    const knockbackForce = 300;
    if (!enemy.isKnockedBack && enemy.active) {
      enemy.isKnockedBack = true;
      enemy.setVelocityX(direction * knockbackForce);

      this.cameras.main.shake(100, 0.0002); // 👈 rung camera nhẹ

      this.time.delayedCall(200, () => {
        if (enemy.active) { 
          enemy.setVelocityX(0);
          enemy.isKnockedBack = false;
        }
      });
    }

    // --- Thanh máu ---
    if (enemy.healthBar) {
      const barWidth = 40;
      const healthPercent = Phaser.Math.Clamp(
        enemy.health / enemy.maxHealth,
        0,
        1
      );
      enemy.healthBar.clear();
      enemy.healthBar.fillStyle(0xff0000);
      enemy.healthBar.fillRect(
        enemy.x - barWidth / 2,
        enemy.y - 80,
        barWidth * healthPercent,
        5
      );
      enemy.healthBar.lineStyle(1, 0xffffff);
      enemy.healthBar.strokeRect(
        enemy.x - barWidth / 2,
        enemy.y - 80,
        barWidth,
        5
      );
    }

    if (enemy.health <= 0) {
      enemy.healthBar?.destroy();
      enemy.destroy();
    }
  }

  private handlePlayerHit(): void {
    if (this.isInvincible || this.isGameOver) return;

    this.playerHealth -= 1;
    this.healthText.setText(`HP: ${this.playerHealth}`);

    if (this.playerHealth <= 0) {
      this.isGameOver = true;
      this.player.setTint(0x000000);
      this.player.setVelocity(0);
      this.player.anims.stop();

      this.gameOverText = this.add
        .text(
          this.cameras.main.width / 2,
          this.cameras.main.height / 2,
          "Game Over! Nhấn SPACE để chơi lại",
          {
            fontSize: "40px",
            color: "#ffffff",
            backgroundColor: "#000000",
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0);
    } else {
      this.isInvincible = true;
      this.player.setTint(0xff0000);
      this.time.delayedCall(200, () => this.player.clearTint(), [], this);
      this.time.delayedCall(1000, () => (this.isInvincible = false), [], this);
      this.player.setVelocityY(-200);
    }
  }

  update(): void {
    if (this.isGameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space!))
        window.location.reload();
      return;
    }
    if (this.isInDialogue) return;

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-460);
      this.player.setFlipX(true);
      this.player.play("leloi-walk-left", true);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(460);
      this.player.setFlipX(false);
      this.player.play("leloi-walk-right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.stop();
    }

    if (
      (this.cursors.up?.isDown || this.cursors.space?.isDown) &&
      this.player.body.blocked.down
    ) {
      this.player.setVelocityY(-400);
    }

    // --- Charge ---
    if (this.attackKey.isDown) {
      if (!this.isCharging) {
        this.isCharging = true;
        this.chargePower = 0;
      }
      this.chargePower = Phaser.Math.Clamp(this.chargePower + 1, 0, 100);
    }

    if (Phaser.Input.Keyboard.JustUp(this.attackKey)) {
      if (this.isCharging && this.chargePower >= 30)
        this.shootArrow(this.chargePower);
      this.isCharging = false;
      this.chargePower = 0;
    }

    // --- Thanh lực ---
    this.chargeBar.clear();
    if (this.isCharging) {
      this.chargeBar.fillStyle(0x00ff00);
      this.chargeBar.fillRect(16, 50, this.chargePower * 2, 20);
      this.chargeBar.lineStyle(2, 0xffffff);
      this.chargeBar.strokeRect(16, 50, 200, 20);
    }

    // --- Enemy logic ---
    this.enemies.getChildren().forEach((enemy: any) => {
      if (!enemy || !enemy.active || !enemy.body) return;

      if (!enemy.isKnockedBack) {
        if (this.player.x < enemy.x) {
          enemy.setVelocityX(-100);
          enemy.setFlipX(false);
          enemy.play("enemy-walk-left", true);
        } else {
          enemy.setVelocityX(100);
          enemy.setFlipX(true);
          enemy.play("enemy-walk-right", true);
        }
      } else {
        enemy.anims.stop();
      }

      const barWidth = 40;
      const healthPercent = enemy.health / enemy.maxHealth;
      enemy.healthBar.clear();
      enemy.healthBar.fillStyle(0xff0000);
      enemy.healthBar.fillRect(
        enemy.x - barWidth / 2,
        enemy.y - 80,
        barWidth * healthPercent,
        5
      );
      enemy.healthBar.lineStyle(1, 0xffffff);
      enemy.healthBar.strokeRect(
        enemy.x - barWidth / 2,
        enemy.y - 80,
        barWidth,
        5
      );
    });
  }

  private shootArrow(power: number): void {
    const arrow = this.arrows.create(
      this.player.x,
      this.player.y - 80,
      "arrow"
    ) as any;
    arrow.body.setAllowGravity(true);
    const speed = (power / 100) * 800 * (this.player.flipX ? -2 : 2);
    arrow.setVelocityX(speed);
    if (this.player.flipX) arrow.setFlipX(true);
    this.time.delayedCall(2000, () => arrow.destroy(), [], this);
  }
}
