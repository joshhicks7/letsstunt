import { Appearance, useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Device light/dark. Falls back to `Appearance.getColorScheme()` when RN reports `null`
 * on the first frame (avoids a flash defaulting to light before the real scheme arrives).
 */
export function useColorScheme(): 'light' | 'dark' {
  const system = useRNColorScheme();
  const resolved = system ?? Appearance.getColorScheme();
  return resolved === 'dark' ? 'dark' : 'light';
}
