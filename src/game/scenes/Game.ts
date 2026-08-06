// GameScene.ts
import { Scene } from "phaser";
import TouchControls from "../TouchControls";


// Khai báo kiểu dữ liệu cho Enemy/Boss (mở rộng từ SpriteWithDynamicBody)
interface GameCharacter extends Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
  health: number;
  maxHealth: number;
  healthBar: Phaser.GameObjects.Graphics;
  isKnockedBack: boolean;
  isBoss: boolean;
}

// Khai báo kiểu cho mũi tên thường và mũi tên lửa
interface ArrowProjectile extends Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
  damage: number; // Thêm thuộc tính damage để lưu sát thương thực tế
}
interface UltimateProjectile extends Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
  damage: number;
  piercingCount: number; // Số lần có thể xuyên qua địch
}

// ✨ THAY ĐỔI LỚN: Mở rộng Soldier từ GameCharacter để có HP, HealthBar
interface Soldier extends GameCharacter {
  damage: number; // Sát thương gây ra khi tấn công
  target: GameCharacter | null;
}

// ✨ KHAI BÁO KIỂU CHO COIN (Xu)
interface Coin extends Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
  value: number;
}


export default class GameScene extends Scene {
  private touchControls!: TouchControls;
  private equippedPetKey: string = 'none'; // Biến mới để lưu Pet đang được chọn

  // ✨ BIẾN MỚI CHO QUẢNG CÁO/HỒI SINH ✨
  private respawnPanel!: Phaser.GameObjects.Container;
  private isOfferingRespawn: boolean = false;
  private readonly AD_DURATION: number = 3; // Giả lập thời gian quảng cáo 3 giây

  // Trạng thái sở hữu Pet (Phải được truyền qua Scene)
  private petOwned: { [key: string]: boolean } = {
    hp_regen: false,
    damage_dps: false,
    coin_collect: false
  };
  private currentPetSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
  private petRegenTimer: number = 0; // Timer cho Pet hồi máu

  // ✨ KHAI BÁO BIẾN MỚI CHO PET DAMAGE ✨
  private petDamageTimer: number = 0; // Timer cho Pet tấn công
  private readonly PET_DAMAGE_RATE: number = 180; // Tấn công mỗi 180 frames (3 giây)
  private readonly PET_BASE_DAMAGE: number = 1; // Sát thương cơ bản

  private currentLevel: number = 1; // Vòng chơi hiện tại
  private levelCompleteText!: Phaser.GameObjects.Text;
  private isLevelComplete: boolean = false; // Đang hiển thị thông báo chiến thắng vòng

  // --- THÊM: Tính năng Tính điểm ---
  private totalScore: number = 0;
  // ---------------------------------

  // ✨ THÊM BIẾN TRẠNG THÁI PAUSE VÀ PHÍM ESC ✨
  private isPaused: boolean = false;
  private escKey!: Phaser.Input.Keyboard.Key;
  private pausePanel!: Phaser.GameObjects.Container;

  // KHAI BÁO: Biến cho thông báo trên đầu nhân vật
  private playerNotificationText!: Phaser.GameObjects.Text;

  // ✨ THÊM CÁC BIẾN CHO HỆ THỐNG KINH NGHIỆM VÀ CẤP ĐỘ ✨
  private playerLevel: number = 1;
  private currentExp: number = 0;
  private requiredExp: number = 10; // EXP cần thiết ban đầu để lên cấp 2
  private expText!: Phaser.GameObjects.Text;

  // ✨ THÊM BIẾN CỜ CHO THÔNG BÁO MỞ KHÓA ✨
  private ultimateUnlocked: boolean = false;
  private soldierUnlocked: boolean = false;

  // ✨ THÊM BIẾN CHO BẢNG CHỈ SỐ ✨
  private statsKey!: Phaser.Input.Keyboard.Key;
  private statsPanel!: Phaser.GameObjects.Container;
  private isStatsPanelVisible: boolean = false;

  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  // Khai báo phím tuyệt chiêu và Group cho tuyệt chiêu
  private ultimateKey!: Phaser.Input.Keyboard.Key;
  private ultimateAttack!: Phaser.Physics.Arcade.Group;
  // ----------------------------------------------------
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group; // Group này sẽ chứa cả Enemy thường và Boss
  private arrows!: Phaser.Physics.Arcade.Group;
  // Group và Key cho Quân lính
  private soldierKey!: Phaser.Input.Keyboard.Key;
  private soldiers!: Phaser.Physics.Arcade.Group;
  // ✨ THAY ĐỔI: Chi phí lính dùng Xu
  private readonly SOLDIER_COST: number = 5;
  private readonly SOLDIER_DAMAGE: number = 1; // Sát thương lính gây ra
  private readonly SOLDIER_MAX_HEALTH: number = 3; // HP cơ bản của lính

  private bgMusic!: Phaser.Sound.BaseSound; // 🔊 nhạc nền
  private shootSound!: Phaser.Sound.BaseSound; // 🔊 Âm thanh bắn cung

  private mapWidth: number = 900 * 6;
  private playerHealth: number = 5;

  private playerHealthBar!: Phaser.GameObjects.Graphics;

  private isInvincible: boolean = false; // Đã khôi phục biến này

  private isCharging: boolean = false;
  private chargePower: number = 0;
  private chargeBar!: Phaser.GameObjects.Graphics;

  // Biến kiểm soát sạc Tuyệt chiêu
  private isUltimateCharging: boolean = false;
  private ultimatePower: number = 0;
  private ultimateCooldown: number = 0; // Thời gian hồi chiêu

  // KHAI BÁO HỆ THỐNG MANA (Giữ cho Ultimate)
  private playerMana: number = 100;
  private maxMana: number = 100;
  private manaBar!: Phaser.GameObjects.Graphics;
  private manaRegenTimer: number = 0; // Đếm ngược để hồi 1 mana mỗi giây
  private readonly ULTIMATE_COST: number = 50; // Chi phí cho chiêu S
  private readonly MAX_PLAYER_HEALTH: number = 5;
  // ------------------------------------
  // ✨ THÊM CÁC BIẾN CHỈ SỐ CƠ BẢN MỚI ✨
  private baseMaxHealth: number = 5; // Máu cơ bản của người chơi (dựa trên MAX_PLAYER_HEALTH ban đầu)
  private baseArrowDamage: number = 1; // Sát thương cơ bản của chiêu A (chưa sạc)
  private baseUltimateDamage: number = 5; // Sát thương cơ bản của chiêu S

  private isGameOver: boolean = false;
  private gameOverText!: Phaser.GameObjects.Text;

  // ✨ HỆ THỐNG COIN (XU) MỚI
  private playerCoins: number = 0;
  private coinText!: Phaser.GameObjects.Text;
  private coins!: Phaser.Physics.Arcade.Group;
  // -------------------------

  // --- Boss Flag ---
  private bossAppeared: boolean = false;
  // -----------------

  // --- NPC ---
  // (Removed Nguyen Trai)
  // Khai báo lại các hàm private để TypeScript/IDE nhận diện (Giữ cho TypeScript nhận diện)
  // private updateChargeAnimation(power: number): void;
  // private applyDamage(projectile: any, target: any, damage: number, knockback: number): void;
  // private handleArrowHit(arrow: any, target: any): void;
  // private handleUltimateHit(ultimateRocket: any, target: any): void;
  // private handleSoldierHit(soldier: any, target: any): void; // Va chạm Lính -> Địch
  // private handleEnemyContact(player: any, target: any): void; // Va chạm Player/Lính <- Địch
  // private handlePlayerHit(player: any, target: any): void; // Hàm cũ, ta sẽ đổi thành handleEnemyContact
  // private handleCoinCollect(player: any, coin: any): void; // Xử lý nhặt xu
  // private spawnBoss(): void;
  // private showLevelComplete(): void;
  // private startNextLevel(): void;
  // private updateManaBar(): void;
  // private updatePlayerHealthBar(): void;
  // private updateCoinUI(): void; // Cập nhật Xu UI
  // private spawnCoins(x: number, y: number, amount: number): void; // Hàm rơi xu
  // private findNearestEnemy(): GameCharacter | null;
  // private shootArrow(power: number): void;
  // private summonSoldier(): void;
  // private fireUltimateAttack(): void;
  // private damageCharacter(character: GameCharacter | Soldier, damage: number): void;
  // private updateHealthBar(char: GameCharacter | Soldier): void;
  // // ✨ THÊM KHAI BÁO CÁC HÀM MỚI ✨
  // private updateExpUI(): void;
  // private checkLevelUp(): void;
  // // ✨ KHAI BÁO HÀM MỚI ✨
  // private showNotification(message: string): void;

  // Kết thúc khai báo

  constructor() {
    super("Game");
  }

  preload(): void {

    // Ảnh Pet Heal Frames (Thêm các frame mới)
    this.load.image('pet_heal1', '../assets/ph1.png');
    this.load.image('pet_heal2', '../assets/ph2.png');
    this.load.image('pet_heal3', '../assets/ph3.png');
    this.load.image('pet_heal4', '../assets/ph4.png');
    this.load.image('pet_heal5', '../assets/ph5.png');
    this.load.image('pet_heal6', '../assets/ph6.png');
    this.load.image('pet_heal7', '../assets/ph7.png');
    this.load.image('pet_heal8', '../assets/ph8.png');
    // Ảnh Pet damage
    this.load.image('pet_damage1', '../assets/sl1.png');
    this.load.image('pet_damage2', '../assets/sl2.png');
    this.load.image('pet_damage3', '../assets/sl3.png');
    this.load.image('pet_damage4', '../assets/sl4.png');
    this.load.image('pet_damage5', '../assets/sl5.png');
    this.load.image('pet_damage6', '../assets/sl6.png');
    this.load.image('pet_damage7', '../assets/sl7.png');
    this.load.image('pet_damage8', '../assets/sl8.png');
    this.load.image('pet_damage9', '../assets/sl9.png');


    this.load.image('pet_coin', '../assets/pet_heal.png')


    this.load.image("ground", "assets/ground_2.png");
    this.load.image("background", "assets/background.png");
    this.load.image("arrow", "assets/arrow_fire.png");
    this.load.image("npc", "assets/nguyentrai_1.png"); // ✨ SẼ THAY THẾ BẰNG FRAME NT1
    this.load.image('boss', 'assets/boss_1.png'); // Hình ảnh Boss
    this.load.image('rocket', 'assets/arrow_fire.png');
    this.load.image('soldier', 'assets/lt1.png');
    // ✨ TẢI HÌNH ẢNH COIN (Tạm dùng arrow nếu chưa có sprite coin riêng)
    this.load.image('coin', 'assets/coin.png');


    // --- Frames Lê Lợi ---
    this.load.image('leloi1', '../assets/lt1.png');
    this.load.image('leloi2', '../assets/lt2.png');
    this.load.image('leloi3', '../assets/lt3.png');
    this.load.image('leloi4', '../assets/lt4.png');
    this.load.image('leloi5', '../assets/lt5.png');
    this.load.image('leloi6', '../assets/lt6.png');
    this.load.image('leloi7', '../assets/lt7.png');

    // --- Frames soldier ---
    this.load.image('ls1', '../assets/ls1.png');
    this.load.image('ls2', '../assets/ls2.png');
    this.load.image('ls3', '../assets/ls3.png');
    this.load.image('ls4', '../assets/ls4.png');
    this.load.image('ls5', '../assets/ls5.png');
    this.load.image('ls6', '../assets/ls6.png');
    this.load.image('ls7', '../assets/ls7.png');

    // --- Hiệu ứng kéo cung ---
    this.load.image('bancung1', '../assets/bancung_1.png');
    this.load.image('bancung2', '../assets/bancung_2.png');
    this.load.image('bancung3', '../assets/bancung_3.png');

    // --- Enemy frames ---
    this.load.image("enemy1", "assets/m1_1.png");
    this.load.image("enemy2", "assets/m1_2.png");
    this.load.image("enemy3", "assets/m1_3.png");
    this.load.image("enemy3_2", "assets/m1_3_2.png");
    this.load.image("enemy3_3", "assets/m1_3_3.png");
    this.load.image("enemy3_4", "assets/m1_3_4.png");
    this.load.image("enemy4", "assets/m1_4.png");

    // ✨ THÊM: Tải Frames Nguyễn Trãi
    this.load.image('nt1', '../assets/nt1.png');
    this.load.image('nt2', '../assets/nt2.png');
    this.load.image('nt3', '../assets/nt3.png');
    this.load.image('nt4', '../assets/nt4.png');
    this.load.image('nt5', '../assets/nt5.png');
  }

