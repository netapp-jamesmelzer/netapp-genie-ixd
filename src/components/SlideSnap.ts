/**
 * SlideSnap
 * ---------------------------------------------------------------------------
 * Turns the opening sections — Hero → Persona → Recommended → Customer Story —
 * into "slides": a small, intentional scroll glides the page to the next
 * section, and built-in slack keeps the user from blowing past it. The
 * scrubbed ScrollScenes (hero exit, persona entrance/exit, stage push-in/dim,
 * story entrance) play during the glides, so each reads as one transition.
 *
 * Geometry: each section i spans [top_i, end_i], where end_i = top_i when the
 * section fits the viewport, or top_i + height_i − viewport when it is taller
 * (then the user scrolls freely inside it). Between end_i and top_{i+1} is a
 * "glide gap" the page never rests in.
 *
 * Behavior
 *   - At a section's bottom edge (end_i), scrolling down with intent glides to
 *     the next section's top; at a section's top, scrolling up glides to the
 *     previous section's end.
 *   - After the last slide (Customer Story), normal scrolling resumes — but
 *     coming back up while the story is still in view glides back to it.
 *     That return catch inherits the user's scroll speed (ease-out, duration
 *     from velocity) so it decelerates into the story instead of braking and
 *     re-accelerating against their momentum.
 *   - Slack, part 1 — momentum: input during a glide is swallowed, and so is
 *     the trailing trackpad/mouse momentum after arrival. Momentum is
 *     recognised by its shape: events < momentumGapMs apart whose deltas keep
 *     shrinking (held up to maxMomentumMs). A new deliberate gesture ramps
 *     up instead, so after minHoldMs it is released. A hard flick moves
 *     exactly one slide.
 *   - Slack, part 2 — resistance: at the end of the last slide, the first
 *     slackPx of fresh downward scroll is absorbed (the content gives a few px
 *     and springs back) before normal scrolling resumes.
 *   - Keyboard (↓ ↑ PgDn PgUp Space) and touch swipes glide the same way; a
 *     scroll that comes to rest inside a glide gap (scrollbar drag, etc.)
 *     settles in its direction of travel.
 *   - Inactive while a modal has the page scroll-locked, and for wheel events
 *     inside an open persona list or a scrollable textarea.
 */
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

/** The slides, in order. */
const SECTIONS = ['#moment-1', '#moment-2', '#moment-4', '#moment-5'];

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
  /** After arriving, swallow continuous input at least this long… */
  minHoldMs: 1600,
  /** …and decaying (momentum-shaped) input up to this long. */
  maxMomentumMs: 5000,
  /** Downward scroll absorbed at the end of the last slide before scrolling resumes. */
  slackPx: 160,
  /** Pause that resets the slack counter. */
  slackResetMs: 450,
  /** How far the content "gives" while absorbing slack (px). */
  slackGivePx: 18,
  /** Below the last slide, scrolling up within this fraction of a viewport glides back to it. */
  returnZone: 0.85,
  /** Pixel tolerance for "at a stop". */
  tol: 2,
  /** Return-from-below catch: velocity-matched glide, within these bounds (s). */
  returnMin: 0.35,
  returnMax: 0.9,
  /** Below this speed (px/ms) the return catch uses the standard glide. */
  returnMinVelocity: 0.3,
};

type Target = number | 'slack' | null;

interface Span {
  el: HTMLElement;
  top: number;
  end: number;
}

export class SlideSnap {
  private sections: HTMLElement[] = [];

  private animating = false;
  private holdUntil = 0;
  private holdMin = 0;
  private holdMax = 0;
  private lastWheelAt = 0;
  private lastAbsDy = 0;
  /** Smoothed wheel speed (px/ms), for velocity-matched return glides. */
  private wheelVelocity = 0;

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
    this.sections = SECTIONS.map((s) => document.querySelector<HTMLElement>(s)).filter(
      (el): el is HTMLElement => !!el
    );
    if (this.sections.length < 2) return;
    this.lastY = window.scrollY;

