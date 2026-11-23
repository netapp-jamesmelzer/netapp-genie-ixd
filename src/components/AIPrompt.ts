/**
 * AIPrompt
 * ---------------------------------------------------------------------------
 * The sticky AI prompt box floating at the bottom of the viewport (z-index 30).
 *
 * Three size states, each set via GSAP inline height on the textarea:
 *   huge  (initial, 5 rows = 125px) — the first view
 *   large (3 rows = 75px)           — collapsed by ScrollTrigger on first scroll
 *                                     past the hero; never returns to huge
 *   small (1 row = 25px)            — toggled by the collapse/expand control
 *
 * Transitions:
 *   huge  → large  : ScrollTrigger fires once when the hero bottom passes 70% vp
 *   large → small  : user clicks collapse button
 *   small → large  : user clicks expand button
 *   huge  → large  : also fires if user clicks the toggle while still huge,
 *                    or when any modal opens (leaveHuge(), wired in main.ts)
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { iconUrl } from '../utils/assets';

type SizeState = 'huge' | 'large' | 'small';

export class AIPrompt {
  readonly el: HTMLDivElement;
  readonly textarea: HTMLTextAreaElement;
  private readonly sizeToggle: HTMLButtonElement;
  private readonly sizeToggleIcon: HTMLImageElement;
  private readonly sendBtn: HTMLButtonElement;
  private sizeState: SizeState = 'huge';

  /** Pixel heights for each state (line-height 25px × n lines). */
  private readonly HEIGHTS: Record<SizeState, number> = {
    huge: 125,
    large: 75,
    small: 25,
  };

  /** Wired by main.ts; receives the submitted prompt text. */
  onSubmit: (text: string) => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ai-prompt is-huge';
    this.el.innerHTML = `
      <div class="ai-prompt__top">
        <img src="${iconUrl('ic_AI.svg')}" alt="" aria-hidden="true" class="prompt-icon" />
        <textarea
          class="ai-prompt__textarea"
          rows="5"
          placeholder="What data and infrastructure challenge are you looking to solve today?"
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
    this.publishStackHeight();
    // Lock initial huge height via GSAP inline style (overrides rows attr).
    gsap.set(this.textarea, { height: this.HEIGHTS.huge });
    // Collapse huge → large the first time the hero section scrolls past 70% of viewport.
    ScrollTrigger.create({
      trigger: '#moment-1',
      start: 'bottom 70%',
      once: true,
      onEnter: () => {
        if (this.sizeState === 'huge') this.transitionTo('large');
      },
    });
  }

  /**
   * Publish --prompt-stack on :root: the distance from the viewport bottom to
   * the prompt's top edge. The footer and the AI chat thread pad by it so
   * content can always scroll clear of the sticky prompt. Kept live with a
   * ResizeObserver (the prompt height animates between size states).
   */
  private publishStackHeight(): void {
    const update = (): void => {
      const stack = window.innerHeight - this.el.getBoundingClientRect().top;
      document.documentElement.style.setProperty('--prompt-stack', `${Math.ceil(stack)}px`);
    };
    new ResizeObserver(update).observe(this.el);
    window.addEventListener('resize', update);
    update();
  }

  /**
   * Step down from the first-view "huge" state (no-op otherwise). Called when
   * any modal opens so the prompt doesn't cover modal content; like the scroll
   * trigger, it never returns to huge.
   */
  leaveHuge(): void {
    if (this.sizeState === 'huge') this.transitionTo('large');
  }

  /** Swap the placeholder (e.g. while the AI chat modal is open). */
  setPlaceholder(text: string): void {
    this.textarea.placeholder = text;
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
    // huge → large | large → small | small → large
    const next: SizeState =
      this.sizeState === 'huge'
        ? 'large'
        : this.sizeState === 'large'
          ? 'small'
          : 'large';
    this.transitionTo(next);
  }

  private transitionTo(state: SizeState): void {
    const prev = this.sizeState;
    this.sizeState = state;

    this.el.classList.toggle('is-huge', state === 'huge');
    this.el.classList.toggle('is-small', state === 'small');

    // Slightly longer for the dramatic scroll-triggered huge→large collapse.
    const duration = prev === 'huge' && state === 'large' ? 0.5 : 0.25;

    gsap.to(this.textarea, {
      height: this.HEIGHTS[state],
      duration,
      ease: 'power2.inOut',
      overwrite: 'auto',
    });

    this.updateToggleIcon(state);
  }

  private updateToggleIcon(state: SizeState): void {
    // Show expand icon when small (click will expand); collapse icon otherwise.
    this.sizeToggleIcon.src =
      state === 'small' ? iconUrl('ic_expand.svg') : iconUrl('ic_collapse.svg');
  }
}
