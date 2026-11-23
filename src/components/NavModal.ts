/**
 * NavModal
 * ---------------------------------------------------------------------------
 * A near-full-screen modal (z-index 20) activated by the nav "Explore" control.
 * Figma ("nav modal", 1:785): deep-purple panel over the menu.jpg backdrop,
 * three columns of F37Judge Thin links — one large primary column (57px) and
 * two secondary columns (22px) with blank-line gaps between groups — and a
 * plain close X top-right.
 *
 * Clicking any link (or the close X) dismisses the modal — main.ts also closes
 * the AI Chat Modal so a nav click dismisses everything. Open is a GSAP fade +
 * scale followed by a quick column-by-column stagger of the links.
 */
import gsap from 'gsap';
import { iconUrl, mediaUrl } from '../utils/assets';

/** Primary (large) column links. */
const PRIMARY_LINKS: string[] = [
  'Platform',
  'Storage',
  'Data Services',
  'Solutions',
  'Support',
  'Resources',
];

/** Secondary columns — `''` denotes a one-line gap between groups. */
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
  'Contact Sales',
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
      <div class="nav-modal__bg" aria-hidden="true"></div>
      <button class="modal-close" type="button" aria-label="Close navigation">
        <img src="${iconUrl('ic_close_large.svg')}" alt="" aria-hidden="true" class="modal-close-icon" />
      </button>
      <div class="nav-modal__inner">
        <nav class="nav-modal__col nav-modal__col--primary" aria-label="Primary">${primaryMarkup}</nav>
        <nav class="nav-modal__col nav-modal__col--secondary" aria-label="Secondary">${secondaryMarkup(SECONDARY_COL_1)}</nav>
        <nav class="nav-modal__col nav-modal__col--secondary" aria-label="More">${secondaryMarkup(SECONDARY_COL_2)}</nav>
      </div>
    `;

    (this.el.querySelector('.nav-modal__bg') as HTMLDivElement).style.backgroundImage =
      `url('${mediaUrl('menu.jpg')}')`;

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

  /** Open with fade + scale + slight rise, then stagger the link columns in. */
  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.el.style.display = 'flex';

    const cols = Array.from(this.el.querySelectorAll('.nav-modal__col'));
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    tl.fromTo(
      this.el,
      { opacity: 0, scale: 0.97, y: 8 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    );
    cols.forEach((col, i) => {
      tl.fromTo(
        col.querySelectorAll('a'),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.03 },
        0.08 + i * 0.06
      );
    });
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
