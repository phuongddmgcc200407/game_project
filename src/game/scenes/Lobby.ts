import { Scene } from "phaser";
import GameScene from "./Game";
import TouchControls from "../TouchControls";

export default class LobbyScene extends Scene {
    private touchControls!: TouchControls;
    // Nhân vật chính
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    // ✨ KHAI BÁO BIẾN MỚI: NPC HỎI ĐÁP VÀ TRẠNG THÁI QUIZ ✨
    private npcQuiz!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private quizNameText!: Phaser.GameObjects.Text;
    private isQuizActive: boolean = false;
    private currentQuestionIndex: number = 0;
    private readonly COIN_REWARD_PER_QUESTION: number = 20;
    private uiTextLevelCoin!: Phaser.GameObjects.Text;

    // ✨ BIẾN MỚI: Theo dõi việc hoàn thành Quiz ✨
    private hasCompletedQuiz: boolean = false;

    // Các phím đáp án
    // private keyA!: Phaser.Input.Keyboard.Key;
    // private keyB!: Phaser.Input.Keyboard.Key;

    private readonly quizQuestions = [
        {
            question: "1/10: Ai là người lãnh đạo cuộc khởi nghĩa Lam Sơn?",
            options: "A. Nguyễn Trãi / B. Lê Lợi",
            correctAnswer: 'B'
        },
        {
            question: "2/10: Khởi nghĩa Lam Sơn diễn ra vào thế kỷ nào?",
            options: "A. Thế kỷ XIV / B. Thế kỷ XV",
            correctAnswer: 'B'
        },
        {
            question: "3/10: Địa danh nào được Lê Lợi dùng làm căn cứ đầu tiên?",
            options: "A. Chi Lăng / B. Lam Sơn",
            correctAnswer: 'B'
        },
        {
            question: "4/10: Nguyễn Trãi dâng Bình Ngô Sách vào thời điểm nào?",
            options: "A. Khi mới bắt đầu khởi nghĩa / B. Sau khi khởi nghĩa thành công",
            correctAnswer: 'A'
        },
        {
            question: "5/10: Ai là người hiến kế 'đổi họ' cho Lê Lợi để bảo toàn lực lượng?",
            options: "A. Lê Lai / B. Lê Thạch",
            correctAnswer: 'A'
        },
        {
            question: "6/10: Tướng giặc nào bị chém đầu trong trận Chi Lăng – Xương Giang?",
            options: "A. Vương Thông / B. Liễu Thăng",
            correctAnswer: 'B'
        },
        {
            question: "7/10: Sự kiện nào đánh dấu thắng lợi hoàn toàn của Khởi nghĩa Lam Sơn?",
            options: "A. Hội thề Đông Quan / B. Trận Tốt Động – Chúc Động",
            correctAnswer: 'A'
        },
        {
            question: "8/10: Lê Lợi lên ngôi Hoàng đế, lập ra triều đại nào?",
            options: "A. Nhà Tiền Lê / B. Nhà Hậu Lê",
            correctAnswer: 'B'
        },
        {
            question: "9/10: Tên gọi sau khi Lê Lợi lên ngôi là gì?",
            options: "A. Lê Thái Tổ / B. Lê Thánh Tông",
            correctAnswer: 'A'
        },
        {
            question: "10/10: Bộ luật lớn nhất được ban hành dưới thời Hậu Lê sơ kỳ là gì?",
            options: "A. Hình thư / B. Quốc triều Hình luật (Luật Hồng Đức)",
            correctAnswer: 'B'
        }
    ];

    // ✨ THÊM BIẾN LƯU TRỮ NHẠC NỀN ✨
    private bgMusic!: Phaser.Sound.BaseSound;

    // ✨ BIẾN MỚI: Đối tượng Pet trong Lobby ✨
    private currentPetSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
    // ...

    // ✨ BIẾN MỚI: Trạng thái Shop và Pet ✨
    private isShopOpen: boolean = false;
    private shopPanel!: Phaser.GameObjects.Container;
    private confirmationPanel!: Phaser.GameObjects.Container;

    // Trạng thái sở hữu Pet (Phải được truyền qua Scene)
    private petOwned: { [key: string]: boolean } = {
        hp_regen: false,
        damage_dps: false,
        coin_collect: false
    };

    // ✨ BIẾN MỚI: Theo dõi Pet đang được trang bị (mặc định là Pet hồi máu nếu sở hữu) ✨
    private currentEquippedPetKey: string = 'none'; // 'none', 'hp_regen', 'damage_dps', etc.

    // Định nghĩa giá Pet
    private readonly PET_PRICES: { [key: string]: number } = {
        hp_regen: 200,
        damage_dps: 250,
        coin_collect: 190,
    };

    // ✨ THÊM BIẾN LƯU DỮ LIỆU GAMESTATE ✨
    private playerLevel: number = 1;
    private totalScore: number = 0; // ĐIỂM
    private playerCoins: number = 0; // ✨ XU (BIẾN MỚI) ✨
    private expData: any = {};

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

    // ✨ BIẾN MỚI: UI Hướng dẫn chơi
    private guideText!: Phaser.GameObjects.Text;
    private guideBox!: Phaser.GameObjects.Rectangle;

    // ✨ BIẾN MỚI: Trạng thái hướng dẫn
    private isShowingGuide: boolean = false;

    // Khai báo phím mới
    private continueKey!: Phaser.Input.Keyboard.Key; // Phím Enter hoặc Space để tiếp tục

    // Trạng thái game
    private isInDialogue: boolean = false;
    private hasTalkedToNpc: boolean = false;
    private isShowingQuizResult: boolean = false; // ✨ Trạng thái khóa phím chờ kết quả
    private interactionKey!: Phaser.Input.Keyboard.Key;
    private jumpKey!: Phaser.Input.Keyboard.Key;

    constructor() {
        super("Lobby");
    }

