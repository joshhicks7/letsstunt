import type { ProfileMediaItem } from '@/types';

/** Prefer migrated / upload-time WebP URL; fall back to legacy `uri`. */
export function getProfileImageDisplayUri(m: ProfileMediaItem): string {
  if (m.type !== 'image') return m.uri;
  const o = m.optimizedUri;
  if (typeof o === 'string' && o.trim().length > 0) return o.trim();
  return m.uri;
}
