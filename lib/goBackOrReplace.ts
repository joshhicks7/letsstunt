import type { Href } from 'expo-router';
import { router } from 'expo-router';

/**
 * Pops the navigation stack when possible. If there is no history (cold open / deep link),
 * `router.replace(fallback)` so Back always does something sensible.
 */
export function goBackOrReplace(fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
