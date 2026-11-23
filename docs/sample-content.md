# Sample Content — prototype copy

> Copy currently rendered by the prototype, and where it lives in code. Figma
> copy is marked (Figma); everything else is placeholder. The code does not
> parse this file — keep it in sync by hand.

## AI Chat Modal (`src/components/AIChatModal.ts`) — Figma

**Chat history** (left column; the submitted prompt is appended as the current,
highlighted chat):
- How to securely consolidate and stage AI training data from sources in multiple clouds
- Compare CapEx and OpEx investment scenarios
- _(current)_ the user's prompt, e.g. "How can NetApp accelerate my AI infrastructure?"

**AI response** (typewriter, rich text — `AI_RESPONSE_HTML`):

> NetApp accelerates AI infrastructure by making data ready, available, and
> protected across on-premises and cloud environments:
>
> - **Scale performance independently:** AFX disaggregates performance and capacity for demanding AI workloads.
> - **Prepare data faster:** AI Data Engine curates, transforms, and serves AI-ready data in place.
> - **Feed GPUs efficiently:** Validated NVIDIA DGX SuperPOD and AIPod architectures reduce storage bottlenecks.
> - **Unify hybrid data:** ONTAP supports data mobility across AWS, Azure, Google Cloud, and on premises.
> - **Protect AI assets:** Built-in ransomware detection, Snapshot copies, and governance help secure models and datasets.
>
> [Explore AI infrastructure]
>
> Would you like a focused view of AFX capabilities for AI training, RAG, or inference?

**Resources** (right column, revealed after the response):
1. VIRTUAL BRIEFING — Ready to build your own intelligent data infrastructure? → (`chat-resource-1.jpg`)
2. ASSESSMENT — Take the AI readiness assessment → (`chat-resource-2.jpg`)

**Prompt placeholder while the chat is open:** "Make a selection or type something else…"

## Nav Modal (`src/components/NavModal.ts`) — Figma

- Primary: Platform · Storage · Data Services · Solutions · Support · Resources
- Column 2: Customer Stories · Partnerships · Thought Leadership · Communities ·
  Product Updates · _(gap)_ · How to Buy · Test Drive a Product · Find a Partner ·
  Contact Sales
- Column 3: Blogs · Careers · Investors · _(gap)_ · Technical Support ·
  Developers · Downloads · Training

## Account Modal (`src/components/AccountModal.ts`) — Figma

- Persona sentence: "I'm a/an [role ▾] / focused on [goal ▾] / in the [industry ▾]"
- DASHBOARD — Access support, communities and trainings, Sign in →
- ACCOUNT — Don't have an account? Click here to create an account →
- CONSOLE — Monitor and run hybrid cloud data services, NetApp Console →

## Persona options (`src/state/persona.ts`)

- **Role:** Chief Information Officer · Chief Data Officer · VP Infrastructure/Operations ·
  Chief Information Security Officer · DevOps Engineer · Storage Engineer
- **Goal:** adopting AI safely and affordably · managing data at scale · migrating
  virtualization paradigms · meeting regulatory requirements · achieving consistent
  delivery across hybrid cloud
- **Industry** (account modal only; placeholder — Figma shows only "space industry"):
  space industry · financial services industry · healthcare industry ·
  manufacturing industry · public sector · media and entertainment industry

## Persona Saved status (page picker + account modal)

"[SAVED] We'll customize your site experience based on this choice." — shown
under the form after the first change; the form stays editable. (Replaces the
removed moment-3 confirmation.)

## Home 6 news carousel (`index.html`, `.news`)

1–3 are Figma; 4–6 are placeholder (`data-placeholder`):
1. AWS RE:INVENT — Join NetApp at AWS Summit Berlin to explore cloud, AI, and modern data infrastructure. [Explore AWS Summit Berlin]
2. GARTNER — Discover why Gartner recognizes NetApp for leadership in enterprise storage and data infrastructure. [Read the Gartner report]
3. ANALYST REPORT — Get the latest analyst perspective on cyber resilience, data protection, and AI-ready infrastructure. [Download the report]
4. NETAPP INSIGHT — Watch the keynotes and breakout sessions on intelligent data infrastructure on demand. [Watch on demand]
5. PRESS RELEASE — NetApp expands AFX and AI Data Engine to speed the path from raw data to AI-ready data. [Read the announcement]
6. BLOG — See how enterprises are building secure, AI-ready data pipelines across hybrid cloud. [Read the blog]

## Home 6 quick start links — Figma

Emma's quick start links: Explore your workflows → · Manage your profile → · Open your workspace → · Connect your data →
