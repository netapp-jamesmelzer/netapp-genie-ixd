/**
 * NewsCarousel
 * ---------------------------------------------------------------------------
 * Drives every [data-carousel] block (currently Home 6 "News and
 * announcements"). Figma: plain prev/next arrows top-right, three cards
 * visible, and a progress rail under the cards whose violet card-width bar
 * slides from left to right as the track scrolls.
 *
 * The track is a native horizontal scroll-snap container, so trackpad swipes,
 * shift-wheel, touch and keyboard (focus the track, use arrow keys) all work;
 * the arrows just scroll by one card. Arrows disable at either end.
 */
export class NewsCarousel {
  mount(): void {
    document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((root) => {
      const track = root.querySelector<HTMLElement>('[data-carousel-track]');
      const prev = root.querySelector<HTMLButtonElement>('[data-carousel-prev]');
      const next = root.querySelector<HTMLButtonElement>('[data-carousel-next]');
      const bar = root.querySelector<HTMLElement>('[data-carousel-bar]');
      if (!track || !prev || !next || !bar) return;

      /** One step = one card width + the grid gap. */
      const step = (): number => {
        const first = track.children[0] as HTMLElement | undefined;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return first ? first.offsetWidth + gap : track.clientWidth;
      };

      const update = (): void => {
        const max = track.scrollWidth - track.clientWidth;
        const progress = max > 0 ? track.scrollLeft / max : 0;
        const rail = bar.parentElement?.clientWidth ?? 0;
        bar.style.setProperty('--progress-x', `${progress * (rail - bar.offsetWidth)}px`);
        prev.disabled = track.scrollLeft <= 1;
        next.disabled = track.scrollLeft >= max - 1;
      };

      prev.addEventListener('click', () => track.scrollBy({ left: -step() }));
      next.addEventListener('click', () => track.scrollBy({ left: step() }));
      track.addEventListener('scroll', update, { passive: true });
      track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          track.scrollBy({ left: step() });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          track.scrollBy({ left: -step() });
        }
      });
      window.addEventListener('resize', update);
      update();
    });
  }
}
