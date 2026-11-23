/**
 * main.ts — entry point. Registers GSAP plugins, imports all styles, builds the
 * components, mounts them, and wires the cross-component interactions.
 *
 * Z-index layering (bottom -> top), enforced in tokens.css / component CSS:
 *   1. Page skeleton
 *   2. AI Chat Modal (10)
 *   3. Nav Modal / Account Modal (20)
 *   4. AI Prompt (30)
 *   5. Nav Bar (40)
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Styles (tokens first so custom properties exist for everything else).
import './styles/tokens.css';
import './styles/base.css';
import './styles/page.css';
import './styles/nav.css';
import './styles/modals.css';
import './styles/ai-prompt.css';
import './styles/password-gate.css';

// Components.
import { requireAuth } from './components/PasswordGate';
import { NavBar } from './components/NavBar';
import { NavModal } from './components/NavModal';
import { AccountModal } from './components/AccountModal';
import { AIPrompt } from './components/AIPrompt';
import { AIChatModal } from './components/AIChatModal';
import { PersonaPicker } from './components/PersonaPicker';
import { ScrollScenes } from './components/ScrollScenes';
import { NewsCarousel } from './components/NewsCarousel';
import { SlideSnap } from './components/SlideSnap';
import type { PersonaChangeDetail } from './state/persona';
import { fontUrl, iconUrl, mediaUrl } from './utils/assets';

gsap.registerPlugin(ScrollTrigger);

/**
 * Resolves asset placeholders in the static index.html markup to base-aware
 * URLs via the helpers (never absolute paths, so they work on the GitHub Pages
 * subpath). Markup uses data-attributes:
 *   [data-video] -> <video> source,  [data-bg] -> CSS background-image,
 *   [data-icon]  -> <img> src (icons/),  [data-media] -> <img> src (media/),
 *   [data-mask]  -> --icon custom property for .icon-mask (media/).
 */
function hydratePageAssets(): void {
  document.querySelectorAll<HTMLVideoElement>('[data-video]').forEach((el) => {
    const name = el.dataset.video;
    if (name) {
      el.src = mediaUrl(name);
      el.load();
    }
  });
  // Inert demo links on the page (nav/modal links are handled by components).
  document.querySelectorAll<HTMLAnchorElement>('main.page a[href="#"]').forEach((a) => {
    a.addEventListener('click', (e) => e.preventDefault());
  });
  document.querySelectorAll<HTMLElement>('[data-bg]').forEach((el) => {
    const name = el.dataset.bg;
    if (name) el.style.backgroundImage = `url('${mediaUrl(name)}')`;
  });
  document.querySelectorAll<HTMLImageElement>('[data-icon]').forEach((el) => {
    const name = el.dataset.icon;
    if (name) el.src = iconUrl(name);
  });
  document.querySelectorAll<HTMLImageElement>('[data-media]').forEach((el) => {
    const name = el.dataset.media;
    if (name) el.src = mediaUrl(name);
  });
  // Recolorable SVGs (.icon-mask): the file becomes the element's CSS mask.
  document.querySelectorAll<HTMLElement>('[data-mask]').forEach((el) => {
    const name = el.dataset.mask;
    if (name) el.style.setProperty('--icon', `url('${mediaUrl(name)}')`);
  });
}

/**
 * Injects the F37Judge @font-face rules with base-aware URLs so the fonts
 * resolve correctly when served from a subpath (e.g. GitHub Pages).
 */