    window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    window.addEventListener('keydown', (e) => this.onKey(e));
    window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
  }

  // -- Geometry (measured live; layout shifts with fonts/resizes) -----------

  private spans(): Span[] {
    const vh = window.innerHeight;
    return this.sections.map((el) => {
      const r = el.getBoundingClientRect();
      const top = Math.round(r.top + window.scrollY);
      return { el, top, end: Math.max(top, Math.round(top + r.height - vh)) };
    });
  }

  /** Where a move in `dir` (+1 down, −1 up) from `y` should go. */
  private targetFor(y: number, dir: number): Target {
    const s = this.spans();
    const { tol } = CONFIG;
    const last = s[s.length - 1];

    if (dir > 0) {
      for (let i = 0; i < s.length - 1; i++) {
        // From a section's bottom edge (or inside the gap after it) → next top.
        if (y >= s[i].end - tol && y < s[i + 1].top - tol) return s[i + 1].top;
      }
      if (Math.abs(y - last.end) <= tol) return 'slack';
      return null; // inside a tall section, or past the slides
    }

    if (y <= tol) return null;
    for (let i = 0; i < s.length - 1; i++) {
      // From a section's top (or inside the gap before it) → previous end.
      if (y > s[i].end + tol && y <= s[i + 1].top + tol) return s[i].end;
    }
    if (y > last.end + tol && y < last.end + window.innerHeight * CONFIG.returnZone) {
      return last.end;
    }
    return null;
  }

  /** If `y` rests inside a glide gap, the stop to settle to in `dir`. */
  private settleFor(y: number, dir: number): number | null {
    const s = this.spans();
    const { tol } = CONFIG;
    for (let i = 0; i < s.length - 1; i++) {
      if (y > s[i].end + tol && y < s[i + 1].top - tol) {
        return dir < 0 ? s[i].end : s[i + 1].top;
      }
    }
    return null;
  }

  /** The content element of the section currently at `y` (for the slack give). */
  private contentAt(y: number): HTMLElement | null {
    const span = this.spans().find((sp) => y >= sp.top - CONFIG.tol && y <= sp.end + CONFIG.tol);
    return span?.el.querySelector<HTMLElement>('.moment__content') ?? null;
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
    const absDy = Math.abs(dy);
    const decaying = absDy <= this.lastAbsDy + 1;
    this.lastAbsDy = absDy;
    this.wheelVelocity =
      gap > 0 && gap < 100 ? this.wheelVelocity * 0.6 + (absDy / gap) * 0.4 : absDy / 16;

    // Slack 1: swallow input during the glide and its trailing momentum.
    if (this.animating) {
      e.preventDefault();
      return;
    }
    if (now < this.holdUntil) {
      e.preventDefault();
      const continuous = gap < CONFIG.momentumGapMs;
      if (continuous && now < this.holdMax && (now < this.holdMin || decaying)) {
        this.holdUntil = now + CONFIG.momentumGapMs;
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
      // Coming back up from below the last slide: carry the user's speed.
      const spans = this.spans();
      const returning = dir < 0 && window.scrollY > spans[spans.length - 1].end + CONFIG.tol;
      this.glideTo(target, returning ? this.wheelVelocity : 0);
    }
  }

  /** Slack 2: resist the first slackPx of downward scroll at the last slide. */
  private absorbSlack(e: WheelEvent, dy: number, now: number): void {
    if (now - this.slackAt > CONFIG.slackResetMs) {
      this.slackAcc = 0;
      this.slackReleased = false;
    }
    this.slackAt = now;
    if (this.slackReleased) return; // let native scrolling continue
    const give = this.contentAt(window.scrollY);
    this.slackAcc += dy;
    if (this.slackAcc < CONFIG.slackPx) {
      e.preventDefault();
      if (!give) return;
      const px = (this.slackAcc / CONFIG.slackPx) * CONFIG.slackGivePx;
      gsap.to(give, { '--slack-give': `${-px}px`, duration: 0.15, overwrite: true });
      gsap.to(give, {
        '--slack-give': '0px',
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
        delay: 0.18,
      });
    } else {
      this.slackReleased = true;
      if (give) gsap.to(give, { '--slack-give': '0px', duration: 0.3, overwrite: true });
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

  /** Settle a scroll that comes to rest inside a glide gap (scrollbar, etc.). */
  private onScroll(): void {
    const y = window.scrollY;
    if (y !== this.lastY) this.lastDir = Math.sign(y - this.lastY);
    this.lastY = y;
    if (this.animating) return;
    window.clearTimeout(this.settleTimer);
    this.settleTimer = window.setTimeout(() => {
      if (this.animating || this.isLocked()) return;
      const to = this.settleFor(window.scrollY, this.lastDir);
      if (to !== null) this.glideTo(to);
    }, 160);
  }

  // -- Motion ---------------------------------------------------------------

  /**
   * @param velocity  current scroll speed (px/ms) to carry into the glide; 0
   *                  = the standard eased glide. With velocity, a cubic
   *                  Hermite ease whose start slope k = v·T/d matches the
   *                  user's speed exactly and whose end slope is 0, so the
   *                  page only decelerates into the stop. T aims for k ≈ 2
   *                  (a natural ease-out) within returnMin..returnMax.
   */
  private glideTo(y: number, velocity = 0): void {
    this.animating = true;
    this.slackAcc = 0;
    this.slackReleased = false;
    let duration = CONFIG.duration;
    let ease: string | ((t: number) => number) = CONFIG.ease;
    const distance = Math.abs(y - window.scrollY);
    if (velocity >= CONFIG.returnMinVelocity && distance > 0) {
      const ms = Math.min(CONFIG.returnMax * 1000, Math.max(CONFIG.returnMin * 1000, (2 * distance) / velocity));
      const k = Math.min(3, Math.max(0.5, (velocity * ms) / distance)); // ≤ 3 keeps it monotonic
      duration = ms / 1000;
      // f(0)=0, f(1)=1, f'(0)=k, f'(1)=0
      ease = (t: number) => k * t + (3 - 2 * k) * t * t + (k - 2) * t * t * t;
    }
    gsap.to(window, {
      scrollTo: { y, autoKill: false },
      duration: this.reducedMotion.matches ? 0 : duration,
      ease,
      overwrite: 'auto',
      onComplete: () => {
        this.animating = false;
        const now = performance.now();
        this.holdUntil = now + CONFIG.momentumGapMs;
        this.holdMin = now + CONFIG.minHoldMs;
        this.holdMax = now + CONFIG.maxMomentumMs;
        // A fresh gesture at the last slide starts its slack from zero.
        this.slackAt = 0;
      },
    });
  }
}
