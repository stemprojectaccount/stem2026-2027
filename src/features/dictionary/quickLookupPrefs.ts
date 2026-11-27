// Preferences and small helpers of "Tra nhanh" (kept apart so settings / lessons do not load the dictionary code).
export const QUICK_LOOKUP_KEY = "smartstudy_quick_lookup_v1";
export const QUICK_LOOKUP_CHANGED = "smartstudy:quick-lookup-changed";
export const OPEN_DICTIONARY_EVENT = "smartstudy:open-dictionary";

export function quickLookupEnabled(): boolean {
  try {
    return localStorage.getItem(QUICK_LOOKUP_KEY) !== "off";
  } catch {
    return true;
  }
}
export function setQuickLookupEnabled(on: boolean) {
  try {
    localStorage.setItem(QUICK_LOOKUP_KEY, on ? "on" : "off");
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(QUICK_LOOKUP_CHANGED, { detail: on }));
}

/** The text if it is 1–3 English words (letters, apostrophes, hyphens), else null. */
export function englishPhrase(raw: string): string | null {
  const t = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
  if (!t || t.length > 40) return null;
  if (!/^[A-Za-z][A-Za-z'’\- ]*$/.test(t)) return null;
  if (t.split(" ").length > 3) return null;
  return t.toLowerCase().replace(/’/g, "'");
}

/** Text selected inside a data-quick-lookup area that Quick Lookup will handle (so other popups can step aside). */
export function isQuickLookupSelection(text: string): boolean {
  return quickLookupEnabled() && englishPhrase(text) !== null;
}

export function openDictionary(word: string) {
  window.dispatchEvent(new CustomEvent(OPEN_DICTIONARY_EVENT, { detail: { word } }));
}

