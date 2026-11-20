/**
 * NavBar
 * ---------------------------------------------------------------------------
 * A fixed wrapper (z-index 40) holding two independently positioned children:
 *   - .nav-pill    : centered pill with a placeholder logo + menu control
 *   - .nav-account : a round account control floating to the right
 *
 * Behavior:
 *   - Not sticky. Hides on scroll-down, reappears on scroll-up (GSAP + a single
 *     ScrollTrigger onUpdate using self.getVelocity() + direction, with a small
 *     travel threshold so tiny jitters don't trigger it).
 *   - Menu control toggles active state (label swaps to "Close").
 *   - Account control has an .is-active (persistent outline) and .is-pinging
 *     (brief outline flash) state. pingAccount() plays the flash.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export class NavBar {
  readonly wrapper: HTMLDivElement;
  readonly menuBtn: HTMLButtonElement;
  readonly accountBtn: HTMLButtonElement;

  /** Callbacks wired by main.ts. */
  onMenuClick: () => void = () => {};
  onAccountClick: () => void = () => {};

  private lastScrollY = 0;
  private hidden = false;

  constructor() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'nav-bar-wrapper';
    this.wrapper.innerHTML = `
      <div class="nav-bar-inner">
        <div class="nav-pill">
          <span class="nav-logo">NetApp</span>
          <button class="menu-btn" type="button" aria-expanded="false" aria-label="Open navigation menu">
            <span class="menu-btn-label menu-btn-label--open">Menu</span>
            <span class="menu-btn-label menu-btn-label--close">Close</span>
          </button>
        </div>
        <button class="nav-account" type="button" aria-label="Account" aria-expanded="false">
          <span aria-hidden="true">JM</span>
        </button>
      </div>
    `;

    this.menuBtn = this.wrapper.querySelector('.menu-btn') as HTMLButtonElement;
    this.accountBtn = this.wrapper.querySelector('.nav-account') as HTMLButtonElement;

    this.menuBtn.addEventListener('click', () => this.onMenuClick());
    this.accountBtn.addEventListener('click', () => this.onAccountClick());
  }

  /** Mount into the DOM and start scroll-direction tracking. */
  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.wrapper);
    this.lastScrollY = window.scrollY;
    this.initScrollBehavior();
  }

  // -- Menu control active state -------------------------------------------
  setMenuActive(active: boolean): void {
    this.menuBtn.classList.toggle('is-active', active);
    this.menuBtn.setAttribute('aria-expanded', String(active));
  }

  // -- Account control active state ----------------------------------------
  setAccountActive(active: boolean): void {
    this.accountBtn.classList.toggle('is-active', active);
    this.accountBtn.setAttribute('aria-expanded', String(active));
  }

  /**
   * Ping the account control: a brief blue outline flash. Used when a Persona
   * Picker selection changes, and at the end of the picker collapse animation.
   */
  pingAccount(): void {
    const btn = this.accountBtn;
    btn.classList.add('is-pinging');
    gsap
      .timeline({
        onComplete: () => {
          btn.classList.remove('is-pinging');
          // Restore persistent active outline if the account modal is open.
          if (!btn.classList.contains('is-active')) {
            gsap.set(btn, { outline: '3px solid transparent' });
          }
        },
      })
      .to(btn, { outline: '3px solid var(--color-ping)', duration: 0.1 })
      .to(btn, { outline: '3px solid transparent', duration: 0.4, delay: 0.4 });
  }

  // -- Scroll hide/show -----------------------------------------------------
  private initScrollBehavior(): void {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const currentY = window.scrollY;
        const delta = currentY - this.lastScrollY;

        // Ignore tiny jitters (< 3px of travel).
        if (Math.abs(delta) < 3) return;

        const velocity = self.getVelocity();
        const scrollingDown = velocity > 0 && delta > 0;
        const scrollingUp = velocity < 0 && delta < 0;

        // Always reveal when near the very top.
        if (currentY < this.wrapperRevealThreshold()) {
          this.show();
        } else if (scrollingDown) {
          this.hide();
        } else if (scrollingUp) {
          this.show();
        }

        this.lastScrollY = currentY;
      },
    });
  }

  private wrapperRevealThreshold(): number {
    return 16;
  }

  private hide(): void {
    if (this.hidden) return;
    this.hidden = true;
    gsap.to(this.wrapper, {
      yPercent: -120,
      duration: 0.3,
      ease: 'power2.in',
      overwrite: 'auto',
    });
  }

  private show(): void {
    if (!this.hidden) return;
    this.hidden = false;
    gsap.to(this.wrapper, {
      yPercent: 0,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }
}
