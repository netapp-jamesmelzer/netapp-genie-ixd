/**
 * NavModal
 * ---------------------------------------------------------------------------
 * A near-full-screen modal (z-index 20) activated by the nav menu control.
 * Contents use a "side-tabs" metaphor: 5 vertical tab buttons on the left, each
 * revealing a panel of 10 placeholder links on the right. Clicking a tab just
 * toggles classes (no GSAP). Open/close is a GSAP fade+scale.
 *
 * Clicking any link (or the close X) dismisses the modal — main.ts also closes
 * the AI Chat Modal so a nav click dismisses everything.
 */
import gsap from 'gsap';

interface NavTab {
  label: string;
  links: string[];
}

const NAV_TABS: NavTab[] = [
  {
    label: 'Products',
    links: [
      'Cloud Storage',
      'Data Management',
      'Block & File Storage',
      'Object Storage',
      'Backup & Recovery',
      'Ransomware Protection',
      'Observability',
      'Kubernetes Storage',
      'AI Data Engine',
      'All Products',
    ],
  },
  {
    label: 'Solutions',
    links: [
      'Hybrid Cloud',
      'Multicloud',
      'AI & Analytics',
      'Virtual Desktops',
      'Databases',
      'DevOps & CI/CD',
      'Disaster Recovery',
      'Cost Optimization',
      'Edge & IoT',
      'Industry Solutions',
    ],
  },
  {
    label: 'Resources',
    links: [
      'Documentation',
      'Knowledge Base',
      'Blog',
      'Webinars',
      'Case Studies',
      'White Papers',
      'Community',
      'Training & Certification',
      'Events',
      'Developer Hub',
    ],
  },
  {
    label: 'Support',
    links: [
      'Open a Case',
      'Downloads',
      'Product Lifecycle',
      'System Status',
      'Security Advisories',
      'Professional Services',
      'Managed Services',
      'Partner Support',
      'Contact Support',
      'Support Plans',
    ],
  },
  {
    label: 'Company',
    links: [
      'About NetApp',
      'Leadership',
      'Careers',
      'Newsroom',
      'Investor Relations',
      'Sustainability',
      'Partners',
      'Customers',
      'Legal & Trust',
      'Contact Us',
    ],
  },
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

    const tabsMarkup = NAV_TABS.map(
      (tab, i) =>
        `<button class="tab-btn${i === 0 ? ' is-active' : ''}" type="button" data-tab="${i}">${tab.label}</button>`
    ).join('');

    const panelsMarkup = NAV_TABS.map(
      (tab, i) =>
        `<div class="tab-panel${i === 0 ? ' is-active' : ''}" data-panel="${i}">${tab.links
          .map((link) => `<a href="#" data-nav-link>${tab.label} &rsaquo; ${link}</a>`)
          .join('')}</div>`
    ).join('');

    this.el.innerHTML = `
      <button class="modal-close" type="button" aria-label="Close navigation">&times;</button>
      <div class="nav-modal__inner">
        <nav class="nav-modal__tabs" aria-label="Navigation sections">${tabsMarkup}</nav>
        <div class="nav-modal__panels">${panelsMarkup}</div>
      </div>
    `;

    // Close button.
    (this.el.querySelector('.modal-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.onClose()
    );

    // Side-tab switching (simple class toggle).
    this.el.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.activateTab(Number(btn.dataset.tab)));
    });

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

  private activateTab(index: number): void {
    this.el.querySelectorAll<HTMLElement>('.tab-btn').forEach((btn) => {
      btn.classList.toggle('is-active', Number(btn.dataset.tab) === index);
    });
    this.el.querySelectorAll<HTMLElement>('.tab-panel').forEach((panel) => {
      panel.classList.toggle('is-active', Number(panel.dataset.panel) === index);
    });
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