  create(): void {
    // 📱 Khởi tạo Touch Controls
    this.touchControls = new TouchControls('game-container');
    this.touchControls.setContext('game');

    // ✨ Đóng bảng chỉ số khi chạm bất kỳ đâu trên màn hình game ✨
    this.input.on('pointerdown', () => {
      if (this.isStatsPanelVisible) {
        this.isStatsPanelVisible = false;
        this.statsPanel.setVisible(false);
        this.physics.resume();
        this.anims.resumeAll();
      }
    });

    // THÊM: Gán phím C cho bảng chỉ số
    this.statsKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.C
    );
    // ---------------------------------------------

    // ✨ GÁN PHÍM ESC CHO PAUSE MENU ✨
    this.escKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    // ✨ KHỞI TẠO BẢNG CHỈ SỐ ✨
    this.statsPanel = this.createStatsPanel();
    this.updateStatsPanel();
    // --- Camera (Giữ nguyên) ---

    // ✨ KHỞI TẠO PAUSE MENU ✨
    this.pausePanel = this.createPauseMenu();

    // --- Background ---
    const bgWidth = 900;
    for (let i = 0; i < 6; i++) {
      this.add.image(i * bgWidth, 0, "background").setOrigin(0, 0);
    }

    // --- Ground ---
    this.ground = this.physics.add.staticGroup();
    this.ground.create(600, 900, "ground").setScale(300, 6).refreshBody();

    // --- Phát nhạc nền ---
    this.bgMusic = this.sound.add('bgMusic', { volume: 0.2 });
    this.bgMusic.play();

    // 🔊 Tạo đối tượng âm thanh bắn cung
    this.shootSound = this.sound.add("shoot", { volume: 4.5 });

    // --- Player ---
    this.player = this.physics.add.sprite(200, 650, "leloi1");
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setOrigin(0.5, 1);
    this.physics.add.collider(this.player, this.ground);

    // ✨ VỊ TRÍ CHÍNH XÁC: GỌI HÀM HIỂN THỊ PET NGAY TẠI ĐÂY ✨
    this.displayPet()

    // ✨ ĐỊNH NGHĨA HOẠT ẢNH PET HEAL ✨
    this.anims.create({
      key: "pet-heal-idle",
      frames: [
        { key: "pet_heal1" }, { key: "pet_heal2" }, { key: "pet_heal3" }, { key: "pet_heal4" },
        { key: "pet_heal5" }, { key: "pet_heal6" }, { key: "pet_heal7" }, { key: "pet_heal8" },
      ],
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: "pet-damage-idle", // <--- KEY HOẠT ẢNH MỚI
      frames: [
        { key: "pet_damage1" }, { key: "pet_damage2" }, { key: "pet_damage3" }, { key: "pet_damage4" },
        { key: "pet_damage5" }, { key: "pet_damage6" }, { key: "pet_damage7" }, { key: "pet_damage8" }, { key: "pet_damage9" },
      ],
      frameRate: 6, // Tốc độ hợp lý
      repeat: -1, // Lặp lại vô hạn
    });

    // ✨ ĐỊNH NGHĨA HOẠT ẢNH BOSS ✨
    this.anims.create({
      key: "boss-walk-left",
      frames: [
        { key: "boss1" },
        { key: "boss2" },
        { key: "boss3" },
        { key: "boss4" },
        { key: "boss5" },
        { key: "boss6" },
        { key: "boss7" },
      ],
      frameRate: 6, // Tốc độ chậm hơn (điều chỉnh theo ý bạn)
      repeat: -1,
    });

    this.anims.create({
      key: "boss-walk-right",
      frames: [
        { key: "boss1" }, // Dùng chung frames
        { key: "boss2" },
        { key: "boss3" },
        { key: "boss4" },
        { key: "boss5" },
        { key: "boss6" },
        { key: "boss7" },
      ],
      frameRate: 6,
      repeat: -1,
    });
    // ------------------------------------

    // --- (Removed Nguyen Trai NPC & Dialogue UI) ---

    // --- Animations (Giữ nguyên) ---
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

