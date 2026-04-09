import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';
import LoginWithApple from '@/components/auth/LoginWithApple';
import LoginWithGoogle from '@/components/auth/LoginWithGoogle';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { MIN_AGE } from '@/constants/safety';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { hrefWithReturnTo, sanitizeReturnTo } from '@/lib/authRedirect';
import { goBackOrReplace } from '@/lib/goBackOrReplace';
import { hrefTermsOfService } from '@/lib/legalRoutes';
import { mapAuthError } from '@/lib/mapAuthError';
import { usePostAuthNavigation } from '@/lib/usePostAuthNavigation';
import { authEmailStyles as styles } from './_authEmailStyles';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const onGoogleComplete = usePostAuthNavigation(returnTo);

  const handleSignUp = async () => {
    if (!email.trim() || !password) return;
    if (!agreeTerms) return;
    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
      const safe = sanitizeReturnTo(returnTo) ?? undefined;
      router.replace(hrefWithReturnTo('/(onboarding)', safe));
    } catch (e: unknown) {
      const code =
        e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      Alert.alert('Sign up', mapAuthError(code));
    } finally {
      setSubmitting(false);
    }
  };

  const canSignUp = email.trim().length > 0 && password.length > 0 && agreeTerms && !submitting;

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => goBackOrReplace('/(auth)/welcome')} style={styles.back}>
        <FontAwesome name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <ThemedText style={styles.title}>Create account</ThemedText>
      <View style={styles.socialRow}>
        <LoginWithGoogle onComplete={onGoogleComplete} disabled={submitting || !agreeTerms} />
        <LoginWithApple onComplete={onGoogleComplete} disabled={submitting || !agreeTerms} compact />
      </View>
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <ThemedText style={[styles.dividerText, { color: colors.secondary }]}>or</ThemedText>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="Email"
        placeholderTextColor={colors.secondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!submitting}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="Password"
        placeholderTextColor={colors.secondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!submitting}
      />
      <Pressable
        style={[styles.btn, { backgroundColor: canSignUp ? colors.tint : colors.border }]}
        onPress={() => void handleSignUp()}
        disabled={!canSignUp}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.btnText}>Continue</ThemedText>
        )}
      </Pressable>
      <View style={styles.checkboxRow}>
        <Pressable
          style={[
            styles.checkbox,
            {
              borderColor: agreeTerms ? colors.tint : colors.border,
              backgroundColor: agreeTerms ? colors.tint + '22' : 'transparent',
            },
          ]}
          onPress={() => setAgreeTerms((v) => !v)}
          disabled={submitting}
        >
          {agreeTerms ? <FontAwesome name="check" size={14} color={colors.tint} /> : null}
        </Pressable>
        <ThemedText style={[styles.checkboxLabel, { color: colors.text }]}>
          I am {MIN_AGE}+ and agree to the{' '}
          <ThemedText style={[styles.link, { color: colors.tint }]} onPress={() => router.push(hrefTermsOfService)}>
            Terms of Service
          </ThemedText>
          {' '}and{' '}
          <ThemedText style={[styles.link, { color: colors.tint }]} onPress={() => router.push('/(auth)/privacy')}>
            Privacy Policy
          </ThemedText>
        </ThemedText>
      </View>
    </ThemedView>
  );
}
