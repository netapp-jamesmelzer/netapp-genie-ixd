# Project status & handoff notes

_Last updated: Nov 23, 2026 — Monday list complete (see `docs/monday.md`) on `phase-1-prototype`_

Read this first when resuming work (agents: also `CLAUDE.md`). Pair with `docs/requirements.md` (original interaction spec) and `docs/sample-content.md`.

## Workflow
- Branch `phase-1-prototype`; push directly (pushes deploy Pages). Milestones are PR'd and merged to `main` when James asks (first: Nov 23, 2026); keep the branch — the deploy runs from it.
- Commit as `James Melzer <netapp-jamesmelzer@users.noreply.github.com>`.
- Deployed by GitHub Pages (`.github/workflows/deploy.yml`) on push: https://netapp-jamesmelzer.github.io/netapp-genie-ixd/
- Pushes authenticate as `netapp-jamesmelzer` via a repo-local git credential helper (see local `git config`). Deploy workflow runs on Node 24 (actions bumped Nov 23).
- Build: `npm run build` (tsc strict incl. `noUnusedLocals`/`noUnusedParameters`, then vite). Must pass clean.
- Figma (current): file `RdQdLmjTEVawc2wGeB6EkB` ("genie-ixd"), Page 1 `0:1` — node ids in `CLAUDE.md`. The old Skunkworks file (`PoMIBV4u8ZpCIE39FenV9k`, referenced in `docs/figma-findings.md`) is superseded.

## Conventions
- Radii: `--radius-tag` (4px) for tags only; `--radius-infinite` (999px) for everything fully rounded (buttons, nav pill, chips).
- Asset helpers (`assets.ts`) return absolute URLs — required for `--icon: url(...)` CSS vars, which otherwise resolve against `/assets/` in production.
- Eyebrow accent on dark surfaces is `--color-eyebrow-cyan` (the old teal token is gone).
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
1. **Nav** — pill (logo │ Explore ≡) + account control grouped and centered (`.nav-group`). **Auto theme:** page surfaces carry `data-nav-theme="dark|light"`; a ScrollTrigger per surface flips the nav (`data-theme` on `.nav-bar-wrapper`) when that surface is behind the nav's centre line — light = Figma Home 4/6 (`#1E252F` on frosted white + soft shadow), dark = white on frosted dark; 0.35s crossfade. Logo and icons are `.icon-mask` (currentColor). Any open modal pins dark. New surfaces need a `data-nav-theme`. Active state = Figma "selected" fill (`--color-nav-selected`) on the pill / account circle; label stays "Explore". Nav modal and Account modal are mutually exclusive; AI chat modal stays underneath. Escape closes the topmost modal.
2. **AI prompt** — single sticky prompt (inline hero prompt removed). 3 states: huge (5 lines, initial) → large (3 lines) via ScrollTrigger on `#moment-1` or when any modal opens → small (1 line) via collapse toggle (small ↔ large). While the chat is open the placeholder reads "Make a selection or type something else…". Placeholder: "What data and infrastructure challenge are you looking to solve today?" Sparkle icon, textarea and send button are top-aligned in huge/large. **Small** is a single 62px line: sparkle · text · send · size toggle, "Solve problems" hidden. **Focus glow:** while the textarea has focus, a full-viewport `.ai-prompt-glow` (z 29, just under the prompt, click-through) fades in — radial `#7B27FF` 10% → 0 centred on the prompt (`--prompt-cx/cy`, kept live by AIPrompt); tune via `--prompt-glow-from/to` in tokens. (`AIPrompt.ts`)
3. **Persona** — scroll-based collapse animation **dropped**. Two-line sentence "I'm a/an [role ▾] / focused on [goal ▾]" (article auto). Each dropdown is text + cyan underline + cyan drop arrow (Figma), no pill/box. Custom ARIA listbox (keyboard + outside-click). State lives in `src/state/persona.ts`; the page picker and Account Modal both bind to it. Page edits fire `persona-change` (source `page`) → account "ping"; edits inside the Account Modal don't ping.
   - **Saved status** (`createPersonaStatus` in `PersonaPicker.ts`), under both forms: on a change, "[SAVED] We'll customize your site experience based on this choice." pops in, holds 3s, then fades out over 500ms (space stays reserved, so nothing shifts); a change while it's showing pulses the tag and restarts the hold. The form never hides — people will play with it. Each form shows its own row only for its own changes.
   - The old moment 3 ("Thanks! We'll customize…") was removed on purpose; the Saved row replaces it.
   - Roles: Chief Information Officer, Chief Data Officer, VP Infrastructure/Operations, Chief Information Security Officer, DevOps Engineer, Storage Engineer.
   - Goals: adopting AI safely and affordably, managing data at scale, migrating virtualization paradigms, meeting regulatory requirements, achieving consistent delivery across hybrid cloud.
