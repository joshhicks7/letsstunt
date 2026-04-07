import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { mapAuthError } from '@/lib/mapAuthError';
import {
  GOOGLE_CONTINUE_ASPECT_RATIO,
  GOOGLE_CONTINUE_DARK,
  GOOGLE_CONTINUE_LIGHT,
} from '@/components/auth/googleContinueAssets';
import type { LoginWithGoogleProps } from './loginWithGoogle.types';

WebBrowser.maybeCompleteAuthSession();

export default function LoginWithGoogle({ onComplete, disabled, style }: LoginWithGoogleProps) {
  const { signInWithGoogleFromIdToken } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [pending, setPending] = useState(false);
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'dismiss' || response.type === 'error') {
      setPending(false);
      if (response.type === 'error' && 'error' in response && response.error) {
        Alert.alert('Google sign-in', String(response.error));
      }
      return;
    }
    if (response.type !== 'success') return;
    const idToken =
      typeof response.params.id_token === 'string' ? response.params.id_token : undefined;
    if (!idToken) {
      Alert.alert('Google sign-in', 'Try again.');
      setPending(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await signInWithGoogleFromIdToken(idToken);
        if (!cancelled) onComplete(r);
      } catch (e: unknown) {
        const code =
          e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
        if (!cancelled) Alert.alert('Sign in', mapAuthError(code));
      } finally {
        if (!cancelled) setPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [response, onComplete, signInWithGoogleFromIdToken]);

  const busy = pending || !request;
  const source = isDark ? GOOGLE_CONTINUE_DARK : GOOGLE_CONTINUE_LIGHT;

  return (
    <Pressable
      style={[styles.wrap, disabled || busy ? styles.dimmed : null, style]}
      disabled={disabled || busy || !webClientId}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      onPress={() => {
        setPending(true);
        void promptAsync();
      }}
    >
      <View style={styles.imgSlot}>
        {busy ? (
          <ActivityIndicator style={styles.spinner} />
        ) : (
          <Image source={source} style={styles.img} resizeMode="contain" accessibilityIgnoresInvertColors />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  dimmed: {
    opacity: 0.55,
  },
  imgSlot: {
    width: '100%',
    aspectRatio: GOOGLE_CONTINUE_ASPECT_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  spinner: {
    position: 'absolute',
  },
});
