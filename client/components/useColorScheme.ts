import { Appearance, Platform, useColorScheme as useRNColorScheme } from 'react-native';
import { useSyncExternalStore } from 'react';

function subscribeWebColorScheme(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getWebColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** SSR / static HTML: default; +html.tsx paints real bg via prefers-color-scheme CSS before hydration. */
function getServerWebColorScheme(): 'light' | 'dark' {
  return 'light';
}

/**
 * Device light/dark.
 *
 * - **Native:** `useColorScheme` with `Appearance.getColorScheme()` when RN reports `null` on the first frame.
 * - **Web:** `useSyncExternalStore` + `matchMedia` so the first client render matches system preference (no `useState('light')` frame).
 */
export function useColorScheme(): 'light' | 'dark' {
  const system = useRNColorScheme();
  const webScheme = useSyncExternalStore(
    subscribeWebColorScheme,
    getWebColorScheme,
    getServerWebColorScheme,
  );

  if (Platform.OS === 'web') {
    return webScheme;
  }

  const resolved = system ?? Appearance.getColorScheme();
  return resolved === 'dark' ? 'dark' : 'light';
}
