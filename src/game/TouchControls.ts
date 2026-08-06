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
  | 'answerA' | 'answerB';

type ButtonState = {
  isDown: boolean;
  justPressed: boolean;
  justReleased: boolean;
  element: HTMLButtonElement;
};

export type TouchContext = 'none' | 'mainmenu' | 'lobby' | 'game' | 'quiz';

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
      background: rgba(255, 255, 255, 0.25);
    `);

    // Attack (A) - Dưới cùng
    this.createButton('attack', '⚔A', actions, `
      position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: ${btnSize}; height: ${btnSize};
      background: rgba(200, 50, 50, 0.6);
      border-color: rgba(255, 100, 100, 0.5);
    `);

    // Ultimate (S) - Trên cùng
    this.createButton('ultimate', '🔥S', actions, `
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: ${btnSize}; height: ${btnSize};
      background: rgba(200, 130, 0, 0.6);
      border-color: rgba(255, 180, 50, 0.5);
    `);

    // Soldier (D) - Bên Trái
    this.createButton('soldier', '🛡D', actions, `
      position: absolute; left: 0; top: 50%; transform: translateY(-50%);
      width: ${btnSize}; height: ${btnSize};
      background: rgba(50, 150, 50, 0.6);
      border-color: rgba(100, 200, 100, 0.5);
    `);

    // Interact (X) - Đặt cùng vị trí với Attack (A) vì dùng trong Lobby
    this.createButton('interact', '✋X', actions, `
      position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: ${btnSize}; height: ${btnSize};
      background: rgba(60, 60, 200, 0.6);
      border-color: rgba(100, 100, 255, 0.5);
    `);

    // (Đã xóa nút SPACE theo yêu cầu)

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
      background: rgba(80, 80, 80, 0.5);
      border-color: rgba(150, 150, 150, 0.3);
    `);
    this.createButton('pause', '⏸', topRight, `
      position: relative;
      width: 44px; height: 44px; font-size: 16px;
      background: rgba(80, 80, 80, 0.5);
      border-color: rgba(150, 150, 150, 0.3);
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
      background: rgba(0, 110, 190, 0.7);
      border-color: rgba(80, 170, 255, 0.6);
    `);
    this.createButton('answerB', 'B', quizGroup, `
      position: relative;
      width: 70px; height: 60px; font-size: 24px; font-weight: bold;
      background: rgba(190, 110, 0, 0.7);
      border-color: rgba(255, 180, 60, 0.6);
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
      border: 2px solid rgba(255,255,255,0.35);
      border-radius: 50%;
      color: white;
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
      text-shadow: 0 1px 3px rgba(0,0,0,0.6);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
      transition: transform 0.05s ease;
      ${extraStyle}
    `;

    // Giữ hình chữ nhật bo tròn cho các nút không phải hình tròn
    if (extraStyle.includes('width: 65px') || id === 'answerA' || id === 'answerB') {
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
      btn.style.opacity = '1';
      btn.style.transform = btn.style.transform.replace('scale(0.9)', '') + ' scale(0.9)';
      if (!btn.dataset.origBg) btn.dataset.origBg = btn.style.background;
      btn.style.background = btn.dataset.origBg.replace(/[\d.]+\)$/, '0.85)');
    });

    btn.addEventListener('pointerup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.releasePointerCapture(e.pointerId);
      state.isDown = false;
      state.justReleased = true;
      btn.style.opacity = '';
      btn.style.transform = btn.style.transform.replace(' scale(0.9)', '');
      if (btn.dataset.origBg) btn.style.background = btn.dataset.origBg;
    });

    btn.addEventListener('pointerleave', (e) => {
      e.preventDefault();
      if (state.isDown) {
        state.isDown = false;
        state.justReleased = true;
        btn.style.opacity = '';
        btn.style.transform = btn.style.transform.replace(' scale(0.9)', '');
        if (btn.dataset.origBg) btn.style.background = btn.dataset.origBg;
      }
    });

    btn.addEventListener('pointercancel', (e) => {
      e.preventDefault();
      if (state.isDown) {
        state.isDown = false;
        state.justReleased = true;
        btn.style.opacity = '';
        btn.style.transform = btn.style.transform.replace(' scale(0.9)', '');
        if (btn.dataset.origBg) btn.style.background = btn.dataset.origBg;
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
        this.showGroup('dpad');
        this.showGroup('actions');
        this.showGroup('quiz');
        this.showButton('left');
        this.showButton('right');
        this.showButton('jump');
        this.showButton('answerA');
        this.showButton('answerB');
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
