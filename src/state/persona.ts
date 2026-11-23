/**
 * persona.ts — the single source of truth for the visitor's persona.
 * ---------------------------------------------------------------------------
 * Both the in-page Persona Picker (role + goal) and the Account Modal (role +
 * goal + industry) render dropdowns bound to this store, so a change in one
 * place is reflected everywhere (dropdown labels, the confirmation sentence).
 *
 * Every change dispatches a `persona-change` CustomEvent on document with
 * detail `{ field, value, source }`. `source` identifies the UI that made the
 * change ('page' | 'account'); main.ts pings the account control only for
 * changes that come from the page.
 */

export type PersonaField = 'role' | 'goal' | 'industry';
export type PersonaSource = 'page' | 'account';

export interface PersonaChangeDetail {
  field: PersonaField;
  value: string;
  source: PersonaSource;
}

/** Options per field; index 0 is the default selection. */
export const PERSONA_OPTIONS: Record<PersonaField, string[]> = {
  role: [
    'Chief Information Officer',
    'Chief Data Officer',
    'VP Infrastructure/Operations',
    'Chief Information Security Officer',
    'DevOps Engineer',
    'Storage Engineer',
  ],
  goal: [
    'adopting AI safely and affordably',
    'managing data at scale',
    'migrating virtualization paradigms',
    'meeting regulatory requirements',
    'achieving consistent delivery across hybrid cloud',
  ],
  // Placeholder list (Figma shows only "space industry").
  industry: [
    'space industry',
    'financial services industry',
    'healthcare industry',
    'manufacturing industry',
    'public sector',
    'media and entertainment industry',
  ],
};

const state: Record<PersonaField, string> = {
  role: PERSONA_OPTIONS.role[0],
  goal: PERSONA_OPTIONS.goal[0],
  industry: PERSONA_OPTIONS.industry[0],
};

export function getPersona(field: PersonaField): string {
  return state[field];
}

export function setPersona(field: PersonaField, value: string, source: PersonaSource): void {
  if (state[field] === value) return;
  state[field] = value;
  document.dispatchEvent(
    new CustomEvent<PersonaChangeDetail>('persona-change', {
      detail: { field, value, source },
    })
  );
}

/** "a" or "an" for the word that follows (simple vowel-sound heuristic). */
export function articleFor(word: string): string {
  return /^[aeiou]/i.test(word.trim()) ? 'an' : 'a';
}
