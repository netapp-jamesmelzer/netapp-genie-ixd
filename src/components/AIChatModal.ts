/**
 * AIChatModal
 * ---------------------------------------------------------------------------
 * A modal (z-index 10 — BELOW the nav/account modals and the AI prompt, so
 * those remain usable on top of it) that expands out of the AI Prompt box when
 * the user submits a prompt. Figma: "AI chat modal" (1:558) / card
 * "genie-sep23" (1:675).
 *
 * ⚠️ HARD RULE: this modal must NEVER contain its own prompt input. The single
 * sticky AI prompt (AIPrompt.ts, z 30) floats over the bottom of the center
 * column and IS the chat input. The thread reserves bottom space for it via
 * the --prompt-stack custom property (set by AIPrompt).
 *
 * Layout: a white card with a header (brand chip left, collapse control right)
 * and three columns at 1 : 3 : 1 —
 *   .chat-history  (left)  : "Chat history"; the current chat is highlighted
 *   .chat-thread   (center): user prompt echo + typewriter AI response
 *   .chat-artifacts(right) : two resource cards revealed after the response
 * The 1:3:1 grid keeps the center column centered in the viewport, so the
 * sticky prompt lines up with it.
 *
 * Open sequence (GSAP timeline):
 *   1. Geometry set to the AI Prompt rect, transparent.
 *   2. Expand to the full viewport + fade to the dark vignette.
 *   3. Dissolve in the card.
 *   4. Typewriter-reveal the (rich-text) response.
 *   5. Stagger in the two resource cards.
 * Close: the collapse control shrinks the modal back into the prompt rect.
 */
import gsap from 'gsap';
import { iconUrl, mediaUrl } from '../utils/assets';

/** Previous chats shown above the current one in the history column. */
const PREVIOUS_CHATS: string[] = [
  'How to securely consolidate and stage AI training data from sources in multiple clouds',
  'Compare CapEx and OpEx investment scenarios',
];

/**
 * AI response (Figma copy; also in docs/sample-content.md). Rich text: the
 * typewriter reveals it character by character while preserving the markup.
 * Keep it free of whitespace between tags.
 */
const AI_RESPONSE_HTML =
  '<p>NetApp accelerates AI infrastructure by making data ready, available, and protected across on-premises and cloud environments:</p>' +
  '<ul>' +
  '<li><strong>Scale performance independently:</strong> AFX disaggregates performance and capacity for demanding AI workloads.</li>' +
  '<li><strong>Prepare data faster:</strong> AI Data Engine curates, transforms, and serves AI-ready data in place.</li>' +
  '<li><strong>Feed GPUs efficiently:</strong> Validated NVIDIA DGX SuperPOD and AIPod architectures reduce storage bottlenecks.</li>' +
  '<li><strong>Unify hybrid data:</strong> ONTAP supports data mobility across AWS, Azure, Google Cloud, and on premises.</li>' +
  '<li><strong>Protect AI assets:</strong> Built-in ransomware detection, Snapshot copies, and governance help secure models and datasets.</li>' +
  '</ul>' +
  '<p><a href="#" class="ai-response__link">Explore AI infrastructure</a></p>' +
  '<p>Would you like a focused view of AFX capabilities for AI training, RAG, or inference?</p>';

interface ArtifactSpec {
  tag: string;
  label: string;
  image: string;
}

const ARTIFACTS: ArtifactSpec[] = [
  {
    tag: 'Virtual briefing',
    label: 'Ready to build your own intelligent data infrastructure?',
    image: 'chat-resource-1.jpg',
  },
  {
    tag: 'Assessment',
    label: 'Take the AI readiness assessment',
    image: 'chat-resource-2.jpg',
  },
];

const TYPE_SPEED_CPS = 110; // characters per second ("fast typewriter")

export class AIChatModal {
  readonly el: HTMLDivElement;
  private isOpen = false;