4. **Recommended for you** (`#moment-4`) — no eyebrow above the heading (eyebrows inside feature cards stay).
5. **Section 6 (`.footer-section`, Figma Home 6 `1:1020`)** — rebuilt Nov 23 to Figma; content column `--home6-width` 1224px (`.home6-inner`). In order:
   - `.news` — "Latest at NetApp" / "News and announcements" with plain prev/next arrows; a scroll-snap carousel (`NewsCarousel.ts`) of 376px cards (48px gap, 3 visible) and a violet card-width progress bar that slides along a 2px rail. Cards 4–6 are placeholder copy (marked `data-placeholder`) so the carousel can move.
   - `.next-steps-section` — "Next steps" headline (76px Thin) beside "Emma's quick start links" (36px illustrations from `public/media/illustration/`); 3 image cards (Solutions `card-1`, Talk to sales `card-2`, Find a partner `card-3`; 391px tall); then "Resources and support" (39px Regular) with 4 static rows (Downloads, Documentation, Troubleshooting, Training) over the blurred #E6EBF2 glow. No expand behavior.
   - `.mega-footer` — Figma gradient, teal NetApp logo (SVG mask), 5 link columns, divider, © + legal links. Bottom padding adds `--prompt-stack`.
6. **Stage (moments 1–2)** — one sticky `space_video_1.mp4` behind hero and persona (`.stage__bg`, sticky + `margin-bottom: -100vh`).
6a. **Slides: Hero → Persona → Recommended → Customer Story** (`SlideSnap.ts`) — a small scroll intent (wheel ≥ 6px, swipe ≥ 24px, ↓/↑/PgDn/PgUp/Space) glides to the next/previous slide over 1.1s; the scrubbed ScrollScenes play during the glides. Slack: input during a glide and its momentum tail is swallowed (momentum detected by decaying deltas; ≥1.6s, ≤5s), so a hard flick moves exactly one slide; at the end of the story, the first 160px of fresh downward scroll is absorbed with a small elastic "give" before normal scrolling resumes; scrolling up while the story is still in view glides back to it. Sections taller than the viewport scroll freely inside; glides start/end at their edges. Knobs in `CONFIG`. Off while a modal is open.
6b. **Hero partner logos** — `public/media/logos/*.svg` in a CSS marquee (`.hero__partners`): static edge-fade mask on the container, duplicated set crawling left→right (`--partners-crawl-duration` 40s, `--partners-fade` 18%). Figma's internal-gradient fade is intentionally not used. Stops under reduced motion. The story's ESA logo (`logos/esa.svg`) sits top-right per Figma.
6c. **Video morph, Persona → Recommended** (`VideoMorph.ts`) — the stage video shrinks into the featured card and becomes its background (card-1.jpg retired). One `<video>` element is moved between three hosts (`.stage__zoom` → fixed `.video-morph` layer → `.feature-card__media`), so playback never jumps. Scroll-scrubbed over `#moment-4` "top bottom"→"top top" (plays inside the SlideSnap glide, reverses on the way up); clip and video box interpolate viewport → card's live rect, shaped by `MORPH_EASE` (power2.out); stage gradients/dim fade out. Stacking matters: the layer is z 1 right after `.stage__bg` — above Recommended's white background, below all section content; the featured card is transparent so the flying video shows through it. The stage push-in now animates `.stage__zoom`, never the video. Reduced motion: host swap at the midpoint, no flight. Recommended's heading, side card and card copy rise in during the morph (ScrollScenes).
6d. **Story fade-out** (`ScrollScenes.storyFadeOut`) — as the customer story leaves, its video + 50% scrim fade 1 → 0 (scrubbed) between 400px and 100px of the section remaining, revealing the section's white background (always white under the video, so the fade start can be tuned freely); at the 300px line, with the copy off-screen, the section flips (no fade) to `.is-faded` — dark copy, purple eyebrow, dark ghost button/logo — and sets its own `data-nav-theme="light"` so the nav turns light with it. Reverses on the way up. Runs under reduced motion too (it's a fade).
7. **Scroll choreography** — `ScrollScenes.ts`: all scrubbed, skipped under reduced motion. Enter tweens animate children, exit tweens animate wrappers.
8. **Modals** — Account modal opens with "Tell us about yourself" (small white `.persona-note` type) above the sentence; below 1000px viewport height it uses a compact vertical rhythm so cards clear the prompt. Nav: `menu.jpg` + purple scrim, Figma column grid. Account: `account.mp4`, 3 synced persona dropdowns, 3 link cards. AI chat: full-viewport blurred vignette + white card (runs off the bottom so the sticky prompt sits inside it), header (brand chip, collapse control), 1:3:1 columns (Chat history / thread / Resources). Collapse shrinks the modal back into the prompt rect.

## Open items
- Owed by James: footer social icons (Facebook, Instagram, LinkedIn, X — Figma shows them under Contact & Feedback and at the end of the legal row).
- Owed by James (optional): a `turn_right` icon for the chat prompt echo (currently the ↳ glyph); favicon.
- Offered, not yet done: replace placeholder next-steps card photos (`card-1..3.jpg`) with real Figma images.
- Some copy is still placeholder (not from Figma) outside the next-steps section; verify against Figma when touched.
- Home 4 ("Recommended for you") still uses the old circled carousel arrows and lacks Figma's progress rail; `NewsCarousel` can drive it once it has more cards.
- Possible future: dark→light background choreography into moment 4.

## Collaboration notes
- James runs explicit feedback passes; execute them directly and precisely (be careful with nesting/spacing interpretation). Major decisions go through James. Don't involve other people.
