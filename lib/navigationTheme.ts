import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import Colors from '@/constants/Colors';

/** Navigation theme aligned with app Colors; follows resolved light/dark scheme. */
export function buildNavigationTheme(scheme: 'light' | 'dark'): Theme {
  const c = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      ...base.colors,
      primary: c.tint,
      background: c.background,
      card: c.card,
      text: c.text,
      border: c.border,
      notification: c.tint,
    },
  };
}
