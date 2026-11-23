/**
 * assets.ts — asset URL helpers
 * ---------------------------------------------------------------------------
 * Vite replaces `import.meta.env.BASE_URL` with the configured `base` value
 * at build time ('./' for GitHub Pages). Using this helper instead of hard-
 * coded absolute paths ensures icons, fonts, and media resolve correctly when
 * the site is served from a subpath (e.g. /netapp-genie-ixd/ on GitHub Pages).
 */
const BASE = import.meta.env.BASE_URL;

/**
 * Always return an absolute URL. A relative URL placed in a CSS custom
 * property (e.g. `--icon: url(...)` for .icon-mask) is resolved against the
 * *stylesheet* that uses the var — in production that's /assets/, so
 * './icons/x.svg' became /assets/icons/x.svg (404). Absolute URLs are safe
 * in every context (img src, inline styles, CSS vars).
 */
function abs(path: string): string {
  return new URL(path, document.baseURI).href;
}

export function iconUrl(filename: string): string {
  return abs(`${BASE}icons/${filename}`);
}

export function mediaUrl(filename: string): string {
  return abs(`${BASE}media/${filename}`);
}

export function fontUrl(filename: string): string {
  return abs(`${BASE}fonts/${filename}`);
}
