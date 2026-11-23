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
 *   Recommended (moment 4): heading, side card, then the featured card's
 *     copy rise in while VideoMorph shrinks the stage video into the card.
 *   Customer story (moment 5):
 *     - video eases from a push-in to rest on enter, pushes in again on exit
 *     - eyebrow, then the headline, then the button rise in
 *     - ESA logo slides in from the right
 *     - exit: content lifts and fades; then the video + scrim fade out
 *       (300px → 100px of the section left) and the section flips to white
 *       with dark copy (storyFadeOut)
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
      this.recommended();
      this.story();
    });

    // A fade, not motion — runs under reduced motion too.
    this.storyFadeOut();

    // Layout shifts after fonts swap in; re-measure trigger positions.
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }

  private stage(): void {
    gsap.fromTo(
      '.stage__zoom',
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

  /** Recommended arrives over the morphing video; the card copy lands last. */
  private recommended(): void {
    gsap
      .timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: '#moment-4', start: 'top 75%', end: 'top top', scrub: 0.4 },
      })
      .fromTo('.recommended__head', { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, 0)
      .fromTo('.recommended__side', { y: 60, opacity: 0 }, { y: 0, opacity: 1 }, 0.15)
      .fromTo('.feature-card__body', { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, 0.55);
  }

  private story(): void {
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
      .fromTo('.story__headline', { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, 0.1)
      .fromTo('.story__logo', { x: 60, opacity: 0 }, { x: 0, opacity: 1 }, 0.3)
      .fromTo('#moment-5 .btn', { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, '>-0.2');

    gsap.to('.story__content', {
      y: -100,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: '#moment-5', start: 'bottom 70%', end: 'bottom top', scrub: 0.4 },
    });
  }

  /**
   * Customer story → white: as the story scrolls out, its video and scrim
   * fade to 0 between "300px of the section left" and "100px left" (scrubbed,
   * reverses). At the start of that window — when the copy is already above
   * the viewport — the section flips to its light variant (.is-faded: white
   * background, dark copy) and tells the nav it is now a light surface.
   */
  private storyFadeOut(): void {
    const story = document.querySelector<HTMLElement>('#moment-5');
    if (!story) return;
    gsap.fromTo(
      ['#moment-5 .moment__video', '#moment-5 .moment__overlay--story'],
      { opacity: 1 },
      {
        opacity: 0,
        ease: 'none',
        immediateRender: false,
        scrollTrigger: { trigger: story, start: 'bottom 300px', end: 'bottom 100px', scrub: true },
      }
    );
    const flip = (light: boolean): void => {
      story.classList.toggle('is-faded', light);
      story.dataset.navTheme = light ? 'light' : 'dark';
    };
    ScrollTrigger.create({
      trigger: story,
      start: 'bottom 300px',
      end: 'max',
      onEnter: () => flip(true),
      onLeaveBack: () => flip(false),
      onRefresh: (self) => flip(self.progress > 0),
    });
  }

}
