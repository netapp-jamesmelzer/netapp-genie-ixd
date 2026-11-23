/**
 * VideoMorph
 * ---------------------------------------------------------------------------
 * Persona → Recommended: the full-screen stage video shrinks into the
 * featured card and becomes its background. Scroll-scrubbed across the slide
 * (#moment-4 from "top bottom" to "top top"), so it plays inside SlideSnap's
 * glide and reverses on the way back up.
 *
 * One video, three hosts. The single playing <video> is *moved* between:
 *   stage  — progress 0   : .stage__zoom (sticky stage background)
 *   flying — 0 < p < 1    : .video-morph (fixed layer, clipped + resized)
 *   card   — progress 1   : .feature-card__media
 * A moved media element keeps playing, so there is no frame jump or sync.
 *
 * While flying, each frame interpolates (with progress p):
 *   - the clip: full viewport → the card's live rect, radius 0 → card radius
 *   - the video box: its stage framing (cover × stage zoom, origin 50% 60%)
 *     → "cover" of the card. Lerping two covering boxes always covers the
 *     lerped clip, so there are never gaps.
 *   - the stage look (top/bottom gradients + persona dim) fades out. The
 *     card's own gradient needs no help: the card (transparent, above this
 *     layer) sits exactly where the clip lands.
 *
 * Reduced motion: no flight — the video simply switches host at the midpoint.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Host = 'stage' | 'flying' | 'card';
interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const CARD_RADIUS = 8; // --radius-card
/** Shape of the shrink over the slide (scroll progress → morph progress).
 *  Front-loaded so the video hugs the card early and the heading/side card
 *  arrive over white rather than over video. */
const MORPH_EASE = gsap.parseEase('power2.out');
const STAGE_ORIGIN = { x: 0.5, y: 0.6 }; // .stage__zoom transform-origin

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  left: lerp(a.left, b.left, t),
  top: lerp(a.top, b.top, t),
  width: lerp(a.width, b.width, t),
  height: lerp(a.height, b.height, t),
});

/** The box a `cover`-fitted media of `aspect` occupies inside `r`. */
function cover(r: Rect, aspect: number): Rect {
  const width = Math.max(r.width, r.height * aspect);
  const height = width / aspect;
  return {
    left: r.left + (r.width - width) / 2,
    top: r.top + (r.height - height) / 2,
    width,
    height,
  };
}

export class VideoMorph {
  private video!: HTMLVideoElement;
  private stageHost!: HTMLElement;
  private cardHost!: HTMLElement;
  private card!: HTMLElement;
  private stageDim!: HTMLElement;

  private layer!: HTMLDivElement;
  private box!: HTMLDivElement;
  private overlays!: HTMLDivElement;
  private dim!: HTMLDivElement;

  private host: Host = 'stage';
  private progress = 0;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  mount(): void {
    const stageHost = document.querySelector<HTMLElement>('.stage__zoom');
    const video = stageHost?.querySelector<HTMLVideoElement>('video');
    const card = document.querySelector<HTMLElement>('.feature-card');
    const cardHost = card?.querySelector<HTMLElement>('.feature-card__media');
    const stageBg = document.querySelector<HTMLElement>('.stage__bg');
    const stageDim = document.querySelector<HTMLElement>('.stage__dim');
    if (!stageHost || !video || !card || !cardHost || !stageBg || !stageDim) return;
    Object.assign(this, { stageHost, video, card, cardHost, stageDim });

    // Flying layer, inserted right after the stage background (see CSS for
    // why its position in the stacking order matters).
    this.layer = document.createElement('div');
    this.layer.className = 'video-morph';
    this.layer.setAttribute('aria-hidden', 'true');
    this.layer.innerHTML = `
      <div class="video-morph__box"></div>
      <div class="video-morph__overlays">
        <div class="moment__overlay moment__overlay--top"></div>
        <div class="moment__overlay moment__overlay--bottom"></div>
      </div>
      <div class="video-morph__dim"></div>
    `;
    stageBg.after(this.layer);
    this.box = this.layer.querySelector('.video-morph__box') as HTMLDivElement;
    this.overlays = this.layer.querySelector('.video-morph__overlays') as HTMLDivElement;
    this.dim = this.layer.querySelector('.video-morph__dim') as HTMLDivElement;

    ScrollTrigger.create({
      trigger: '#moment-4',
      start: 'top bottom',
      end: 'top top',
      onUpdate: (self) => this.render(self.progress),
      onRefresh: (self) => this.render(self.progress),
    });
    window.addEventListener('resize', () => this.render(this.progress));
  }

  private render(p: number): void {
    this.progress = p;
    let host: Host = p <= 0 ? 'stage' : p >= 1 ? 'card' : 'flying';
    if (this.reducedMotion.matches) host = p < 0.5 ? 'stage' : 'card';
    if (host !== this.host) this.moveTo(host);
    if (host === 'flying') this.frame(MORPH_EASE(p));
  }

  private moveTo(host: Host): void {
    this.host = host;
    const target = { stage: this.stageHost, flying: this.box, card: this.cardHost }[host];
    if (this.video.parentElement !== target) {
      target.appendChild(this.video);
      void this.video.play().catch(() => {}); // muted; resumes if a move paused it
    }
    if (host !== 'flying') {
      // Back to "fill the host" (CSS); drop the inline flight geometry.
      this.video.style.left = this.video.style.top = '';
      this.video.style.width = this.video.style.height = '';
    }
    this.layer.classList.toggle('is-active', host === 'flying');
  }

  private frame(p: number): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const view: Rect = { left: 0, top: 0, width: vw, height: vh };
    const c = this.card.getBoundingClientRect();
    const cardRect: Rect = { left: c.left, top: c.top, width: c.width, height: c.height };

    // Clip: viewport → card.
    const clip = lerpRect(view, cardRect, p);
    const r = lerp(0, CARD_RADIUS, p);
    this.layer.style.clipPath = `inset(${clip.top}px ${vw - clip.left - clip.width}px ${
      vh - clip.top - clip.height
    }px ${clip.left}px round ${r}px)`;

    // Video box: stage framing (cover × zoom about the stage origin) → card cover.
    const aspect =
      this.video.videoWidth && this.video.videoHeight
        ? this.video.videoWidth / this.video.videoHeight
        : 16 / 9;
    const zoom = Number(gsap.getProperty(this.stageHost, 'scale')) || 1;
    const base = cover(view, aspect);
    const ox = vw * STAGE_ORIGIN.x;
    const oy = vh * STAGE_ORIGIN.y;
    const from: Rect = {
      left: ox + (base.left - ox) * zoom,
      top: oy + (base.top - oy) * zoom,
      width: base.width * zoom,
      height: base.height * zoom,
    };
    const v = lerpRect(from, cover(cardRect, aspect), p);
    Object.assign(this.video.style, {
      left: `${v.left}px`,
      top: `${v.top}px`,
      width: `${v.width}px`,
      height: `${v.height}px`,
    });

    // Stage look (gradients + persona dim) fades out as the video lands.
    const stageDim = Number(getComputedStyle(this.stageDim).opacity) || 0;
    this.overlays.style.opacity = String(1 - p);
    this.dim.style.opacity = String(stageDim * (1 - p));
  }
}
