/**
 * NavBar
 * ---------------------------------------------------------------------------
 * A nav bar holding a centered .nav-group (frosted pill with logo + "Explore"
 * menu control, plus a round account control).
 *
 * The nav is NOT sticky and NOT permanently fixed:
 *   - At the top of the page it sits in normal document flow and scrolls away
 *     with the content.
 *   - Once it has fully left the viewport, scrolling UP reveals it in a
 *     temporarily fixed position at the top (slides down into view).
 *   - Scrolling DOWN slides it back out of view.
 *   - Returning to the top restores its in-flow position (not floating).
 *
 * A .nav-spacer sibling is grown to the nav's height while the nav is fixed, so
 * pulling the nav out of flow never changes the document height (no jump).
 *
 * Menu control toggles active state (label swaps to "Close"). The account
 * control has .is-active (persistent outline) and .is-pinging (brief flash)
 * states; pingAccount() plays the flash.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { iconUrl, mediaUrl } from '../utils/assets';

type NavState = 'flow' | 'revealed' | 'hidden';

export class NavBar {
  readonly wrapper: HTMLDivElement;
  readonly spacer: HTMLDivElement;
  readonly menuBtn: HTMLButtonElement;
  readonly accountBtn: HTMLButtonElement;

  /** Callbacks wired by main.ts. */
  onMenuClick: () => void = () => {};
  onAccountClick: () => void = () => {};

  private lastScrollY = 0;
  private navHeight = 0;
  private state: NavState = 'flow';
  private pageEl: HTMLElement | null = null;

  constructor() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'nav-bar-wrapper';
    this.wrapper.innerHTML = `
      <div class="nav-bar-inner">
        <div class="nav-group">
          <div class="nav-pill">
            <img src="${mediaUrl('NetApp-Logo.svg')}" alt="NetApp" class="nav-logo-img" />
            <button class="menu-btn" type="button" aria-expanded="false" aria-label="Open navigation menu">
              <span class="menu-btn-label menu-btn-label--open">Explore</span>
              <span class="menu-btn-label menu-btn-label--close">Close</span>
              <img src="${iconUrl('ic_menu.svg')}" alt="" aria-hidden="true" class="nav-icon menu-icon--open" />
              <img src="${iconUrl('ic_close.svg')}" alt="" aria-hidden="true" class="nav-icon menu-icon--close" />
            </button>
          </div>
          <button class="nav-account" type="button" aria-label="Account" aria-expanded="false">
            <img src="${iconUrl('ic_user.svg')}" alt="" aria-hidden="true" class="nav-icon" />
          </button>
        </div>
      </div>
    `;

    // Keeps the nav's flow height reserved while the nav is temporarily fixed.
    this.spacer = document.createElement('div');
    this.spacer.className = 'nav-spacer';

    this.menuBtn = this.wrapper.querySelector('.menu-btn') as HTMLButtonElement;
    this.accountBtn = this.wrapper.querySelector('.nav-account') as HTMLButtonElement;

    this.menuBtn.addEventListener('click', () => this.onMenuClick());
    this.accountBtn.addEventListener('click', () => this.onAccountClick());
  }

  /** Mount at the top of the page flow (before the scrollable content). */
  mount(parent: HTMLElement = document.body): void {
    const page = parent.querySelector('.page');
    if (page) {
      parent.insertBefore(this.wrapper, page);
      parent.insertBefore(this.spacer, page);
      this.pageEl = page as HTMLElement;
    } else {
      parent.insertBefore(this.wrapper, parent.firstChild);
      this.wrapper.after(this.spacer);
      this.pageEl = document.querySelector('main.page');
    }
    this.lastScrollY = window.scrollY;
    this.initScrollBehavior();
  }

  /**
   * Tuck the page content up under the nav. The nav sits in normal flow, so it
   * would otherwise push .page down and leave a blank gap above the hero. We
   * pull .page up by the nav's height so the hero starts at the very top with
   * the nav floating over it (nav z-index 40 > hero ~1). When the nav later
   * goes fixed, the spacer grows to the same height and cancels this offset,
   * keeping the layout stable.
   */
  private applyPageOffset(): void {
    if (this.pageEl) this.pageEl.style.marginTop = `-${this.navHeight}px`;
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
   * Picker selection changes.
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

  // -- Scroll reveal/hide (non-sticky) -------------------------------------
  private initScrollBehavior(): void {
    // Measure on the next frame so the nav has laid out (accurate offsetHeight),
    // then tuck the page up under it.
    requestAnimationFrame(() => {
      this.measure();
      this.applyPageOffset();
    });
    window.addEventListener('resize', () => {
      // Re-measure only while in flow (fixed/hidden keep the same box height).
      if (this.state === 'flow') {
        this.measure();
        this.applyPageOffset();
      }
    });

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: () => this.onScroll(),
    });
    this.onScroll();
  }

  private measure(): void {
    this.navHeight = this.wrapper.offsetHeight;
  }

  private onScroll(): void {
    const currentY = window.scrollY;
    const delta = currentY - this.lastScrollY;

    // Ignore sub-pixel jitter (keep lastScrollY so small moves accumulate).
    if (Math.abs(delta) < 3) return;

    // Within the nav's own height band, the nav belongs in normal flow.
    if (currentY <= this.navHeight) {
      this.resetToFlow();
    } else if (delta < 0) {
      this.reveal(); // scrolling up, past the nav -> slide in (fixed)
    } else {
      this.slideAway(); // scrolling down -> slide out (if currently revealed)
    }

    this.lastScrollY = currentY;
  }

  /** Temporarily fix the nav at the top and slide it into view. */
  private reveal(): void {
    if (this.state === 'revealed') return;
    this.spacer.style.height = `${this.navHeight}px`;
    // Place it fixed + off-screen first, force a reflow, then slide in so the
    // transition always animates from above (no flash at y=0).
    this.wrapper.classList.add('is-fixed', 'is-hidden');
    void this.wrapper.offsetHeight;
    this.wrapper.classList.remove('is-hidden');
    this.state = 'revealed';
  }

  /** Slide the fixed nav back out of view (no-op if it is in flow). */
  private slideAway(): void {
    if (this.state !== 'revealed') return;
    this.wrapper.classList.add('is-hidden');
    this.state = 'hidden';
  }

  /** Return the nav to its natural in-flow position at the top of the page. */
  private resetToFlow(): void {
    if (this.state === 'flow') return;
    this.wrapper.classList.remove('is-fixed', 'is-hidden');
    this.spacer.style.height = '0px';
    this.state = 'flow';
  }
}
