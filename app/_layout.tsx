import 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider } from '@/context/AuthContext';
import { SwipeProvider } from '@/context/SwipeContext';
import { useColorScheme } from '@/components/useColorScheme';
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
      <SwipeProvider>
        <RootLayoutNav />
      </SwipeProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme === 'dark' ? 'dark' : 'light';
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
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