    preload(): void {

        // ✨ ĐẢM BẢO NHẠC NỀN ĐƯỢC TẢI (ĐÃ SỬA ĐƯỜNG DẪN) ✨
        this.load.audio('bgMusic', '../assets/ms_1.mp3');


        // Ảnh Pet healer
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


        this.load.image('pet_coin', '../assets/pet_coin.png');

        // --- Frames Lê Lợi --- (Giữ nguyên)
        this.load.image('leloi1', '../assets/lt1.png');
        this.load.image('leloi2', '../assets/lt2.png');
        this.load.image('leloi3', '../assets/lt3.png');
        this.load.image('leloi4', '../assets/lt4.png');
        this.load.image('leloi5', '../assets/lt5.png');
        this.load.image('leloi6', '../assets/lt6.png');
        this.load.image('leloi7', '../assets/lt7.png');

        // --- Sử gia ---
        this.load.image('sg1', '../assets/sg1.png');
        this.load.image('sg2', '../assets/sg2.png');
        this.load.image('sg3', '../assets/sg3.png');
        this.load.image('sg4', '../assets/sg4.png');
        this.load.image('sg5', '../assets/sg5.png');


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

        // 3. THÊM HOẠT ẢNH
        // THÊM: Định nghĩa hoạt ảnh Pet Idle (Sau khi tải frame)
        // ✨ HOẠT ẢNH SỬ GIA ✨
        this.anims.create({
            key: "sugia-idle", // Đặt tên key cho hoạt ảnh
            frames: [
                { key: "sg1" }, { key: "sg2" }, { key: "sg3" },
                { key: "sg4" }, { key: "sg5" },
            ],
            frameRate: 1, // Tốc độ hoạt ảnh (Ví dụ: 3 frame/giây để đứng yên trông tự nhiên)
            repeat: -1, // Lặp lại vô hạn
        });
        // -----------------------------------------------------
        this.anims.create({
            key: "pet-heal-idle", // <--- KEY HOẠT ẢNH MỚI
            frames: [
                { key: "pet_heal1" }, { key: "pet_heal2" }, { key: "pet_heal3" }, { key: "pet_heal4" },
                { key: "pet_heal5" }, { key: "pet_heal6" }, { key: "pet_heal7" }, { key: "pet_heal8" },
            ],
            frameRate: 6, // Tốc độ hợp lý
            repeat: -1, // Lặp lại vô hạn
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
    }

    create(): void {
        // 📱 Khởi tạo Touch Controls
        this.touchControls = new TouchControls('game-container');
        this.touchControls.setContext('lobby');

        const camWidth = this.cameras.main.width;
        const camHeight = this.cameras.main.height;
        // ✨ SỬA VỊ TRÍ: Đặt cố định ở góc trên bên trái (16px margin) ✨
        const marginX = 16;
        const marginY = 60;
        this.uiTextLevelCoin = this.add.text( // ✨ LƯU ĐỐI TƯỢNG TEXT VÀO BIẾN UI ✨
            marginX,
            marginY,
            `Level: ${this.playerLevel} | Xu: ${this.playerCoins}`,
            {
                fontSize: '24px',
                color: '#ffcc00',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }
        )
            .setOrigin(0, 0) // Neo vào góc trên bên trái
            .setScrollFactor(0) // Cố định với camera
            .setDepth(10); // Đảm bảo nó luôn hiển thị trên nền
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
        const GROUND_Y_POS = 950;
        this.ground.create(camWidth / 2, GROUND_Y_POS, "ground").setScale(100, 10).refreshBody();

        // VỊ TRÍ Y ĐỨNG
        const playerStartY = 650;
        const npcStartY = 840;



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

        // NPC QUIZ (Mới)
        this.npcQuiz = this.physics.add.sprite(
            camWidth / 2 - 300, // Vị trí mới (Ví dụ: bên trái Nguyễn Xí)
            npcStartY,
            "sg1" // Sử dụng lại asset đã có
        ).setOrigin(0.5, 1).setImmovable(true);
        this.npcQuiz.body.allowGravity = false;
        this.npcQuiz.play("sugia-idle", true);

        // Thêm tên "Quiz Master"
        this.quizNameText = this.add.text(
            this.npcQuiz.x,
            this.npcQuiz.y - this.npcQuiz.height - 10,
            "Sử gia", // Tên NPC mới
            { fontSize: '18px', color: '#ffcc00', backgroundColor: '#000000', padding: { x: 5, y: 2 } }
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
        const dialogueY = camHeight - 160;
        const dialogueTextY = camHeight - 190;
        const promptTextY = camHeight - 80;

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
            "",
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

        // ✨ THIẾT LẬP UI HƯỚNG DẪN ✨
        this.guideBox = this.add
            .rectangle(camWidth / 2, camHeight / 2, camWidth * 0.6, camHeight * 0.5, 0x000000, 0.9) // Độ trong suốt cao hơn
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setStrokeStyle(4, 0xffd700) // Viền màu vàng
            .setDepth(20)
            .setVisible(false);

        this.guideText = this.add
            .text(camWidth / 2, camHeight / 2 - (camHeight * 0.5) / 2 + 20, "", {
                // Tăng kích thước chữ, sử dụng font monospace để căn chỉnh
                fontSize: "26px",
                color: "#e8e8e8",
                fontFamily: 'monospace',
                wordWrap: { width: camWidth * 0.6 - 40 },
                lineSpacing: 10,
                align: 'left'
            })
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(21) // Đảm bảo text nằm trên box
            .setVisible(false);

        this.showGameGuide(); // Kích hoạt hướng dẫn khi bắt đầu

        // 9. Va chạm giữa Player/NPC (Giữ nguyên)
        this.physics.add.collider(this.player, this.npcQuest);
        this.physics.add.collider(this.player, this.npcShop);

        // ✨ HIỂN THỊ PET NGAY KHI SCENE LOAD ✨
        this.displayPet();

        this.updateCoinDisplay();
    }

    // ✨ HÀM HIỂN THỊ HƯỚNG DẪN CHƠI ✨
    private showGameGuide(): void {
        this.isShowingGuide = true;
        this.player.body.setVelocity(0, 0);
        this.player.anims.stop();

        // ✨ BẬT LISTENER ĐINH LỄ KHI DIALOGUE BẮT ĐẦU ✨
        this.enableDialogueKeys()

        // Dừng nhạc nền tạm thời (nếu đang chạy)
        if (this.bgMusic.isPlaying) {
            this.bgMusic.pause();
        }

        this.guideBox.setVisible(true);
        this.guideText.setVisible(true);

        const guideContent =
            "***HƯỚNG DẪN CƠ BẢN***\n\n" +
            "⬅️ ➡️: Di chuyển (Trái/Phải)\n" +
            "[SPACE]: Nhảy\n" +
            "[X]: Tương tác với NPC (Đinh Lễ, Nguyễn Xí)\n" +
            "Giữ [A]: Bắn Mũi Tên (Tấn công cơ bản)\n" +
            "Giữ [S]: Sử dụng Kỹ Năng Đặc Biệt (Ultimate)\n" +
            "Ấn [D]: Để triệu hồi lính\n" +
            "Ấn [C]: Để xem chỉ số nhân vật\n" +
            "[ESC]: Tạm Dừng Game (Pause)\n\n" +
            "Ấn [ENTER] để bắt đầu du hành cùng tướng quân Lê Lợi!";

        this.guideText.setText(guideContent);

        // Đợi phím Enter hoặc tap để đóng hướng dẫn
        this.input.keyboard!.once('keydown-ENTER', this.hideGameGuide, this);
        this.input.once('pointerdown', this.hideGameGuide, this);
    }

    // ✨ HÀM ẨN HƯỚNG DẪN CHƠI ✨
    private hideGameGuide(): void {
        this.isShowingGuide = false;
        this.guideBox.setVisible(false);
        this.guideText.setVisible(false);

        // Chạy lại nhạc nền (nếu bị dừng)
        if (!this.bgMusic.isPlaying) {
            this.bgMusic.resume();
        }

        // Cho phép Player di chuyển trở lại
    }

    // Trong LobbyScene.ts -> update():

    update(): void {
        // CẬP NHẬT: Giữ tên NPC di chuyển theo NPC (Không bị chặn)
        this.dinhLeNameText.x = this.npcQuest.x;
        this.dinhLeNameText.y = this.npcQuest.y - this.npcQuest.height - 10;

        this.nguyenXiNameText.x = this.npcShop.x;
        this.nguyenXiNameText.y = this.npcShop.y - this.npcShop.height - 10;

        // ✨ CẬP NHẬT VỊ TRÍ TÊN QUIZ NPC ✨
        this.quizNameText.x = this.npcQuiz.x;
        this.quizNameText.y = this.npcQuiz.y - this.npcQuiz.height - 10;

        // ✨ GỌI HÀM NÀY ĐẦU TIÊN ĐỂ CẬP NHẬT nearestNPC ✨
        this.handleNPCInteraction();


        // ====================================================================
        // ✨ BƯỚC 1: XỬ LÝ PHÍM TƯƠNG TÁC [X] (SỬ DỤNG nearestNPC) ✨
        // ====================================================================
        if (Phaser.Input.Keyboard.JustDown(this.interactionKey) || this.touchControls.justPressed('interact')) {
            const nearestNPC = (this as any).nearestNPC;

            if (nearestNPC === this.npcQuest && !this.isInDialogue) {
                // Mở hội thoại Đinh Lễ
                this.startDialogue();
                this.touchControls.resetFrameState();
            } else if (nearestNPC === this.npcShop && !this.isShopOpen) {
                // Mở Shop Nguyễn Xí
                this.toggleShop(true);
                this.touchControls.resetFrameState();
            } else if (nearestNPC === this.npcQuiz && !this.isQuizActive) { // ✨ XỬ LÝ NPC QUIZ ✨
                this.startQuiz();
                this.touchControls.resetFrameState();
            }

        }

        // ====================================================================
        // ✨ BƯỚC 2: LOGIC CHẶN INPUT & MOVEMENT (THEO TRẠNG THÁI) ✨
        // ====================================================================
        if (this.isInDialogue || this.isShowingGuide || this.isShopOpen || this.isQuizActive) {
            // 📱 Xử lý touch cho Quiz (A/B) khi đang trong trạng thái chặn
            if (this.isQuizActive) {
                if (this.touchControls.justPressed('interact')) { // Nút X (Quay lại)
                    this.endQuiz();
                } else if (!this.isShowingQuizResult) {
                    if (this.touchControls.justPressed('answerA')) {
                        this.handleQuizAnswer('A');
                    } else if (this.touchControls.justPressed('answerB')) {
                        this.handleQuizAnswer('B');
                    }
                }
            }

            // 📱 Xử lý touch cho Dialogue Quest (Y/N)
            if (this.isInDialogue) {
                if (this.touchControls.justPressed('answerY')) {
                    this.handleYes();
                } else if (this.touchControls.justPressed('answerN')) {
                    this.handleNo();
                }
            }

            // Dừng Player và Pet
            this.player.body.setVelocityX(0);
            this.player.anims.stop();
            if (this.currentPetSprite) {
                this.currentPetSprite.body.velocity.x = 0;
            }
            this.touchControls.resetFrameState();
            return; // CHẶN MỌI THỨ Ở DƯỚI
        }
        // ------------------------------------

        // ====================================================================
        // ✨ BƯỚC 3: LOGIC CHẠY (NẾU KHÔNG BỊ CHẶN) ✨
        // ====================================================================

        // Logic theo dõi Pet
        if (this.currentPetSprite) {
            const followDistance = 60;
            const targetX = this.player.x + (this.player.flipX ? 50 : -50);
            const dx = targetX - this.currentPetSprite.x;

            if (Math.abs(dx) > followDistance) {
                this.currentPetSprite.body.velocity.x = dx * 0.9;
            } else {
                this.currentPetSprite.body.velocity.x = 0;
            }
            this.currentPetSprite.setFlipX(!this.player.flipX);
        }

        this.handlePlayerMovement();

        // 📱 Reset trạng thái touch ở cuối frame
        this.touchControls.resetFrameState();
    }

    // Hàm xử lý di chuyển nhân vật chính (Giữ nguyên)
    private handlePlayerMovement(): void {
        const speed = 300;

        this.player.body.setVelocityX(0);

        const isOnGround = this.player.body.blocked.down;

        // 📱 Hỗ trợ cả keyboard và touch controls
        const moveLeft = this.cursors.left.isDown || this.touchControls.isDown('left');
        const moveRight = this.cursors.right.isDown || this.touchControls.isDown('right');
        const doJump = (Phaser.Input.Keyboard.JustDown(this.jumpKey) || this.touchControls.justPressed('jump'));

        if (moveLeft) {
            this.player.body.setVelocityX(-speed);
            this.player.setFlipX(true);
            if (isOnGround) {
                this.player.play("leloi-walk-left", true);
            }
        } else if (moveRight) {
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

        // Dùng phím SPACE (this.jumpKey) hoặc nút ảo để nhảy
        if (doJump && isOnGround) {
            this.player.setVelocityY(-400);
        }

        // Animation nhảy (Tạm thời dùng texture đứng yên nếu không có animation nhảy)
        if (!isOnGround) {
            this.player.anims.stop();
        }
    }

    // Hàm xử lý tương tác với NPC (Giữ nguyên)
    private handleNPCInteraction(): void {
        const distanceToQuestNPC = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npcQuest.x, this.npcQuest.y);
        const distanceToShopNPC = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npcShop.x, this.npcShop.y);
        // ✨ THÊM KHOẢNG CÁCH TỚI NPC QUIZ ✨
        const distanceToQuizNPC = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npcQuiz.x, this.npcQuiz.y);

        const interactionDistance = 150;

        let targetNPC: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
        let isNearNPC = false;

        if (distanceToQuestNPC < interactionDistance) {
            targetNPC = this.npcQuest;
            isNearNPC = true;
        } else if (distanceToShopNPC < interactionDistance) {
            targetNPC = this.npcShop;
            isNearNPC = true;
        } else if (distanceToQuizNPC < interactionDistance) { // ✨ KIỂM TRA NPC QUIZ ✨
            targetNPC = this.npcQuiz;
            isNearNPC = true;
        }

        if (isNearNPC && targetNPC) {
            // Cập nhật vị trí và HIỂN THỊ prompt
            this.interactionPrompt.x = targetNPC.x;
            this.interactionPrompt.y = targetNPC.y - targetNPC.height - 40;
            this.interactionPrompt.setVisible(true);

            // ✨ LƯU NPC ĐANG ĐỨNG GẦN VÀO MỘT BIẾN ✨
            (this as any).nearestNPC = targetNPC;

            // ❌ XÓA HẾT KHỐI XỬ LÝ PHÍM [X] CŨ Ở ĐÂY ❌
        } else {
            this.interactionPrompt.setVisible(false);
            (this as any).nearestNPC = null; // Reset
        }
    }


    // Hàm bắt đầu hội thoại (Chỉ dành cho NPC Quest - Đinh Lễ)
    private startDialogue(): void {
        // Thêm kiểm tra Shop mở để ngăn hội thoại bắt đầu
        if (this.isShopOpen) return;

        if (this.isInDialogue || this.hasTalkedToNpc) return;

        this.isInDialogue = true;
        // ✨ THÊM: Dừng Player ở đây để đảm bảo dừng ngay lập tức ✨
        this.player.body.setVelocity(0, 0);
        this.player.anims.stop();


        // Dữ liệu Player đã bị khóa trong update() nhờ cờ this.isInDialogue

        this.interactionPrompt.setVisible(false);
        this.dialogueBox.setVisible(true);
        this.dialogueText.setVisible(true);
        this.promptText.setVisible(true);
        this.dinhLeNameText.setVisible(false);
        this.nguyenXiNameText.setVisible(false);

        this.dialogueText.setText("Tướng quân, người đã sẵn sàng dẫn quân ra trận chưa? [N] Chưa/ [Y] Vô trận");
        
        // 📱 Chuyển touch context sang dialogueQuest để hiện nút Y/N
        this.touchControls.setContext('dialogueQuest');
    }

    // Xử lý khi người chơi nhấn YES (Giữ nguyên)
    private handleYes(): void {
        if (!this.isInDialogue) return;

        this.endDialogue();

        const gameDataToPass = {
            playerLevel: this.playerLevel,

            // ✅ TRUYỀN GIÁ TRỊ RIÊNG BIỆT ĐÃ LƯU TRONG LOBBY
            totalScore: this.totalScore,    // ĐIỂM
            playerCoins: this.playerCoins,  // XU

            currentExp: this.expData.currentExp,
            requiredExp: this.expData.requiredExp,
            petOwned: this.petOwned,
            // ✨ DÒNG THÊM: TRUYỀN PET ĐANG TRANG BỊ SANG GAME SCENE ✨
        equippedPetKey: this.currentEquippedPetKey,
        };

        // Truyền data qua hàm start()
        this.touchControls.destroy(); // 📱 Dọn dẹp touch controls trước khi chuyển scene
        this.scene.start("Game", gameDataToPass);
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
        this.quizNameText.setVisible(true);
        // ✨ TẮT LISTENER ĐINH LỄ KHI DIALOGUE KẾT THÚC ✨
        // this.disableDialogueKeys();
        this.player.setTexture('leloi1');

        // 📱 Đưa touch context trở lại lobby
        this.touchControls.setContext('lobby');
    }
    // ✨ INIT LÀ HÀM NHẬN DỮ LIỆU TRUYỀN TỪ SCENE TRƯỚC ✨


    init(data: any) {
        // 1. Khởi tạo giá trị mặc định
        this.playerLevel = 1;
        this.totalScore = 0;
        this.playerCoins = 3000; // Khởi tạo Xu
        this.expData = {
            currentExp: 0,
            requiredExp: 10
        };

        // 2. Kiểm tra và áp dụng dữ liệu đã lưu
        if (data && data.playerLevel !== undefined) {

            this.playerLevel = data.playerLevel;

            // ✨ NHẬN TRẠNG THÁI SỞ HỮU PET ✨
            if (data.petOwned) {
                this.petOwned = data.petOwned;
            }

            // ✨ DÒNG SỬA LỖI: NHẬN VÀ PHÂN TÁCH ĐIỂM và XU ✨
            this.totalScore = data.totalScore || 0; // Nhận Điểm
            this.playerCoins = data.playerCoins || 0; // Nhận Xu

            // Cập nhật EXP
            this.expData = {
                currentExp: data.currentExp || 0,
                requiredExp: data.requiredExp || 10
            };

            // ✨ THÊM LOGIC ĐẶT PET ĐANG TRANG BỊ MẶC ĐỊNH LẦN ĐẦU ✨
        if (this.currentEquippedPetKey === 'none') {
            if (this.petOwned.damage_dps) {
                this.currentEquippedPetKey = 'damage_dps';
            } else if (this.petOwned.hp_regen) {
                this.currentEquippedPetKey = 'hp_regen';
            }
        }

            console.log("Dữ liệu Xu đã được giữ lại trong Lobby:", this.playerCoins);
        }
    }

    // Trong Lobby.ts
    // Trong LobbyScene.ts

    private toggleShop(open: boolean): void {
        if (this.isShopOpen === open) return;

        this.isShopOpen = open;

        if (open) {
            // Tái tạo Panel và hiển thị Shop
            if (!this.shopPanel || !this.shopPanel.scene) {
                this.shopPanel = this.createShopPanel();
            }
            this.shopPanel.setVisible(true);

            // Ẩn các đối tượng ngoài Shop
            this.dinhLeNameText.setVisible(false);
            this.nguyenXiNameText.setVisible(false);
            this.interactionPrompt.setVisible(false);

            // ✨ TẮT LISTENER ĐINH LỄ KHI SHOP MỞ (RẤT QUAN TRỌNG) ✨
            this.disableDialogueKeys();

        } else {
            // Đóng shop
            this.shopPanel?.setVisible(false);
            this.confirmationPanel?.setVisible(false);

            // HIỂN THỊ LẠI TÊN NPC
            this.dinhLeNameText.setVisible(true);
            this.nguyenXiNameText.setVisible(true);

            // ✨ BẬT LẠI LISTENER ĐINH LỄ KHI SHOP ĐÓNG ✨
            this.enableDialogueKeys();
        }
    }


    private createShopPanel(): Phaser.GameObjects.Container {
        const camWidth = this.cameras.main.width;
        const camHeight = this.cameras.main.height;
        const panelWidth = 550;
        const panelHeight = 450;

        // --- KHUNG CHÍNH ---
        const shopBox = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a1a, 0.95)
            .setOrigin(0.5).setStrokeStyle(3, 0xffcc00);
        const shopTitle = this.add.text(0, -200, "CỬA HÀNG NGUYỄN XÍ", { fontSize: '30px', color: '#ffcc00', fontStyle: 'bold' }).setOrigin(0.5);
        const closeBtn = this.add.text(220, -200, '[X]', { fontSize: '24px', color: '#ffffff' })
            .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.toggleShop(false));

