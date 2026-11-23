/**
 * SlideSnap
 * ---------------------------------------------------------------------------
 * Turns hero → persona picker into a "slide": a small, intentional scroll
 * glides the page to a fixed stopping point, and built-in slack keeps the user
 * from blowing past it. The scrubbed ScrollScenes (hero exit, persona entrance,
 * stage push-in/dim) play during the glide, so it reads as one transition.
 *
 * Stops:  HERO = 0   ·   PERSONA = top of #moment-2 (persona fills the view)
 *
 * Behavior
 *   - From the hero (or anywhere between the stops), scrolling down with
 *     intent glides to PERSONA; scrolling up glides to HERO.
 *   - Coming back up from below while the persona is still in view glides to
 *     PERSONA first (it's a stop in both directions); one more up → HERO.
 *   - Slack, part 1 — momentum: wheel events during the glide are swallowed,
 *     and so is the trailing trackpad/mouse momentum after arrival (events
 *     arriving < momentumGapMs apart, capped at maxHoldMs).
 *   - Slack, part 2 — resistance: at PERSONA, the first slackPx of fresh
 *     downward scroll is absorbed (the content gives a few px, then springs
 *     back) before normal scrolling resumes.
 *   - Keyboard (↓ ↑ PgDn PgUp Space) and touch swipes snap the same way; a
 *     scroll that comes to rest between the stops (scrollbar drag, etc.)
 *     settles to the stop in its direction of travel.
 *   - Inactive while a modal has the page scroll-locked, and for wheel events
 *     inside an open persona list or a scrollable textarea.
 */
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

/** Feel knobs — tune here. */
const CONFIG = {
  /** Accumulated wheel delta (px) that counts as intent to move. */
  intentPx: 6,
  /** Touch travel (px) that counts as a swipe. */
  touchIntentPx: 24,
  /** Glide duration (s) and ease. */
  duration: 1.1,
  ease: 'power3.inOut',
  /** Wheel events closer together than this are one gesture's momentum. */
  momentumGapMs: 140,
  /** Never absorb momentum longer than this after arriving. */
  maxHoldMs: 1600,
  /** Downward scroll absorbed at the persona stop before scrolling resumes. */
  slackPx: 160,
  /** Pause that resets the slack counter. */
  slackResetMs: 450,
  /** How far the persona content "gives" while absorbing slack (px). */
  slackGivePx: 18,
  /** Below PERSONA, scrolling up within this fraction of a viewport snaps back to it. */
  returnZone: 0.85,
  /** Pixel tolerance for "at a stop". */
  tol: 2,
};

type Target = number | 'slack' | null;

export class SlideSnap {
  private persona!: HTMLElement;
  private giveEl!: HTMLElement;

  private animating = false;
  private holdUntil = 0;
  private holdCap = 0;
  private lastWheelAt = 0;

  private intentAcc = 0;
  private intentAt = 0;

  private slackAcc = 0;
  private slackAt = 0;
  private slackReleased = false;

  private touchY = 0;
  private touchHandled = false;

  private lastY = 0;
  private lastDir = 0;
  private settleTimer = 0;

  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  mount(): void {
    const persona = document.querySelector<HTMLElement>('#moment-2');
    const give = document.querySelector<HTMLElement>('#moment-2 .persona__content');
    if (!persona || !give) return;
    this.persona = persona;
    this.giveEl = give;
    this.lastY = window.scrollY;

    window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    window.addEventListener('keydown', (e) => this.onKey(e));
    window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
  }

  // -- Geometry -------------------------------------------------------------

  /** The persona stop, measured live (layout can shift with fonts/resizes). */
  private get personaStop(): number {
    return Math.round(this.persona.getBoundingClientRect().top + window.scrollY);
  }

  /** Where a move in `dir` (+1 down, −1 up) from `y` should go. */
  private targetFor(y: number, dir: number): Target {
    const stop = this.personaStop;
    const { tol } = CONFIG;
    if (dir > 0) {
      if (y < stop - tol) return stop;
      if (Math.abs(y - stop) <= tol) return 'slack';
      return null;
    }
    if (y <= tol) return null;
    if (y <= stop + tol) return 0;
    if (y < stop + window.innerHeight * CONFIG.returnZone) return stop;
    return null;
  }

  // -- Input ----------------------------------------------------------------

  private isLocked(): boolean {
    return document.documentElement.classList.contains('is-scroll-locked');
  }

  private ignoreTarget(target: EventTarget | null): boolean {
    const el = target as Element | null;
    if (!el?.closest) return false;
    if (el.closest('.persona-dd__list')) return true;
    const ta = el.closest('textarea');
    return !!ta && ta.scrollHeight > ta.clientHeight;
  }

