# Figma Findings — "genie ixd" page

> ⚠️ **Superseded source.** The current Figma is `RdQdLmjTEVawc2wGeB6EkB` (see `CLAUDE.md` for node ids).
> The node ids below refer to the old Skunkworks file; the design content is largely the same.

> Source: **Design System Skunkworks** (`PoMIBV4u8ZpCIE39FenV9k`), page **genie ixd** (`2084:23611`).
> Read-only reference for Phase 2 visual fidelity. Draft — not committed yet.

## Page structure (11 frames)

The page is a **scroll-driven narrative**: five full-viewport "moments" (1600×930 each) stacked
vertically, then one long scrollable footer frame. Three modal frames and a standalone prompt
state sit off to the side as separate artboards.

| Role | Frame | Node | Size |
|------|-------|------|------|
| Moment 1 — Hero | Home | `2084:23957` | 1600×930 |
| Moment 2 — Persona builder | Home 2 | `2084:24071` | 1600×930 |
| Moment 3 — Persona confirmation | Home 3 | `2084:24104` | 1600×930 |
| Moment 4 — Recommended (light) | Home 4 | `2084:24119` | 1600×930 |
| Moment 5 — Customer story | Home 5 | `2084:24152` | 1600×930 |
| Footer / long scroll | Home 6 | `2084:24178` | 1600×**3146** |
| Modal — AI chat | AI chat modal | `2084:23716` | 1600×930 |
| Modal — Account | Account modal | `2084:23885` | 1600×930 |
| Modal — Nav | nav modal | `2084:23943` | 1600×930 |
| Prompt active state | prompt-bubble-lg | `2084:23942` | 1000×136 |
| Prompt focus label | AI Prompt - Focus state | `2084:24317` | (annotation) |

## The five moments

1. **Hero** — Cinematic dark background (base `#110F1A`, space imagery video/stills with heavy
   top+bottom dark gradients). Centered headline **"The fastest enterprise storage on the planet"**
   in F37 Judge Thin **104px** white; subcopy 22/33 below. The **big** prompt bubble sits centered
   (~1219×268, frosted `#FFFFFF/0.96`). Partner logo strip (S&P Global, ESA) at mid-height.
   Frosted nav pill centered at top.
2. **Persona builder** — Dark. "Find the right NetApp solution for you" (76px). A fill-in-the-blank
   sentence: **"I'm an [infrastructure architect] focused on [managing data at scale]"** (Judge Thin
   49px, selectable inline chips). *This is the persona picker.* The prompt bubble is now the **small
   docked** variant (1000×136, solid white, border `#C5CCE0`, shadow, radius 22) pinned near the bottom.
3. **Persona confirmation** — Dark. "Thanks! We'll customize your site experience based on your role
   as an information architect focused on managing data at scale…" (39px). Prompt docked bottom.
4. **Recommended for you** — Background flips to **light** (radial `#EAEEF7`→`#FFFFFF`). "Recommended
   for you" in dark Judge Thin 49px. Featured editorial block: eyebrow "DATA INFRASTRUCTURE AT SCALE",
   statement text, a `Button - card` ("Explore infrastructure solutions"), a 798×449 media panel, plus
   a smaller "Product overview → Learn more" card. Carousel arrows top-right. Prompt docked.
5. **Customer story** — Dark again. Eyebrow **"CUSTOMER STORY"** in cyan `#00DDF4`. Pull quote "The
   European Space Agency uses NetApp…" (61px). ESA logo top-right. Ghost "Read the story" button. Prompt docked.

**Footer (Home 6, 3146 tall):** eyebrow "LATEST AT NETAPP" (purple `#7B27FF`), "News and announcements"
(60px), a row of three news cards (AWS re:Invent / Gartner / analyst report — tag + body + card button),
then a "Resources and support" section built as an **accordion stack** (Downloads, Documentation, … with
`Action / ic_add` toggles), then the full dark **mega-footer** (multi-column link lists: News & Stories,
Contact & Feedback, Quality Certifications, Sustainability, social icons, NetApp logo). Prompt docked.

## The three modals