        // Hiển thị Xu hiện tại
        const currentXuText = this.add.text(-250, -150, `Xu hiện tại: ${this.playerCoins} XU`, { fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);

        // --- DANH SÁCH PET ---
        const pets = [
            { key: 'hp_regen', name: 'Pet Hồi Máu', desc: '+1 HP mỗi 5s', price: this.PET_PRICES.hp_regen, y: -100 },
            { key: 'damage_dps', name: 'Pet Tấn Công', desc: '+0.5 SAT thương mỗi 3s', price: this.PET_PRICES.damage_dps, y: 0 },
            // { key: 'coin_collect', name: 'Pet Nhặt Xu', desc: 'Tự động nhặt Xu rơi', price: this.PET_PRICES.coin_collect, y: 100 },
        ];

        const petElements: Phaser.GameObjects.Container[] = [];
        const petListYOffset = -100; // Vị trí Y bắt đầu của Pet list

       pets.forEach((pet, index) => {
        const isOwned = this.petOwned[pet.key];
        const hasMoney = this.playerCoins >= pet.price;
        const isEquipped = this.currentEquippedPetKey === pet.key; 

        // ✨ XỬ LÝ TEXT VÀ MÀU SẮC DỰA TRÊN TRẠNG THÁI ✨
        let statusText = `${pet.price} XU`;
        let bgColor = hasMoney ? 0x553300 : 0x330000;
        let isPurchasable = hasMoney && !isOwned; // Cờ để mua (chưa sở hữu + đủ tiền)
        let isSelectable = isOwned; // Cờ để chọn (đã sở hữu)

        if (isEquipped) {
            statusText = 'ĐANG CHỌN';
            bgColor = 0x008800;
        } else if (isOwned) {
            statusText = 'ĐÃ SỞ HỮU';
            bgColor = 0x005500;
        }
        
        // ... (phần tạo petText, priceBox, priceText, petContainer giữ nguyên)
        const petText = this.add.text(-250, 0,
            `PET: ${pet.name}\n[${pet.desc}]`,
            { fontSize: '18px', color: '#ffffff', wordWrap: { width: 350 } })
            .setOrigin(0, 0.5);

        const priceBox = this.add.rectangle(150, 0, 150, 40, bgColor)
            .setOrigin(0.5)
            .setStrokeStyle(2, isEquipped ? 0x00ff00 : 0xcccccc); 

        const priceText = this.add.text(150, 0, statusText,
            { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' })
            .setOrigin(0.5);

        const petContainer = this.add.container(0, petListYOffset + index * 100, [
            petText, priceBox, priceText
        ]);


        // ✨ DÒNG SỬA LỖI: LOGIC TƯƠNG TÁC ✨
        if (isPurchasable || isSelectable) { 
            priceBox.setInteractive({ useHandCursor: true });
            priceText.setInteractive({ useHandCursor: true });

            const clickHandler = () => {
                if (isSelectable) { // Nếu đã sở hữu (isOwned = true)
                    this.equipPet(pet.key);
                } else if (isPurchasable) { // Nếu chưa sở hữu NHƯNG đủ tiền
                    this.showConfirmation(pet.key, pet.name, pet.price);
                }
            };

            priceBox.on('pointerdown', clickHandler);
            priceText.on('pointerdown', clickHandler); 

            // Thêm hiệu ứng hover nhẹ (cho cả Mua và Chọn)
            const originalColor = bgColor;
            const hoverColor = isSelectable ? 0x00aa00 : 0x775500; // Xanh đậm nếu là Chọn

            priceBox.on('pointerover', () => { priceBox.setFillStyle(hoverColor); });
            priceBox.on('pointerout', () => { priceBox.setFillStyle(originalColor); });
            priceText.on('pointerover', () => { priceBox.setFillStyle(hoverColor); });
            priceText.on('pointerout', () => { priceBox.setFillStyle(originalColor); });
        }
        // ✨ KẾT THÚC KHỐI SỬA LỖI ✨

        petElements.push(petContainer);
    });

        const shopContainer = this.add.container(camWidth / 2, camHeight / 2, [
            shopBox, shopTitle, closeBtn, currentXuText, ...petElements
        ]);
        shopContainer.setScrollFactor(0).setDepth(2000);
        return shopContainer;
    }

    // Trong Lobby.ts
    private showConfirmation(petKey: string, petName: string, price: number): void {
        this.toggleShop(false); // Ẩn Shop tạm thời

        // ✨ TẮT LISTENER CỦA ĐINH LỄ KHI HIỂN THỊ CỬA SỔ XÁC NHẬN ✨
        this.disableDialogueKeys();

        const camWidth = this.cameras.main.width;
        const camHeight = this.cameras.main.height;

        const box = this.add.rectangle(0, 0, 400, 200, 0x000000, 0.9).setOrigin(0.5).setStrokeStyle(3, 0xff0000);
        const text = this.add.text(0, -40, `Xác nhận mua ${petName} với giá ${price} Xu?`, { fontSize: '20px', color: '#ffffff', align: 'center', wordWrap: { width: 380 } }).setOrigin(0.5);

        const yesBtn = this.add.text(-10, 10, 'CÓ (Y)', { fontSize: '24px', color: '#00ff00', backgroundColor: '#333333', padding: { x: 2, y: 2 } })
            .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.buyPet(petKey, price, true));

        const noBtn = this.add.text(-10, 50, 'KHÔNG (N)', { fontSize: '24px', color: '#ff0000', backgroundColor: '#333333', padding: { x: 10, y: 5 } })
            .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.buyPet(petKey, price, false));

        // Khởi tạo panel
        this.confirmationPanel = this.add.container(camWidth / 2, camHeight / 2, [box, text, yesBtn, noBtn]);
        this.confirmationPanel.setScrollFactor(0).setDepth(2100).setVisible(true);

        // ✨ Gán listener MUA PET (chỉ dùng once) ✨
        this.input.keyboard!.once('keydown-Y', () => this.buyPet(petKey, price, true), this);
        this.input.keyboard!.once('keydown-N', () => this.buyPet(petKey, price, false), this);
    }