  private onWheel(e: WheelEvent): void {
    if (this.isLocked() || e.ctrlKey || this.ignoreTarget(e.target)) return;

    const now = performance.now();
    const gap = now - this.lastWheelAt;
    this.lastWheelAt = now;
    const dy =
      e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if (dy === 0) return;

    // Slack 1: swallow input during the glide and its trailing momentum.
    if (this.animating) {
      e.preventDefault();
      return;
    }
    if (now < this.holdUntil) {
      e.preventDefault();
      if (gap < CONFIG.momentumGapMs) {
        this.holdUntil = Math.min(now + CONFIG.momentumGapMs, this.holdCap);
      }
      return;
    }

    const dir = Math.sign(dy);
    const target = this.targetFor(window.scrollY, dir);

    if (target === 'slack') {
      this.absorbSlack(e, dy, now);
      return;
    }
    if (target === null) return;

    // Small but deliberate: accumulate same-direction delta until it counts.
    if (now - this.intentAt > 200 || Math.sign(this.intentAcc) !== dir) this.intentAcc = 0;
    this.intentAt = now;
    this.intentAcc += dy;
    e.preventDefault();
    if (Math.abs(this.intentAcc) >= CONFIG.intentPx) {
      this.intentAcc = 0;
      this.glideTo(target);
    }
  }

  /** Slack 2: resist the first slackPx of downward scroll at the persona stop. */
  private absorbSlack(e: WheelEvent, dy: number, now: number): void {
    if (now - this.slackAt > CONFIG.slackResetMs) {
      this.slackAcc = 0;
      this.slackReleased = false;
    }
    this.slackAt = now;
    if (this.slackReleased) return; // let native scrolling continue
    this.slackAcc += dy;
    if (this.slackAcc < CONFIG.slackPx) {
      e.preventDefault();
      const give = (this.slackAcc / CONFIG.slackPx) * CONFIG.slackGivePx;
      gsap.to(this.giveEl, { '--slack-give': `${-give}px`, duration: 0.15, overwrite: true });
      gsap.to(this.giveEl, {
        '--slack-give': '0px',
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
        delay: 0.18,
      });
    } else {
      this.slackReleased = true;
      gsap.to(this.giveEl, { '--slack-give': '0px', duration: 0.3, overwrite: true });
    }
  }

  private onKey(e: KeyboardEvent): void {
    if (this.isLocked() || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const el = document.activeElement as HTMLElement | null;
    if (el?.closest('input, textarea, select, [contenteditable], [role="listbox"]')) return;
    // Space on a focused button/link activates it; leave that alone.
    if (e.key === ' ' && el?.closest('button, a')) return;

    let dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1;
    if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
    if (!dir) return;

    if (this.animating) {
      e.preventDefault();
      return;
    }
    const target = this.targetFor(window.scrollY, dir);
    if (typeof target === 'number') {
      e.preventDefault();
      this.glideTo(target);
    }
  }

  private onTouchStart(e: TouchEvent): void {
    this.touchY = e.touches[0]?.clientY ?? 0;
    this.touchHandled = false;
  }

  private onTouchMove(e: TouchEvent): void {
    if (this.isLocked() || this.ignoreTarget(e.target)) return;
    if (this.animating || this.touchHandled) {
      if (e.cancelable) e.preventDefault();
      return;
    }
    const dy = this.touchY - (e.touches[0]?.clientY ?? this.touchY); // + = swipe up = scroll down
    if (Math.abs(dy) < CONFIG.touchIntentPx) return;
    const target = this.targetFor(window.scrollY, Math.sign(dy));
    if (typeof target === 'number') {
      if (e.cancelable) e.preventDefault();
      this.touchHandled = true;
      this.glideTo(target);
    }
  }

  /** Settle a scroll that comes to rest between the stops (scrollbar, etc.). */
  private onScroll(): void {
    const y = window.scrollY;
    if (y !== this.lastY) this.lastDir = Math.sign(y - this.lastY);
    this.lastY = y;
    if (this.animating) return;
    window.clearTimeout(this.settleTimer);
    this.settleTimer = window.setTimeout(() => {
      if (this.animating || this.isLocked()) return;
      const stop = this.personaStop;
      const now = window.scrollY;
      if (now > CONFIG.tol && now < stop - CONFIG.tol) {
        this.glideTo(this.lastDir < 0 ? 0 : stop);
      }
    }, 160);
  }

  // -- Motion ---------------------------------------------------------------

  private glideTo(y: number): void {
    this.animating = true;
    this.slackAcc = 0;
    this.slackReleased = false;
    gsap.to(window, {
      scrollTo: { y, autoKill: false },
      duration: this.reducedMotion.matches ? 0 : CONFIG.duration,
      ease: CONFIG.ease,
      overwrite: 'auto',
      onComplete: () => {
        this.animating = false;
        const now = performance.now();
        this.holdUntil = now + CONFIG.momentumGapMs;
        this.holdCap = now + CONFIG.maxHoldMs;
        // A fresh gesture at the persona stop starts its slack from zero.
        this.slackAt = 0;
      },
    });
  }
}