    // Hoạt ảnh cho lính
    this.anims.create({
      key: "soldier-walk",
      frames: [
        { key: "ls1" },
        { key: "ls2" },
        { key: "ls3" },
        { key: "ls4" },
        { key: "ls5" },
        { key: "ls6" },
        { key: "ls7" },
      ],
      frameRate: 8,
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

    // Tạo 2 Enemy thường (Giữ nguyên)
    for (let i = 0; i < 2; i++) {
      const enemy = this.enemies.create(
        this.mapWidth - 50 - i * 100,
        610,
        "enemy1"
      ) as GameCharacter;
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(0.2);
      enemy.play("enemy-walk-left");
      enemy.maxHealth = 3;
      enemy.health = enemy.maxHealth;
      enemy.healthBar = this.add.graphics();
      enemy.setOrigin(0.5, 1);
      enemy.isBoss = false;
    }

    this.physics.add.collider(this.enemies, this.ground);


    // --- UI ---

    // Khởi tạo Player Health Bar
    this.playerHealthBar = this.add.graphics().setScrollFactor(0);
    this.updatePlayerHealthBar();

    // HIỂN THỊ MANA BAR
    this.manaBar = this.add.graphics().setScrollFactor(0);
    this.updateManaBar();

    // ✨ KHỞI TẠO COIN UI
    // this.playerCoins = 0; // Bắt đầu với 0 xu
    this.coinText = this.add.text(16, 160, `Xu: ${this.playerCoins}`, {
      fontSize: '20px',
      color: '#ffdd00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 8 }
    }).setScrollFactor(0).setDepth(1);
    this.updateCoinUI();
    // ----------------------

    // ✨ THÊM KHỞI TẠO EXP UI VÀ LEVEL DISPLAY ✨
    this.expText = this.add.text(16, 200, `Cấp ${this.playerLevel} | EXP: 0/10`, {
      fontSize: '20px',
      color: '#aaffaa', // Màu xanh nhạt cho EXP
      backgroundColor: '#000000',
      padding: { x: 5, y: 8 }
    }).setScrollFactor(0).setDepth(1);
    // ---------------------------------------------

    // --- Arrow group (Giữ nguyên) ---
    this.arrows = this.physics.add.group();

    // Va chạm Arrows/Enemies
    this.physics.add.overlap(
      this.arrows,
      this.enemies,
      this.handleArrowHit,
      undefined,
      this
    );

    // Va chạm Player/Enemies
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerHit,
      undefined,
      this
    );

    // THÊM: Group cho Tuyệt chiêu và xử lý va chạm
    this.ultimateAttack = this.physics.add.group({
      runChildUpdate: false
    });
    this.physics.add.overlap(
      this.ultimateAttack,
      this.enemies,
      this.handleUltimateHit, // Hàm xử lý sát thương tuyệt chiêu
      undefined,
      this
    );
    // ---------------------------------------------

    // ✨ KHỞI TẠO COIN GROUP
    this.coins = this.physics.add.group();
    // ✨ THAY THẾ COLLIDER DÙNG CALLBACK ✨
    this.physics.add.collider(this.coins, this.ground, this.stopCoinMovement, undefined, this);
    this.physics.add.overlap(this.player, this.coins, this.handleCoinCollect, undefined, this); // Player nhặt xu


    // THÊM: Khởi tạo Group cho Quân lính
    this.soldiers = this.physics.add.group({
      runChildUpdate: true,
    });

    // Va chạm giữa Lính và Ground
    this.physics.add.collider(this.soldiers, this.ground);

    // Va chạm giữa Lính và Kẻ địch (Lính gây sát thương - dùng overlap)
    this.physics.add.overlap(
      this.soldiers,
      this.enemies,
      this.handleSoldierHit,
      undefined,
      this
    );

    // THÊM: Va chạm Vật lý giữa Lính và Kẻ địch (Địch gây sát thương lên Lính - dùng collider)
    this.physics.add.collider(
      this.soldiers,
      this.enemies,
      this.handleEnemyContact, // Hàm mới xử lý sát thương lẫn nhau
      undefined,
      this
    );

    // --- Controls ---
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.A
    );
    // THÊM: Gán phím S cho tuyệt chiêu
    this.ultimateKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.S
    );
    // THÊM: Gán phím D cho chiêu triệu hồi lính
    this.soldierKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.D
    );
    // ---------------------------------------------

    // --- Camera (Giữ nguyên) ---
    this.cameras.main.setBounds(0, 0, this.mapWidth, 900);
    this.physics.world.setBounds(0, 0, this.mapWidth, 900);
    this.cameras.main.startFollow(this.player);

    // --- Charge bar (Giữ nguyên) ---
    this.chargeBar = this.add.graphics().setScrollFactor(0);

    // ✨ DÒNG SỬA LỖI: KHỞI TẠO PANEL HỒI SINH TRONG CREATE() ✨
    this.respawnPanel = this.createRespawnPanel();
    
    // Hiện hướng dẫn chiến đấu khi mới vào trận
    this.createTutorialPanel();
  }

  // ✨ HÀM TẠO BẢNG HƯỚNG DẪN CHIẾN ĐẤU ✨
  private createTutorialPanel(): void {
    const camWidth = this.cameras.main.width;
    const camHeight = this.cameras.main.height;

    // Nền tối mờ toàn màn hình
    const overlay = this.add.rectangle(0, 0, camWidth, camHeight, 0x000000, 0.8)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(3000)
      .setInteractive();

    const panelWidth = 600;
    const panelHeight = 260;
    const panel = this.add.rectangle(camWidth / 2, camHeight / 2, panelWidth, panelHeight, 0x222222, 1)
      .setScrollFactor(0)
      .setDepth(3001)
      .setStrokeStyle(2, 0xffd700);

    const title = this.add.text(camWidth / 2, camHeight / 2 - 90, "⚔️ HƯỚNG DẪN CHIẾN ĐẤU ⚔️", {
      fontSize: "24px",
      color: "#ffd700",
      fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3002);

    const content = this.add.text(camWidth / 2, camHeight / 2, 
      "• Giữ [A]: Kéo cung bắn tên (Tấn công cơ bản)\n\n" +
      "• Giữ [S]: Sử dụng Tuyệt chiêu (Yêu cầu Cấp 2)\n\n" +
      "• Nhấn [D]: Triệu hồi lính (Yêu cầu Cấp 3 và Xu)", {
      fontSize: "20px",
      color: "#ffffff",
      lineSpacing: 10
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3002);

    const closeText = this.add.text(camWidth / 2, camHeight / 2 + 100, "( Chạm vào đây để bắt đầu )", {
      fontSize: "18px",
      color: "#aaaaaa",
      fontStyle: "italic"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3002);

    // Tạm dừng game
    this.isPaused = true;
    this.physics.world.isPaused = true;
    this.time.paused = true;

    // Tự động hủy khi click
    overlay.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      content.destroy();
      closeText.destroy();
      
      // Tiếp tục game
      this.isPaused = false;
      this.physics.world.isPaused = false;
      this.time.paused = false;
    });
  }

  // --- UI Logic ---
  // -------------------------------------------------------------------------
  // Hàm cập nhật Xu UI mới
  private updateCoinUI(): void {
    this.coinText.setText(`Xu: ${this.playerCoins}`);
  }
  // Hàm cập nhật Thanh Máu Người Chơi
  private updatePlayerHealthBar(): void {
    const healthPercent = this.playerHealth / this.MAX_PLAYER_HEALTH;
    const barX = 16;
    const barY = 80;
    const barWidth = 200;
    const barHeight = 15;

    this.playerHealthBar.clear();

    // Viền (Đen)
    this.playerHealthBar.fillStyle(0x000000, 0.5);
    this.playerHealthBar.fillRect(barX, barY, barWidth, barHeight);
    this.playerHealthBar.lineStyle(1, 0xff0000); // Viền đỏ
    this.playerHealthBar.strokeRect(barX, barY, barWidth, barHeight);

    // Máu hiện tại (Đỏ)
    this.playerHealthBar.fillStyle(0xff3333);
    this.playerHealthBar.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Thêm chữ "HP" nhỏ ở góc trái
    this.add.text(barX + 2, barY + 1, "HP", {
      fontSize: '12px',
      color: '#ffffff'
    }).setScrollFactor(0).setDepth(1);
  }


  // Hàm cập nhật Mana Bar (Giữ lại cho Ultimate)
  private updateManaBar(): void {
    const manaPercent = this.playerMana / this.maxMana;
    const barX = 16;
    const barY = 110;
    const barWidth = 200;
    const barHeight = 15; // Chiều cao thanh Mana

    this.manaBar.clear();

    // Viền mana bar (xanh đậm/đen)
    this.manaBar.fillStyle(0x000000, 0.5);
    this.manaBar.fillRect(barX, barY, barWidth, barHeight);
    this.manaBar.lineStyle(1, 0x0000ff); // Viền
    this.manaBar.strokeRect(barX, barY, barWidth, barHeight);

    // Mana hiện tại (xanh sáng)
    this.manaBar.fillStyle(0x0099ff);
    this.manaBar.fillRect(barX, barY, barWidth * manaPercent, barHeight);

    // Thêm chữ "MP" hoặc "Mana" nhỏ ở góc trái
    this.add.text(barX + 2, barY + 1, "MP", {
      fontSize: '12px',
      color: '#ffffff'
    }).setScrollFactor(0).setDepth(1);
  }

  private updateChargeAnimation(power: number): void {
    if (power < 30) {
      this.player.setTexture("leloi1");
    } else if (power < 60) {
      this.player.setTexture("bancung1");
    } else if (power < 99) {
      this.player.setTexture("bancung2");
    } else {
      this.player.setTexture("bancung3");
    }
    // Giữ màu tint cam khi sạc ultimate
    if (this.isUltimateCharging) {
      this.player.setTint(0xff8800);
    } else {
      // Chỉ xóa tint nếu KHÔNG đang trong trạng thái vô địch
      if (!this.isInvincible) {
        this.player.clearTint();
      }
    }
  }

  // --- Combat/Interaction Logic ---
  // -------------------------------------------------------------------------

  // Hàm xử lý nhặt Xu mới
  private handleCoinCollect(player: any, coinObj: any): void {
    const coin = coinObj as Coin;
    this.playerCoins += coin.value;
    this.updateCoinUI();
    coin.destroy();
  }

  // Hàm xử lý va chạm mũi tên thường (Nút A)
  private handleArrowHit(arrow: any, target: any): void {
    const arrowProj = arrow as ArrowProjectile;


    // 1. Gây sát thương và hiệu ứng (Knockback)
    this.applyDamage(arrow, target, arrowProj.damage, 300);

    // 2. Hủy mũi tên ngay lập tức (Không xuyên mục tiêu)
    arrow.destroy();
  }

  // Hàm xử lý va chạm Tuyệt chiêu (Nút S)
  private handleUltimateHit(ultimateRocket: any, target: any): void {
    const rocket = ultimateRocket as UltimateProjectile;

    // Chỉ xử lý nếu tên lửa còn số lần xuyên (piercingCount > 0)
    if (rocket.active) {
      this.applyDamage(rocket, target, rocket.damage, 0);

      // GIẢM SỐ LẦN XUYÊN
      rocket.piercingCount--;

      // Nếu hết lượt xuyên, hủy tên lửa
      if (rocket.piercingCount <= 0) {
        rocket.destroy();
      }
    }
  }

  // Hàm xử lý va chạm giữa Lính và Kẻ địch (Lính gây sát thương)
  private handleSoldierHit(soldierObj: any, targetObj: any): void {
    const soldier = soldierObj as Soldier;
    const enemy = targetObj as GameCharacter;

    // Lính chỉ tấn công khi va chạm (overlap)
    if (soldier.active && enemy.active) {
      this.applyDamage(soldier, enemy, soldier.damage, 100);
    }
  }

  // Xử lý va chạm vật lý giữa Lính và Kẻ địch
  private handleEnemyContact(charA: any, charB: any): void {
    let soldier: Soldier | undefined;
    let enemy: GameCharacter | undefined;

    if (this.soldiers.contains(charA)) {
      soldier = charA as Soldier;
      enemy = charB as GameCharacter;
    } else if (this.soldiers.contains(charB)) {
      soldier = charB as Soldier;
      enemy = charA as GameCharacter;
    }

    if (soldier && enemy && soldier.active && enemy.active) {
      this.damageCharacter(soldier, 1);

      if (soldier.active) {
        const direction = soldier.x < enemy.x ? -1 : 1;
        soldier.setVelocityX(direction * 100);
        this.time.delayedCall(100, () => {
          if (soldier?.active) {
            soldier.setVelocityX(0);
          }
        });
      }
    }
  }

  // Hàm sát thương chung cho Player/Soldier
  private damageCharacter(character: GameCharacter | Soldier, damage: number): void {
    if (character.health <= 0) return;

    character.health -= damage;

    // Hiệu ứng đỏ
    character.setTint(0xff0000);
    this.time.delayedCall(200, () => character?.clearTint());

    // Cập nhật thanh máu nếu là lính
    if ((character as Soldier).healthBar) {
      this.updateHealthBar(character);
    }

    if (character.health <= 0) {
      character.healthBar?.destroy();
      character.destroy();
    }
  }

  // Hàm riêng để cập nhật thanh máu của lính/boss (Đã sửa vị trí)
  private updateHealthBar(char: GameCharacter | Soldier): void {
    const isBoss = char.isBoss;
    const barWidth = isBoss ? 100 : 40;
    const barHeight = isBoss ? 10 : 5;
    const yOffset = isBoss ? -140 : -130; // Đã chỉnh lên cao hơn

    const healthPercent = Phaser.Math.Clamp(char.health / char.maxHealth, 0, 1);

    char.healthBar.clear();
    char.healthBar.lineStyle(isBoss ? 2 : 1, 0xffffff);
    char.healthBar.strokeRect(char.x - barWidth / 2, char.y + yOffset, barWidth, barHeight);
    char.healthBar.fillStyle(isBoss ? 0xff0000 : 0x00ff00); // Boss: Đỏ, Lính: Xanh lá

    // Vẽ thanh máu
    char.healthBar.fillRect(char.x - barWidth / 2, char.y + yOffset, barWidth * healthPercent, barHeight);
  }

  // Hàm rơi Xu mới
  // Trong GameScene.ts
  private spawnCoins(x: number, y: number, amount: number): void {
    for (let i = 0; i < amount; i++) {
      // Rơi ra 1-2 xu mỗi lần
      const coinValue = Phaser.Math.Between(1, 2);

      const coin = this.coins.create(x, y - 50, 'coin') as Coin;
      coin.value = coinValue;
      coin.setScale(0.5); // Giảm kích thước xu

      // ✨ SỬA LỖI: LOẠI BỎ LỰC ĐẨY VÀ XOAY ✨

      // Thay vì dùng lực đẩy, chỉ set vận tốc Y ban đầu nhẹ (để nó rơi)
      const initialVelocityY = Phaser.Math.Between(-10, 50); // Chỉ để nó bắt đầu rơi
      const initialVelocityX = Phaser.Math.Between(-50, 50); // Lực đẩy X rất nhỏ để phân tán nhẹ

      coin.setVelocity(initialVelocityX, initialVelocityY);

      // Đảm bảo không có vận tốc góc
      coin.setAngularVelocity(0);
    }
  }


  // Hàm xử lý sát thương Enemy/Boss VÀ THÊM LOGIC RƠI XU
  private applyDamage(projectile: any, target: any, damage: number, knockback: number): void {
    const enemy = target as GameCharacter;

    // ✨ SỬA LỖI: Chỉ kiểm tra enemy.body, không kiểm tra projectile.body nếu projectile là null
    if (!enemy || !enemy.body || !enemy.active) return;

    // Nếu có projectile (mũi tên/tên lửa), hãy đảm bảo nó hoạt động
    if (projectile && !projectile.active) return;

    enemy.health -= damage; // Áp dụng sát thương

    // Hiệu ứng đỏ cho Enemy
    enemy.setTint(0xff0000);
    this.time.delayedCall(150, () => enemy?.clearTint());

    // Knockback
    if (knockback > 0 && !enemy.isKnockedBack && enemy.active) {
      const direction = projectile.body.velocity.x > 0 ? 1 : -1;
      enemy.isKnockedBack = true;
      enemy.setVelocityX(direction * knockback);

      this.cameras.main.shake(100, 0.0002);

      this.time.delayedCall(200, () => {
        if (enemy.active) {
          enemy.setVelocityX(0);
          enemy.isKnockedBack = false;
        }
      });
    }

    // Cập nhật Thanh máu
    this.updateHealthBar(enemy); // Sử dụng hàm cập nhật chung

    if (enemy.health <= 0) {
      const enemyX = enemy.x;
      const enemyY = enemy.y;

      enemy.healthBar?.destroy();
      enemy.destroy();

      // ✨ LOGIC CỘNG EXP KHI ĐỊCH CHẾT ✨
      let expGained: number;

      if (enemy.isBoss) {
        expGained = 5 + (this.currentLevel * 3); // Boss cho EXP nhiều hơn và tăng theo level
        this.totalScore += 5;
        this.playerMana = Phaser.Math.Clamp(this.playerMana + 30, 0, this.maxMana);
      } else {
        expGained = 2; // Quái thường cho 2 EXP
        this.totalScore += 2;
        this.playerMana = Phaser.Math.Clamp(this.playerMana + 10, 0, this.maxMana);
      }

      this.currentExp += expGained;
      this.checkLevelUp(); // Gọi hàm kiểm tra lên cấp và cập nhật UI

      // ✨ LOGIC RƠI XU KHI ĐỊCH CHẾT
      const coinDropAmount = enemy.isBoss ? Phaser.Math.Between(5, 8) : Phaser.Math.Between(2, 4);
      this.spawnCoins(enemyX, enemyY, coinDropAmount);

      // Logic cộng điểm & Mana (Giữ nguyên)
      if (enemy.isBoss) {
        this.totalScore += 5;
        this.playerMana = Phaser.Math.Clamp(this.playerMana + 30, 0, this.maxMana);
      } else {
        this.totalScore += 2;
        this.playerMana = Phaser.Math.Clamp(this.playerMana + 10, 0, this.maxMana);
      }

      // Cập nhật Mana Bar
      this.updateManaBar();

      // Logic Boss Spawn
      if (!enemy.isBoss && this.enemies.countActive(true) === 0 && !this.bossAppeared) {
        this.spawnBoss();
      }

      // Logic Level Complete
      if (enemy.isBoss) {
        this.showLevelComplete();
      }
    }
  }

  // Khôi phục logic sát thương và hiệu ứng Invincibility
  private handlePlayerHit(player: any, target: any): void {
    if (this.isInvincible || this.isGameOver || this.isOfferingRespawn) return;

    this.playerHealth -= 1;
    this.updatePlayerHealthBar();

    if (this.playerHealth <= 0) {
      // ✨ LOGIC MỚI: DỪNG TRÒ CHƠI VÀ HỎI XEM QUẢNG CÁO ✨
      this.isGameOver = true; // Set cờ Game Over (tạm thời)
      this.player.setTint(0x000000);
      this.player.setVelocity(0);
      this.player.anims.stop();
      this.physics.world.isPaused = true; // Dừng thế giới vật lý




      this.isOfferingRespawn = true;
      // this.respawnPanel.setVisible(true);

      // ✨ GỌI HÀM MỚI: Hiển thị thông báo VĨNH VIỄN trên đầu người chơi ✨
      const adPrompt = "Xem quảng cáo để hồi sinh [Y/N]?";
      this.showNotification(adPrompt, true); // True = isPersistent


      // Khai báo listener cho phím tắt Y/N
      this.input.keyboard!.once('keydown-Y', () => this.handleAdRespawn(true), this);
      this.input.keyboard!.once('keydown-N', () => this.handleAdRespawn(false), this);
      // 📱 Hỗ trợ nút chạm qua respawnPanel (đã có pointerdown handler trên yesBtn/noBtn)

      // ❌ XÓA HẾT PHẦN HIỂN THỊ "GAME OVER" VÀ SPACE NẾU CÓ ❌

    } else {
      // 1. Bật trạng thái vô địch
      this.isInvincible = true;

      // 2. Hiệu ứng nháy màu đỏ (Tint)
      this.player.setTint(0xff0000);
      this.time.delayedCall(200, () => this.player.clearTint(), [], this);

      // 3. Tắt trạng thái vô địch sau 1 giây
      this.time.delayedCall(1000, () => (this.isInvincible = false), [], this);

      // 4. Đẩy nhân vật lên một chút (knockback nhỏ)
      this.player.setVelocityY(-200);
    }
  }

  // --- Game Flow Logic ---
  // -------------------------------------------------------------------------
  private spawnBoss(): void {
    if (this.bossAppeared) return;
    this.bossAppeared = true;

    // LOGIC TĂNG ĐỘ KHÓ BOSS: HP = Level * 5
    const bossHealthMultiplier = 5;
    const bossHealth = this.currentLevel * bossHealthMultiplier;

    // SÁT THƯƠNG BOSS: Sát thương tăng thêm 1 mỗi vòng
    const bossDamage = this.currentLevel;
    // -------------------------

    const bossX = this.mapWidth - 100;
    const bossY = 725;

    const boss = this.enemies.create(bossX, bossY, "boss1") as GameCharacter;
    boss.body.allowGravity = true; // Đảm bảo trọng lực BẬT
    boss.setCollideWorldBounds(true);
    boss.setBounce(0.1);
    boss.setOrigin(0.5, 1);

    // ✨ BẮT ĐẦU CHẠY HOẠT ẢNH BOSS ✨
    // Giả sử Boss ban đầu di chuyển sang trái (hướng về player)
    boss.play("boss-walk-left", true);

    boss.maxHealth = bossHealth; // Áp dụng HP mới
    boss.health = bossHealth;    // Áp dụng HP mới
    boss.healthBar = this.add.graphics().setDepth(1);

    boss.setImmovable(false);
    boss.isBoss = true;

    // LƯU TRỮ SÁT THƯƠNG CỦA BOSS TRONG DỮ LIỆU CỦA NÓ
    (boss as any).damage = bossDamage;

    boss.y = bossY;
    boss.body.y = bossY;

    const bossText = this.add.text(this.cameras.main.scrollX + this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      "BOSS XUẤT HIỆN!",
      { fontSize: "60px", color: "#ff0000", backgroundColor: "#000000" })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.time.delayedCall(2000, () => bossText.destroy());

    const textMessage = "Tướng giặc đã xuất hiện!";
    const playerX = this.player.x;
    const playerY = this.player.y - 450;

    this.playerNotificationText = this.add.text(
      playerX,
      playerY,
      textMessage,
      {
        fontSize: "34px",
        color: "#ffff00",
        backgroundColor: "#000000",
        padding: { x: 10, y: 5 }
      }
    )
      .setOrigin(0.5, 0)
      .setScrollFactor(1)
      .setDepth(999);

    this.time.delayedCall(2000, () => {
      if (this.playerNotificationText) {
        this.playerNotificationText.destroy();
      }
    }, [], this);
  }

  private showLevelComplete(): void {
    if (this.levelCompleteText) this.levelCompleteText.destroy();

    const camWidth = this.cameras.main.width;
    const camHeight = this.cameras.main.height;

    this.levelCompleteText = this.add.text(
      camWidth / 2,
      camHeight / 2,
      `CHÚC MỪNG! VÒNG ${this.currentLevel} HOÀN THÀNH\nNhấn SPACE để sang vòng tiếp theo`,
      {
        fontSize: "50px",
        color: "#00ff00",
        backgroundColor: "#000000",
        align: "center",
        padding: { x: 20, y: 20 },
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(999);

    this.player.body.enable = false;
    this.enemies.getChildren().forEach((e: any) => e.body.enable = false);

    this.isLevelComplete = true;
  }

  private startNextLevel(): void {
    if (this.levelCompleteText) this.levelCompleteText.destroy();
    this.isLevelComplete = false;

    // Reset Player
    this.player.setPosition(200, 650);
    this.player.clearTint();
    // ✨ SỬA LỖI: HỒI ĐẦY MÁU KHI SANG VÒNG MỚI ✨
    this.playerHealth = Math.floor(this.baseMaxHealth); // Sử dụng máu tối đa hiện tại (đã tăng theo cấp)
    this.updatePlayerHealthBar(); // Cập nhật thanh máu mới
    this.player.body.enable = true;

    // Xóa toàn bộ enemy cũ
    this.enemies.clear(true, true);

    // Tăng level
    this.currentLevel += 1;
    this.bossAppeared = false;

    // LOGIC TĂNG ĐỘ KHÓ QUÁI THƯỜNG
    const baseEnemyHealth = 3;
    const baseEnemyCount = 2;
    const enemyHealth = baseEnemyHealth * this.currentLevel;
    const enemyCount = baseEnemyCount * this.currentLevel; // Tăng số lượng theo cấp độ
    // --------------------------------

    // Spawn Enemy/Boss mới cho Vòng tiếp theo
    for (let i = 0; i < enemyCount; i++) {
      const enemy = this.enemies.create(
        this.mapWidth - 50 - i * 100,
        610,
        "enemy1"
      ) as GameCharacter;
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(0.2);
      enemy.play("enemy-walk-left");
      enemy.maxHealth = enemyHealth; // Áp dụng HP mới
      enemy.health = enemyHealth;       // Áp dụng HP mới
      enemy.healthBar = this.add.graphics();
      enemy.setOrigin(0.5, 1);
      enemy.isBoss = false;
    }
  }

  // --- Utility Functions ---
  // -------------------------------------------------------------------------
  private findNearestEnemy(): GameCharacter | null {
    let nearestEnemy: GameCharacter | null = null;
    let minDistance = Infinity;

    this.enemies.getChildren().forEach((enemy: any) => {
      const char = enemy as GameCharacter;
      if (char.active) {
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, char.x, char.y);
        if (distance < minDistance) {
          minDistance = distance;
          nearestEnemy = char;
        }
      }
    });

    return nearestEnemy;
  }

  // --- Projectile Logic ---
  // -------------------------------------------------------------------------
  // Hàm shootArrow (Thêm logic tính sát thương dựa trên Charge Power)
  private shootArrow(power: number): void {
    this.shootSound.play();

    // Tính sát thương: 1 (cơ bản) + 1 (nếu sạc >= 60) + 1 (nếu sạc = 100)
    const baseDamage = this.baseArrowDamage;
    const chargedDamage = (power >= 60 ? 1 : 0) + (power >= 100 ? 1 : 0);
    const finalDamage = baseDamage + chargedDamage; // Sát thương tối đa là 3

    const arrow = this.arrows.create(this.player.x, this.player.y - 80, "arrow") as ArrowProjectile;
    arrow.damage = finalDamage; // Gán sát thương vào projectile

    arrow.body.setAllowGravity(true);
    const speed = (power / 100) * 800 * (this.player.flipX ? -2 : 2);
    arrow.setVelocityX(speed);
    if (this.player.flipX) arrow.setFlipX(true);
  }

  // Định nghĩa hàm Tuyệt chiêu (bắn thẳng)
  private fireUltimateAttack(): void {
    // Tạo mũi tên lửa
    const rocket = this.ultimateAttack.create(this.player.x, this.player.y - 80, "rocket") as UltimateProjectile;

    // Cài đặt thuộc tính
    rocket.body.setAllowGravity(false);
    rocket.body.setCircle(16); // Đặt hitbox hình tròn
    rocket.setTint(0xffa500); // Màu cam (lửa)
    rocket.setScale(1.5);
    rocket.damage = this.baseUltimateDamage; // Gán sát thương cố định (tăng theo cấp)
    rocket.piercingCount = 3; // THÊM: Số lần xuyên (3 kẻ địch)

    // LOGIC BẮN THẲNG THEO HƯỚNG NHÂN VẬT QUAY
    const ultimateSpeed = 1000;
    let initialAngle = 0;
    let flipX = false;

    if (this.cursors.up?.isDown) {
      // Bắn thẳng lên
      initialAngle = -Math.PI / 2;
    } else if (this.player.flipX) {
      // Quay trái
      initialAngle = Math.PI;
      flipX = true;
    } else {
      // Quay phải
      initialAngle = 0;
    }

    rocket.body.setVelocity(
      Math.cos(initialAngle) * ultimateSpeed,
      Math.sin(initialAngle) * ultimateSpeed
    );

    // Thiết lập hướng xoay và flip
    rocket.setFlipX(flipX);

    if (this.cursors.up?.isDown) {
      rocket.rotation = initialAngle;
    } else {
      rocket.rotation = 0; // Đặt ngang
    }

    // Tự hủy sau 2 giây (Chỉ để phòng trường hợp không trúng gì)
    this.time.delayedCall(2000, () => rocket.destroy(), [], this);
  }

  // --- Game Loop ---
  // -------------------------------------------------------------------------
  update(): void {
    // --- 1. KIỂM TRA TRẠNG THÁI CHẶN (BLOCKING STATES) ---
    if (this.isGameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space!) || this.input.activePointer.leftButtonDown()) window.location.reload();
      this.touchControls.resetFrameState();
      return;
    }

    // ✨ XỬ LÝ PHÍM ESC (PAUSE) ✨
    if (Phaser.Input.Keyboard.JustDown(this.escKey) || this.touchControls.justPressed('pause')) {
      this.togglePause(!this.isPaused);
    }

    // Nếu game đang pause, KHÔNG làm gì cả
    if (this.isPaused) {
      this.touchControls.resetFrameState();
      return;
    }
    // ------------------------------------

    // ✨ LOGIC BẬT/TẮT BẢNG CHỈ SỐ (Nút C) ✨
    if (Phaser.Input.Keyboard.JustDown(this.statsKey) || this.touchControls.justPressed('stats')) {
      this.isStatsPanelVisible = !this.isStatsPanelVisible;
      this.statsPanel.setVisible(this.isStatsPanelVisible);

      // Cập nhật ngay khi mở
      if (this.isStatsPanelVisible) {
        this.updateStatsPanel();
        this.physics.pause();
        this.anims.pauseAll();
      } else {
        this.physics.resume();
        this.anims.resumeAll();
      }
    }

    // Thoát khỏi update nếu bảng chỉ số đang mở (để người chơi không di chuyển)
    if (this.isStatsPanelVisible) {
      this.player.setVelocityX(0);
      this.player.anims.stop();
      this.touchControls.resetFrameState();
      return;
    }

    // LOGIC HỒI MANA MỖI GIÂY (60 frames)
    this.manaRegenTimer++;
    if (this.manaRegenTimer >= 60) {
      this.playerMana = Phaser.Math.Clamp(this.playerMana + 1, 0, this.maxMana);
      this.updateManaBar();
      this.manaRegenTimer = 0;
    }
    // ------------------------------------

    // Giảm thời gian hồi chiêu
    if (this.ultimateCooldown > 0) {
      this.ultimateCooldown--;
    }

    // ✨ HIỆU ỨNG PET HỒI MÁU (PET 1) ✨
    if (this.equippedPetKey === 'hp_regen') { // ✨ ĐÃ SỬA: CHỈ CHẠY NẾU ĐƯỢC TRANG BỊ ✨
      this.petRegenTimer++;
      if (this.petRegenTimer >= 300) {
        this.playerHealth = Phaser.Math.Clamp(this.playerHealth + 1, 0, this.MAX_PLAYER_HEALTH);
        this.updatePlayerHealthBar();
        this.petRegenTimer = 0;
      }
    }


    // ✨ LOGIC TẤN CÔNG PET DAMAGE ✨
    if (this.equippedPetKey === 'damage_dps') {
      this.petDamageTimer++;

      // ĐỊNH NGHĨA TẦM TẤN CÔNG (Ví dụ: 300 pixel)
      const ATTACK_RANGE = 380;

      if (this.petDamageTimer >= this.PET_DAMAGE_RATE) {
        // ✨ THAY THẾ findNearestEnemy BẰNG findNearestEnemyInRadius ✨
        const target = this.findNearestEnemyInRadius(
          this.player.x,
          this.player.y,
          ATTACK_RANGE
        );

        if (target) {
          // Tấn công ngay lập tức (instant damage)
          this.applyDamage(null, target, this.PET_BASE_DAMAGE, 0);

          // Hiệu ứng thị giác
          this.currentPetSprite?.setTint(0xff8800);
          this.time.delayedCall(150, () => this.currentPetSprite?.clearTint());
        }
        this.petDamageTimer = 0;
      }
    }

    // Logic theo dõi Pet (VỊ TRÍ ĐẶT ĐÚNG)
    if (this.currentPetSprite) {
      const followDistance = 60;
      const easingFactor = 0.9;
      const targetX = this.player.x + (this.player.flipX ? 50 : -50);
      const dx = targetX - this.currentPetSprite.x;

      if (Math.abs(dx) > followDistance) {
        this.currentPetSprite.body.velocity.x = dx * easingFactor;
      } else {
        this.currentPetSprite.body.velocity.x = 0;
      }
      this.currentPetSprite.setFlipX(!this.player.flipX);
    }
    // ------------------------------------


    // ✨ LỖI ĐÃ SỬA: BỎ DÒNG 'return' (Hoặc di chuyển nó ra khỏi đây nếu cần)
    if (this.isLevelComplete) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space!) || this.input.activePointer.leftButtonDown()) {
        this.startNextLevel();
      }
      this.touchControls.resetFrameState();
      return; // GIỮ LẠI DÒNG NÀY ĐỂ NGĂN CHẶN DI CHUYỂN KHI MÀN HÌNH CHUYỂN VÒNG
    }

    // --- Player Movement (Giữ nguyên) ---

    // KIỂM TRA GAME OVER, DIALOGUE, và LEVEL COMPLETE TRƯỚC PHẦN NÀY

    // 📱 Hỗ trợ cả keyboard và touch controls cho di chuyển
    const moveLeft = this.cursors.left?.isDown || this.touchControls.isDown('left');
    const moveRight = this.cursors.right?.isDown || this.touchControls.isDown('right');
    const doJump = this.cursors.up?.isDown || this.cursors.space?.isDown || this.touchControls.isDown('jump');

    if (moveLeft) {
      this.player.setVelocityX(-460);
      this.player.setFlipX(true);
      this.player.play("leloi-walk-left", true);
    } else if (moveRight) {
      this.player.setVelocityX(460);
      this.player.setFlipX(false);
      this.player.play("leloi-walk-right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.stop();
    }

    if (doJump && this.player.body.blocked.down) {
      this.player.setVelocityY(-400);
    }

    // --- Logic SẠC CUNG THƯỜNG (A) --- 📱 Hỗ trợ touch
    const isAttacking = this.attackKey.isDown || this.touchControls.isDown('attack');
    if (isAttacking) {
      if (!this.isCharging) {
        this.isCharging = true;
        this.chargePower = 0;
      }
      this.chargePower = Phaser.Math.Clamp(this.chargePower + 1, 0, 100);

      // ÁP DỤNG HOẠT ẢNH SẠC CHO NÚT A
      this.updateChargeAnimation(this.chargePower);
    }

    const attackReleased = Phaser.Input.Keyboard.JustUp(this.attackKey) || this.touchControls.justReleased('attack');
    if (attackReleased) {
      if (this.isCharging && this.chargePower >= 30) {
        this.shootArrow(this.chargePower);
      }
      this.isCharging = false;
      this.chargePower = 0;
      this.player.setTexture("leloi1");
    }

    // --- Logic SẠC TUYỆT CHIÊU (S) ---
    // THÊM ĐIỀU KIỆN KIỂM TRA MANA: this.playerMana >= this.ULTIMATE_COST
    const canUseUltimate = this.playerMana >= this.ULTIMATE_COST;
    // ✨ THÊM ĐIỀU KIỆN CẤP ĐỘ 5 ✨
    const canUnlockUltimate = this.playerLevel >= 2;
    //     const isUltimateCharging = this.ultimateKey.isDown && this.ultimateCooldown === 0 && !this.isCharging && canUseUltimate; 

    // PHẢI KIỂM TRA CẤP ĐỘ (canUnlockUltimate) NGAY Ở ĐÂY
    // 📱 Hỗ trợ touch cho Ultimate
    const isUltKeyDown = this.ultimateKey.isDown || this.touchControls.isDown('ultimate');
    const isTryingToCharge = isUltKeyDown && this.ultimateCooldown === 0 && !this.isCharging;

    if (isTryingToCharge && canUnlockUltimate && canUseUltimate) { // ✨ DÙNG isTryingToCharge, canUnlockUltimate VÀ canUseUltimate
      if (!this.isUltimateCharging) {
        this.isUltimateCharging = true;
        this.ultimatePower = 0;
      }
      this.ultimatePower = Phaser.Math.Clamp(this.ultimatePower + 1, 0, 100);

      // ÁP DỤNG HOẠT ẢNH SẠC CHO NÚT S
      this.updateChargeAnimation(this.ultimatePower);

    } else if (isUltKeyDown && !canUnlockUltimate) {
      // Báo hiệu chưa mở khóa (ví dụ: nháy màu xanh dương)
      this.player.setTint(0x00aaff);
      this.showNotification("Bạn cần đạt cấp 2 để sử dụng hỏa tiễn!");
    } else if (isUltKeyDown && !canUseUltimate) {
      // Hiệu ứng báo không đủ mana (Chỉ cần set tint đỏ/nhấp nháy)
      this.player.setTint(0xcc0000);
      this.showNotification("Không đủ Mana!");
    } else if (this.isUltimateCharging && !isUltKeyDown) { // Logic khi nhả nút S (Chỉ khi đang sạc)
      // NHẢ NÚT S
      if (this.ultimatePower >= 50) { // Yêu cầu sạc ít nhất 50%
        this.fireUltimateAttack();
        // TIÊU HAO MANA
        this.playerMana -= this.ULTIMATE_COST;
        this.updateManaBar();
        this.ultimateCooldown = 300; // Hồi chiêu 300 frames (khoảng 5 giây)
      }
      this.isUltimateCharging = false;
      this.ultimatePower = 0;
      this.player.setTexture("leloi1"); // Reset texture
    }

    // SỬA LỖI: Bổ sung điều kiện KHÔNG XÓA TINT khi đang trong trạng thái vô địch
    // Chỉ xóa tint nếu không có sạc nào đang diễn ra VÀ nhân vật không đang trong trạng thái Invincible
    //     if (!isAttacking && !isUltimateCharging && !this.ultimateKey.isDown && !this.isInvincible) {
    //         this.player.clearTint();
    //     }

    // Kích hoạt chiêu Triệu hồi lính (Nút D)
    const canSummonSoldier = this.playerLevel >= 3; // ✨ ĐIỀU KIỆN CẤP ĐỘ 5 ✨

    // 📱 Hỗ trợ touch cho Soldier summon
    if ((Phaser.Input.Keyboard.JustDown(this.soldierKey) || this.touchControls.justPressed('soldier')) && !this.isCharging && !this.isUltimateCharging) {
      if (canSummonSoldier) {
        this.summonSoldier();
      } else {
        // Hiệu ứng báo chưa mở khóa (ví dụ: nháy màu xanh lá)
        this.player.setTint(0x00ff00);
        this.showNotification("Bạn cần đạt cấp 3 để triệu hồi lính!");
        this.time.delayedCall(100, () => this.player.clearTint());
      }
    }
    // ----------------------------------------------------------------------------------


    // --- Cập nhật Charge Bar (Đẩy xuống dưới Mana Bar) ---
    this.chargeBar.clear();
    const chargeBarY = 130; // Vị trí mới, ngay dưới Mana Bar (50+15=65, chọn 70 cho khoảng cách)
    const cooldownBarY = 100;

    if (this.isCharging) {
      this.chargeBar.fillStyle(0x00ff00);
      this.chargeBar.fillRect(16, chargeBarY, this.chargePower * 2, 20);
      this.chargeBar.lineStyle(2, 0xffffff);
      this.chargeBar.strokeRect(16, chargeBarY, 200, 20);
    } else if (this.isUltimateCharging) {
      this.chargeBar.fillStyle(0xffa500); // Màu cam cho Ultimate
      this.chargeBar.fillRect(16, chargeBarY, this.ultimatePower * 2, 20);
      this.chargeBar.lineStyle(2, 0xffffff);
      this.chargeBar.strokeRect(16, chargeBarY, 200, 20);
    }

    // Hiển thị cooldown (tùy chọn)
    if (this.ultimateCooldown > 0) {
      const cooldownText = `ULT CD: ${Math.ceil(this.ultimateCooldown / 60)}`;
      this.chargeBar.fillStyle(0x888888);
      this.chargeBar.fillRect(16, cooldownBarY, 200, 15);
      this.add.text(18, cooldownBarY, cooldownText, { fontSize: '12px', color: '#000000' }).setScrollFactor(0).setDepth(1);
    }
    // --- ENEMY/BOSS MOVEMENT VÀ HOẠT ẢNH (ĐÃ TỔNG HỢP & SỬA LỖI) ---
    this.enemies.getChildren().forEach((target: any) => {
      const enemy = target as GameCharacter;
      if (!enemy || !enemy.active || !enemy.body) return;

      const isBoss = enemy.isBoss;

      // ✨ TÍNH TOÁN TỐC ĐỘ (Chỉ tính 1 lần)
      const bossDamage = isBoss ? (enemy as any).damage : 0;
      const moveSpeed = isBoss ? (100 + bossDamage * 10) : 100;

      if (!enemy.isKnockedBack) {
        if (this.player.x < enemy.x) {
          enemy.setVelocityX(-moveSpeed);
          enemy.setFlipX(false);

          // ✨ CHỌN HOẠT ẢNH ĐÚNG ✨
          if (isBoss) {
            enemy.play("boss-walk-left", true);
          } else {
            enemy.play("enemy-walk-left", true);
          }
        } else {
          enemy.setVelocityX(moveSpeed);
          enemy.setFlipX(true);

          // ✨ CHỌN HOẠT ẢNH ĐÚNG ✨
          if (isBoss) {
            enemy.play("boss-walk-right", true);
          } else {
            enemy.play("enemy-walk-right", true);
          }
        }
      } else {
        enemy.anims.stop();
        if (isBoss) {
          enemy.setTexture("boss1");
        }
      }

      // Cập nhật thanh máu (Giữ nguyên)
      const barWidth = isBoss ? 100 : 40;
      const barHeight = isBoss ? 10 : 5;
      const yOffset = isBoss ? -140 : -120;
      const healthPercent = enemy.health / enemy.maxHealth;

      enemy.healthBar.clear();
      enemy.healthBar.lineStyle(isBoss ? 2 : 1, 0xffffff);
      enemy.healthBar.strokeRect(enemy.x - barWidth / 2, enemy.y + yOffset, barWidth, barHeight);
      enemy.healthBar.fillStyle(0xff0000);
      enemy.healthBar.fillRect(enemy.x - barWidth / 2, enemy.y + yOffset, barWidth * healthPercent, barHeight);
    });

    // Logic cập nhật cho lính (tìm và đuổi theo địch)
    this.soldiers.getChildren().forEach((soldierObj: any) => {
      const soldier = soldierObj as Soldier;
      if (!soldier.active) return;

      // 1. Tìm kẻ địch gần nhất nếu chưa có hoặc kẻ địch đã chết
      if (!soldier.target || !soldier.target.active) {
        soldier.target = this.findNearestEnemy();
      }

      // 2. Nếu tìm thấy mục tiêu, di chuyển về phía đó
      if (soldier.target) {
        const speed = 150; // Tốc độ di chuyển của lính
        const targetX = soldier.target.x;

        // Tính toán khoảng cách (chúng ta dùng 5px làm ngưỡng đứng yên)
        const distanceToTarget = Math.abs(soldier.x - targetX);
        const isCloseEnough = distanceToTarget <= 5;

        if (distanceToTarget > 5) { // Nếu còn xa mục tiêu
          // Di chuyển
          const direction = soldier.x < targetX ? speed : -speed;
          soldier.setVelocityX(direction);
          soldier.setFlipX(direction < 0);

          // ✨ CHẠY HOẠT ẢNH KHI DI CHUYỂN ✨
          soldier.play("soldier-walk", true);
        } else {
          // Đã gần mục tiêu (Đứng yên/Tấn công tại chỗ)
          soldier.setVelocityX(0);

          // ✨ DỪNG HOẠT ẢNH KHI ĐỨNG YÊN ✨
          soldier.anims.stop();
          soldier.setTexture('ls1'); // Khôi phục frame đứng yên
        }

        // Cập nhật thanh máu của lính theo vị trí
        this.updateHealthBar(soldier);
      } else {
        // Nếu không có mục tiêu, lính đứng yên
        soldier.setVelocityX(0);

        // ✨ DỪNG HOẠT ẢNH KHI KHÔNG CÓ MỤC TIÊU ✨
        soldier.anims.stop();
        soldier.setTexture('ls1');
      }
    });
    // ----------------------------------------------------------------------------------

    // 📱 Reset trạng thái touch ở cuối frame
    this.touchControls.resetFrameState();
  }

  // Định nghĩa hàm triệu hồi lính (SỬ DỤNG XU THAY VÌ MANA)
  private summonSoldier(): void {
    // ✨ KIỂM TRA XU THAY VÌ MANA
    if (this.playerCoins < this.SOLDIER_COST) {
      // Báo không đủ Xu
      this.player.setTint(0xffa500); // Màu cam báo thiếu xu
      this.time.delayedCall(100, () => this.player.clearTint());
      return;
    }

    this.playerCoins -= this.SOLDIER_COST;
    this.updateCoinUI(); // Cập nhật hiển thị xu

    // Triệu hồi lính ngay cạnh người chơi, đặt cao hơn mặt đất
    const soldier = this.soldiers.create(
      this.player.x + (this.player.flipX ? -80 : 80),
      this.player.y - 10,
      "soldier"
    ) as Soldier;

    soldier.setOrigin(0.5, 1);
    soldier.setCollideWorldBounds(true);
    soldier.setBounce(0.1);

    // Khởi tạo các thuộc tính lính (giống như Enemy)
    soldier.isBoss = false;
    soldier.damage = this.SOLDIER_DAMAGE;
    soldier.maxHealth = this.SOLDIER_MAX_HEALTH;
    soldier.health = this.SOLDIER_MAX_HEALTH;
    soldier.healthBar = this.add.graphics().setDepth(1); // Tạo Health Bar cho lính



    soldier.target = this.findNearestEnemy(); // Tìm mục tiêu ban đầu

    // Lính tồn tại cho đến khi bị tiêu diệt (không có delayedCall)
  }

  // ✨ ĐỊNH NGHĨA HÀM CẬP NHẬT EXP UI MỚI ✨
  private updateExpUI(): void {
    this.expText.setText(`Cấp ${this.playerLevel} | EXP: ${this.currentExp}/${this.requiredExp}`);
  }
  // ✨ HÀM CẬP NHẬT BẢNG CHỈ SỐ NHÂN VẬT ✨
  private updateStatsPanel(): void {
    if (!this.statsPanel) return;

    // ✨ SỬ DỤNG BIẾN TẠM VÀ KIỂM TRA DATA AN TOÀN TRƯỚC KHI TRUY CẬP ✨
    const statsData = this.statsPanel.data.getAll();

    if (!statsData) return; // Bảo vệ khỏi lỗi destructuring nếu data là undefined/null

    const {
      levelText,
      healthText,
      damageAText,
      damageSText,
      manaText,
      scoreText,
      ultStatus,
      soldierStatus,
    } = statsData;

    // Tính toán sát thương hiển thị
    // Chú ý: Math.floor(X * 10) / 10 là cách làm tròn đến 1 chữ số thập phân.
    const finalArrowDamage = Math.floor(this.baseArrowDamage * 10) / 10;
    const finalUltimateDamage = Math.floor(this.baseUltimateDamage * 10) / 10;

    const healthColor = this.playerHealth <= this.baseMaxHealth / 4 ? '#ff0000' : '#ffffff';

    levelText.setText(`Cấp độ: ${this.playerLevel}`);
    healthText.setText(`Máu: ${Math.floor(this.playerHealth)} / ${Math.floor(this.baseMaxHealth)}`).setColor(healthColor);
    damageAText.setText(`Sát thương (A): ${finalArrowDamage}`);
    damageSText.setText(`Sát thương (S): ${finalUltimateDamage}`);
    manaText.setText(`Mana: ${this.playerMana}`);
    scoreText.setText(`Tổng điểm: ${this.totalScore}`);

    // Cập nhật trạng thái mở khóa
    ultStatus.setText(`Hỏa tiễn (S): ${this.ultimateUnlocked ? 'ĐÃ MỞ KHÓA' : `Cần 2`}`)
      .setColor(this.ultimateUnlocked ? '#ffd700' : '#00aaff');

    soldierStatus.setText(`Triệu hồi (D): ${this.soldierUnlocked ? 'ĐÃ MỞ KHÓA' : `Cần Cấp 3`}`)
      .setColor(this.soldierUnlocked ? '#00ff00' : '#88ff88');
  }


  // ✨ ĐỊNH NGHĨA HÀM KIỂM TRA LÊN CẤP MỚI ✨
  private checkLevelUp(): void {
    while (this.currentExp >= this.requiredExp) {
      // 1. Lên cấp
      const oldLevel = this.playerLevel; // LƯU CẤP ĐỘ CŨ
      this.currentExp -= this.requiredExp;
      this.playerLevel++;

      // 2. Tính EXP yêu cầu cho cấp tiếp theo (Ví dụ: Tăng 50% mỗi cấp)
      this.requiredExp = Math.floor(10 * Math.pow(1.5, this.playerLevel - 1));

      // ✨ LOGIC TĂNG CHỈ SỐ KHI LÊN CẤP ✨
      const levelBonus = 0.5;

      // Tăng MÁU TỐI ĐA (+0.5 Máu)
      this.baseMaxHealth += levelBonus; // Tăng base health


      // Tăng SÁT THƯƠNG A (+0.5 Sát thương)
      this.baseArrowDamage += levelBonus;

      // Tăng SÁT THƯƠNG S (+0.5 Sát thương)
      this.baseUltimateDamage += levelBonus;

      // ✨ SỬA LỖI: HỒI ĐẦY MÁU KHI LÊN CẤP ✨
      this.playerHealth = Math.floor(this.baseMaxHealth);
      this.updatePlayerHealthBar(); // Cập nhật thanh máu sau khi hồi đầy
      // ------------------------------------

      // ✨ CẬP NHẬT BẢNG CHỈ SỐ NGAY KHI LÊN CẤP ✨
      this.updateStatsPanel();

      // 3. Hiển thị thông báo lên cấp
      const message = `LÊN CẤP ${this.playerLevel}!`;
      const playerX = this.player.x;
      const playerY = this.player.y - 450;

      const levelUpText = this.add.text(playerX, playerY, message, {
        fontSize: "38px",
        color: "#ffffff",
        backgroundColor: "#0055ff",
        padding: { x: 10, y: 5 }
      })
        .setOrigin(0.5, 0)
        .setScrollFactor(1)
        .setDepth(999);

      this.time.delayedCall(1500, () => levelUpText.destroy(), [], this);

      // 4. Thêm hiệu ứng/buff (Ví dụ: Hồi đầy máu/mana)
      this.playerHealth = this.MAX_PLAYER_HEALTH;
      this.playerMana = this.maxMana;
      this.updatePlayerHealthBar();
      this.updateManaBar();

      // ✨ 5. LOGIC THÔNG BÁO MỞ KHÓA KỸ NĂNG ✨
      if (this.playerLevel >= 2 && !this.ultimateUnlocked) {
        this.ultimateUnlocked = true;
        // Dùng delayedCall để thông báo hiện sau thông báo lên cấp
        this.time.delayedCall(2000, () => {
          this.showNotification("🚀 Tướng đã có thể sử dụng hỏa tiễn, nhấn S để sử dụng!");
        }, [], this);
      }

      if (this.playerLevel >= 3 && !this.soldierUnlocked) {
        this.soldierUnlocked = true;
        // Dùng delayedCall để thông báo hiện sau thông báo lên cấp
        this.time.delayedCall(2500, () => {
          this.showNotification("🛡️ Tướng quân đã có thể triệu tập quân đội, nhấn D để sử dụng!");
        }, [], this);
      }

    }
    this.updateExpUI();
  }
  // -------------------------------------------------------------------------

  // --- Utility Function: Hiển thị thông báo trên đầu người chơi ---
  // ✨ THAM SỐ MỚI: isPersistent để giữ thông báo không tự hủy ✨
  private showNotification(message: string, isPersistent: boolean = false): void {
    // Hủy thông báo cũ (nếu có) để tránh tràn màn hình
    if (this.playerNotificationText && this.playerNotificationText.active) {
      this.playerNotificationText.destroy();
    }

    const playerX = this.player.x;
    const playerY = this.player.y - 150; // Đặt trên đầu nhân vật

    this.playerNotificationText = this.add.text(
      playerX,
      playerY,
      message,
      {
        fontSize: "40px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 5, y: 3 }
      }
    )
      .setOrigin(0.5, 0)
      .setScrollFactor(1)
      .setDepth(999);

    // ✨ LOGIC MỚI: TỰ HỦY NẾU KHÔNG PHẢI LÀ THÔNG BÁO VĨNH VIỄN ✨
    if (!isPersistent) {
      this.time.delayedCall(1500, () => {
        if (this.playerNotificationText) {
          this.playerNotificationText.destroy();
        }
      }, [], this);
    }
  }
  // ---------------------------------------------------------------
  // ✨ HÀM TẠO BẢNG CHỈ SỐ NHÂN VẬT ✨

  private createStatsPanel(): Phaser.GameObjects.Container {
    const panelWidth = 350;
    const panelHeight = 350;
    const camWidth = this.cameras.main.width;
    const camHeight = this.cameras.main.height;

    // Nền tối trong suốt
    const background = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.8)
      .setOrigin(0.5);

    // Tiêu đề
    const title = this.add.text(0, -130, "✨ CHỈ SỐ ANH HÙNG ✨", {
      fontSize: "24px",
      color: "#ffd700",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Vị trí bắt đầu của các dòng chỉ số
    const startY = -90;
    const lineHeight = 30;

    // Khởi tạo các đối tượng Text cần cập nhật
    const levelText = this.add.text(-150, startY, "Cấp độ: 1", { fontSize: "18px", color: "#ffffff" }).setOrigin(0, 0.5);
    const healthText = this.add.text(-150, startY + lineHeight * 1, "Máu: 5 / 5", { fontSize: "18px", color: "#ffffff" }).setOrigin(0, 0.5);
    const damageAText = this.add.text(-150, startY + lineHeight * 2, "Sát thương (A): 1.0", { fontSize: "18px", color: "#ffffff" }).setOrigin(0, 0.5);
    const damageSText = this.add.text(-150, startY + lineHeight * 3, "Sát thương (S): 5.0", { fontSize: "18px", color: "#ffffff" }).setOrigin(0, 0.5);
    const manaText = this.add.text(-150, startY + lineHeight * 4, "Mana: 100", { fontSize: "18px", color: "#ffffff" }).setOrigin(0, 0.5);
    const scoreText = this.add.text(-150, startY + lineHeight * 5, "Tổng điểm: 0", { fontSize: "18px", color: "#ffffff" }).setOrigin(0, 0.5);

    // Ghi chú mở khóa
    const ultStatus = this.add.text(-150, startY + lineHeight * 7, "Hỏa tiễn (S): Cấp 2", { fontSize: "16px", color: "#00aaff" }).setOrigin(0, 0.5);
    const soldierStatus = this.add.text(-150, startY + lineHeight * 8, "Triệu hồi (D): 3", { fontSize: "16px", color: "#00ff00" }).setOrigin(0, 0.5);

    // Nút đóng (X)
    const closeBtn = this.add.text(0, panelHeight / 2 - 20, "( Chạm bất kỳ đâu để đóng )", {
      fontSize: "14px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    // Tạo Container
    const panel = this.add.container(camWidth / 2, camHeight / 2, [
      background,
      title,
      levelText,
      healthText,
      damageAText,
      damageSText,
      manaText,
      scoreText,
      ultStatus,
      soldierStatus,
      closeBtn,
    ]);

    // Lưu các đối tượng Text vào data của Container để dễ dàng cập nhật
    panel.setData({
      levelText: levelText,
      healthText: healthText,
      damageAText: damageAText,
      damageSText: damageSText,
      manaText: manaText,
      scoreText: scoreText,
      ultStatus: ultStatus,
      soldierStatus: soldierStatus,
    });

    panel.setScrollFactor(0); // Luôn cố định trên màn hình
    panel.setDepth(1000); // Đảm bảo hiển thị trên tất cả các UI khác
    panel.setVisible(false); // Ẩn mặc định
    return panel;
  }

  // ✨ HÀM TẠO MENU TẠM DỪNG (PAUSE MENU) ✨
  private createPauseMenu(): Phaser.GameObjects.Container {
    const camWidth = this.cameras.main.width;
    const camHeight = this.cameras.main.height;

    // Nền tối mờ toàn màn hình
    const overlay = this.add.rectangle(0, 0, camWidth, camHeight, 0x000000, 0.7)
      .setOrigin(0);

    // Bảng chính
    const panel = this.add.rectangle(camWidth / 2, camHeight / 2, 400, 300, 0x333333, 0.9)
      .setOrigin(0.5).setStrokeStyle(3, 0xffd700);

    // Tiêu đề
    const title = this.add.text(camWidth / 2, camHeight / 2 - 100, "TRÒ CHƠI ĐÃ DỪNG", {
      fontSize: "30px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Tạo các nút
    const buttonStyle = { fontSize: "22px", color: "#ffffff", backgroundColor: "#555555" };
    const buttonSpacing = 60;

    // 1. Tiếp tục
    const resumeBtn = this.add.text(camWidth / 2, camHeight / 2 - buttonSpacing / 2, "Tiếp tục", buttonStyle).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause(false));

    // 2. Quay về Sảnh (Lobby)
    const lobbyBtn = this.add.text(camWidth / 2, camHeight / 2 + buttonSpacing / 2, "Quay về Sảnh (Lobby)", buttonStyle).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goToLobby());

    // 3. Quay về Menu Chính
    const menuBtn = this.add.text(camWidth / 2, camHeight / 2 + buttonSpacing / 2 * 3, "Quay về Menu Chính", buttonStyle).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goToMainMenu());

    const container = this.add.container(0, 0, [
      overlay, panel, title, resumeBtn, lobbyBtn, menuBtn
    ]);

    // Nếu các nút KHÔNG nằm trong Container:
    resumeBtn.setScrollFactor(0);
    lobbyBtn.setScrollFactor(0);
    menuBtn.setScrollFactor(0);
    // VÀ
    overlay.setScrollFactor(0);
    panel.setScrollFactor(0);
    title.setScrollFactor(0);

    container.setScrollFactor(0); // Cố định trên màn hình
    container.setDepth(2000); // Rất cao để đè lên mọi thứ
    container.setVisible(false); // Ẩn mặc định
    return container;
  }

  // ✨ HÀM XỬ LÝ TRẠNG THÁI TẠM DỪNG (Đã sửa lỗi Uncaught TypeError) ✨
  private togglePause(shouldPause: boolean): void {
    if (this.isPaused === shouldPause) return; // Tránh gọi lại

    this.isPaused = shouldPause;

    // 1. Dừng/Chạy lại PHYSICS WORLD
    this.physics.world.isPaused = shouldPause;

    // 2. Dừng/Chạy lại GAME TIME bằng cách set thuộc tính 'paused'
    // Đây là cách đúng để dừng toàn bộ Scene time trong Phaser 3.
    this.time.paused = shouldPause;

    // 3. Hiển thị/Ẩn menu
    if (this.pausePanel) {
      this.pausePanel.setVisible(shouldPause);
    }
  }

  // ✨ HÀM CHUYỂN SCENE SANG LOBBY (GIỮ DỮ LIỆU) ✨
  private goToLobby(): void {
    this.togglePause(false); // Đảm bảo game không còn pause

    // LƯU TRỮ DỮ LIỆU CẦN THIẾT
    const saveData = {
      playerLevel: this.playerLevel,
      totalScore: this.totalScore,    // ĐIỂM
      playerCoins: this.playerCoins,  // ✨ PHẢI TRUYỀN XU ĐI ✨
      currentExp: this.currentExp,
      requiredExp: this.requiredExp,
    };

    // Dừng scene hiện tại và khởi động scene Lobby, truyền dữ liệu
    this.touchControls.destroy(); // 📱 Dọn dẹp touch controls
    this.scene.stop('GameScene');
    this.scene.start('Lobby', saveData); // Khởi động LobbyScene và truyền saveData
  }

  // ✨ HÀM CHUYỂN VỀ MENU CHÍNH ✨
  private goToMainMenu(): void {
    this.togglePause(false);
    this.touchControls.destroy(); // 📱 Dọn dẹp touch controls
    this.scene.stop('GameScene');
    this.scene.start('MainMenu'); // Quay về Menu chính
  }

  // ✨ THÊM HÀM INIT VÀ XỬ LÝ DỮ LIỆU KHỞI TẠO ✨
  // Trong GameScene.ts

  // ✨ HÀM KHỞI TẠO VÀ NHẬN DỮ LIỆU TỪ LOBBY/SCENE TRƯỚC ✨
  // Trong GameScene.ts -> init(data: any)

  init(data: any) {
    // 1. Luôn đặt giá trị mặc định cho trường hợp không có dữ liệu
    this.playerLevel = 1;
    this.totalScore = 0;
    this.currentExp = 0;
    this.requiredExp = 10;

    // ✨ KHAI BÁO VÀ RESET BIẾN playerCoins ✨
    this.playerCoins = 0; // Đặt mặc định cho Xu (playerCoins)

    // 2. Nếu có dữ liệu được truyền từ Scene trước (LobbyScene), HÃY GHI ĐÈ
    if (data) {
      // ✨ NHẬN TRẠNG THÁI SỞ HỮU PET ✨
      if (data && data.petOwned) {
        this.petOwned = data.petOwned;

        // ✨ DÒNG SỬA LỖI: LƯU TRỮ KEY PET ĐANG ĐƯỢC TRANG BỊ ✨
        this.equippedPetKey = data.equippedPetKey || 'none'; // Lấy key từ LobbyScene
      }

      this.playerLevel = data.playerLevel || 1;
      this.totalScore = data.totalScore || 0;

      // ✨ DÒNG KHẮC PHỤC CHÍNH: NHẬN VÀ CẬP NHẬT playerCoins ✨
      this.playerCoins = data.playerCoins || 0;

      this.currentExp = data.currentExp || 0;
      this.requiredExp = data.requiredExp || 10;
    }

    // [Tùy chọn] Gọi updateCoinUI() ở đây nếu bạn muốn cập nhật hiển thị ngay lập tức
  }

  // Trong GameScene.ts, hàm private stopCoinMovement:

  private stopCoinMovement(coinObj: any, groundObj: any): void {
    const coin = coinObj as Coin;

    // Đảm bảo coin vẫn đang hoạt động và đang chạm đất
    if (coin.active && coin.body.blocked.down) {
      // Dừng mọi vận tốc
      coin.setVelocity(0, 0);
      coin.setAngularVelocity(0);

      // Vô hiệu hóa ảnh hưởng của lực bên ngoài
      coin.setImmovable(false);

      // Ngăn chặn đồng xu bị đẩy bởi Player hoặc vật thể khác
      // ✨ SỬA LỖI: DÙNG THUỘC TÍNH .pushable = false ✨
      (coin.body as Phaser.Physics.Arcade.Body).pushable = false;
      // -----------------------------------------------------
    }
  }

  private displayPet(): void {
    // 1. Nếu Pet đang hiển thị, hủy nó đi
    if (this.currentPetSprite) {
      this.currentPetSprite.destroy();
      this.currentPetSprite = null;
    }

    let petKey: string | null = null;
    let animationKey: string | null = null;

    // ✨ DÒNG SỬA LỖI CHÍNH: SỬ DỤNG KEY PET ĐANG ĐƯỢC TRANG BỊ ✨
    const equippedKey = this.equippedPetKey; // Sử dụng biến đã được gán trong init(data)

    if (equippedKey === 'damage_dps') {
      petKey = 'pet_damage1';
      animationKey = 'pet-damage-idle';
    }
    else if (equippedKey === 'hp_regen') {
      petKey = 'pet_heal1';
      animationKey = 'pet-heal-idle';
    }
    else if (equippedKey === 'coin_collect') {
      petKey = 'pet_coin';
      animationKey = null;
    }

    // Lưu ý: Nếu equippedKey là 'none' (chưa chọn Pet nào) thì petKey vẫn là null.

    if (petKey) {
      // Đảm bảo this.player và this.ground đã được khởi tạo
      if (!this.player || !this.ground) {
        console.error("Lỗi: Player hoặc Ground chưa được khởi tạo!");
        return;
      }

      // 2. Tạo Pet Sprite mới
      // Vị trí: Đặt hơi lùi về phía sau player (-50) và thấp hơn (dưới -50 so với player.y)
      this.currentPetSprite = this.physics.add.sprite(this.player.x - 50, this.player.y, petKey) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

      this.currentPetSprite.setOrigin(0.5, 1);
      this.currentPetSprite.body.allowGravity = true;
      this.physics.add.collider(this.currentPetSprite, this.ground);
      this.currentPetSprite.setScale(0.8);

      // 3. CHẠY HOẠT ẢNH NẾU CÓ
      if (animationKey) {
        this.currentPetSprite.play(animationKey!, true);
      }
    }
  }

  // Trong GameScene.ts (Thêm hàm này)

  private findNearestEnemyInRadius(x: number, y: number, radius: number): GameCharacter | null {
    let nearestEnemy: GameCharacter | null = null;
    let minDistance = Infinity;

    this.enemies.getChildren().forEach((enemy: any) => {
      const char = enemy as GameCharacter;
      if (char.active) {
        const distance = Phaser.Math.Distance.Between(x, y, char.x, char.y);

        // CHỈ XÉT KẺ ĐỊCH NẰM TRONG PHẠM VI
        if (distance < radius) {
          if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = char;
          }
        }
      }
    });

    return nearestEnemy;
  }

  private createRespawnPanel(): Phaser.GameObjects.Container {
    const camWidth = this.cameras.main.width;
    const camHeight = this.cameras.main.height;

    // 1. Nền mờ đè lên Game Over
    const overlay = this.add.rectangle(0, 0, camWidth, camHeight, 0x000000, 0.9)
      .setOrigin(0);

    // 2. Panel chính
    const panel = this.add.rectangle(0, 0, 450, 250, 0x1a1a1a, 1)
      .setOrigin(0.5).setStrokeStyle(4, 0xffd700);

    // 3. Tiêu đề
    const title = this.add.text(0, -90, "TƯỚNG QUÂN ĐÃ NGÃ XUỐNG", {
      fontSize: "28px",
      color: "#ff3333",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // 4. Lựa chọn
    const prompt = this.add.text(0, -30, "Xem quảng cáo để hồi sinh và tiếp tục chiến đấu?", {
      fontSize: "20px",
      color: "#ffffff",
      align: 'center'
    }).setOrigin(0.5);

    // 5. Nút CHẤP NHẬN (Yes)
    const yesBtn = this.add.text(-100, 50, "✅ CHẤP NHẬN (Y)", {
      fontSize: "24px",
      color: "#00ff00",
      backgroundColor: "#222222",
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleAdRespawn(true));

    // 6. Nút TỪ CHỐI (No)
    const noBtn = this.add.text(100, 50, "❌ TỪ CHỐI (N)", {
      fontSize: "24px",
      color: "#ff0000",
      backgroundColor: "#222222",
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleAdRespawn(false));

    const container = this.add.container(camWidth / 2, camHeight / 2, [
      overlay, panel, title, prompt, yesBtn, noBtn
    ]);

    container.setScrollFactor(0);
    container.setDepth(3000);
    container.setVisible(false);
    return container;
  }

  private handleAdRespawn(accepted: boolean): void {
    const YOUTUBE_AD_LINK = "https://www.youtube.com/watch?v=Bx9S5d1Us-I"; // ✨ THAY THẾ BẰNG LINK QUẢNG CÁO CỦA BẠN ✨

    // Dọn dẹp listener phím Y/N
    this.input.keyboard!.off('keydown-Y');
    this.input.keyboard!.off('keydown-N');

    this.isOfferingRespawn = false;
    this.physics.world.isPaused = false;

    if (this.playerNotificationText) {
      this.playerNotificationText.destroy();
    }

    if (accepted) {
      // ✨ BƯỚC MỚI: MỞ CỬA SỔ QUẢNG CÁO MÔ PHỎNG ✨
      const adWindow = window.open(YOUTUBE_AD_LINK, "_blank"); // Mở tab mới

      this.showNotification(`Đang xem quảng cáo...`, true);
      this.player.body.enable = false; // Chặn input và di chuyển

      this.time.delayedCall(this.AD_DURATION * 1000, () => {

        // Đóng cửa sổ quảng cáo (Nếu có thể, tùy thuộc vào trình duyệt)
        if (adWindow) {
          adWindow.close();
        }

        this.respawnPlayer(); // Hồi sinh sau khi "xem xong"
      }, [], this);

    } else {
      // Nếu TỪ CHỐI, kết thúc Game Over
      this.gameOver();
    }
  }

  // Hàm hồi sinh thực tế (KHÔNG reset điểm/xu)
  private respawnPlayer(): void {
    this.isGameOver = false; // Tắt cờ Game Over
    this.player.clearTint();
    this.player.body.enable = true; // Bật lại di chuyển

    // Hồi lại máu
    // Sử dụng baseMaxHealth đã tăng theo Level
    this.playerHealth = Math.floor(this.baseMaxHealth);
    this.updatePlayerHealthBar();

    // Hồi lại mana
    this.playerMana = this.maxMana;
    this.updateManaBar();

    // Thiết lập lại vị trí an toàn (hoặc giữ nguyên nếu bạn muốn hồi sinh tại chỗ chết)
    // this.player.setPosition(this.player.x, this.player.y - 100); 

    this.showNotification("✨ Hồi sinh thành công!");

    // Đảm bảo không còn vô địch nếu đang ở trạng thái đó
    this.isInvincible = false;
  }

  // Hàm kết thúc trò chơi (Nếu từ chối quảng cáo hoặc không có quảng cáo)
  private gameOver(): void {
    this.player.body.enable = false; // Dừng hoàn toàn
    this.isGameOver = true;

    const gameOverMessage = `Game Over!\nTổng điểm: ${this.totalScore}\nXu kiếm được: ${this.playerCoins}\nNhấn SPACE để chơi lại`;

    this.gameOverText = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        gameOverMessage,
        {
          fontSize: "40px",
          color: "#ffffff",
          backgroundColor: "#000000",
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3000); // Đảm bảo hiển thị trên mọi thứ
  }

}