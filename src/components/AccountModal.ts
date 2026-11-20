/**
 * AccountModal
 * ---------------------------------------------------------------------------
 * A near-full-screen modal (z-index 20) activated by the account control. Figma
 * layout: a dark gradient panel with a centered persona-recap sentence and a
 * three-section card grid, each section fronted by a cyan eyebrow label.
 *
 * Uses the same open/close animation pattern as NavModal. Mutual exclusivity
 * with NavModal is coordinated in main.ts.
 */
import gsap from 'gsap';
import { iconUrl } from '../utils/assets';

interface AccountSection {
  eyebrow: string;
  body: string;
}

const ACCOUNT_SECTIONS: AccountSection[] = [
  {
    eyebrow: 'Dashboard',
    body: 'Access support, communities and trainings. Sign in →',
  },
  {
    eyebrow: 'Account',
    body: "Don't have an account? Click here to create an account →",
  },
  {
    eyebrow: 'Console',
    body: 'Monitor and run hybrid cloud data services. NetApp Console →',
  },
];

export class AccountModal {
  readonly el: HTMLDivElement;
  private isOpen = false;

  onClose: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'app-modal account-modal';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-label', 'Account');

    const cardsMarkup = ACCOUNT_SECTIONS.map(
      (s) => `
      <div class="account-block">
        <p class="eyebrow account-block__eyebrow">${s.eyebrow}</p>
        <p class="account-block__body">${s.body}</p>
      </div>`
    ).join('');

    this.el.innerHTML = `
      <button class="modal-close" type="button" aria-label="Close account"><img src="${iconUrl('ic_close.svg')}" alt="" aria-hidden="true" class="modal-close-icon" /></button>
      <div class="account-modal__inner">
        <p class="account-modal__recap">
          I'm an <span class="persona-chip">information architect</span> focused on
          <span class="persona-chip">managing data at scale</span> in the
          <span class="persona-chip">space industry</span>.
        </p>
        <div class="account-modal__grid">${cardsMarkup}</div>
      </div>
    `;

    (this.el.querySelector('.modal-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.onClose()
    );
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.el);
  }

  get opened(): boolean {
    return this.isOpen;
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.el.style.display = 'flex';
    gsap.fromTo(
      this.el,
      { opacity: 0, scale: 0.97, y: 8 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      }
    );
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    gsap.to(this.el, {
      opacity: 0,
      scale: 0.97,
      y: 8,
      duration: 0.3,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: () => {
        this.el.style.display = 'none';
      },
    });
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }
}
