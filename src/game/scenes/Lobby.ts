import { Scene } from "phaser";
import GameScene from "./Game";

export default class LobbyScene extends Scene {
    // Nhân vật chính
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    // ✨ THÊM BIẾN LƯU TRỮ NHẠC NỀN ✨
    private bgMusic!: Phaser.Sound.BaseSound;

    // ✨ THÊM BIẾN LƯU DỮ LIỆU GAMESTATE ✨
    private playerLevel: number = 1;
    private totalScore: number = 0;
    private expData: any = {}; // Lưu trữ EXP chi tiết (currentExp, requiredExp)

    // ✨ KHAI BÁO: Thêm ground group
    private ground!: Phaser.Physics.Arcade.StaticGroup;

    // NPC và tương tác
    private npcQuest!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private npcShop!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    // UI Dialogue
    private dialogueText!: Phaser.GameObjects.Text;
    private dialogueBox!: Phaser.GameObjects.Rectangle;
    private promptText!: Phaser.GameObjects.Text;
    private interactionPrompt!: Phaser.GameObjects.Text;

    // ✨ KHAI BÁO: Biến lưu trữ tên NPC
    private dinhLeNameText!: Phaser.GameObjects.Text;
    private nguyenXiNameText!: Phaser.GameObjects.Text; // ✨ THÊM TÊN NGUYỄN XÍ

    // Trạng thái game
    private isInDialogue: boolean = false;
    private interactionKey!: Phaser.Input.Keyboard.Key;
    private jumpKey!: Phaser.Input.Keyboard.Key;

    constructor() {
        super("Lobby");
    }

    preload(): void {

        // ✨ ĐẢM BẢO NHẠC NỀN ĐƯỢC TẢI (ĐÃ SỬA ĐƯỜNG DẪN) ✨
        this.load.audio('bgMusic', '../assets/ms_1.mp3'); 

        // --- Frames Lê Lợi --- (Giữ nguyên)
        this.load.image('leloi1', '../assets/lt1.png');
        this.load.image('leloi2', '../assets/lt2.png');
        this.load.image('leloi3', '../assets/lt3.png');
        this.load.image('leloi4', '../assets/lt4.png');
        this.load.image('leloi5', '../assets/lt5.png');
        this.load.image('leloi6', '../assets/lt6.png');
        this.load.image('leloi7', '../assets/lt7.png');

        // --- Hiệu ứng kéo cung (Giữ nguyên) ---
        this.load.image('bancung1', '../assets/bancung_1.png');
        this.load.image('bancung2', '../assets/bancung_2.png');
        this.load.image('bancung3', '../assets/bancung_3.png');

        // ✨ Tải Frames Đinh Lễ (Giữ nguyên)
        this.load.image('dinhle1', '../assets/dl1.png');
        this.load.image('dinhle2', '../assets/dl2.png');
        this.load.image('dinhle3', '../assets/dl3.png');
        this.load.image('dinhle4', '../assets/dl4.png');
        this.load.image('dinhle5', '../assets/dl5.png');

        // ✨ THÊM: Tải Frames Nguyễn Xí
        this.load.image('nx1', '../assets/nx1.png');
        this.load.image('nx2', '../assets/nx2.png');
        this.load.image('nx3', '../assets/nx3.png');
        this.load.image('nx4', '../assets/nx4.png');
        this.load.image('nx5', '../assets/nx5.png');

        // NPC và Ground (Giữ nguyên)
        this.load.image("npcQuest", "assets/npc.png");
        this.load.image("npcShop", "assets/enemy1.png");
        this.load.image("background", "assets/bg_1.png");
        this.load.image("ground", "assets/ground_2.png");
    }

