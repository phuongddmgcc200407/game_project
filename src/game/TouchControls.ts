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
  | 'answerA' | 'answerB' | 'space';

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
    const btnSizeSm = '44px';
    const gap = '6px';

    // ========================================
    // D-PAD (Góc dưới trái) — Layout ngang
    // ========================================
    const dpad = this.createGroup('dpad', `
      position: absolute;
      bottom: env(safe-area-inset-bottom, 8px);
      left: env(safe-area-inset-left, 8px);
      bottom: max(8px, env(safe-area-inset-bottom));
      left: max(8px, env(safe-area-inset-left));
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${gap};
    `);

    // Hàng trên: nút Nhảy (⬆) — canh giữa
    const dpadRow1 = document.createElement('div');
    dpadRow1.style.cssText = `display: flex; justify-content: center; width: 100%;`;
    this.createButton('jump', '⬆', dpadRow1, `width: ${btnSize}; height: ${btnSize};`);
    dpad.appendChild(dpadRow1);

    // Hàng dưới: ◀ ▶ cạnh nhau
    const dpadRow2 = document.createElement('div');
    dpadRow2.style.cssText = `display: flex; gap: ${gap};`;
    this.createButton('left', '◀', dpadRow2, `width: ${btnSize}; height: ${btnSize};`);
    this.createButton('right', '▶', dpadRow2, `width: ${btnSize}; height: ${btnSize};`);
    dpad.appendChild(dpadRow2);

    // ========================================
    // ACTION BUTTONS (Góc dưới phải) — Layout compact
    // ========================================
    const actions = this.createGroup('actions', `
      position: absolute;
      bottom: env(safe-area-inset-bottom, 8px);
      right: env(safe-area-inset-right, 8px);
      bottom: max(8px, env(safe-area-inset-bottom));
      right: max(8px, env(safe-area-inset-right));
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: ${gap};
    `);

    // Hàng 1: A + S (tấn công chính)
    const actRow1 = document.createElement('div');
    actRow1.style.cssText = `display: flex; gap: ${gap};`;
    this.createButton('attack', '⚔A', actRow1, `
      width: ${btnSize}; height: ${btnSize};
      background: rgba(200, 50, 50, 0.6);
      border-color: rgba(255, 100, 100, 0.5);
    `);
    this.createButton('ultimate', '🔥S', actRow1, `
      width: ${btnSize}; height: ${btnSize};
      background: rgba(200, 130, 0, 0.6);
      border-color: rgba(255, 180, 50, 0.5);
    `);
    actions.appendChild(actRow1);

    // Hàng 2: D + X (hỗ trợ)
    const actRow2 = document.createElement('div');
    actRow2.style.cssText = `display: flex; gap: ${gap};`;
    this.createButton('soldier', '🛡D', actRow2, `
      width: ${btnSize}; height: ${btnSize};
      background: rgba(50, 150, 50, 0.6);
      border-color: rgba(100, 200, 100, 0.5);
    `);
    this.createButton('interact', '✋X', actRow2, `
      width: ${btnSize}; height: ${btnSize};
      background: rgba(60, 60, 200, 0.6);
      border-color: rgba(100, 100, 255, 0.5);
    `);
    actions.appendChild(actRow2);

    // Hàng 3: SPACE (rộng, canh giữa hàng)
    const actRow3 = document.createElement('div');
    actRow3.style.cssText = `display: flex; gap: ${gap}; width: 100%;`;
    this.createButton('space', 'SPACE', actRow3, `
      width: calc(${btnSize} * 2 + ${gap});
      height: ${btnSizeSm};
      font-size: 13px;
      background: rgba(120, 120, 120, 0.5);
      border-color: rgba(180, 180, 180, 0.4);
    `);
    actions.appendChild(actRow3);

    // ========================================
    // TOP-RIGHT BUTTONS (nhỏ, góc trên phải)
    // ========================================
    const topRight = this.createGroup('top-right', `
      position: absolute;
      top: max(8px, env(safe-area-inset-top));
      right: max(8px, env(safe-area-inset-right));
      display: flex;
      gap: ${gap};
    `);
    this.createButton('stats', '📊', topRight, `
      width: ${btnSizeSm}; height: 36px; font-size: 16px;
      background: rgba(80, 80, 80, 0.5);
      border-color: rgba(150, 150, 150, 0.3);
    `);
    this.createButton('pause', '⏸', topRight, `
      width: ${btnSizeSm}; height: 36px; font-size: 16px;
      background: rgba(80, 80, 80, 0.5);
      border-color: rgba(150, 150, 150, 0.3);
    `);

    // ========================================
    // QUIZ ANSWER BUTTONS (giữa bên phải, chỉ khi quiz)
    // ========================================
    const quizGroup = this.createGroup('quiz', `
      position: absolute;
      right: max(8px, env(safe-area-inset-right));
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 8px;
    `);
    this.createButton('answerA', 'A', quizGroup, `
      width: 64px; height: 52px; font-size: 22px; font-weight: bold;
      background: rgba(0, 110, 190, 0.7);
      border-color: rgba(80, 170, 255, 0.6);
    `);
    this.createButton('answerB', 'B', quizGroup, `
      width: 64px; height: 52px; font-size: 22px; font-weight: bold;
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
      width: 56px; height: 56px;
      border: 2px solid rgba(255,255,255,0.35);
      border-radius: 14px;
      background: rgba(255,255,255,0.18);
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
      btn.style.transform = 'scale(0.9)';
      btn.style.background = btn.style.background.replace(/[\d.]+\)$/, '0.85)');
    });

    btn.addEventListener('pointerup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.releasePointerCapture(e.pointerId);
      state.isDown = false;
      state.justReleased = true;
      btn.style.opacity = '';
      btn.style.transform = '';
    });

    btn.addEventListener('pointerleave', (e) => {
      e.preventDefault();
      if (state.isDown) {
        state.isDown = false;
        state.justReleased = true;
        btn.style.opacity = '';
        btn.style.transform = '';
      }
    });

    btn.addEventListener('pointercancel', (e) => {
      e.preventDefault();
      if (state.isDown) {
        state.isDown = false;
        state.justReleased = true;
        btn.style.opacity = '';
        btn.style.transform = '';
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
        this.showButton('space');
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
        this.showButton('space');
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
        this.showButton('space');
        this.showButton('answerA');
        this.showButton('answerB');
        break;

      case 'mainmenu':
        this.showGroup('actions');
        this.showButton('space');
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
    if (state) state.element.style.display = 'flex';
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
