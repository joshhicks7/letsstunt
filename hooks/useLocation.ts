import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export interface UseLocationResult {
  city: string | null;
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/** Request location, get coords and city for nearby matching and profile. */
export function useLocation(): UseLocationResult {
  const [city, setCity] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      setLat(latitude);
      setLng(longitude);
      const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const name = result?.city ?? result?.subregion ?? result?.region ?? null;
      setCity(name ?? null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setCity(null);
      setLat(null);
      setLng(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { city, lat, lng, loading, error, refetch: fetchLocation };
}
