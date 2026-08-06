/**
 * TouchControls.ts
 * Hệ thống nút ảo HTML overlay cho điều khiển cảm ứng trên mobile.
 * Nút được hiển thị dưới dạng HTML <button> đặt trên canvas Phaser.
 * Chỉ hiển thị trên thiết bị có hỗ trợ touch.
 */

export type TouchButtonId =
  | 'left' | 'right' | 'jump'
  | 'attack' | 'ultimate' | 'soldier'
  | 'interact' | 'stats' | 'pause'
  | 'answerA' | 'answerB' | 'answerY' | 'answerN';

type ButtonState = {
  isDown: boolean;
  justPressed: boolean;
  justReleased: boolean;
  element: HTMLButtonElement;
};

export type TouchContext = 'none' | 'mainmenu' | 'lobby' | 'game' | 'quiz' | 'dialogueQuest';

export default class TouchControls {
  private container: HTMLDivElement;
  private buttons: Map<TouchButtonId, ButtonState> = new Map();
  private currentContext: TouchContext = 'none';
  private isTouchDevice: boolean;

  constructor(parentId: string) {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Tạo container overlay
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 10;
      display: ${this.isTouchDevice ? 'block' : 'none'};
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    `;

    const parentEl = document.getElementById(parentId);
    if (parentEl) {
      parentEl.style.position = 'relative';
      parentEl.appendChild(this.container);
    }

    this.createButtons();
    this.setContext('none');
  }

  private createButtons(): void {
    const btnSize = '56px';

    // ========================================
    // D-PAD (Góc dưới trái)
    // ========================================
    const dpad = this.createGroup('dpad', `
      position: absolute;
      bottom: max(20px, env(safe-area-inset-bottom));
      left: max(20px, env(safe-area-inset-left));
      width: 150px;
      height: ${btnSize};
    `);

    // Left và Right nằm hai bên
    this.createButton('left', '◀', dpad, `position: absolute; left: 0; bottom: 0; width: 65px; height: 100%;`);
    this.createButton('right', '▶', dpad, `position: absolute; right: 0; bottom: 0; width: 65px; height: 100%;`);

    // ========================================
    // ACTION BUTTONS (Góc dưới phải - Layout hình thoi)
    // ========================================
    const actions = this.createGroup('actions', `
      position: absolute;
      bottom: max(20px, env(safe-area-inset-bottom));
      right: max(20px, env(safe-area-inset-right));
      width: 150px;
      height: 150px;
    `);

    // Jump (⬆) - Bên Phải
    this.createButton('jump', '⬆', actions, `
      position: absolute; right: 0; top: 50%; transform: translateY(-50%);
      width: ${btnSize}; height: ${btnSize};
    `);

    // Attack (A) - Dưới cùng
    this.createButton('attack', '⚔A', actions, `
      position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: ${btnSize}; height: ${btnSize};
    `);

    // Ultimate (S) - Trên cùng
    this.createButton('ultimate', '🔥S', actions, `
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: ${btnSize}; height: ${btnSize};
    `);

    // Soldier (D) - Bên Trái
    this.createButton('soldier', '🛡D', actions, `
      position: absolute; left: 0; top: 50%; transform: translateY(-50%);
      width: ${btnSize}; height: ${btnSize};
    `);

    // Interact (X) - Đặt cùng vị trí với Attack (A) vì dùng trong Lobby
    this.createButton('interact', '✋X', actions, `
      position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: ${btnSize}; height: ${btnSize};
    `);

    // ========================================
    // TOP-RIGHT BUTTONS (nhỏ, góc trên phải)
    // ========================================
    const topRight = this.createGroup('top-right', `
      position: absolute;
      top: max(12px, env(safe-area-inset-top));
      right: max(12px, env(safe-area-inset-right));
      display: flex;
      gap: 10px;
    `);
    this.createButton('stats', '📊', topRight, `
      position: relative;
      width: 44px; height: 44px; font-size: 16px;
    `);
    this.createButton('pause', '⏸', topRight, `
      position: relative;
      width: 44px; height: 44px; font-size: 16px;
    `);

    // ========================================
    // QUIZ ANSWER BUTTONS (giữa màn hình)
    // ========================================
    const quizGroup = this.createGroup('quiz', `
      position: absolute;
      right: max(40px, env(safe-area-inset-right));
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 16px;
    `);
    this.createButton('answerA', 'A', quizGroup, `
      position: relative;
      width: 70px; height: 60px; font-size: 24px; font-weight: bold;
    `);
    this.createButton('answerB', 'B', quizGroup, `
      position: relative;
      width: 70px; height: 60px; font-size: 24px; font-weight: bold;
    `);
    this.createButton('answerY', 'Vô Trận', quizGroup, `
      position: relative;
      width: 100px; height: 50px; font-size: 16px; font-weight: bold;
    `);
    this.createButton('answerN', 'Chưa', quizGroup, `
      position: relative;
      width: 100px; height: 50px; font-size: 16px; font-weight: bold;
    `);
  }

  private createGroup(id: string, style: string): HTMLDivElement {
    const group = document.createElement('div');
    group.id = `touch-group-${id}`;
    group.style.cssText = style;
    this.container.appendChild(group);
    return group;
  }

  private createButton(id: TouchButtonId, label: string, parent: HTMLElement, extraStyle: string): void {
    const btn = document.createElement('button');
    btn.id = `touch-btn-${id}`;
    btn.textContent = label;
    btn.style.cssText = `
      border: 1.5px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.05);
      box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.15), 0 2px 5px rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      color: rgba(255, 255, 255, 0.9);
      font-size: 18px;
      font-weight: bold;
      pointer-events: auto;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      display: flex;
      align-items: center;
      justify-content: center;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
      transition: all 0.1s ease;
      ${extraStyle}
    `;

    // Giữ hình chữ nhật bo tròn cho các nút không phải hình tròn
    if (extraStyle.includes('width: 65px') || id === 'answerA' || id === 'answerB' || id === 'answerY' || id === 'answerN') {
      btn.style.borderRadius = '14px';
    }

    const state: ButtonState = {
      isDown: false,
      justPressed: false,
      justReleased: false,
      element: btn,
    };

    // Pointer events cho multi-touch support
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.setPointerCapture(e.pointerId);
      state.isDown = true;
      state.justPressed = true;
      btn.style.transform = btn.style.transform.replace('scale(0.9)', '') + ' scale(0.9)';
      btn.style.background = 'rgba(255, 255, 255, 0.25)';
      btn.style.boxShadow = 'inset 0 0 15px rgba(255, 255, 255, 0.4), 0 0 8px rgba(255, 255, 255, 0.2)';
    });

    btn.addEventListener('pointerup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.releasePointerCapture(e.pointerId);
      state.isDown = false;
      state.justReleased = true;
      btn.style.transform = btn.style.transform.replace(' scale(0.9)', '');
      btn.style.background = '';
      btn.style.boxShadow = '';
    });

    btn.addEventListener('pointerleave', (e) => {
      e.preventDefault();
      if (state.isDown) {
        state.isDown = false;
        state.justReleased = true;
        btn.style.transform = btn.style.transform.replace(' scale(0.9)', '');
        btn.style.background = '';
        btn.style.boxShadow = '';
      }
    });

    btn.addEventListener('pointercancel', (e) => {
      e.preventDefault();
      if (state.isDown) {
        state.isDown = false;
        state.justReleased = true;
        btn.style.transform = btn.style.transform.replace(' scale(0.9)', '');
        btn.style.background = '';
        btn.style.boxShadow = '';
      }
    });

    // Ngăn context menu trên long press
    btn.addEventListener('contextmenu', (e) => e.preventDefault());

    this.buttons.set(id, state);
    parent.appendChild(btn);
  }

  /** Kiểm tra nút đang được giữ */
  isDown(id: TouchButtonId): boolean {
    return this.buttons.get(id)?.isDown ?? false;
  }

  /** Kiểm tra nút vừa được nhấn (chỉ true 1 frame) */
  justPressed(id: TouchButtonId): boolean {
    return this.buttons.get(id)?.justPressed ?? false;
  }

  /** Kiểm tra nút vừa được thả (chỉ true 1 frame) */
  justReleased(id: TouchButtonId): boolean {
    return this.buttons.get(id)?.justReleased ?? false;
  }

  /** Gọi ở cuối mỗi update() để reset trạng thái justPressed/justReleased */
  resetFrameState(): void {
    this.buttons.forEach((state) => {
      state.justPressed = false;
      state.justReleased = false;
    });
  }

  /** Đặt context để hiển thị/ẩn nút phù hợp cho từng scene */
  setContext(context: TouchContext): void {
    this.currentContext = context;

    if (!this.isTouchDevice) return;

    // Ẩn tất cả trước
    const allGroups = this.container.querySelectorAll<HTMLDivElement>('[id^="touch-group-"]');
    allGroups.forEach(g => g.style.display = 'none');

    // Ẩn tất cả nút cụ thể
    this.buttons.forEach(state => {
      state.element.style.display = 'none';
    });

    switch (context) {
      case 'lobby':
        this.showGroup('dpad');
        this.showGroup('actions');
        this.showButton('left');
        this.showButton('right');
        this.showButton('jump');
        this.showButton('interact');
        break;

      case 'game':
        this.showGroup('dpad');
        this.showGroup('actions');
        this.showGroup('top-right');
        this.showButton('left');
        this.showButton('right');
        this.showButton('jump');
        this.showButton('attack');
        this.showButton('ultimate');
        this.showButton('soldier');
        this.showButton('stats');
        this.showButton('pause');
        break;

      case 'quiz':
        this.showGroup('actions');
        this.showGroup('quiz');
        this.showButton('interact'); // Nut X (Back)
        this.showButton('answerA');
        this.showButton('answerB');
        break;

      case 'dialogueQuest':
        this.showGroup('quiz');
        this.showButton('answerY');
        this.showButton('answerN');
        break;

      case 'mainmenu':
        // Không hiện gì, tap màn hình để start
        break;

      case 'none':
      default:
        // Tất cả đã ẩn
        break;
    }
  }

  private showGroup(groupId: string): void {
    const el = document.getElementById(`touch-group-${groupId}`);
    if (el) el.style.display = '';
  }

  private showButton(id: TouchButtonId): void {
    const state = this.buttons.get(id);
    if (state) state.element.style.display = 'block';
  }

  /** Kiểm tra thiết bị có hỗ trợ touch hay không */
  get isMobile(): boolean {
    return this.isTouchDevice;
  }

  /** Hủy và dọn dẹp tất cả controls */
  destroy(): void {
    this.container.remove();
    this.buttons.clear();
  }
}
