/**
 * PersonaPicker
 * ---------------------------------------------------------------------------
 * An in-page personalization control (two inline dropdowns) injected early in
 * the page, right after the hero. Two behaviors:
 *
 *   1. Changing either dropdown dispatches a `persona-change` CustomEvent on
 *      document. main.ts listens and pings the account control.
 *
 *   2. Scroll collapse (GSAP ScrollTrigger): when the picker scrolls out of view
 *      upward, the text fades fast, then the shape compresses rightward
 *      (scaleX -> 0, transform-origin right center) — it shrinks in place rather
 *      than flying to the nav. When it scrolls back in, it expands and the text
 *      fades back. After a collapse, the account control is pinged
 *      (onCollapseComplete), reinforcing where the animation "ended".
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export class PersonaPicker {
  readonly el: HTMLDivElement;
  private collapsed = false;

  /** Wired by main.ts -> NavBar.pingAccount(). */
  onCollapseComplete: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'persona-picker';
    this.el.innerHTML = `
      <div class="persona-picker-field">
        <label class="persona-picker-labels" for="persona-role">Role</label>
        <select id="persona-role" data-persona="role">
          <option value="it-admin">IT Admin</option>
          <option value="developer">Developer</option>
          <option value="executive">Executive</option>
          <option value="procurement">Procurement</option>
        </select>
      </div>
      <div class="persona-picker-field">
        <label class="persona-picker-labels" for="persona-industry">Industry</label>
        <select id="persona-industry" data-persona="industry">
          <option value="financial-services">Financial Services</option>
          <option value="healthcare">Healthcare</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="retail">Retail</option>
        </select>
      </div>
    `;

    this.el.querySelectorAll<HTMLSelectElement>('select').forEach((select) => {
      select.addEventListener('change', () => {
        document.dispatchEvent(
          new CustomEvent('persona-change', {
            detail: { field: select.dataset.persona, value: select.value },
          })
        );
      });
    });
  }

  /** Inject into the page slot and register the collapse ScrollTrigger. */
  mount(slotId = 'persona-picker-slot'): void {
    const slot = document.getElementById(slotId);
    if (slot) {
      slot.appendChild(this.el);
    } else {
      document.body.appendChild(this.el);
    }
    this.initScrollCollapse();
  }

  private get textEls(): HTMLElement[] {
    return Array.from(
      this.el.querySelectorAll<HTMLElement>('.persona-picker-labels, select')
    );
  }

  private initScrollCollapse(): void {
    ScrollTrigger.create({
      trigger: this.el,
      // Fire while the picker is still partially visible (bottom edge 20% from
      // the top of the viewport), so the fade + compress is seen before it exits.
      start: 'bottom 20%',
      end: 'bottom 20%',
      onLeave: () => this.collapse(),
      onEnterBack: () => this.expand(),
    });
  }

  private collapse(): void {
    if (this.collapsed) return;
    this.collapsed = true;

    const tl = gsap.timeline({
      onComplete: () => this.onCollapseComplete(),
    });
    // 1. Text/options fade out fast.
    tl.to(this.textEls, { opacity: 0, duration: 0.15 })
      // 2. Shape compresses rightward.
      .to(this.el, {
        scaleX: 0,
        transformOrigin: 'right center',
        duration: 0.4,
        ease: 'power2.in',
      });
  }

  private expand(): void {
    if (!this.collapsed) return;
    this.collapsed = false;

    gsap.killTweensOf([this.el, ...this.textEls]);
    const tl = gsap.timeline();
    // 1. Shape expands back.
    tl.to(this.el, {
      scaleX: 1,
      transformOrigin: 'right center',
      duration: 0.3,
      ease: 'power2.out',
    })
      // 2. Text/options fade back in.
      .to(this.textEls, { opacity: 1, duration: 0.2, delay: 0.2 }, 0);
  }
}