- **Nav modal** (`2084:23943`) — Solid deep-purple `#25193A` full-bleed. **Three columns of Judge Thin
  links**, not tabs: col 1 large 57px (Platform / Storage / Data Services / Solutions / Support /
  Resources); cols 2–3 smaller 22px (Customer Stories, Partnerships, Thought Leadership, Communities,
  Product Updates, How to Buy… / Blogs, Careers, Investors, Technical Support, Developers, Downloads,
  Training). Nav pill shows the active/selected state. *Differs from the current 5-tab × 10-link build.*
- **Account modal** (`2084:23885`) — Dark. Giant "A" avatar glyph (120px). Persona recap sentence, now
  extended: "I'm an information architect focused on managing data at scale **in the space industry**."
  Three sections with cyan eyebrows — **Dashboard / Account / Console** — each with body copy + a sign-in
  style link. Prompt docked.
- **AI chat modal** (`2084:23716`, 206 nodes, most complex) — Behind: the hero, blurred/darkened, with a
  giant "NetApp AFX" wordmark (170px) and a big prompt bubble (the page dissolves behind the modal). On
  top: a white rounded card `genie-sep23` (1500×826, radius 20) in **two columns** — LEFT a conversation
  column (user suggestion pill → response text → docked prompt box at bottom), RIGHT a resource rail of
  media-thumbnail + label cards. This realizes the "chat over a dimmed page" intent from requirements.

## Design-system signals

- **Typeface:** Everything is **F37 Judge** — Thin (100) for display/headlines, Regular (400) for
  body/UI, Medium (500) for eyebrows (UPPERCASE, letter-spacing ~2). Matches the three weights already in
  the repo (`/public/fonts`). ✅
- **Type scale (observed):** 170 (AFX) · 120 (avatar) · 104 (hero) · 76 · 60/61 · 57 · 49 · 39 · 36 ·
  body 22/33 · UI 20/25, 18/22.5 · eyebrow 14/19.6 upper.
- **Signature gradient:** the AI submit arrow = `linear(225deg, #7B27FF → #00DDF4)` (purple→cyan). This is
  the "genie"/AI accent.
- **Accents:** cyan `#00DDF4`, purple `#7B27FF`. ⚠️ Note: cyan is used as **eyebrow text** here (Customer
  Story; Dashboard/Account/Console) — the figma-netapp token project forbids cyan-for-text, but that rule
  may not govern this exploration. Flagging for James.
- **Neutrals:** darks `#110F1A` / `#1E252F` / `#25193A` (nav purple-dark); lights `#F4F1ED` (chat bg),
  `#EAEEF7` radial, `#E2ECF2` (card button), `#CFDDE6` / `#C5CCE0` (borders, frosted surfaces).
- **`prompt-bubble-lg`** is the spine of the whole page — present in **every** frame in two variants:
  **big centered** (hero, frosted) and **small docked** (1000×136, solid, bordered). Both carry cycling
  placeholder prompts, the gradient submit arrow, and a quick-action row ("Solve problems", …).
- **`nav`** component: frosted pill (NetApp logo + "Explore") with a separate search circle; frost opacity
  varies with the background behind it.

## Deltas vs. the current Phase-1 prototype

1. **Nav modal** — current = 5 side-tabs × 10 links; Figma = 3 columns of Judge Thin links on solid
   purple. Rebuild needed to match.
2. **Persona picker** — current = two `<select>` dropdowns in a slot; Figma = the inline "I'm an ___
   focused on ___" sentence inside the scroll flow (Moment 2), echoed in the account modal ("in the ___").
3. **Scroll choreography** — the hero's **big** prompt bubble appears to **dock to the bottom as a small
   bubble** and stay pinned across moments 2–5 and the footer. That big→small dock is the headline animation.
4. **Background choreography** — dark (1–3) → light (4) → dark (5) → light footer.
5. **Media** — frames reference many image/video fills (space stills, Getty/Adobe stock, AFX beauty shots)
   not yet in the repo. Repo currently has: card-1/2/3, chat-resource-1/2, menu.jpg, account.mp4,
   space_video_1/2.mp4, illustrations.
