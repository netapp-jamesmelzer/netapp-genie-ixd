# Project status & handoff notes

_Last updated: Nov 20, 2026 — HEAD `31d7ce3` (wave 3) on `phase-1-prototype`_

Read this first when resuming work. Pair with `docs/requirements.md` (original interaction spec) and `docs/sample-content.md`.

## Workflow
- Branch `phase-1-prototype`; push directly. **No PRs, no merges, no reviewers.**
- Commit as `James Melzer <netapp-jamesmelzer@users.noreply.github.com>`.
- Deployed by GitHub Pages (`.github/workflows/deploy.yml`) on push: https://netapp-jamesmelzer.github.io/netapp-genie-ixd/
- The agent's GitHub App cannot push changes under `.github/workflows/`.
- Build: `npm run build` (tsc strict incl. `noUnusedLocals`/`noUnusedParameters`, then vite). Must pass clean.
- Figma: file `PoMIBV4u8ZpCIE39FenV9k`, page "genie ixd" `2084:23611`; Home 6 = `2084:24178`; Next steps Option 11 = `2084:24197`.

## Conventions
- All design values live in `src/styles/tokens.css`.
- Assets always resolved via `iconUrl` / `mediaUrl` / `fontUrl` in `src/utils/assets.ts` (Pages subpath; `base: './'`). Never absolute paths.
- Z-index: 1 page, 10 AI chat modal, 20 nav/account modals, 30 AI prompt, 40 nav bar.
- Text buttons carry `ic_arrow_outward.svg`. Cyan text is acceptable in this exploration.

## Hard requirements (do not regress)
- **AI prompt max-width is always 800px** (`--prompt-max-width`). Never changes.
- **The nav bar is NOT sticky/fixed.** It sits in normal flow at the top and scrolls away. It slides in (temporarily `position: fixed`, class `is-fixed`) only on scroll-up after it has left the viewport, hides on scroll-down (`is-hidden`), and returns to its in-flow position at the top. `.nav-spacer` prevents layout jumps. (`NavBar.ts`, `nav.css`)

## Current page structure & decisions
1. **Nav** — pill + account control grouped and centered (`.nav-group`); Explore uses `ic_menu.svg`. Nav modal and Account modal are mutually exclusive; AI chat modal stays underneath.
2. **AI prompt** — single sticky prompt (inline hero prompt removed). 3 states: huge (5 lines, initial) → large (3 lines) via ScrollTrigger on `#moment-1` → small (1 line) via collapse toggle (small ↔ large). Placeholder: "What data and infrastructure challenge are you looking to solve today?" (`AIPrompt.ts`)
3. **Persona** — scroll-based collapse animation **dropped**. Inline sentence "I'm a [role ▾] focused on [goal ▾]": each dropdown is text + cyan underline + down arrow, no pill/box. Custom ARIA listbox (keyboard + outside-click). Selection fires `persona-change` → account "ping". (`PersonaPicker.ts`)
   - Roles: Chief Information Officer, Chief Data Officer, VP Infrastructure/Operations, Chief Information Security Officer, DevOps Engineer, Storage Engineer.
   - Goals: adopting AI safely and affordably, managing data at scale, migrating virtualization paradigms, meeting regulatory requirements, achieving consistent delivery across hybrid cloud.
   - `.persona-chip` CSS is kept only because `AccountModal.ts` uses it in its recap.
4. **Recommended for you** (`#moment-4`) — no eyebrow above the heading (eyebrows inside feature cards stay).
5. **Section 6 (`.footer-section`)**, in order:
   - `.news` — news cards flush to the grid: no border, padding or radius.
   - `.next-steps-section` — contains the heading ("Take the next step toward cyber resilience"), the 3 image cards (Solutions / Find a partner / Talk to sales) **and the Resources & support accordion**. They share one outer margin, white background and the blur glow (`::before`). Card images sit inside the card's 20px padding (not outdented), square corners. Accordion: full width within the section, `ic_add.svg`, 4 rows, no expand behavior needed.
   - `.mega-footer`.

## Open items
- Owed by James: hero logos; ESA story logo over the rocket video.
- Offered, not yet done: replace placeholder next-steps card photos (`card-1..3.jpg`) with real Figma images.
- Some copy is still placeholder (not from Figma) outside the next-steps section; verify against Figma when touched.
- Possible future: scroll choreography polish (huge→large prompt transition, background choreography).

## Collaboration notes
- James runs explicit feedback passes; execute them directly and precisely (be careful with nesting/spacing interpretation). Major decisions go through James. Don't involve other people.
