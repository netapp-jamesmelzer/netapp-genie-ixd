# Monday to-do list

_Captured Nov 20, 2026 · completed Nov 23, 2026 (uncommitted working tree on `phase-1-prototype`)_

1. ✅ **Footer scroll clearance** — `.mega-footer` bottom padding adds `--prompt-stack`
   (live prompt height + offset, published by `AIPrompt.ts`), so the footer scrolls
   fully clear of the prompt in any prompt size state.
2. ✅ **Product overview card image** — `product-overview-card.png`, 376:212 ratio.
3. ✅ **Nav & account modal backgrounds** — nav: `menu.jpg` under a purple scrim;
   account: looping `account.mp4` under two 20% black scrims (Figma).
4. ✅ **Hero + persona picker scroll animations** — moments 1–3 now share one sticky
   earth video ("stage", as in Figma Home/Home 2/Home 3) that pushes in and dims
   with scroll; hero copy drifts up and out; persona headline and lines rise in and
   the cyan underlines draw in; confirmation rises in. All scrubbed (`ScrollScenes.ts`).
5. ✅ **Customer story scroll animations** — video eases from push-in to rest and
   back; eyebrow, headline (word by word), ESA label and button rise in; content
   lifts out on exit.
6. ✅ **Nav modal details** — Figma column positions, "Contact Sales" added, plain
   close X, staggered link entrance, Figma "selected" fill on the active nav pill.
7. ✅ **Account modal details** — three live persona dropdowns (role/goal/industry)
   synced with the page picker; Dashboard/Account/Console link cards; staggered entrance.
8. ✅ **AI Chat Modal** — Chat history column restored (1:3:1), duplicate prompt
   removed, visible collapse/dismiss control (shrinks back into the prompt), Figma
   copy as rich-text typewriter. Hard rule added to `CLAUDE.md` (immutable directions)
   and `docs/status.md`.