    create(): void {
        const camWidth = this.cameras.main.width;
        const camHeight = this.cameras.main.height;
        // ✨ THÊM UI HIỂN THỊ CHỈ SỐ ĐÃ LƯU ✨
        this.add.text(
            camWidth / 2,
            30, // Đặt ở vị trí cao
            `Level: ${this.playerLevel} | Xu: ${this.totalScore}`,
            { fontSize: '24px', color: '#ffcc00', backgroundColor: '#000000', padding: { x: 10, y: 5 } }
        ).setOrigin(0.5, 0);
        // ------------------------------------

         // ✨ LOGIC PHÁT NHẠC (Đã sửa lỗi tạo đối tượng lặp lại) ✨
    // 1. Dùng get() để lấy instance âm thanh nếu nó đã được tạo
    this.bgMusic = this.sound.get('bgMusic'); 

    if (!this.bgMusic) {
        // 2. Nếu chưa có, tạo nó (và nó sẽ được lưu trong Sound Manager)
        this.bgMusic = this.sound.add('bgMusic', { volume: 0.4, loop: true });
    }
    
    // 3. Chỉ phát nếu nó chưa chạy
    if (!this.bgMusic.isPlaying) {
        this.bgMusic.play();
    }
    // ------------------------------------

        // 1. Thêm nền
        this.add.tileSprite(0, 0, camWidth, camHeight, 'background')
            .setOrigin(0, 0).setScrollFactor(0);

        // 2. TẠO GROUND 
        this.ground = this.physics.add.staticGroup();
        const GROUND_Y_POS = 850;
        this.ground.create(camWidth / 2, GROUND_Y_POS, "ground").setScale(10, 7).refreshBody();

        // VỊ TRÍ Y ĐỨNG
        const playerStartY = 650;
        const npcStartY = 780;

        // 3. THÊM HOẠT ẢNH
        this.anims.create({
            key: "leloi-walk-left",
            frames: [
                { key: "leloi1" }, { key: "leloi2" }, { key: "leloi3" }, { key: "leloi4" },
                { key: "leloi5" }, { key: "leloi6" }, { key: "leloi7" },
            ],
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "leloi-walk-right",
            frames: [
                { key: "leloi1" }, { key: "leloi2" }, { key: "leloi3" }, { key: "leloi4" },
                { key: "leloi5" }, { key: "leloi6" }, { key: "leloi7" },
            ],
            frameRate: 10,
            repeat: -1,
        });

        // HOẠT ẢNH ĐINH LỄ
        this.anims.create({
            key: "dinhle-idle",
            frames: [
                { key: "dinhle1" }, { key: "dinhle2" }, { key: "dinhle3" },
                { key: "dinhle4" }, { key: "dinhle5" },
            ],
            frameRate: 1,
            repeat: -1,
        });

        // ✨ HOẠT ẢNH NGUYỄN XÍ (ĐÃ SỬA FRAME RATE)
        this.anims.create({
            key: "nguyenxi-idle",
            frames: [
                { key: "nx1" }, { key: "nx2" }, { key: "nx3" },
                { key: "nx4" }, { key: "nx5" },
            ],
            frameRate: 1, // ✨ ĐÃ SỬA: Giảm tốc độ hoạt ảnh
            repeat: -1,
        });
        // -----------------------------------------------------

        // 4. Thêm Nhân Vật Chính (Player)
        this.player = this.physics.add.sprite(
            150,
            playerStartY,
            'leloi1'
        ).setOrigin(0.5, 1).setCollideWorldBounds(true);
        this.player.body.allowGravity = true;
        this.player.setBounce(0.1);
        this.player.body.setSize(this.player.width * 0.5, this.player.height);

        // 5. Thêm NPC và Vật lý
        // NPC QUEST (Đinh Lễ)
        this.npcQuest = this.physics.add.sprite(
            camWidth - 150,
            npcStartY,
            "dinhle1"
        ).setOrigin(0.5, 1).setImmovable(true);
        this.npcQuest.body.allowGravity = false;
        this.npcQuest.play("dinhle-idle", true);

        // Thêm tên "Đinh Lễ"
        this.dinhLeNameText = this.add.text(
            this.npcQuest.x,
            this.npcQuest.y - this.npcQuest.height - 10,
            "Đinh Lễ",
            { fontSize: '18px', color: '#ffdd00', backgroundColor: '#000000', padding: { x: 5, y: 2 } }
        ).setOrigin(0.5);


        // NPC SHOP (Nguyễn Xí)
        this.npcShop = this.physics.add.sprite(
            camWidth / 2,
            npcStartY,
            "nx1"
        ).setOrigin(0.5, 1).setImmovable(true);
        this.npcShop.body.allowGravity = false;

        // ÁP DỤNG: Phát hoạt ảnh đứng yên cho NPC Shop
        this.npcShop.play("nguyenxi-idle", true);

        // THÊM: Tạo tên "Nguyễn Xí"
        this.nguyenXiNameText = this.add.text(
            this.npcShop.x,
            this.npcShop.y - this.npcShop.height - 10,
            "Nguyễn Xí",
            { fontSize: '18px', color: '#ffdd00', backgroundColor: '#000000', padding: { x: 5, y: 2 } }
        ).setOrigin(0.5);

        // 6. Thêm Collider
        this.physics.add.collider(this.player, this.ground);

        // 7. Thiết lập Input (Giữ nguyên)
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.interactionKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.input.keyboard!.on("keydown-Y", this.handleYes, this);
        this.input.keyboard!.on("keydown-N", this.handleNo, this);

        // 8. Thiết lập UI (Dialogue) (Giữ nguyên)
        const dialogueY = camHeight - 100;
        const dialogueTextY = camHeight - 150;
        const promptTextY = camHeight - 40;

        this.dialogueBox = this.add
            .rectangle(camWidth / 2, dialogueY, 700, 120, 0x000000, 0.7)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(10)
            .setVisible(false);

        this.dialogueText = this.add
            .text(camWidth / 2 - 320, dialogueTextY, "", {
                fontSize: "20px",
                color: "#ffffff",
                wordWrap: { width: 640 }
            })
            .setScrollFactor(0)
            .setDepth(10)
            .setVisible(false);

        this.promptText = this.add.text(
            camWidth / 2,
            promptTextY,
            "Sẵn sàng? (Y/N)",
            { fontSize: '24px', color: '#ffff00', backgroundColor: '#000000' }
        ).setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(10)
            .setVisible(false);

        // Cập nhật UI PROMPT: Hiển thị phím X 
        this.interactionPrompt = this.add.text(
            this.npcQuest.x,
            this.npcQuest.y - this.npcQuest.height / 2 + 20,
            "**[X] Tương tác**",
            { fontSize: '18px', color: '#ffffff', backgroundColor: '#000000' }
        ).setOrigin(0.5).setVisible(false);

        // 9. Va chạm giữa Player/NPC (Giữ nguyên)
        this.physics.add.collider(this.player, this.npcQuest);
        this.physics.add.collider(this.player, this.npcShop);
    }

