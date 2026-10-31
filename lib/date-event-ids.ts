const storageKey = 'twinkle-date-event-ids';
const validId = /^[a-f\d]{24}$/i;

export function knownDateEventIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string' && validId.test(id)) : [];
  } catch {
    return [];
  }
}

export function rememberDateEventId(id: string): void {
  if (typeof window === 'undefined' || !validId.test(id)) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([id, ...knownDateEventIds().filter((saved) => saved !== id)].slice(0, 30)));
  } catch {
    // The app still works when browser storage is disabled.
  }
}
