# Project status & handoff notes

_Last updated: Nov 23, 2026 — Monday list complete (see `docs/monday.md`) on `phase-1-prototype`_

Read this first when resuming work (agents: also `CLAUDE.md`). Pair with `docs/requirements.md` (original interaction spec) and `docs/sample-content.md`.

## Workflow
- Branch `phase-1-prototype`; push directly. **No PRs, no merges, no reviewers.**
- Commit as `James Melzer <netapp-jamesmelzer@users.noreply.github.com>`.
- Deployed by GitHub Pages (`.github/workflows/deploy.yml`) on push: https://netapp-jamesmelzer.github.io/netapp-genie-ixd/
- The agent's GitHub App cannot push changes under `.github/workflows/`.
- Build: `npm run build` (tsc strict incl. `noUnusedLocals`/`noUnusedParameters`, then vite). Must pass clean.
- Figma (current): file `RdQdLmjTEVawc2wGeB6EkB` ("genie-ixd"), Page 1 `0:1` — node ids in `CLAUDE.md`. The old Skunkworks file (`PoMIBV4u8ZpCIE39FenV9k`, referenced in `docs/figma-findings.md`) is superseded.

## Conventions
- All design values live in `src/styles/tokens.css`.
- Assets always resolved via `iconUrl` / `mediaUrl` / `fontUrl` in `src/utils/assets.ts` (Pages subpath; `base: './'`). Never absolute paths. All images live in `public/media/` — never pull images from Figma.
- Recolorable icons: `.icon-mask` with `--icon: url(...)` (SVG as CSS mask; set `background`).
- `--prompt-stack` (set live by `AIPrompt.ts`) = viewport bottom → prompt top; use it to keep content clear of the sticky prompt.
- Z-index: 1 page, 10 AI chat modal, 20 nav/account modals, 30 AI prompt, 40 nav bar.
- Text buttons carry `ic_arrow_outward.svg`. Cyan text is acceptable in this exploration.

## Hard requirements (do not regress)
- **The AI Chat Modal must never contain its own prompt input.** The single sticky prompt is the only one (regressed 3×; see `CLAUDE.md`).
- **AI prompt max-width is always 800px** (`--prompt-max-width`). Never changes.
- **The nav bar is NOT sticky/fixed.** It sits in normal flow at the top and scrolls away. It slides in (temporarily `position: fixed`, class `is-fixed`) only on scroll-up after it has left the viewport, hides on scroll-down (`is-hidden`), and returns to its in-flow position at the top. `.nav-spacer` prevents layout jumps. At the top the nav floats over the hero video: `NavBar.ts` measures the nav height and applies an equal negative `margin-top` to `main.page` (re-measured on resize). (`NavBar.ts`, `nav.css`)

## Current page structure & decisions
1. **Nav** — pill (logo │ Explore ≡) + account control grouped and centered (`.nav-group`). Active state = Figma "selected" fill (`--color-nav-selected`) on the pill / account circle; label stays "Explore". Nav modal and Account modal are mutually exclusive; AI chat modal stays underneath. Escape closes the topmost modal.
2. **AI prompt** — single sticky prompt (inline hero prompt removed). 3 states: huge (5 lines, initial) → large (3 lines) via ScrollTrigger on `#moment-1` or when any modal opens → small (1 line) via collapse toggle (small ↔ large). While the chat is open the placeholder reads "Make a selection or type something else…". Placeholder: "What data and infrastructure challenge are you looking to solve today?" Sparkle icon, textarea and send button are top-aligned (`align-items: flex-start`) in all three states. (`AIPrompt.ts`)
3. **Persona** — scroll-based collapse animation **dropped**. Two-line sentence "I'm a/an [role ▾] / focused on [goal ▾]" (article auto). Each dropdown is text + cyan underline + cyan drop arrow (Figma), no pill/box. Custom ARIA listbox (keyboard + outside-click). State lives in `src/state/persona.ts`; the page picker, Account Modal and moment-3 confirmation text all bind to it. Page edits fire `persona-change` (source `page`) → account "ping"; edits inside the Account Modal don't ping.
   - Roles: Chief Information Officer, Chief Data Officer, VP Infrastructure/Operations, Chief Information Security Officer, DevOps Engineer, Storage Engineer.
   - Goals: adopting AI safely and affordably, managing data at scale, migrating virtualization paradigms, meeting regulatory requirements, achieving consistent delivery across hybrid cloud.
4. **Recommended for you** (`#moment-4`) — no eyebrow above the heading (eyebrows inside feature cards stay).
5. **Section 6 (`.footer-section`, Figma Home 6 `1:1020`)** — rebuilt Nov 23 to Figma; content column `--home6-width` 1224px (`.home6-inner`). In order:
   - `.news` — "Latest at NetApp" / "News and announcements" with plain prev/next arrows; a scroll-snap carousel (`NewsCarousel.ts`) of 376px cards (48px gap, 3 visible) and a violet card-width progress bar that slides along a 2px rail. Cards 4–6 are placeholder copy (marked `data-placeholder`) so the carousel can move.
   - `.next-steps-section` — "Next steps" headline (76px Thin) beside "Emma's quick start links" (36px illustrations from `public/media/illustration/`); 3 image cards (Solutions `card-1`, Talk to sales `card-2`, Find a partner `card-3`; 391px tall); then "Resources and support" (39px Regular) with 4 static rows (Downloads, Documentation, Troubleshooting, Training) over the blurred #E6EBF2 glow. No expand behavior.
   - `.mega-footer` — Figma gradient, teal NetApp logo (SVG mask), 5 link columns, divider, © + legal links. Bottom padding adds `--prompt-stack`.
6. **Stage (moments 1–3)** — one sticky `space_video_1.mp4` behind hero, persona and confirmation (`.stage__bg`, sticky + `margin-bottom: -100vh`).
7. **Scroll choreography** — `ScrollScenes.ts`: all scrubbed, skipped under reduced motion. Enter tweens animate children, exit tweens animate wrappers.
8. **Modals** — Nav: `menu.jpg` + purple scrim, Figma column grid. Account: `account.mp4`, 3 synced persona dropdowns, 3 link cards. AI chat: full-viewport blurred vignette + white card (runs off the bottom so the sticky prompt sits inside it), header (brand chip, collapse control), 1:3:1 columns (Chat history / thread / Resources). Collapse shrinks the modal back into the prompt rect.

## Open items
- Owed by James: hero partner logos (Figma: Mahindra, S&P Global, ESA, Porsche Motorsport, Aston Martin); ESA logo for the story (Figma places it top-right). Not in `public/media/` yet.
- Owed by James: footer social icons (Facebook, Instagram, LinkedIn, X — Figma shows them under Contact & Feedback and at the end of the legal row).
- Owed by James (optional): a `turn_right` icon for the chat prompt echo (currently the ↳ glyph); favicon.
- Offered, not yet done: replace placeholder next-steps card photos (`card-1..3.jpg`) with real Figma images.
- Some copy is still placeholder (not from Figma) outside the next-steps section; verify against Figma when touched.
- Home 4 ("Recommended for you") still uses the old circled carousel arrows and lacks Figma's progress rail; `NewsCarousel` can drive it once it has more cards.
- Possible future: dark→light background choreography into moment 4.

## Collaboration notes
- James runs explicit feedback passes; execute them directly and precisely (be careful with nesting/spacing interpretation). Major decisions go through James. Don't involve other people.
