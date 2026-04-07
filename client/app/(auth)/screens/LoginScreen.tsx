import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';
import LoginWithGoogle from '@/components/auth/LoginWithGoogle';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { asPostAuthHref, hrefWithReturnTo, sanitizeReturnTo } from '@/lib/authRedirect';
import { goBackOrReplace } from '@/lib/goBackOrReplace';
import { mapAuthError } from '@/lib/mapAuthError';
import { usePostAuthNavigation } from '@/lib/usePostAuthNavigation';
import { authEmailStyles as styles } from './_authEmailStyles';

export default function LoginScreen() {
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const onGoogleComplete = usePostAuthNavigation(returnTo);

  const handleLogin = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { onboardingComplete: done } = await login(email.trim(), password);
      const safe = sanitizeReturnTo(returnTo);
      setTimeout(() => {
        if (!done) {
          router.replace(hrefWithReturnTo('/(onboarding)', safe ?? undefined));
        } else {
          router.replace(asPostAuthHref(safe ?? '/(tabs)/discover'));
        }
      }, 0);
    } catch (e: unknown) {
      const code =
        e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      Alert.alert('Log in', mapAuthError(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => goBackOrReplace('/(auth)/welcome')} style={styles.back}>
        <FontAwesome name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <ThemedText style={styles.title}>Log in</ThemedText>
      <LoginWithGoogle onComplete={onGoogleComplete} disabled={submitting} />
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <ThemedText style={[styles.dividerText, { color: colors.secondary }]}>or email</ThemedText>
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
        style={[styles.btn, { backgroundColor: colors.tint, opacity: submitting ? 0.7 : 1 }]}
        onPress={() => void handleLogin()}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.btnText}>Log in</ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}
