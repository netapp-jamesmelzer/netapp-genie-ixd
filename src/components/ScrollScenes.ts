/**
 * ScrollScenes
 * ---------------------------------------------------------------------------
 * Scroll-driven (scrubbed) animations for the page moments. Every tween is tied
 * to scroll position, so scrolling back up plays them in reverse.
 *
 *   Stage (moments 1–2, one sticky earth video):
 *     - video slowly pushes in across the whole stage
 *     - a dark layer deepens as the persona moment arrives (Figma Home 2
 *       reads darker than Home 1)
 *   Hero (moment 1), exit:
 *     - headline, subcopy and partner logos drift up and fade at staggered
 *       rates as the hero scrolls away
 *   Persona picker (moment 2):
 *     - enter: headline rises in, then each sentence line, then the cyan
 *       underlines draw left→right (CSS var --u on .persona-dd__button)
 *     - exit: the whole block lifts and fades
 *   Customer story (moment 5):
 *     - video eases from a push-in to rest on enter, pushes in again on exit
 *     - eyebrow, then the headline word by word, then the button rise in
 *     - ESA logo slides in from the right
 *     - exit: content lifts and fades
 *
 * Rule of thumb: enter tweens animate children, exit tweens animate the
 * wrapper, so the two never fight over the same property.
 *
 * Everything is skipped under prefers-reduced-motion.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export class ScrollScenes {
  mount(): void {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      this.stage();
      this.hero();
      this.persona();
      this.story();
    });

    // Layout shifts after fonts swap in; re-measure trigger positions.
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }

  private stage(): void {
    gsap.fromTo(
      '.stage__video',
      { scale: 1 },
      {
        scale: 1.18,
        ease: 'none',
        scrollTrigger: { trigger: '#stage', start: 'top top', end: 'bottom bottom', scrub: true },
      }
    );
    gsap.fromTo(
      '.stage__dim',
      { opacity: 0 },
      {
        opacity: 0.45,
        ease: 'none',
        scrollTrigger: { trigger: '#moment-2', start: 'top bottom', end: 'top top', scrub: true },
      }
    );
  }

  private hero(): void {
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '#moment-1', start: 'top top', end: 'bottom top', scrub: 0.4 },
      })
      .to('.hero__headline', { y: -140, opacity: 0, scale: 0.96 }, 0)
      .to('.hero__subcopy', { y: -100, opacity: 0 }, 0.05)
      .to('.hero__partners', { y: -70, opacity: 0 }, 0.1);
  }

  private persona(): void {
    gsap
      .timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: '#moment-2', start: 'top 85%', end: 'center 55%', scrub: 0.6 },
      })
      .fromTo('.persona__headline', { y: 80, opacity: 0 }, { y: 0, opacity: 1 }, 0)
      .fromTo(
        '.persona-line',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15 },
        0.15
      )
      .fromTo(
        '#moment-2 .persona-dd__button',
        { '--u': 0 },
        { '--u': 1, stagger: 0.15, ease: 'power1.inOut' },
        0.35
      );

    gsap.to('.persona__content', {
      y: -120,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: '#moment-2', start: 'center 35%', end: 'bottom top', scrub: 0.4 },
    });
  }

  private story(): void {
    const words = splitWords(document.querySelector<HTMLElement>('.story__headline'));

    // One timeline for the video across the whole pass (enter → rest → exit).
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '#moment-5', start: 'top bottom', end: 'bottom top', scrub: true },
      })
      .fromTo('#moment-5 .moment__video', { scale: 1.25 }, { scale: 1, duration: 1 })
      .to('#moment-5 .moment__video', { scale: 1.1, duration: 1 });

    gsap
      .timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: '#moment-5', start: 'top 75%', end: 'top 10%', scrub: 0.6 },
      })
      .fromTo('#moment-5 .eyebrow', { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, 0)
      .fromTo(words, { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04 }, 0.1)
      .fromTo('.story__logo', { x: 60, opacity: 0 }, { x: 0, opacity: 1 }, 0.3)
      .fromTo('#moment-5 .btn', { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, '>-0.2');

    gsap.to('.story__content', {
      y: -100,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: '#moment-5', start: 'bottom 70%', end: 'bottom top', scrub: 0.4 },
    });
  }
}

/** Wrap each word of an element's text in .story__word spans; returns them. */
function splitWords(el: HTMLElement | null): HTMLElement[] {
  if (!el) return [];
  const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ');
  el.setAttribute('aria-label', text);
  el.innerHTML = text
    .split(' ')
    .map((w) => `<span class="story__word" aria-hidden="true">${w}</span>`)
    .join(' ');
  return Array.from(el.querySelectorAll<HTMLElement>('.story__word'));
}