function injectFontFaces(): void {
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'F37Judge';
      src: url('${fontUrl('F37Judge-ThinExtended.woff2')}') format('woff2');
      font-weight: 100;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'F37Judge';
      src: url('${fontUrl('F37Judge-RegularExtended.woff2')}') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'F37Judge';
      src: url('${fontUrl('F37Judge-MediumExtended.woff2')}') format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
  `;
  document.head.insertBefore(style, document.head.firstChild);
}

async function init(): Promise<void> {
  // Gate the whole experience behind the team-preview password. Resolves
  // immediately if the session is already authenticated; otherwise blocks here
  // (page content hidden) until the user passes the gate.
  await requireAuth();

  injectFontFaces();
  hydratePageAssets();

  // --- Instantiate ---------------------------------------------------------
  const navBar = new NavBar();
  const navModal = new NavModal();
  const accountModal = new AccountModal();
  const aiPrompt = new AIPrompt();
  const aiChatModal = new AIChatModal();
  const personaPicker = new PersonaPicker();
  const scrollScenes = new ScrollScenes();

  // --- Mount (CSS controls stacking, so DOM order is for readability) -------
  aiChatModal.mount(); // z 10
  navModal.mount(); // z 20
  accountModal.mount(); // z 20
  aiPrompt.mount(); // z 30
  navBar.mount(); // z 40
  personaPicker.mount();
  scrollScenes.mount();
  new NewsCarousel().mount();
  new SlideSnap().mount();

  // --- Scroll lock while any modal is open --------------------------------
  // Keeps the page (and the in-flow nav bar) from scrolling away behind a
  // modal via wheel, trackpad or keyboard. Scrollable areas inside the
  // modals (e.g. the chat thread) still scroll.
  const syncScrollLock = (): void => {
    const root = document.documentElement;
    const lock = navModal.opened || accountModal.opened || aiChatModal.opened;
    if (lock === root.classList.contains('is-scroll-locked')) return;
    if (lock) {
      const comp = window.innerWidth - root.clientWidth;
      root.style.setProperty('--scrollbar-comp', `${comp}px`);
    }
    root.classList.toggle('is-scroll-locked', lock);
  };

  // --- Nav Bar controls -> modals (mutually exclusive) ---------------------
  navBar.onMenuClick = () => {
    if (navModal.opened) {
      navModal.close();
      navBar.setMenuActive(false);
    } else {
      // Close the account modal if open (simultaneous crossfade).
      if (accountModal.opened) {
        accountModal.close();
        navBar.setAccountActive(false);
      }
      navModal.open();
      navBar.setMenuActive(true);
      aiPrompt.leaveHuge();
    }
    syncScrollLock();
  };

  navBar.onAccountClick = () => {
    if (accountModal.opened) {
      accountModal.close();
      navBar.setAccountActive(false);
    } else {
      if (navModal.opened) {
        navModal.close();
        navBar.setMenuActive(false);
      }
      accountModal.open();
      navBar.setAccountActive(true);
      aiPrompt.leaveHuge();
    }
    syncScrollLock();
  };

  // --- Modal close buttons -------------------------------------------------
  navModal.onClose = () => {
    navModal.close();
    navBar.setMenuActive(false);
    syncScrollLock();
  };

  accountModal.onClose = () => {
    accountModal.close();
    navBar.setAccountActive(false);
    syncScrollLock();
  };

  // Collapse control: shrink the chat back into the prompt it came from.
  aiChatModal.onClose = () => {
    aiChatModal.close(aiPrompt.getRect());
    aiPrompt.setPlaceholder(DEFAULT_PLACEHOLDER);
    syncScrollLock();
  };

  // --- Nav link click dismisses everything ---------------------------------
  navModal.onLinkClick = () => {
    navModal.close();
    navBar.setMenuActive(false);
    accountModal.close();
    navBar.setAccountActive(false);
    aiChatModal.close();
    aiPrompt.setPlaceholder(DEFAULT_PLACEHOLDER);
    syncScrollLock();
  };

  // --- AI Prompt submit -> open the AI Chat Modal from the prompt rect ------
  // (The chat modal has no input of its own — this prompt stays the input.)
  const DEFAULT_PLACEHOLDER = aiPrompt.textarea.placeholder;
  aiPrompt.onSubmit = (text: string) => {
    if (aiChatModal.opened) return; // demo: one scripted conversation
    aiChatModal.open(aiPrompt.getRect(), text);
    aiPrompt.leaveHuge();
    aiPrompt.setPlaceholder('Make a selection or type something else…');
    syncScrollLock();
  };

  // --- Persona change on the page -> ping the account control -------------
  // (Edits made inside the Account Modal don't ping; it is already open.)
  document.addEventListener('persona-change', (e) => {
    if ((e as CustomEvent<PersonaChangeDetail>).detail.source === 'page') {
      navBar.pingAccount();
    }
  });

  // --- Escape closes the topmost modal -------------------------------------
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (navModal.opened) navModal.onClose();
    else if (accountModal.opened) accountModal.onClose();
    else if (aiChatModal.opened) aiChatModal.onClose();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void init());
} else {
  void init();
}
