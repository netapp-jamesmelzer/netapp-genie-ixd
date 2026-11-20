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

gsap.registerPlugin(ScrollTrigger);

function init(): void {
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
