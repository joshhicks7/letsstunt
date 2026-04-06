import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

/** Resolved after a successful permission + geocode (also written to hook state). */
export type LocationSnapshot = {
  city: string | null;
  region: string | null;
  lat: number;
  lng: number;
};

export interface UseLocationResult {
  city: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<LocationSnapshot | null>;
  /** Opens system app settings (iOS/Android). No-op on web. */
  openAppSettings: () => Promise<void>;
}

/**
 * Reverse geocode for web — expo-location throws on web for reverseGeocodeAsync.
 * BigDataCloud client endpoint is meant for browser use (no API key).
 */
async function reverseGeocodeWeb(latitude: number, longitude: number): Promise<{ city: string | null; region: string | null }> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(String(latitude))}&longitude=${encodeURIComponent(String(longitude))}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) return { city: null, region: null };
    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
    };
    const city = data.city || data.locality || null;
    const region = data.principalSubdivision || null;
    return { city, region };
  } catch {
    return { city: null, region: null };
  }
}

async function reverseGeocodeCoords(
  latitude: number,
  longitude: number,
): Promise<{ city: string | null; region: string | null }> {
  if (Platform.OS === 'web') {
    return reverseGeocodeWeb(latitude, longitude);
  }
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const r = results[0];
    if (!r) return { city: null, region: null };
    const city = r.city ?? r.subregion ?? r.district ?? r.name ?? null;
    const region = r.region ?? null;
    return { city, region };
  } catch {
    return { city: null, region: null };
  }
}

/**
 * Request location, get coords and city/region for nearby matching and profile.
 *
 * - **Native:** Calls `requestForegroundPermissionsAsync` on every `refetch`, then always
 *   `getCurrentPositionAsync`. We do not return early when permission is still denied — that
 *   was preventing a second attempt from ever reaching GPS after the first denial.
 * - **Web:** Does not auto-fetch on mount (prompt only when you call `refetch`). Each `refetch`
 *   calls `getCurrentPosition` again (browser may still suppress prompts if the user has
 *   permanently blocked the site — reset via site settings / lock icon).
 */
export function useLocation(): UseLocationResult {
  const [city, setCity] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(Platform.OS !== 'web');
  const [error, setError] = useState<Error | null>(null);

  const openAppSettings = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Linking.openSettings();
    } catch {
      /* ignore */
    }
  }, []);

  const fetchLocation = useCallback(async (): Promise<LocationSnapshot | null> => {
    setLoading(true);
    setError(null);
    try {
      if (Platform.OS !== 'web') {
        await Location.requestForegroundPermissionsAsync();
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      const { city: cityName, region: regionName } = await reverseGeocodeCoords(latitude, longitude);

      setLat(latitude);
      setLng(longitude);
      setCity(cityName);
      setRegion(regionName);

      return {
        city: cityName,
        region: regionName,
        lat: latitude,
        lng: longitude,
      };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      setCity(null);
      setRegion(null);
      setLat(null);
      setLng(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    fetchLocation();
  }, [fetchLocation]);

  return { city, region, lat, lng, loading, error, refetch: fetchLocation, openAppSettings };
}
