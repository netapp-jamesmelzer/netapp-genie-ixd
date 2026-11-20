## Overview

An interaction demo for a marketing website, focused on main navigation, scroll behavior, sticky AI prompt box, and account/preferences controls. 

- We’re only going to model a single page. The prototype’s goal is to demonstrate several different interactive elements and animations working in concert (or at least not stepping on one another’s toes).
- We’re going to start in low visual fidelity to work on the interactions and animations first. Expect iteration. Build for flexibility, not performance.
- Later, we will layer in high-fidelity visuals. I have Figma mockups, but my instinct is to get the animations right, review with the team, then add real visuals. There isn’t a design system or component library yet, so it can be custom/messy under the hood.

## Anatomy

- Nav bar: A top navigation bar containing a logo and menu control, plus a floating/visually separate account control. It floats over the content. Visually, this bar is a big pill centered {24px} from the top of the viewport (logo and menu control), with a separate round button floating to the right of it (the account control).
- AI Prompt: A sticky AI chat prompt box that floats at the bottom of the viewport.
- Persona Picker: An in-page group of personalization controls. To start, assume it is two inline dropdown menus.
- AI Chat Modal: A near-full-screen modal take-over, containing an AI chat conversation. Three columns (proportion 1:3:1): previous chats with active chat highlighted; the active chat thread ending with the prompt input; a flexible artifacts column for the AI to push resources or custom artifacts.
- Nav Modal: A near-full-screen modal take-over activated by the menu control, containing many links segmented into a “side-tabs” interaction metaphor.
- Account Modal: A near-full-screen modal take-over activated by the account control, with signed in and anonymous modes, containing a TBD layout of: personalization control; a sign-in form; a create account card; a product sign-in card; and etc.
- The Page: For now I want to focus on the global interactive elements. Show a typical series of ‘loading skeleton’ gray blocks forming 5 rows of content: hero, 3 cards, callout, 3 more cards, footer. I will provide a Figma mockup of the real page, and we can add its visuals and animations later.

Assume that the Nav Bar and AI Prompt are visible ‘over’ all the modals. 

## Interactions

Nav Bar and Nav Modal

- Nav Bar is not sticky. However, it should reappear for a user who scrolls back ‘up’.
- The Nav Bar’s menu control activates the Nav Modal. The menu control should visually indicate this active state and clicking it again will deactivate the modal. In addition, the Nav Modal has a close X in the upper right corner.
- The Nav Modal’s contents are collapsed into “side tabs”, with ~5 tabs each showing a panel of ~10 links.
- Clicking a navigation link in the nav modal will navigation to the destination page, effectively dismissing the modal. For our demo, nav links won’t be active.

AI Prompt and AI Chat Modal

- AI Prompt is sticky.
- AI Prompt has two size modes with a toggle control to switch between large and small. Size only changes the height of the box: {3 lines and 1 line?}. Width is {max-width: 800px?} and margin left/right {24px?} from the viewport edge. It sits {24px?} above the bottom of the viewport.
- When the user’s focus enters the AI Prompt, it highlights with an outline.
- When the user submits a prompt, the AI Chat Modal appears. The modal container quickly animates: expanding up and out to the edges of the viewport, starting transparent and becoming opaque as it grows. As the modal reaches its full size the contents dissolve in. The AI Prompt remains in place z-index ‘above’ this modal, so it appears to be part of it.
- The Nav Bar is also ‘above’ this modal, so it remains available. The user can open the Nav Modal on top of the AI Chat Modal. Clicking a navigation link in the nav modal will navigation to the destination page, effectively dismissing both modals. This is also true for the Nav Bar’s account control and Account Modal.
- Once the AI Chat Modal is fully revealed, use a fast typewriter animation to reveal the AI response in the center chat thread column. As that response completes, reveal two cards in the resource column, as though the response included two artifacts or links.
- The upper right corner of the modal contains a close X icon to dismiss the modal. (We’re debating whether this should be a close X or a reduce arrow). I’ll provide both icons.

Nav Bar’s Account Control and Account Modal

- The Account Control and Account Modal follow the basics of the Menu Control and Navigation Modal. The Account Control should visually indicate when its corresponding modal is active. The user should be able to click back and forth between the account and menu controls, seeing the corresponding modal.
- The Account Control also needs a highlighted state, similar to a notification state, when a user action effects it. In our demo, a user selection in the Persona Picker will ‘ping’ the Account Control, highlighting it.
- When the user scrolls the in-page Persona Picker out of view (up only?) the picker should quickly animate to collapse ‘right’ as though it’s folding into the account control in the Nav Bar. Have the text of the Persona Picker quickly fade out, so the animation visually focuses on the outer shape of the picker and the collapse looks clean. Highlight the Account Control briefly at the end of this animation, to visually reinforce that the animation ended there.
- The contents of the Account Modal are something we can iterate on when we get to high-fidelity.