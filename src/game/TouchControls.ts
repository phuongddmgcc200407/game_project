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
    // === D-PAD (Góc dưới trái) ===
    const dpad = this.createGroup('dpad', `
      position: absolute; bottom: 20px; left: 15px;
      display: grid;
      grid-template-columns: 65px 65px 65px;
      grid-template-rows: 65px 65px;
      gap: 4px;
    `);

    // Row 1: [empty] [jump] [empty]
    dpad.appendChild(this.createSpacer());
    this.createButton('jump', '⬆', dpad, '');
    dpad.appendChild(this.createSpacer());

    // Row 2: [left] [empty] [right]
    this.createButton('left', '◀', dpad, '');
    dpad.appendChild(this.createSpacer());
    this.createButton('right', '▶', dpad, '');

    // === ACTION BUTTONS (Góc dưới phải) ===
    const actions = this.createGroup('actions', `
      position: absolute; bottom: 20px; right: 15px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: flex-end;
    `);

    // Hàng 1: A + S
    const row1 = document.createElement('div');
    row1.style.cssText = 'display: flex; gap: 6px;';
    this.createButton('attack', '⚔A', row1, 'background: rgba(220,50,50,0.55);');
    this.createButton('ultimate', '🔥S', row1, 'background: rgba(220,140,0,0.55);');
    actions.appendChild(row1);

    // Hàng 2: D + X
    const row2 = document.createElement('div');
    row2.style.cssText = 'display: flex; gap: 6px;';
    this.createButton('soldier', '🛡D', row2, 'background: rgba(50,160,50,0.55);');
    this.createButton('interact', '✋X', row2, 'background: rgba(80,80,220,0.55);');
    actions.appendChild(row2);

    // Hàng 3: SPACE (dùng cho next dialogue, level complete, etc.)
    const row3 = document.createElement('div');
    row3.style.cssText = 'display: flex; gap: 6px;';
    this.createButton('space', 'SPACE', row3, 'background: rgba(150,150,150,0.55); width: 134px;');
    actions.appendChild(row3);

    // === TOP-RIGHT BUTTONS (Góc trên phải) ===
    const topRight = this.createGroup('top-right', `
      position: absolute; top: 12px; right: 15px;
      display: flex; gap: 6px;
    `);
    this.createButton('stats', '📊C', topRight, 'width: 55px; height: 40px; font-size: 13px; background: rgba(100,100,100,0.55);');
    this.createButton('pause', '⏸', topRight, 'width: 55px; height: 40px; font-size: 16px; background: rgba(100,100,100,0.55);');

    // === QUIZ ANSWER BUTTONS (Hiển thị khi quiz active) ===
    const quizGroup = this.createGroup('quiz', `
      position: absolute; bottom: 160px; right: 15px;
      display: flex; gap: 8px;
    `);
    this.createButton('answerA', 'A', quizGroup, 'width: 70px; height: 55px; font-size: 22px; background: rgba(0,120,200,0.65); font-weight: bold;');
    this.createButton('answerB', 'B', quizGroup, 'width: 70px; height: 55px; font-size: 22px; background: rgba(200,120,0,0.65); font-weight: bold;');
  }

  private createGroup(id: string, style: string): HTMLDivElement {
    const group = document.createElement('div');
    group.id = `touch-group-${id}`;
    group.style.cssText = style;
    this.container.appendChild(group);
    return group;
  }

  private createSpacer(): HTMLDivElement {
    const spacer = document.createElement('div');
    spacer.style.cssText = 'width: 65px; height: 65px;';
    return spacer;
  }

  private createButton(id: TouchButtonId, label: string, parent: HTMLElement, extraStyle: string): void {
    const btn = document.createElement('button');
    btn.id = `touch-btn-${id}`;
    btn.textContent = label;
    btn.style.cssText = `
      width: 65px; height: 65px;
      border: 2px solid rgba(255,255,255,0.4);
      border-radius: 12px;
      background: rgba(255,255,255,0.2);
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
      btn.style.transform = 'scale(0.92)';
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
