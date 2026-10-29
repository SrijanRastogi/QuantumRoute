import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'qr-color-scheme';

const getMedia = (): MediaQueryList | null =>
  typeof window === 'undefined' ? null : window.matchMedia('(prefers-color-scheme: dark)');

const systemTheme = (): Theme => (getMedia()?.matches ? 'dark' : 'light');

const readOverride = (): Theme | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
};

const resolve = (): Theme => readOverride() ?? systemTheme();

let current: Theme = 'dark';
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

/**
 * Applies the resolved theme to <html> and keeps the document metadata
 * (`color-scheme`, `theme-color`) in sync so native UI follows the choice.
 */
export const applyTheme = (): Theme => {
  if (typeof document === 'undefined') return current;

  current = resolve();
  const root = document.documentElement;
  root.dataset.theme = current;

  const schemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (schemeMeta) schemeMeta.setAttribute('content', current);

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', current === 'dark' ? '#020202' : '#f5f4f9');
  }

  notify();
  return current;
};

/**
 * Two-state toggle. The explicit choice is always persisted, so the site never
 * silently follows the OS after the user has picked a scheme.
 */
export const toggleTheme = (): Theme => {
  const target: Theme = current === 'dark' ? 'light' : 'dark';

  try {
    localStorage.setItem(STORAGE_KEY, target);
  } catch {
    // Persistence can be blocked; the theme still applies for this session.
  }

  return applyTheme();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = (): Theme => current;
const getServerSnapshot = (): Theme => 'dark';

if (typeof window !== 'undefined') {
  const media = getMedia();
  media?.addEventListener('change', applyTheme);
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) applyTheme();
  });
  applyTheme();
}

export const useTheme = (): Theme => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
