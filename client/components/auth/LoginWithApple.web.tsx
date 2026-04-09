'use client';

import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { OAuthProvider, signInWithPopup } from 'firebase/auth';
import { Text as ThemedText } from '@/components/Themed';
import { AppleSignInGlyph } from '@/components/auth/AppleSignInGlyph';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseAuth } from '@/lib/getFirebaseAuth';
import { mapAuthError } from '@/lib/mapAuthError';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/Theme';
import { GOOGLE_CONTINUE_ICON_SIZE } from '@/components/auth/googleContinueAssets';
import type { LoginWithAppleProps } from './loginWithApple.types';

/**
 * Web-only: Firebase Auth Apple provider (`signInWithPopup`).
 * Enable **Apple** in Firebase Console → Authentication → Sign-in method (Services ID, Team ID, key).
 */
export default function LoginWithApple({ onComplete, disabled, style, compact }: LoginWithAppleProps) {
  const { finalizeGoogleUser } = useAuth();
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      const result = await signInWithPopup(auth, provider);
      const r = await finalizeGoogleUser(result.user);
      onComplete(r);
    } catch (e: unknown) {
      const code =
        e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        Alert.alert('Sign in', mapAuthError(code));
      }
    } finally {
      setBusy(false);
    }
  };

  if (compact) {
    const side = GOOGLE_CONTINUE_ICON_SIZE;
    return (
      <Pressable
        style={[
          styles.compactWrap,
          { width: side, height: side, borderRadius: side / 2 },
          (disabled || busy) && styles.dimmed,
          style,
        ]}
        onPress={() => void onPress()}
        disabled={disabled || busy}
        accessibilityRole="button"
        accessibilityLabel="Sign in with Apple"
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <AppleSignInGlyph size={Math.round(side * 0.42)} color="#fff" />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.wrap, (disabled || busy) && styles.dimmed, style]}
      onPress={() => void onPress()}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel="Sign in with Apple"
    >
      <View style={styles.inner}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <AppleSignInGlyph size={22} color="#fff" />
            <ThemedText style={styles.label}>Sign in with Apple</ThemedText>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactWrap: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  dimmed: { opacity: 0.55 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 24,
  },
  label: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
});
