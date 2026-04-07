import type { StunterProfile, StuntGroup } from '@/types';

/** Payload written to `publicProfiles` / `groupListings` — city and region only (no GPS, no country). */
export function locationForPublicFirestore(
  loc: StunterProfile['location'],
): { city?: string; region?: string } | null {
  if (!loc) return null;
  const city = loc.city?.trim() || undefined;
  const region = loc.region?.trim() || undefined;
  if (!city && !region) return null;
  return { ...(city ? { city } : {}), ...(region ? { region } : {}) };
}

/**
 * In-memory shape for other users' locations (discover / matches). Strips legacy lat/lng/country from snapshots.
 */
export function stripLocationToCityRegionOnly(
  loc: StunterProfile['location'],
): StunterProfile['location'] {
  if (!loc) return null;
  const city = loc.city?.trim() || undefined;
  const region = loc.region?.trim() || undefined;
  if (!city && !region) return null;
  return { city, region, country: '' };
}

export function stripGroupLocationToCityRegionOnly(
  loc: StuntGroup['location'],
): StuntGroup['location'] {
  return stripLocationToCityRegionOnly(loc);
}
