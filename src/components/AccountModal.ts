/**
 * AccountModal
 * ---------------------------------------------------------------------------
 * A near-full-screen modal (z-index 20) activated by the account control.
 * Figma ("Account modal", 1:727):
 *   - Background: account.mp4 looping video under two 20% black scrims.
 *   - "Tell us about yourself" intro (small white note type), then the
 *     persona sentence on three centered lines, each an inline dropdown bound
 *     to the shared persona store (edits here update the page picker too):
 *       I'm a/an [role ▾] / focused on [goal ▾] / in the [industry ▾]
 *   - Under the sentence, the shared "[SAVED] We'll customize…" status row
 *     (createPersonaStatus) — the form stays editable.
 *   - Three translucent cards (cyan eyebrow + body link): Dashboard, Account,
 *     Console.
 *   - Plain close X, top-right.
 *   - The sticky AI prompt (z 30) sits over the bottom; layout reserves room.
 *
 * Open/close: fade + scale, then the sentence lines and cards stagger in.
 * Mutual exclusivity with NavModal is coordinated in main.ts.
 */
import gsap from 'gsap';
import { iconUrl, mediaUrl } from '../utils/assets';
import { PersonaDropdown, bindPersonaText, createPersonaStatus } from './PersonaPicker';
import type { PersonaField } from '../state/persona';

interface AccountCard {
  eyebrow: string;
  body: string;
  link: string;
}

const ACCOUNT_CARDS: AccountCard[] = [
  { eyebrow: 'Dashboard', body: 'Access support, communities and trainings,', link: 'Sign in' },
  { eyebrow: 'Account', body: 'Don’t have an account?', link: 'Click here to create an account' },
  { eyebrow: 'Console', body: 'Monitor and run hybrid cloud data services,', link: 'NetApp Console' },
];

export class AccountModal {
  readonly el: HTMLDivElement;
  private readonly video: HTMLVideoElement;
  private readonly dropdowns: PersonaDropdown[] = [];
  private isOpen = false;

  onClose: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'app-modal account-modal';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-label', 'Account and preferences');

    const cardsMarkup = ACCOUNT_CARDS.map(
      (c) => `
      <a href="#" class="account-card" data-account-link>
        <span class="account-card__eyebrow">${c.eyebrow}</span>
        <span class="account-card__body">${c.body} <span class="account-card__link">${c.link}&nbsp;→</span></span>
      </a>`
    ).join('');

    this.el.innerHTML = `
      <div class="account-modal__bg" aria-hidden="true">
        <video class="account-modal__video" muted loop playsinline preload="metadata"></video>
      </div>
      <button class="modal-close" type="button" aria-label="Close account">
        <img src="${iconUrl('ic_close_large.svg')}" alt="" aria-hidden="true" class="modal-close-icon" />
      </button>
      <div class="account-modal__inner">
        <div class="account-modal__persona">
          <p class="account-modal__intro persona-note">Tell us about yourself</p>
          <p class="account-modal__line">I’m <span data-persona-article="role">a</span> <span data-account-dd="role"></span></p>
          <p class="account-modal__line">focused on <span data-account-dd="goal"></span></p>
          <p class="account-modal__line">in the <span data-account-dd="industry"></span></p>
        </div>
        <div class="account-modal__grid">${cardsMarkup}</div>
      </div>
    `;

    this.video = this.el.querySelector('.account-modal__video') as HTMLVideoElement;
    this.video.src = mediaUrl('account.mp4');

    this.el.querySelectorAll<HTMLElement>('[data-account-dd]').forEach((slot) => {
      const dd = new PersonaDropdown(slot.dataset.accountDd as PersonaField, 'account');
      slot.appendChild(dd.el);
      this.dropdowns.push(dd);
    });
    this.el.querySelector('.account-modal__persona')?.appendChild(createPersonaStatus('account'));
    bindPersonaText(this.el);

    (this.el.querySelector('.modal-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.onClose()
    );
    this.el.querySelectorAll('[data-account-link]').forEach((a) =>
      a.addEventListener('click', (e) => e.preventDefault())
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
    void this.video.play().catch(() => {});

    const lines = this.el.querySelectorAll('.account-modal__intro, .account-modal__line');
    const cards = this.el.querySelectorAll('.account-card');
    gsap
      .timeline({ defaults: { overwrite: 'auto' } })
      .fromTo(
        this.el,
        { opacity: 0, scale: 0.97, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
      .fromTo(
        lines,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.06 },
        0.1
      )
      .fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.06,
          // Drop the inline transform so the CSS hover lift can apply.
          clearProps: 'transform',
        },
        0.25
      );
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.dropdowns.forEach((dd) => dd.close());
    gsap.to(this.el, {
      opacity: 0,
      scale: 0.97,
      y: 8,
      duration: 0.3,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: () => {
        this.el.style.display = 'none';
        this.video.pause();
      },
    });
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }
}
