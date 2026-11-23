# netapp-genie-ixd — agent instructions

Single-page interaction prototype (Vite + TypeScript + GSAP, no framework).
Read `docs/status.md` first; `docs/requirements.md` is the original interaction spec.

## Immutable directions (never regress — check before every change)

1. **The AI Chat Modal must NEVER contain its own prompt input.** The single
   sticky AI prompt (`AIPrompt.ts`) at the bottom of the viewport is the only
   prompt; it floats over the chat's center column and *is* the chat input.
   No textarea, input, or decorative "Ask a follow-up…" box inside
   `AIChatModal.ts` — not even a non-interactive mock. (This has regressed three
   times.)
2. **AI prompt max-width is always 800px** (`--prompt-max-width`).
3. **The nav bar is NOT sticky/fixed.** It sits in normal flow, scrolls away,
   slides in (temporarily fixed) only on scroll-up after leaving the viewport,
   and returns to flow at the top. See `NavBar.ts`.
4. **Z-order:** page 1 · AI chat modal 10 · nav/account modals 20 · AI prompt 30
   · nav bar 40.
5. **Assets come only from `public/` (`public/media/`, `public/icons/`,
   `public/fonts/`)**, resolved via `iconUrl` / `mediaUrl` / `fontUrl` in
   `src/utils/assets.ts`. Never absolute paths; never hot-link or download
   images from Figma. If an asset is missing, ask James.
6. All design values live in `src/styles/tokens.css`.
7. `npm run build` (strict tsc incl. `noUnusedLocals`/`noUnusedParameters`, then
   vite) must pass clean.

## Figma

File `RdQdLmjTEVawc2wGeB6EkB` ("genie-ixd"), Page 1 (`0:1`). Frames: Home `1:799`,
Home 2 `1:913`, Home 3 `1:946`, Home 4 `1:961`, Home 5 `1:994`, Home 6 `1:1020`,
AI chat modal `1:558` (card `1:675`), Account modal `1:727`, nav modal `1:785`.
Read it with the Figma MCP (no PAT needed).
