import type { Href } from 'expo-router';

/**
 * Safe post-auth redirects: only in-app paths under (tabs) or (onboarding).
 * Prevents open redirects via protocols, spaces, or odd characters.
 */
const ALLOWED_PREFIXES = ['/(tabs)/', '/(onboarding)/'] as const;

function firstParam(raw: string | string[] | undefined): string | undefined {
  if (raw == null) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

export function sanitizeReturnTo(raw: string | string[] | undefined): string | null {
  const s = firstParam(raw);
  if (!s || typeof s !== 'string') return null;
  let path: string;
  try {
    path = decodeURIComponent(s.trim());
  } catch {
    return null;
  }
  if (!path.startsWith('/')) return null;
  if (path.includes('//') || path.includes('\\')) return null;
  if (/[\s<>"]/.test(path)) return null;
  if (path.includes(':')) return null;

  const ok =
    path === '/(tabs)' ||
    path === '/(onboarding)' ||
    path.startsWith('/group/') ||
    ALLOWED_PREFIXES.some((p) => path.startsWith(p));
  if (!ok) return null;
  return path;
}

/** Use after sanitizeReturnTo — satisfies expo-router `Href` for `router.replace`. */
export function asPostAuthHref(path: string): Href {
  return path as Href;
}

/** Append returnTo query (value is a decoded path segment). */
export function hrefWithReturnTo(path: string, returnToPath: string | undefined): Href {
  if (!returnToPath) return path as Href;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}returnTo=${encodeURIComponent(returnToPath)}` as Href;
}

/** Build returnTo from expo-router segments, e.g. ['(tabs)','profile'] → '/(tabs)/profile'. */
export function hrefFromSegments(segments: string[]): string {
  if (segments.length === 0) return '/';
  return `/${segments.join('/')}`;
}
