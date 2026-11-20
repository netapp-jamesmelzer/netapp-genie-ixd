/**
 * PersonaPicker
 * ---------------------------------------------------------------------------
 * Two inline, accessible dropdowns embedded directly in the persona sentence:
 *
 *   "I'm a [Chief Information Officer ▾] focused on [managing data at scale ▾]"
 *
 * Each dropdown is a plain-text trigger (cyan underline + down arrow) — no pill,
 * border, box, shadow or card. It is a custom ARIA listbox widget:
 *   - button with aria-haspopup="listbox" + aria-expanded
 *   - ul[role=listbox] with li[role=option]
 *   - keyboard: Enter/Space/ArrowDown open; Arrows/Home/End move; Enter/Space
 *     select; Escape closes and returns focus; Tab closes; outside click closes
 *
 * Changing either dropdown dispatches a `persona-change` CustomEvent on
 * document; main.ts listens and pings the account control.
 *
 * (The previous scroll-based collapse animation has been removed entirely.)
 */
import { iconUrl } from '../utils/assets';

interface DropdownConfig {
  /** Field name carried in the persona-change event. */
  field: string;
  /** Value of the inline slot's data-persona-dd attribute. */
  slot: string;
  /** Options, in order; index 0 is the default selection. */
  options: string[];
}

const CONFIGS: DropdownConfig[] = [
  {
    field: 'role',
    slot: 'role',
    options: [
      'Chief Information Officer',
      'Chief Data Officer',
      'VP Infrastructure/Operations',
      'Chief Information Security Officer',
      'DevOps Engineer',
      'Storage Engineer',
    ],
  },
  {
    field: 'goal',
    slot: 'goal',
    options: [
      'adopting AI safely and affordably',
      'managing data at scale',
      'migrating virtualization paradigms',
      'meeting regulatory requirements',
      'achieving consistent delivery across hybrid cloud',
    ],
  },
];

export class PersonaPicker {
  private dropdowns: PersonaDropdown[] = [];

  /** Build each dropdown and inject it into its inline slot in the sentence. */
  mount(): void {
    CONFIGS.forEach((cfg) => {
      const slot = document.querySelector<HTMLElement>(
        `[data-persona-dd="${cfg.slot}"]`
      );
      if (!slot) return;
      const dd = new PersonaDropdown(cfg);
      slot.appendChild(dd.el);
      this.dropdowns.push(dd);
    });
  }
}

class PersonaDropdown {
  readonly el: HTMLSpanElement;
  private readonly button: HTMLButtonElement;
  private readonly listbox: HTMLUListElement;
  private readonly textEl: HTMLSpanElement;
  private readonly options: string[];
  private readonly field: string;
  private readonly idBase: string;
  private selectedIndex = 0;
  private activeIndex = 0;
  private open = false;

  constructor(cfg: DropdownConfig) {
    this.options = cfg.options;
    this.field = cfg.field;
    this.idBase = `persona-dd-${cfg.field}`;

    this.el = document.createElement('span');
    this.el.className = 'persona-dd';

    // --- Trigger button ---
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'persona-dd__button';
    this.button.id = `${this.idBase}-button`;
    this.button.setAttribute('aria-haspopup', 'listbox');
    this.button.setAttribute('aria-expanded', 'false');
    this.button.setAttribute('aria-controls', `${this.idBase}-list`);

    this.textEl = document.createElement('span');
    this.textEl.className = 'persona-dd__text';
    this.textEl.textContent = this.options[this.selectedIndex];

    const arrow = document.createElement('img');
    arrow.src = iconUrl('ic_dropdown_arrow_down.svg');
    arrow.alt = '';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.className = 'persona-dd__arrow';

    this.button.append(this.textEl, arrow);

    // --- Listbox ---
    this.listbox = document.createElement('ul');
    this.listbox.className = 'persona-dd__list';
    this.listbox.id = `${this.idBase}-list`;
    this.listbox.setAttribute('role', 'listbox');
    this.listbox.tabIndex = -1;
    this.listbox.hidden = true;

    this.options.forEach((opt, i) => {
      const li = document.createElement('li');
      li.className = 'persona-dd__option';
      li.id = `${this.idBase}-opt-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === this.selectedIndex));
      li.textContent = opt;
      li.addEventListener('click', () => this.select(i));
      this.listbox.appendChild(li);
    });

    this.el.append(this.button, this.listbox);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.button.addEventListener('click', () => this.toggle());
    this.button.addEventListener('keydown', (e) => this.onButtonKeydown(e));
    this.listbox.addEventListener('keydown', (e) => this.onListKeydown(e));
    document.addEventListener('click', (e) => {
      if (this.open && !this.el.contains(e.target as Node)) this.close();
    });
  }

  private toggle(): void {
    this.open ? this.close() : this.openMenu();
  }

  private openMenu(): void {
    if (this.open) return;
    this.open = true;
    this.listbox.hidden = false;
    this.el.classList.add('is-open');
    this.button.setAttribute('aria-expanded', 'true');
    this.activeIndex = this.selectedIndex;
    this.updateActive();
    this.listbox.focus();
  }

  private close(returnFocus = false): void {
    if (!this.open) return;
    this.open = false;
    this.listbox.hidden = true;
    this.el.classList.remove('is-open');
    this.button.setAttribute('aria-expanded', 'false');
    if (returnFocus) this.button.focus();
  }

  private updateActive(): void {
    this.listbox.setAttribute(
      'aria-activedescendant',
      `${this.idBase}-opt-${this.activeIndex}`
    );
    Array.from(this.listbox.children).forEach((li, i) => {
      li.classList.toggle('is-active', i === this.activeIndex);
    });
    (this.listbox.children[this.activeIndex] as HTMLElement | undefined)?.scrollIntoView({
      block: 'nearest',
    });
  }

  private onButtonKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.openMenu();
        break;
    }
  }

  private onListKeydown(e: KeyboardEvent): void {
    const last = this.options.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.activeIndex = this.activeIndex >= last ? 0 : this.activeIndex + 1;
        this.updateActive();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.activeIndex = this.activeIndex <= 0 ? last : this.activeIndex - 1;
        this.updateActive();
        break;
      case 'Home':
        e.preventDefault();
        this.activeIndex = 0;
        this.updateActive();
        break;
      case 'End':
        e.preventDefault();
        this.activeIndex = last;
        this.updateActive();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.select(this.activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  private select(index: number): void {
    this.selectedIndex = index;
    this.textEl.textContent = this.options[index];
    Array.from(this.listbox.children).forEach((li, i) => {
      li.setAttribute('aria-selected', String(i === index));
    });
    this.close(true);
    document.dispatchEvent(
      new CustomEvent('persona-change', {
        detail: { field: this.field, value: this.options[index] },
      })
    );
  }
}