    // Trong Lobby.ts

    private buyPet(petKey: string, price: number, confirmed: boolean): void {
        // Xóa panel xác nhận và dừng lắng nghe phím
        this.confirmationPanel?.setVisible(false);
        // Dọn dẹp listener MUA PET (Quan trọng)
        this.input.keyboard!.off('keydown-Y');
        this.input.keyboard!.off('keydown-N')

        if (confirmed) {
            if (this.playerCoins >= price && !this.petOwned[petKey]) {

                // BƯỚC 1: TRỪ XU VÀ CẬP NHẬT TRẠNG THÁI
                this.playerCoins -= price;
                this.petOwned[petKey] = true;
                this.updateCoinDisplay();
                this.currentEquippedPetKey = petKey; // ✨ TỰ ĐỘNG TRANG BỊ PET MỚI MUA ✨

                // BƯỚC 2: KHỞI TẠO LẠI SHOP PANEL VÀ HIỂN THỊ PET ✨
                this.shopPanel?.destroy();
                this.shopPanel = this.createShopPanel();
                

                this.displayPet(); // ✨ GỌI HÀM NÀY ĐỂ HIỂN THỊ PET MỚI MUA ✨

                // BƯỚC 3 & 4: THÔNG BÁO và Mở lại Shop
                const successText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100,
                    `🎉 Đã mua ${petKey.replace('_', ' ')} thành công!`,
                    { fontSize: '30px', color: '#00ff00', backgroundColor: '#000000' })
                    .setOrigin(0.5).setScrollFactor(0).setDepth(2200);

                this.time.delayedCall(2000, () => successText.destroy(), [], this);
                this.toggleShop(true);
                return;
            } else if (this.petOwned[petKey]) {
                // Thông báo đã mua
                this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100,
                    `Pet này đã được sở hữu!`, { fontSize: '30px', color: '#ffff00' })
                    .setOrigin(0.5).setScrollFactor(0).setDepth(2200);
                this.time.delayedCall(2000, () => this.toggleShop(true), [], this);
                return;
            }
        }

        // Nếu không mua được (không đủ tiền hoặc hủy), mở lại Shop
        this.toggleShop(true);
    }

    // Trong Lobby.ts

   private displayPet(): void {
    // 1. Nếu Pet đang hiển thị, hủy nó đi
    if (this.currentPetSprite) {
        this.currentPetSprite.destroy();
        this.currentPetSprite = null;
    }

    let petKey: string | null = null;
    let animationKey: string | null = null;
    
    // ✨ DÒNG KHẮC PHỤC CHÍNH: LẤY KEY PET ĐANG ĐƯỢC TRANG BỊ ✨
    const equippedKey = this.currentEquippedPetKey;
    
    // ----------------------------------------------------
    // ✨ LOGIC MỚI: CHỈ XÉT PET ĐANG ĐƯỢC TRANG BỊ ✨
    if (equippedKey === 'damage_dps' && this.petOwned.damage_dps) {
        petKey = 'pet_damage1';
        animationKey = 'pet-damage-idle';
    }
    else if (equippedKey === 'hp_regen' && this.petOwned.hp_regen) {
        petKey = 'pet_heal1';
        animationKey = 'pet-heal-idle';
    }
    else if (equippedKey === 'coin_collect' && this.petOwned.coin_collect) {
        petKey = 'pet_coin';
        animationKey = null;
    }

    // [Tùy chọn] Logic cho lần đầu load scene (khi equippedKey là 'none')
    if (equippedKey === 'none') {
        if (this.petOwned.damage_dps) {
            this.currentEquippedPetKey = 'damage_dps';
            this.displayPet(); 
            return;
        } else if (this.petOwned.hp_regen) {
            this.currentEquippedPetKey = 'hp_regen';
            this.displayPet();
            return;
        }
    }
    // ----------------------------------------------------

    if (petKey) {
        // 2. Tạo Pet Sprite mới
        this.currentPetSprite = this.physics.add.sprite(this.player.x - 50, this.player.y, petKey) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        this.currentPetSprite.setOrigin(0.5, 1);
        this.currentPetSprite.body.allowGravity = true;
        this.physics.add.collider(this.currentPetSprite, this.ground); // Pet cũng đứng trên đất
        this.currentPetSprite.setScale(0.8); // Giảm kích thước Pet

        // 3. CHẠY HOẠT ẢNH NẾU CÓ
        if (animationKey) {
            this.currentPetSprite.play(animationKey!, true);
        }
    }
}

    private enableDialogueKeys(): void {
        // Chỉ bật nếu đang hội thoại
        this.input.keyboard!.on("keydown-Y", this.handleYes, this);
        this.input.keyboard!.on("keydown-N", this.handleNo, this);
    }

    private disableDialogueKeys(): void {
        // Tắt các listener cố định
        this.input.keyboard!.off("keydown-Y", this.handleYes, this);
        this.input.keyboard!.off("keydown-N", this.handleNo, this);
    }

    private startQuiz(): void {
        if (this.isQuizActive || this.isInDialogue || this.isShopOpen) return;

        // ✨ KIỂM TRA TRẠNG THÁI HOÀN THÀNH ✨
        if (this.hasCompletedQuiz) {
            this.isInDialogue = true; // Tạm thời dùng dialogue để chặn di chuyển
            this.player.body.setVelocity(0, 0);
            this.player.anims.stop();
            this.interactionPrompt.setVisible(false);
            this.dinhLeNameText.setVisible(false);
            this.nguyenXiNameText.setVisible(false);
            this.quizNameText.setVisible(false);

            // Hiển thị thông báo
            this.dialogueBox.setVisible(true);
            this.dialogueText.setVisible(true);
            this.promptText.setVisible(true);

            this.dialogueText.setText("Sử gia: Bạn đã hoàn thành tất cả câu hỏi lịch sử!");
            this.promptText.setText("[SPACE] hoặc chạm để tiếp tục du hành.");

            // Dùng `once` với phím SPACE để đóng hộp thoại chung
            this.input.keyboard!.once('keydown-SPACE', this.endDialogue, this);
            this.input.once('pointerdown', this.endDialogue, this);
            
            // 📱 Ẩn touch controls đi khi xem thông báo hoàn thành
            this.touchControls.setContext('none');
            return;
        }

        // --- LOGIC BẮT ĐẦU QUIZ (CHỈ KHI CHƯA HOÀN THÀNH) ---
        this.isQuizActive = true;
        this.currentQuestionIndex = 0; // Luôn bắt đầu từ câu đầu tiên khi tương tác lần đầu
        this.player.body.setVelocity(0, 0);
        this.player.anims.stop();
        this.interactionPrompt.setVisible(false)

        // 📱 Chuyển touch context sang quiz để hiện nút A/B
        this.touchControls.setContext('quiz');

        // Ẩn tên NPC khác và tên Quiz NPC
        this.dinhLeNameText.setVisible(false);
        this.nguyenXiNameText.setVisible(false);
        this.quizNameText.setVisible(false);

        // Bật Listener đáp án (SỬ DỤNG HÀM WRAPPER)
        this.input.keyboard!.on('keydown-A', () => this.handleQuizAnswer('A'), this); // ✨ SỬA ĐỔI ✨
        this.input.keyboard!.on('keydown-B', () => this.handleQuizAnswer('B'), this); // ✨ SỬA ĐỔI ✨

        this.showQuestion();
    }

    private showQuestion(): void {
        if (this.currentQuestionIndex >= this.quizQuestions.length) {
            // Đã hết câu hỏi
            this.dialogueText.setText("Chúc mừng! Bạn đã hoàn thành tất cả các câu hỏi lịch sử.");
            this.promptText.setText("[X] để kết thúc");
            this.promptText.setVisible(true);

            // Thêm listener cho phím X để kết thúc Quiz
            this.input.keyboard!.once('keydown-X', this.endQuiz, this);
            return;
        }

        const questionData = this.quizQuestions[this.currentQuestionIndex];

        this.dialogueBox.setVisible(true);
        this.dialogueText.setVisible(true);

        this.dialogueText.setText(`[Sử gia]: ${questionData.question}\n${questionData.options}`);
        this.promptText.setText("Chọn đáp án: [A] hoặc [B]");
        this.promptText.setVisible(true);
    }

    private handleQuizAnswer(answerKey: string): void {
        if (!this.isQuizActive || this.currentQuestionIndex >= this.quizQuestions.length) return;
        if (this.isShowingQuizResult) return; // Bảo vệ 2 lớp chống spam

        this.isShowingQuizResult = true;

        // const answerKey = event.originalEvent.key.toUpperCase(); // DÒNG NÀY ĐÃ BỊ XÓA ❌
        const questionData = this.quizQuestions[this.currentQuestionIndex];
        let message: string;

        // Tắt listener tạm thời (SỬA ĐỔI CÁCH TẮT)
        this.input.keyboard!.off('keydown-A'); // Tắt tất cả listener cho A
        this.input.keyboard!.off('keydown-B'); // Tắt tất cả listener cho B

        // ... (logic tiếp theo giữ nguyên)
        if (answerKey === questionData.correctAnswer) {
            this.playerCoins += this.COIN_REWARD_PER_QUESTION; // Cộng xu
            message = `✅ Đúng rồi! Bạn nhận được ${this.COIN_REWARD_PER_QUESTION} Xu!`;
        } else {
            message = `❌ Sai rồi! Đáp án đúng là ${questionData.correctAnswer}.`;
        }

        // Hiển thị thông báo kết quả
        this.dialogueText.setText(`[Sử gia]: ${message}`);
        this.promptText.setText("Tự động chuyển câu hỏi sau giây lát...");
        this.promptText.setVisible(true);

        // Tăng index câu hỏi
        this.currentQuestionIndex++;

        // Chuyển sang câu hỏi tiếp theo sau 1.5s
        this.time.delayedCall(1500, () => {
            if (this.isQuizActive) {
                this.continueQuiz();
            }
        }, [], this);

        // Cập nhật hiển thị Xu
        this.updateCoinDisplay();
    }

    private continueQuiz(): void {
        this.isShowingQuizResult = false;
        // Bật lại listener đáp án (SỬA ĐỔI CÁCH BẬT)
        this.input.keyboard!.on('keydown-A', () => this.handleQuizAnswer('A'), this); // ✨ SỬA ĐỔI ✨
        this.input.keyboard!.on('keydown-B', () => this.handleQuizAnswer('B'), this); // ✨ SỬA ĐỔI ✨

        // Hiển thị câu hỏi tiếp theo
        this.showQuestion();
    }

    private endQuiz(): void {
        this.isShowingQuizResult = false;
        // ✨ KIỂM TRA ĐÃ HOÀN THÀNH TẤT CẢ CÂU HỎI CHƯA (Index 10 sau khi trả lời câu 9) ✨
        if (this.currentQuestionIndex >= this.quizQuestions.length) {
            this.hasCompletedQuiz = true; // Set cờ hoàn thành
        }


        this.isQuizActive = false;
        this.dialogueBox.setVisible(false);
        this.dialogueText.setVisible(false);
        this.promptText.setVisible(false);

        // 📱 Quay lại touch context lobby
        this.touchControls.setContext('lobby');

        // Xóa tất cả listener liên quan đến Quiz
        this.input.keyboard!.off('keydown-A', this.handleQuizAnswer, this);
        this.input.keyboard!.off('keydown-B', this.handleQuizAnswer, this);
        this.input.keyboard!.off('keydown-X', this.endQuiz, this); // Dọn dẹp listener cuối cùng

        // Hiển thị lại tên NPC
        this.dinhLeNameText.setVisible(true);
        this.nguyenXiNameText.setVisible(true);
        this.quizNameText.setVisible(true);

        // Đảm bảo Player có thể di chuyển (đã được xử lý bởi cờ isQuizActive)
    }

    // ✨ HÀM HỖ TRỢ: Cập nhật hiển thị Xu (Cần tạo nếu chưa có)
    private updateCoinDisplay(): void {
        // Tìm đối tượng Text hiển thị Level và Xu
        const camWidth = this.cameras.main.width;
        const marginX = 16;
        const marginY = 60;

        if (this.uiTextLevelCoin) {
            this.uiTextLevelCoin.setText(`Level: ${this.playerLevel} | Xu: ${this.playerCoins}`);
        }
    }

    // ✨ HÀM MỚI: Hiển thị thông báo tạm thời (dùng cho equipPet) ✨
private showTemporaryMessage(message: string): void {
    const camWidth = this.cameras.main.width;
    const tempText = this.add.text(camWidth / 2, 50, message, {
        fontSize: '24px',
        color: '#ffcc00',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    })
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(3000);

    this.time.delayedCall(1500, () => tempText.destroy(), [], this);
}

// ✨ HÀM MỚI: Trang bị Pet đã sở hữu ✨
private equipPet(petKey: string): void {
    if (this.currentEquippedPetKey === petKey) {
        this.showTemporaryMessage(`Pet ${petKey.replace('_', ' ')} đang được trang bị.`);
        return;
    }

    this.currentEquippedPetKey = petKey;
    this.displayPet(); // Cập nhật hình ảnh Pet trong Lobby
    
    // Yêu cầu làm mới Shop để thấy hiệu ứng Pet đang chọn
    this.shopPanel?.destroy();
    this.shopPanel = this.createShopPanel();
    this.shopPanel.setVisible(true); // Hiển thị lại shop đã làm mới

    this.showTemporaryMessage(`Đã trang bị Pet ${petKey.replace('_', ' ')}.`);
}
}