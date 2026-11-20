/**
 * AIChatModal
 * ---------------------------------------------------------------------------
 * The most complex component. A modal (z-index 10 — BELOW the nav/account
 * modals and the AI prompt, so those remain usable on top of it) that expands
 * out of the AI Prompt box when the user submits a prompt.
 *
 * Layout: three columns in a flexbox at 1 : 3 : 1 —
 *   .chat-history (left)   : previous chats, first marked active
 *   .chat-thread (center)  : prior bubbles, the typewriter AI response, and an
 *                            in-modal prompt input mirroring the main AI prompt
 *   .chat-artifacts (right): two cards revealed after the typewriter completes
 *
 * Open sequence (GSAP timeline):
 *   1. display:flex, geometry set to match the AI Prompt rect, opacity 0,
 *      transparent background.
 *   2. Expand to the full viewport + fade to opaque (bg -> --color-modal-bg).
 *   3. Dissolve in .chat-layout contents.
 *   4. Start the typewriter on .ai-response (~40 chars/sec).
 *   5. After the typewriter completes, stagger in the two artifact cards.
 */
import gsap from 'gsap';

const MODAL_INSET = 16; // px — mirrors --modal-inset token

/**
 * Placeholder AI response (also documented in docs/sample-content.md). Kept as a
 * constant here because the typewriter reads it directly from code.
 */
const AI_RESPONSE = `NetApp's intelligent data infrastructure brings your hybrid cloud together under a single control plane. Whether your workloads live on-premises, at the edge, or across multiple public clouds, you get consistent storage, data management, and security without rewriting a thing.

For teams modernizing their storage estate, ONTAP-based systems deliver built-in efficiency: inline deduplication, compression, and automated tiering move cold data to lower-cost object storage while keeping hot data fast. You pay for performance where it matters and capacity where it doesn't.

On the operations side, our observability tooling surfaces cost, performance, and risk in one place, so you can right-size capacity before it becomes a fire drill. Policy-driven automation handles the repetitive work, and ransomware detection watches for anomalies around the clock.

Want me to put together a short migration outline, or compare the cloud storage tiers for your workload profile? I've pulled a couple of starting points into the panel on the right.`;

interface ArtifactSpec {
  title: string;
  description: string;
}

const ARTIFACTS: ArtifactSpec[] = [
  {
    title: 'Cloud Storage Tiers — Quick Comparison',
    description:
      'Side-by-side of performance, capacity, and archive tiers with indicative price/performance ratios.',
  },
  {
    title: '90-Day Migration Outline',
    description:
      'A phased template covering assessment, pilot, cutover, and optimization — with stakeholder checkpoints.',
  },
];

const TYPE_SPEED_CPS = 40; // characters per second

export class AIChatModal {
  readonly el: HTMLDivElement;
  private isOpen = false;

  private readonly responseEl: HTMLDivElement;
  private readonly artifactsEl: HTMLDivElement;
  private readonly layoutEl: HTMLDivElement;

  private typeTimer: number | null = null;
  private openTl: gsap.core.Timeline | null = null;

