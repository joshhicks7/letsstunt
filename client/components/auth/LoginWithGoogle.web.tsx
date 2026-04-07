import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { getFirebaseAuth } from '@/lib/getFirebaseAuth';
import { mapAuthError } from '@/lib/mapAuthError';
import {
  GOOGLE_CONTINUE_ASPECT_RATIO,
  GOOGLE_CONTINUE_DARK,
  GOOGLE_CONTINUE_LIGHT,
} from '@/components/auth/googleContinueAssets';
import type { LoginWithGoogleProps } from './loginWithGoogle.types';

/** Viewport width below this uses redirect sign-in (more reliable than popups on phone browsers). */
const WEB_GOOGLE_REDIRECT_BREAKPOINT = 0;

export default function LoginWithGoogle({ onComplete, disabled, style }: LoginWithGoogleProps) {
  const { finalizeGoogleUser } = useAuth();
  const { width: viewportWidth } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const useRedirectFlow = viewportWidth < WEB_GOOGLE_REDIRECT_BREAKPOINT;

  const onPress = async () => {
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      if (useRedirectFlow) {
        await signInWithRedirect(auth, provider);
        return;
      }
      const result = await signInWithPopup(auth, provider);
      const r = await finalizeGoogleUser(result.user);
      onComplete(r);
    } catch (e: unknown) {
      const code =
        e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      if (code !== 'auth/popup-closed-by-user') {
        Alert.alert('Sign in', mapAuthError(code));
      }
    } finally {
      setBusy(false);
    }
  };

  const source = isDark ? GOOGLE_CONTINUE_DARK : GOOGLE_CONTINUE_LIGHT;

  return (
    <Pressable
      style={[styles.wrap, disabled || busy ? styles.dimmed : null, style]}
      onPress={() => void onPress()}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
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
