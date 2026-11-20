/**
 * AIPrompt
 * ---------------------------------------------------------------------------
 * The sticky AI prompt box floating at the bottom of the viewport (z-index 30,
 * above the AI Chat Modal so it looks integrated with it).
 *
 *   - A size toggle (upper-right) switches between large (3 lines) and small
 *     (1 line) height, animated with GSAP.
 *   - Focus adds .is-focused to the container -> CSS shows the focus outline.
 *   - Submitting (Enter without Shift, or the send button) with non-empty text
 *     fires onSubmit(text) and clears the textarea.
 */
import gsap from 'gsap';
import { iconUrl } from '../utils/assets';

export class AIPrompt {
  readonly el: HTMLDivElement;
  readonly textarea: HTMLTextAreaElement;
  private readonly sizeToggle: HTMLButtonElement;
  private readonly sizeToggleIcon: HTMLImageElement;
  private readonly sendBtn: HTMLButtonElement;
  private isLarge = true;

  /** Wired by main.ts; receives the submitted prompt text. */
  onSubmit: (text: string) => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ai-prompt';
    this.el.innerHTML = `
      <div class="ai-prompt__top">
        <img src="${iconUrl('ic_AI.svg')}" alt="" aria-hidden="true" class="prompt-icon" />
        <textarea
          class="ai-prompt__textarea"
          rows="3"
          placeholder="Ask NetApp Genie anything…"
          aria-label="AI prompt input"
        ></textarea>
        <button class="send-btn" type="button" aria-label="Send prompt">
          <img src="${iconUrl('ic_arrow_right.svg')}" alt="" aria-hidden="true" class="send-icon" />
        </button>
      </div>
      <div class="ai-prompt__bottom">
        <span class="quick-action-chip">Solve problems</span>
        <button class="size-toggle" type="button" aria-label="Toggle prompt size" title="Toggle size">
          <img src="${iconUrl('ic_collapse.svg')}" alt="" aria-hidden="true" class="size-toggle-icon" />
        </button>
      </div>
    `;

    this.textarea = this.el.querySelector('.ai-prompt__textarea') as HTMLTextAreaElement;
    this.sizeToggle = this.el.querySelector('.size-toggle') as HTMLButtonElement;
    this.sizeToggleIcon = this.el.querySelector('.size-toggle-icon') as HTMLImageElement;
    this.sendBtn = this.el.querySelector('.send-btn') as HTMLButtonElement;

    // Focus outline.
    this.textarea.addEventListener('focus', () => this.el.classList.add('is-focused'));
    this.textarea.addEventListener('blur', () => this.el.classList.remove('is-focused'));

    // Submit on Enter (without Shift).
    this.textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submit();
      }
    });

    this.sendBtn.addEventListener('click', () => this.submit());
    this.sizeToggle.addEventListener('click', () => this.toggleSize());
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.el);
  }

  /** Bounding rect of the prompt box — used by the chat modal to expand from. */
  getRect(): DOMRect {
    return this.el.getBoundingClientRect();
  }

  private submit(): void {
    const text = this.textarea.value.trim();
    if (!text) return;
    this.textarea.value = '';
    this.onSubmit(text);
  }

  private toggleSize(): void {
    this.isLarge = !this.isLarge;
    this.el.classList.toggle('is-small', !this.isLarge);
    this.textarea.rows = this.isLarge ? 3 : 1;
    this.updateToggleIcon(this.isLarge);
    // Animate the textarea height between large (3 lines) and small (1 line).
    // The bubble itself grows/shrinks to fit (flex column, auto height).
    gsap.to(this.textarea, {
      height: this.isLarge ? 75 : 25,
      duration: 0.25,
      ease: 'power2.inOut',
      overwrite: 'auto',
    });
  }

  /**
   * Swap the size-toggle icon to reflect the action a click will perform:
   * large -> show collapse (click collapses to small),
   * small -> show expand (click expands to large).
   */
  private updateToggleIcon(isLarge: boolean): void {
    this.sizeToggleIcon.src = isLarge
      ? iconUrl('ic_collapse.svg')
      : iconUrl('ic_expand.svg');
  }
}