  onClose: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ai-chat-modal';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-label', 'AI chat');

    this.el.innerHTML = `
      <button class="modal-close" type="button" aria-label="Close chat">&times;</button>
      <div class="chat-layout">
        <aside class="chat-history">
          <p class="chat-col-title">Chats</p>
          <div class="chat-history__item is-active">Comparing cloud storage tiers</div>
          <div class="chat-history__item">Ransomware recovery options</div>
          <div class="chat-history__item">Kubernetes persistent volumes</div>
          <div class="chat-history__item">Reducing cold data costs</div>
        </aside>
        <section class="chat-thread">
          <div class="chat-bubble chat-bubble--ai">Hi! I'm NetApp Genie. Ask me about storage, cloud, or data management.</div>
          <div class="chat-bubble chat-bubble--user" data-user-echo>Tell me about NetApp cloud storage.</div>
          <div class="ai-response" aria-live="polite"></div>
        </section>
        <aside class="chat-artifacts">
          <p class="chat-col-title">Resources</p>
        </aside>
      </div>
    `;

    this.layoutEl = this.el.querySelector('.chat-layout') as HTMLDivElement;
    this.responseEl = this.el.querySelector('.ai-response') as HTMLDivElement;
    this.artifactsEl = this.el.querySelector('.chat-artifacts') as HTMLDivElement;

    (this.el.querySelector('.modal-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.onClose()
    );
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.el);
  }

  get opened(): boolean {
    return this.isOpen;
  }

  /**
   * Open the modal, expanding out of the given rect (the AI Prompt box).
   * @param fromRect  bounding rect to grow from
   * @param promptText  the user's submitted prompt (echoed into the thread)
   */
  open(fromRect: DOMRect, promptText?: string): void {
    if (this.isOpen) return;
    this.isOpen = true;

    // Reset any previous run.
    this.resetContents();

    if (promptText) {
      const echo = this.el.querySelector('[data-user-echo]') as HTMLDivElement | null;
      if (echo) echo.textContent = promptText;
    }

    // Step 1: show + match the prompt rect, transparent.
    this.el.style.display = 'flex';
    gsap.set(this.el, {
      position: 'fixed',
      top: fromRect.top,
      left: fromRect.left,
      width: fromRect.width,
      height: fromRect.height,
      opacity: 0,
      backgroundColor: 'var(--color-modal-overlay)',
      borderRadius: 'var(--radius-modal)',
    });
    gsap.set(this.layoutEl, { opacity: 0 });

    // Steps 2-5 as a timeline.
    this.openTl = gsap.timeline();
    this.openTl
      // Step 2: expand to full viewport + become opaque.
      .to(this.el, {
        top: MODAL_INSET,
        left: MODAL_INSET,
        width: `calc(100vw - ${MODAL_INSET * 2}px)`,
        height: `calc(100vh - ${MODAL_INSET * 2}px)`,
        borderRadius: 'var(--radius-modal)',
        opacity: 1,
        backgroundColor: 'var(--color-modal-bg)',
        duration: 0.5,
        ease: 'power2.out',
      })
      // Step 3: dissolve in the contents.
      .fromTo(
        this.layoutEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        '>-0.05'
      )
      // Step 4: start the typewriter once contents are visible.
      .add(() => this.runTypewriter());
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.openTl?.kill();
    this.openTl = null;
    this.stopTypewriter();

    gsap.to(this.el, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: () => {
        this.el.style.display = 'none';
        this.resetContents();
      },
    });
  }

  // -- Internal helpers -----------------------------------------------------

  private resetContents(): void {
    this.stopTypewriter();
    this.responseEl.textContent = '';
    // Remove any previously rendered artifact cards (keep the title).
    this.artifactsEl
      .querySelectorAll('.artifact-card')
      .forEach((card) => card.remove());
  }

  /** Character-by-character reveal at ~TYPE_SPEED_CPS, then reveal artifacts. */
  private runTypewriter(): void {
    const text = AI_RESPONSE;
    let i = 0;
    const intervalMs = 1000 / TYPE_SPEED_CPS;

    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.innerHTML = '&nbsp;';

    const textNode = document.createElement('span');
    this.responseEl.appendChild(textNode);
    this.responseEl.appendChild(caret);

    this.typeTimer = window.setInterval(() => {
      i += 1;
      textNode.textContent = text.slice(0, i);
      if (i >= text.length) {
        this.stopTypewriter();
        caret.remove();
        this.revealArtifacts();
      }
    }, intervalMs);
  }

  private stopTypewriter(): void {
    if (this.typeTimer !== null) {
      window.clearInterval(this.typeTimer);
      this.typeTimer = null;
    }
  }

  /** After the response completes, stagger in the two artifact cards. */
  private revealArtifacts(): void {
    const cards: HTMLDivElement[] = ARTIFACTS.map((a) => {
      const card = document.createElement('div');
      card.className = 'artifact-card';
      card.innerHTML = `<h4>${a.title}</h4><p>${a.description}</p>`;
      this.artifactsEl.appendChild(card);
      return card;
    });

    gsap.fromTo(
      cards,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: 'power2.out',
        stagger: 0.12,
      }
    );
  }
}
