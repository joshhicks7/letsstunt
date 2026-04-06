import type { StunterProfile } from '@/types';

const GEOAPIFY_SEARCH = 'https://api.geoapify.com/v1/geocode/search';

export function getGeoapifyApiKey(): string | undefined {
  const k = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  return typeof k === 'string' && k.trim().length > 0 ? k.trim() : undefined;
}

type GeoapifyRawResult = {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  state_code?: string;
  country?: string;
  country_code?: string;
  lat?: number;
  lon?: number;
  formatted?: string;
  name?: string;
  county?: string;
  result_type?: string;
  place_id?: string;
};

type GeoapifySearchJson = {
  results?: GeoapifyRawResult[];
};

export type GeoapifyPlace = {
  placeId: string;
  label: string;
  location: NonNullable<StunterProfile['location']> & { lat: number; lng: number };
};

function normalizeCountry(countryCode?: string, countryName?: string): string {
  const c = countryCode?.toLowerCase();
  if (c === 'us') return 'USA';
  if (countryName) return countryName;
  return 'USA';
}

function mapResult(r: GeoapifyRawResult, index: number): GeoapifyPlace | null {
  if (r.lat == null || r.lon == null || Number.isNaN(r.lat) || Number.isNaN(r.lon)) return null;
  const city = r.city || r.town || r.village || r.name || r.county;
  const region = r.state_code || r.state || undefined;
  const label =
    r.formatted ||
    [city, region || r.state, r.country_code?.toUpperCase() === 'US' ? 'USA' : r.country]
      .filter(Boolean)
      .join(', ');
  if (!label.trim()) return null;
  return {
    placeId: r.place_id || `geoapify-${index}-${r.lat}-${r.lon}`,
    label,
    location: {
      city: city || undefined,
      region,
      country: normalizeCountry(r.country_code, r.country),
      lat: r.lat,
      lng: r.lon,
    },
  };
}

export async function geoapifySearchPlaces(
  text: string,
  signal?: AbortSignal,
  options?: { limit?: number; filterCountryCode?: string },
): Promise<GeoapifyPlace[]> {
  const apiKey = getGeoapifyApiKey();
  const q = text.trim();
  if (!apiKey || q.length < 2) return [];

  const params = new URLSearchParams({
    text: q,
    format: 'json',
    limit: String(options?.limit ?? 8),
    apiKey,
    lang: 'en',
  });
  if (options?.filterCountryCode) {
    params.set('filter', `countrycode:${options.filterCountryCode}`);
  }

  const res = await fetch(`${GEOAPIFY_SEARCH}?${params}`, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as GeoapifySearchJson;
  const raw = data.results ?? [];
  const out: GeoapifyPlace[] = [];
  raw.forEach((row, i) => {
    const m = mapResult(row, i);
    if (m) out.push(m);
  });
  return out;
}