  private readonly cardEl: HTMLDivElement;
  private readonly threadEl: HTMLElement;
  private readonly echoEl: HTMLSpanElement;
  private readonly responseEl: HTMLDivElement;
  private readonly artifactsEl: HTMLElement;
  private readonly currentChatEl: HTMLButtonElement;

  private typeRaf: number | null = null;
  private openTl: gsap.core.Timeline | null = null;

  /** Called by the collapse control; main.ts decides how to close. */
  onClose: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ai-chat-modal';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-label', 'NetApp AI Assistant');

    const historyMarkup = PREVIOUS_CHATS.map(
      (c) => `<button type="button" class="chat-history__item">${c}</button>`
    ).join('');

    this.el.innerHTML = `
      <div class="chat-card">
        <header class="chat-header">
          <div class="chat-brand">
            <span class="chat-brand__icon icon-mask" aria-hidden="true" style="--icon: url('${iconUrl('ic_AI.svg')}')"></span>
            <span class="chat-brand__name">NetApp AI Assistant</span>
          </div>
          <button class="chat-dismiss" type="button" aria-label="Minimize chat" title="Minimize">
            <img src="${iconUrl('ic_collapse.svg')}" alt="" aria-hidden="true" />
          </button>
        </header>
        <div class="chat-cols">
          <nav class="chat-history" aria-label="Chat history">
            <p class="chat-col-title">Chat history</p>
            ${historyMarkup}
            <button type="button" class="chat-history__item is-current" aria-current="true" data-current-chat></button>
          </nav>
          <section class="chat-thread" aria-label="Conversation">
            <div class="chat-echo">
              <span class="chat-echo__pill">
                <span class="chat-echo__icon" aria-hidden="true">↳</span>
                <span data-user-echo></span>
              </span>
            </div>
            <div class="ai-response" aria-live="polite"></div>
          </section>
          <aside class="chat-artifacts" aria-label="Resources"></aside>
        </div>
      </div>
    `;

    this.cardEl = this.el.querySelector('.chat-card') as HTMLDivElement;
    this.threadEl = this.el.querySelector('.chat-thread') as HTMLElement;
    this.echoEl = this.el.querySelector('[data-user-echo]') as HTMLSpanElement;
    this.responseEl = this.el.querySelector('.ai-response') as HTMLDivElement;
    this.artifactsEl = this.el.querySelector('.chat-artifacts') as HTMLElement;
    this.currentChatEl = this.el.querySelector('[data-current-chat]') as HTMLButtonElement;

    (this.el.querySelector('.chat-dismiss') as HTMLButtonElement).addEventListener(
      'click',
      () => this.onClose()
    );
    this.responseEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) e.preventDefault(); // demo links inert
    });
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
  open(fromRect: DOMRect, promptText: string): void {
    if (this.isOpen) return;
    this.isOpen = true;

    this.resetContents();
    this.echoEl.textContent = promptText;
    this.currentChatEl.textContent = promptText;

    // Step 1: show + match the prompt rect, transparent.
    this.el.style.display = 'block';
    gsap.set(this.el, {
      top: fromRect.top,
      left: fromRect.left,
      width: fromRect.width,
      height: fromRect.height,
      borderRadius: 22,
      opacity: 0,
    });
    gsap.set(this.cardEl, { opacity: 0 });

    this.openTl = gsap
      .timeline()
      // Step 2: expand to the full viewport + become opaque.
      .to(this.el, {
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        borderRadius: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
      })
      // Step 3: dissolve in the card.
      .to(this.cardEl, { opacity: 1, duration: 0.3 }, '>-0.05')
      // Step 4: typewriter once contents are visible (step 5 chains from it).
      .add(() => this.runTypewriter());
  }

  /**
   * Close. With a rect, collapse back into it (the "minimize" gesture);
   * without one, simply fade out (e.g. a nav link dismissing everything).
   */
  close(toRect?: DOMRect): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.openTl?.kill();
    this.openTl = null;
    this.stopTypewriter();

    const done = (): void => {
      this.el.style.display = 'none';
      this.resetContents();
    };

    if (toRect) {
      gsap
        .timeline({ onComplete: done })
        .to(this.cardEl, { opacity: 0, duration: 0.15, ease: 'power1.in' })
        .to(
          this.el,
          {
            top: toRect.top,
            left: toRect.left,
            width: toRect.width,
            height: toRect.height,
            borderRadius: 22,
            duration: 0.45,
            ease: 'power3.inOut',
          },
          0.05
        )
        // Fade only at the end, so the shrink into the prompt reads clearly.
        .to(this.el, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0.32);
    } else {
      gsap.to(this.el, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: done,
      });
    }
  }

  // -- Internal helpers -----------------------------------------------------

  private resetContents(): void {
    this.stopTypewriter();
    this.responseEl.innerHTML = '';
    this.artifactsEl.innerHTML = '';
    this.threadEl.scrollTop = 0;
  }

  /**
   * Reveal AI_RESPONSE_HTML at ~TYPE_SPEED_CPS while keeping its markup: every
   * text node is emptied, then refilled in document order. Each block (p / li)
   * stays hidden until its first character is typed, so bullets and spacing
   * never appear ahead of the text.
   */
  private runTypewriter(): void {
    this.responseEl.innerHTML = AI_RESPONSE_HTML;

    const walker = document.createTreeWalker(this.responseEl, NodeFilter.SHOW_TEXT);
    const nodes: { node: Text; full: string; block: HTMLElement | null }[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      nodes.push({
        node,
        full: node.data,
        block: node.parentElement?.closest<HTMLElement>('p, li') ?? null,
      });
      node.data = '';
    }
    this.responseEl
      .querySelectorAll<HTMLElement>('p, li')
      .forEach((b) => b.classList.add('is-pending'));

    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');

    const total = nodes.reduce((n, t) => n + t.full.length, 0);
    const start = performance.now();
    let nodeIdx = 0;
    let typed = 0; // chars typed before nodes[nodeIdx]

    const tick = (now: number): void => {
      const target = Math.min(total, Math.floor(((now - start) / 1000) * TYPE_SPEED_CPS));
      while (nodeIdx < nodes.length) {
        const cur = nodes[nodeIdx];
        const want = Math.min(cur.full.length, target - typed);
        if (want <= 0) break;
        cur.block?.classList.remove('is-pending');
        cur.node.data = cur.full.slice(0, want);
        cur.node.after(caret);
        if (want < cur.full.length) break;
        typed += cur.full.length;
        nodeIdx += 1;
      }
      this.followTyping();

      if (target >= total) {
        this.typeRaf = null;
        caret.remove();
        this.revealArtifacts();
      } else {
        this.typeRaf = requestAnimationFrame(tick);
      }
    };
    this.typeRaf = requestAnimationFrame(tick);
  }

  /** Keep the newest text in view if the response outgrows the thread. */
  private followTyping(): void {
    const t = this.threadEl;
    t.scrollTop = t.scrollHeight - t.clientHeight;
  }

  private stopTypewriter(): void {
    if (this.typeRaf !== null) {
      cancelAnimationFrame(this.typeRaf);
      this.typeRaf = null;
    }
  }

  /** After the response completes, stagger in the resource cards. */
  private revealArtifacts(): void {
    const cards = ARTIFACTS.map((a) => {
      const card = document.createElement('a');
      card.href = '#';
      card.className = 'artifact-card';
      card.innerHTML = `
        <span class="artifact-card__media"><img src="${mediaUrl(a.image)}" alt="" /></span>
        <span class="artifact-card__tag">${a.tag}</span>
        <span class="artifact-card__label">${a.label}&nbsp;→</span>
      `;
      card.addEventListener('click', (e) => e.preventDefault());
      this.artifactsEl.appendChild(card);
      return card;
    });

    gsap.fromTo(
      cards,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.12 }
    );
  }
}
