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
 * Active states follow Figma: the menu control's pill (or the account
 * control) takes the "selected" fill while its modal is open; the "Explore"
 * label does not change. The account control also has .is-pinging (brief cyan
 * outline flash) played by pingAccount().
 *
 * Theme: the glass nav floats over dark video, white sections and mixes of
 * both, so it switches between a dark theme (white text) and a light theme
 * (#1E252F text). Page surfaces declare what they are with
 * [data-nav-theme="dark" | "light"]; a ScrollTrigger per surface reports
 * which one is behind the nav's vertical centre line, in both scroll
 * directions. A surface may change its own data-nav-theme (e.g. the story
 * after its video fades to white); the nav re-reads it. setThemeOverride()
 * pins a theme while a modal is open.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { iconUrl, mediaUrl } from '../utils/assets';

type NavState = 'flow' | 'revealed' | 'hidden';
export type NavTheme = 'dark' | 'light';

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
  private surface: HTMLElement | null = null;
  private themeOverride: NavTheme | null = null;

  constructor() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'nav-bar-wrapper';
    this.wrapper.innerHTML = `
      <div class="nav-bar-inner">
        <div class="nav-group">
          <div class="nav-pill">
            <span class="nav-logo icon-mask" role="img" aria-label="NetApp" style="--icon: url('${mediaUrl('NetApp-Logo.svg')}')"></span>
            <span class="nav-divider" aria-hidden="true"></span>
            <button class="menu-btn" type="button" aria-expanded="false" aria-label="Explore — site navigation">
              <span class="menu-btn-label">Explore</span>
              <span class="nav-icon icon-mask" aria-hidden="true" style="--icon: url('${iconUrl('ic_menu.svg')}')"></span>
            </button>
          </div>
          <button class="nav-account" type="button" aria-label="Account" aria-expanded="false">
            <span class="nav-icon icon-mask" aria-hidden="true" style="--icon: url('${iconUrl('ic_user.svg')}')"></span>
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
    this.initTheme();
  }

  // -- Theme (dark/light from the surface behind the nav) ------------------

  /** Force a theme (e.g. while a modal is open); null returns to auto. */
  setThemeOverride(theme: NavTheme | null): void {
    this.themeOverride = theme;
    this.applyTheme();
  }

  private applyTheme(): void {
    const surfaceTheme: NavTheme = this.surface?.dataset.navTheme === 'light' ? 'light' : 'dark';
    this.wrapper.dataset.theme = this.themeOverride ?? surfaceTheme;
  }

  private initTheme(): void {
    // The nav's vertical centre: top offset + half the pill (Figma 24 + 78/2).
    const line = (): number => {
      const pill = this.wrapper.querySelector('.nav-pill') as HTMLElement;
      const top = parseFloat(getComputedStyle(this.wrapper.querySelector('.nav-bar-inner')!).paddingTop) || 24;
      return Math.round(top + pill.offsetHeight / 2);
    };
    const surfaces = document.querySelectorAll<HTMLElement>('[data-nav-theme]');
    surfaces.forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: () => `top ${line()}px`,
        end: () => `bottom ${line()}px`,
        onToggle: (self) => {
          if (!self.isActive) return;
          this.surface = el;
          this.applyTheme();
        },
      });
    });
    // A surface flipping its own theme while it's behind the nav.
    const mo = new MutationObserver(() => this.applyTheme());
    surfaces.forEach((el) => mo.observe(el, { attributes: true, attributeFilter: ['data-nav-theme'] }));
    this.applyTheme();
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