    update(): void {
        // CẬP NHẬT: Giữ tên NPC di chuyển theo NPC
        this.dinhLeNameText.x = this.npcQuest.x;
        this.dinhLeNameText.y = this.npcQuest.y - this.npcQuest.height - 10;

        this.nguyenXiNameText.x = this.npcShop.x;
        this.nguyenXiNameText.y = this.npcShop.y - this.npcShop.height - 10;

        if (this.isInDialogue) {
            this.player.body.setVelocityX(0);
            this.player.anims.stop();
            return;
        }

        this.handlePlayerMovement();
        this.handleNPCInteraction();
    }

    // Hàm xử lý di chuyển nhân vật chính (Giữ nguyên)
    private handlePlayerMovement(): void {
        const speed = 300;

        this.player.body.setVelocityX(0);

        const isOnGround = this.player.body.blocked.down;

        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
            this.player.setFlipX(true);
            if (isOnGround) {
                this.player.play("leloi-walk-left", true);
            }
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
            this.player.setFlipX(false);
            if (isOnGround) {
                this.player.play("leloi-walk-right", true);
            }
        } else {
            this.player.body.setVelocityX(0);
            if (isOnGround) {
                this.player.anims.stop();
                this.player.setTexture('leloi1');
            }
        }

        // Dùng phím SPACE (this.jumpKey) để nhảy
        if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && isOnGround) {
            this.player.setVelocityY(-400);
        }

        // Animation nhảy (Tạm thời dùng texture đứng yên nếu không có animation nhảy)
        if (!isOnGround) {
            this.player.anims.stop();
        }
    }

    // Hàm xử lý tương tác với NPC (Giữ nguyên)
    private handleNPCInteraction(): void {
        // Mở rộng khu vực tương tác để bao gồm cả NPC Shop, nếu cần

        const distanceToQuestNPC = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.npcQuest.x,
            this.npcQuest.y
        );

        const distanceToShopNPC = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.npcShop.x,
            this.npcShop.y
        );

        const interactionDistance = 150;

        let targetNPC: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
        let isNearNPC = false;

        if (distanceToQuestNPC < interactionDistance) {
            targetNPC = this.npcQuest;
            isNearNPC = true;
        } else if (distanceToShopNPC < interactionDistance) {
            targetNPC = this.npcShop;
            isNearNPC = true;
        }

        if (isNearNPC && targetNPC) {
            // Cập nhật vị trí hiển thị của prompt tương tác
            this.interactionPrompt.x = targetNPC.x;
            this.interactionPrompt.y = targetNPC.y - targetNPC.height - 40;
            this.interactionPrompt.setVisible(true);

            // Kiểm tra phím X (this.interactionKey)
            if (Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
                // Ta có thể thêm logic kiểm tra NPC nào đang được tương tác ở đây
                if (targetNPC === this.npcQuest) {
                    this.startDialogue();
                } else if (targetNPC === this.npcShop) {
                    // TODO: Thêm logic mở Shop khi tương tác với Nguyễn Xí
                    this.nguyenXiNameText.setText("Chào tướng quân! Shop hiện chưa mở.");
                    this.dinhLeNameText.setVisible(true);
                    this.time.delayedCall(1500, () => this.dinhLeNameText.setText("Đinh Lễ"), [], this);
                }
            }
        } else {
            this.interactionPrompt.setVisible(false);
        }
    }

    // Hàm bắt đầu hội thoại (Chỉ dành cho NPC Quest - Đinh Lễ)
    private startDialogue(): void {
        this.isInDialogue = true;
        this.interactionPrompt.setVisible(false);
        this.dialogueBox.setVisible(true);
        this.dialogueText.setVisible(true);
        this.promptText.setVisible(true);
        this.dinhLeNameText.setVisible(false);
        this.nguyenXiNameText.setVisible(false); // Ẩn tên Nguyễn Xí khi đối thoại

        this.dialogueText.setText("Tướng quân, người đã sẵn sàng dẫn quân ra trận chưa? [N] Chưa/ [Y] Vô trận");
    }

    // Xử lý khi người chơi nhấn YES (Giữ nguyên)
    private handleYes(): void {
        if (!this.isInDialogue) return;

        this.endDialogue();

        // ✨ TRUYỀN LẠI DỮ LIỆU GAMESTATE VÀO GAME SCENE ✨
        const gameDataToPass = {
            playerLevel: this.playerLevel,
            totalScore: this.totalScore,
            currentExp: this.expData.currentExp,
            requiredExp: this.expData.requiredExp,
            // Thêm các dữ liệu khác nếu bạn cần
        };
        this.scene.start("Game"); // Chuyển sang GameScene
    }

    // Xử lý khi người chơi nhấn NO (Giữ nguyên)
    private handleNo(): void {
        if (!this.isInDialogue) return;

        this.dialogueText.setText("Hãy chuẩn bị kỹ càng rồi quay lại đây nhé.");
        this.promptText.setVisible(false);
        this.time.delayedCall(2000, this.endDialogue, [], this);
    }

    // Kết thúc hội thoại (Giữ nguyên)
    private endDialogue(): void {
        this.isInDialogue = false;
        this.dialogueBox.setVisible(false);
        this.dialogueText.setVisible(false);
        this.promptText.setVisible(false);
        // Hiển thị lại tên NPC sau khi kết thúc đối thoại
        this.dinhLeNameText.setVisible(true);
        this.nguyenXiNameText.setVisible(true);
    }
    // ✨ INIT LÀ HÀM NHẬN DỮ LIỆU TRUYỀN TỪ SCENE TRƯỚC ✨
    init(data: any) {
        // Kiểm tra xem dữ liệu có được truyền không
        if (data && data.playerLevel !== undefined) {
            this.playerLevel = data.playerLevel;
            this.totalScore = data.totalScore || 0;
            this.expData = {
                currentExp: data.currentExp || 0,
                requiredExp: data.requiredExp || 10
            };
            console.log("Dữ liệu Level/Xu đã được giữ lại trong Lobby:", data);
        }
    }
}