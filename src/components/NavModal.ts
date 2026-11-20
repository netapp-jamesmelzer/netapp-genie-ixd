/**
 * NavModal
 * ---------------------------------------------------------------------------
 * A near-full-screen modal (z-index 20) activated by the nav "Explore" control.
 * Figma layout: a solid dark-purple panel with three columns of F37Judge Thin
 * links — one large primary column and two smaller secondary columns.
 *
 * Clicking any link (or the close X) dismisses the modal — main.ts also closes
 * the AI Chat Modal so a nav click dismisses everything. Open/close is a GSAP
 * fade + scale.
 */
import gsap from 'gsap';
import { iconUrl } from '../utils/assets';

/** Primary (large) column links. */
const PRIMARY_LINKS: string[] = [
  'Platform',
  'Storage',
  'Data Services',
  'Solutions',
  'Support',
  'Resources',
];

/** Secondary columns — `''` denotes a visual gap between groups. */
const SECONDARY_COL_1: string[] = [
  'Customer Stories',
  'Partnerships',
  'Thought Leadership',
  'Communities',
  'Product Updates',
  '',
  'How to Buy',
  'Test Drive a Product',
  'Find a Partner',
];

const SECONDARY_COL_2: string[] = [
  'Blogs',
  'Careers',
  'Investors',
  '',
  'Technical Support',
  'Developers',
  'Downloads',
  'Training',
];

export class NavModal {
  readonly el: HTMLDivElement;
  private isOpen = false;

  /** Callbacks wired by main.ts. */
  onClose: () => void = () => {};
  onLinkClick: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'app-modal nav-modal';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-label', 'Site navigation');

    const primaryMarkup = PRIMARY_LINKS.map(
      (link) => `<a href="#" data-nav-link class="nav-modal__link--lg">${link}</a>`
    ).join('');

    const secondaryMarkup = (items: string[]): string =>
      items
        .map((link) =>
          link === ''
            ? '<span class="nav-modal__gap" aria-hidden="true"></span>'
            : `<a href="#" data-nav-link class="nav-modal__link--sm">${link}</a>`
        )
        .join('');

    this.el.innerHTML = `
      <button class="modal-close" type="button" aria-label="Close navigation"><img src="${iconUrl('ic_close.svg')}" alt="" aria-hidden="true" class="modal-close-icon" /></button>
      <div class="nav-modal__inner">
        <nav class="nav-modal__col nav-modal__col--primary" aria-label="Primary">${primaryMarkup}</nav>
        <nav class="nav-modal__col nav-modal__col--secondary" aria-label="Secondary">${secondaryMarkup(SECONDARY_COL_1)}</nav>
        <nav class="nav-modal__col nav-modal__col--secondary" aria-label="More">${secondaryMarkup(SECONDARY_COL_2)}</nav>
      </div>
    `;

    // Close button.
    (this.el.querySelector('.modal-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.onClose()
    );

    // Link clicks dismiss the modal(s).
    this.el.querySelectorAll<HTMLAnchorElement>('a[data-nav-link]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault(); // demo links are inert
        this.onLinkClick();
      });
    });
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.el);
  }

  get opened(): boolean {
    return this.isOpen;
  }

  /** Open with fade + scale + slight rise. */
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

  /** Close: fade + scale down, then hide. */
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
