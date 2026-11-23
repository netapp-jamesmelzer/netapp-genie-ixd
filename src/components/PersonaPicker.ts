/**
 * PersonaPicker
 * ---------------------------------------------------------------------------
 * Inline, accessible dropdowns embedded directly in persona sentences:
 *
 *   "I'm a [Chief Information Officer ▾]
 *    focused on [adopting AI safely and affordably ▾]"
 *
 * Each dropdown is a plain-text trigger (cyan underline + cyan drop arrow) — no
 * pill, border, box, shadow or card. It is a custom ARIA listbox widget:
 *   - button with aria-haspopup="listbox" + aria-expanded
 *   - ul[role=listbox] with li[role=option]
 *   - keyboard: Enter/Space/ArrowDown open; Arrows/Home/End move; Enter/Space
 *     select; Escape closes and returns focus; Tab closes; outside click closes
 *
 * Dropdowns are bound to the shared persona store (src/state/persona.ts), so
 * the page picker and the Account Modal stay in sync. `PersonaDropdown` is
 * exported for reuse by AccountModal.
 *
 * Live text: any element with [data-persona-text="<field>"] shows the current
 * value, and [data-persona-article="<field>"] shows "a"/"an" for it.
 *
 * Saved status (`createPersonaStatus`): a row under each persona form that
 * appears on the first change — "[SAVED] We'll customize your site experience
 * based on this choice." The form never hides (people will play with it);
 * each further change re-acknowledges the save with a quick tag pulse.
 */
import gsap from 'gsap';
import { iconUrl } from '../utils/assets';
import {
  PERSONA_OPTIONS,
  articleFor,
  getPersona,
  setPersona,
  type PersonaChangeDetail,
  type PersonaField,
  type PersonaSource,
} from '../state/persona';

export class PersonaPicker {
  /** Build each page dropdown, inject it into its inline slot, bind live text. */
  mount(): void {
    document.querySelectorAll<HTMLElement>('main.page [data-persona-dd]').forEach((slot) => {
      const field = slot.dataset.personaDd as PersonaField;
      if (!PERSONA_OPTIONS[field]) return;
      slot.appendChild(new PersonaDropdown(field, 'page').el);
    });
    document.querySelector('.persona__sentence')?.after(createPersonaStatus('page'));
    bindPersonaText(document);
  }
}

/**
 * The "[SAVED] We'll customize…" row shown under a persona form. Space is
 * reserved from the start (visibility only), so revealing it never shifts the
 * form. A change made in this form animates the row in (or pulses the tag if
 * it is already showing); a change made in the *other* form just marks this
 * one as saved, without animating, since the choice is shared.
 */
export function createPersonaStatus(source: PersonaSource): HTMLElement {
  const el = document.createElement('p');
  el.className = 'persona-status';
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <span class="persona-status__tag">Saved</span>
    <span class="persona-status__text">We’ll customize your site experience based on this choice.</span>
  `;
  const tag = el.querySelector('.persona-status__tag') as HTMLSpanElement;
  const text = el.querySelector('.persona-status__text') as HTMLSpanElement;

  document.addEventListener('persona-change', (e) => {
    const local = (e as CustomEvent<PersonaChangeDetail>).detail.source === source;
    const wasShown = el.classList.contains('is-shown');
    el.classList.add('is-shown');
    if (!local) return;

    if (!wasShown) {
      gsap
        .timeline({ delay: 0.12 })
        .fromTo(
          tag,
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.2)' }
        )
        .fromTo(
          text,
          { x: -12, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
          '-=0.15'
        );
    } else {
      // Already saved once: a quick pulse acknowledges the new choice.
      gsap.fromTo(
        tag,
        { scale: 1.18 },
        { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' }
      );
      gsap.fromTo(text, { opacity: 0.35 }, { opacity: 1, duration: 0.4, ease: 'power1.out' });
    }
  });
  return el;
}

/** Keep [data-persona-text] / [data-persona-article] in sync with the store. */
export function bindPersonaText(root: ParentNode): void {
  const render = (): void => {
    root.querySelectorAll<HTMLElement>('[data-persona-text]').forEach((el) => {
      el.textContent = getPersona(el.dataset.personaText as PersonaField);
    });
    root.querySelectorAll<HTMLElement>('[data-persona-article]').forEach((el) => {
      const word = getPersona(el.dataset.personaArticle as PersonaField);
      const article = articleFor(word);
      // Preserve a leading capital ("A"/"An") if the markup starts capitalised.
      el.textContent = /^[A-Z]/.test(el.textContent ?? '')
        ? article[0].toUpperCase() + article.slice(1)
        : article;
    });
  };
  render();
  document.addEventListener('persona-change', render);
}

let instanceCount = 0;

export class PersonaDropdown {
  readonly el: HTMLSpanElement;
  private readonly button: HTMLButtonElement;
  private readonly listbox: HTMLUListElement;
  private readonly textEl: HTMLSpanElement;
  private readonly options: string[];
  private readonly idBase: string;
  private selectedIndex: number;
  private activeIndex: number;
  private open = false;

  constructor(
    private readonly field: PersonaField,
    private readonly source: PersonaSource
  ) {
    this.options = PERSONA_OPTIONS[field];
    this.idBase = `persona-dd-${field}-${++instanceCount}`;
    this.selectedIndex = Math.max(0, this.options.indexOf(getPersona(field)));
    this.activeIndex = this.selectedIndex;

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

    // Cyan drop arrow: the SVG is used as a mask so it can take any color.
    const arrow = document.createElement('span');
    arrow.className = 'persona-dd__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.style.setProperty('--icon', `url('${iconUrl('ic_dropdown_arrow_down.svg')}')`);

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
    // Reflect changes made by other dropdowns bound to the same field.
    document.addEventListener('persona-change', (e) => {
      const { field, value } = (e as CustomEvent<PersonaChangeDetail>).detail;
      if (field !== this.field) return;
      const i = this.options.indexOf(value);
      if (i >= 0 && i !== this.selectedIndex) this.render(i);
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

  close(returnFocus = false): void {
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
        e.stopPropagation(); // don't also close a modal this dropdown lives in
        this.close(true);
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  private render(index: number): void {
    this.selectedIndex = index;
    this.textEl.textContent = this.options[index];
    Array.from(this.listbox.children).forEach((li, i) => {
      li.setAttribute('aria-selected', String(i === index));
    });
  }

  private select(index: number): void {
    this.render(index);
    this.close(true);
    setPersona(this.field, this.options[index], this.source);
  }
}
