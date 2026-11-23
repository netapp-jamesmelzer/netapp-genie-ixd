/**
 * PasswordGate
 * ---------------------------------------------------------------------------
 * A lightweight, client-side password gate for the team preview. This is NOT
 * real security — the expected hash lives in the bundle and anyone with DevTools
 * can bypass it. Its only job is to stop colleagues from casually stumbling onto
 * the work-in-progress.
 *
 * Flow:
 *   - If sessionStorage `genie_auth === '1'`, resolve immediately (no gate).
 *   - Otherwise hide the page content, show a fullscreen overlay, and resolve
 *     only once the user enters a password whose SHA-256 hex digest matches
 *     EXPECTED_HASH.
 *
 * Usage: `await requireAuth()` at the very top of init(), before any other
 * component is built.
 */

const AUTH_KEY = 'genie_auth';
const AUTH_VALUE = '1';
// SHA-256 of the preview password. Comparing a hash (not plaintext) keeps the
// password itself out of the bundle.
const EXPECTED_HASH =
  '5b021825928bf388f21cb9ad017a903fca4c4f68d46ab6984c0b5c1c823a4104';

/** Hex-encode an ArrayBuffer. */
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** SHA-256 hex digest of a string via the Web Crypto API. */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

/** Hide everything already in the page so only the gate is visible. */
function hidePageContent(): void {
  document
    .querySelectorAll<HTMLElement>('main.page')
    .forEach((el) => {
      el.style.visibility = 'hidden';
    });
}

/** Restore the page content once the gate has passed. */
function showPageContent(): void {
  document
    .querySelectorAll<HTMLElement>('main.page')
    .forEach((el) => {
      el.style.visibility = '';
    });
}

/**
 * Resolve as soon as the user passes the gate. Resolves immediately if the
 * session is already authenticated.
 */
export function requireAuth(): Promise<void> {
  if (sessionStorage.getItem(AUTH_KEY) === AUTH_VALUE) {
    return Promise.resolve();
  }

  hidePageContent();

  return new Promise<void>((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'pw-gate';
    overlay.innerHTML = `
      <form class="pw-gate__card" novalidate>
        <div class="pw-gate__brand">NetApp</div>
        <p class="pw-gate__label">Team preview — enter password to continue</p>
        <input
          class="pw-gate__input"
          type="password"
          name="password"
          autocomplete="current-password"
          aria-label="Password"
          spellcheck="false"
        />
        <button class="pw-gate__submit" type="submit">Enter</button>
        <p class="pw-gate__error" role="alert" aria-live="polite"></p>
      </form>
    `;
    document.body.appendChild(overlay);

    const form = overlay.querySelector('form') as HTMLFormElement;
    const input = overlay.querySelector('.pw-gate__input') as HTMLInputElement;
    const card = overlay.querySelector('.pw-gate__card') as HTMLElement;
    const error = overlay.querySelector('.pw-gate__error') as HTMLElement;

    input.focus();

    const fail = (): void => {
      error.textContent = 'Incorrect password';
      card.classList.remove('pw-gate__card--shake');
      // Force reflow so the animation restarts on repeated failures.
      void card.offsetWidth;
      card.classList.add('pw-gate__card--shake');
      input.value = '';
      input.focus();
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value;
      if (!value) {
        fail();
        return;
      }
      void sha256Hex(value).then((hash) => {
        if (hash === EXPECTED_HASH) {
          sessionStorage.setItem(AUTH_KEY, AUTH_VALUE);
          overlay.remove();
          showPageContent();
          resolve();
        } else {
          fail();
        }
      });
    });
  });
}
