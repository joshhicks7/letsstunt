import 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useGlobalSearchParams, usePathname, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StuntGroupProvider } from '@/context/StuntGroupContext';
import { useColorScheme } from '@/components/useColorScheme';
import { asPostAuthHref, hrefFromSegments, hrefWithReturnTo, sanitizeReturnTo } from '@/lib/authRedirect';
import { buildNavigationTheme } from '@/lib/navigationTheme';

const MAX_CONTENT_WIDTH = 428;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ ...FontAwesome.font });
  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  // Always render the navigator so router.replace() in index can run after mount.
  return (
    <AuthProvider>
      <StuntGroupProvider>
        <RootLayoutNav />
      </StuntGroupProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const resolvedScheme = useStableColorScheme();
  const theme = useMemo(() => buildNavigationTheme(resolvedScheme), [resolvedScheme]);
  const { width } = useWindowDimensions();
  const isWide = width > MAX_CONTENT_WIDTH;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.colorScheme = resolvedScheme;
  }, [resolvedScheme]);
  const contentStyle = Platform.OS === 'web'
    ? isWide
      ? ({ maxWidth: MAX_CONTENT_WIDTH, width: '100%', marginHorizontal: 'auto' } as const)
      : undefined
    : isWide
      ? ({ maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' } as const)
      : undefined;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={[{ flex: 1 }, contentStyle]}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </View>
        </View>
        {/* After Stack so navigator mounts before any router.replace in this effect */}
        <AuthRouteGuard />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/** Keeps deep links off protected groups: guests → auth, signed-in incomplete → onboarding. */
function AuthRouteGuard() {
  const { authReady, user, onboardingComplete } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const globalParams = useGlobalSearchParams<{ returnTo?: string | string[] }>();
  const router = useRouter();
  const rootNav = useRootNavigationState();

  const returnToParam = globalParams.returnTo;
  const returnToKey = Array.isArray(returnToParam) ? returnToParam[0] : returnToParam;

  useEffect(() => {
    if (!rootNav?.key || !authReady) return;

    const first = segments[0];
    const second = segments[1];
    const inAuth = first === '(auth)';
    const inOnboarding = first === '(onboarding)';
    const inTabs = first === '(tabs)';
    const isBootstrapRoute = pathname === '/';

    const intendedHref =
      segments.length > 0 ? hrefFromSegments(segments as string[]) : undefined;

    const run = () => {
      if (!user) {
        if (first === 'group') {
          return;
        }
        if (!inAuth && !isBootstrapRoute) {
          if (intendedHref) {
            router.replace(hrefWithReturnTo('/(auth)/welcome', intendedHref));
          } else {
            router.replace('/(auth)/welcome');
          }
        }
        return;
      }

      if (!onboardingComplete) {
        if (first === 'group') {
          return;
        }
        if (inTabs) {
          if (intendedHref) {
            router.replace(hrefWithReturnTo('/(onboarding)', intendedHref));
          } else {
            router.replace('/(onboarding)');
          }
        }
        return;
      }

      if (inOnboarding) {
        router.replace('/(tabs)/discover');
        return;
      }

      if (inAuth && (second === 'welcome' || second === 'login' || second === 'sign-up')) {
        const next = sanitizeReturnTo(returnToParam) ?? '/(tabs)/discover';
        router.replace(asPostAuthHref(next));
      }
    };

    const id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, [authReady, user, onboardingComplete, segments, pathname, rootNav?.key, router, returnToKey, returnToParam]);

  return null;
}

function useStableColorScheme() {
  const systemScheme = useColorScheme();

  const [webScheme, setWebScheme] = useState<'light' | 'dark'>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const listener = (e: MediaQueryListEvent) => {
      setWebScheme(e.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return Platform.OS === 'web'
    ? webScheme
    : systemScheme ?? 'light';
}