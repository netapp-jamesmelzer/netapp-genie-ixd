/**
 * assets.ts — asset URL helpers
 * ---------------------------------------------------------------------------
 * Vite replaces `import.meta.env.BASE_URL` with the configured `base` value
 * at build time ('./' for GitHub Pages). Using this helper instead of hard-
 * coded absolute paths ensures icons, fonts, and media resolve correctly when
 * the site is served from a subpath (e.g. /netapp-genie-ixd/ on GitHub Pages).
 */
const BASE = import.meta.env.BASE_URL;

export function iconUrl(filename: string): string {
  return `${BASE}icons/${filename}`;
}

export function mediaUrl(filename: string): string {
  return `${BASE}media/${filename}`;
}

export function fontUrl(filename: string): string {
  return `${BASE}fonts/${filename}`;
}
