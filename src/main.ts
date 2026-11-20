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

// Components.
import { NavBar } from './components/NavBar';
import { NavModal } from './components/NavModal';
import { AccountModal } from './components/AccountModal';
import { AIPrompt } from './components/AIPrompt';
import { AIChatModal } from './components/AIChatModal';
import { PersonaPicker } from './components/PersonaPicker';
import { fontUrl, iconUrl } from './utils/assets';

gsap.registerPlugin(ScrollTrigger);

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

/**
 * Injects the persona picker dropdown arrow background-images with base-aware
 * URLs so the icons resolve correctly when served from a subpath.
 */
function injectPersonaPickerIcons(): void {
  const style = document.createElement('style');
  style.textContent = `
    .persona-picker select {
      background-image: url('${iconUrl('ic_dropdown_arrow_down.svg')}');
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 16px;
    }
    .persona-picker select:focus {
      background-image: url('${iconUrl('ic_dropdown_arrow_up.svg')}');
    }
  `;
  document.head.appendChild(style);
}

function init(): void {
  injectFontFaces();
  injectPersonaPickerIcons();

  // --- Instantiate ---------------------------------------------------------
  const navBar = new NavBar();
  const navModal = new NavModal();
  const accountModal = new AccountModal();
  const aiPrompt = new AIPrompt();
  const aiChatModal = new AIChatModal();
  const personaPicker = new PersonaPicker();

  // --- Mount (CSS controls stacking, so DOM order is for readability) -------
  aiChatModal.mount(); // z 10
  navModal.mount(); // z 20
  accountModal.mount(); // z 20
  aiPrompt.mount(); // z 30
  navBar.mount(); // z 40
  personaPicker.mount('persona-picker-slot');

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
    }
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
    }
  };

  // --- Modal close buttons -------------------------------------------------
  navModal.onClose = () => {
    navModal.close();
    navBar.setMenuActive(false);
  };

  accountModal.onClose = () => {
    accountModal.close();
    navBar.setAccountActive(false);
  };

  aiChatModal.onClose = () => {
    aiChatModal.close();
  };

  // --- Nav link click dismisses everything ---------------------------------
  navModal.onLinkClick = () => {
    navModal.close();
    navBar.setMenuActive(false);
    accountModal.close();
    navBar.setAccountActive(false);
    aiChatModal.close();
  };

  // --- AI Prompt submit -> open the AI Chat Modal from the prompt rect ------
  aiPrompt.onSubmit = (text: string) => {
    const rect = aiPrompt.getRect();
    aiChatModal.open(rect, text);
  };

  // --- Persona change -> ping the account control --------------------------
  document.addEventListener('persona-change', () => {
    navBar.pingAccount();
  });

  // --- Persona Picker collapse finished -> ping the account control --------
  personaPicker.onCollapseComplete = () => {
    navBar.pingAccount();
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
