import type { StunterProfile } from '@/types';

/** Update profile location from free-text city / "City, ST" input (no geocode until user picks or uses GPS). */
export function locationFromAreaText(
  trimmed: string,
  base: StunterProfile['location'] | null,
): StunterProfile['location'] | null {
  if (!trimmed) {
    if (base?.lat != null || base?.lng != null) {
      return {
        country: base.country ?? 'USA',
        lat: base.lat,
        lng: base.lng,
      };
    }
    return null;
  }
  const commaIdx = trimmed.indexOf(',');
  const cityPart = commaIdx >= 0 ? trimmed.slice(0, commaIdx).trim() : trimmed;
  const regionPart = commaIdx >= 0 ? trimmed.slice(commaIdx + 1).trim() : undefined;
  return {
    country: base?.country ?? 'USA',
    lat: base?.lat,
    lng: base?.lng,
    city: cityPart || undefined,
    region: regionPart || undefined,
  };
}
