/**
 * AccountModal
 * ---------------------------------------------------------------------------
 * A near-full-screen modal (z-index 20) activated by the account control. Uses
 * the same open/close animation pattern as NavModal. Placeholder layout only:
 * a header plus three labeled gray content blocks (sign-in form, create account
 * card, product sign-in card). Signed-in vs anonymous layouts are a Phase 2
 * iteration — for now a single placeholder layout.
 *
 * Mutual exclusivity with NavModal is coordinated in main.ts.
 */
import gsap from 'gsap';

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

    this.el.innerHTML = `
      <button class="modal-close" type="button" aria-label="Close account"><img src="/icons/ic_close.svg" alt="" aria-hidden="true" class="modal-close-icon" /></button>
      <div class="account-modal__inner">
        <h2>Account</h2>
        <div class="account-modal__grid">
          <div class="account-block">
            <h3>Sign in</h3>
            <p>Email + password form placeholder. "Forgot password" link. (Phase 2)</p>
          </div>
          <div class="account-block">
            <h3>Create account</h3>
            <p>New-user registration card with a primary call-to-action. (Phase 2)</p>
          </div>
          <div class="account-block">
            <h3>Product sign-in</h3>
            <p>Jump to a product console (BlueXP, Cloud Manager, Support Site). (Phase 2)</p>
          </div>
        </div>
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
