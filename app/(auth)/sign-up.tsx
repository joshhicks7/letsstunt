import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { MIN_AGE } from '@/constants/safety';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password) return;
    if (!agreeTerms) return;
    await signUp(email.trim(), password);
    router.replace('/(onboarding)');
  };

  const canSignUp = email.trim().length > 0 && password.length > 0 && agreeTerms;

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <FontAwesome name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <ThemedText style={styles.title}>Create account</ThemedText>
      <ThemedText style={[styles.subtitle, { color: colors.secondary }]}>
        You’ll add your birthday and profile next.
      </ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="Email"
        placeholderTextColor={colors.secondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="Password"
        placeholderTextColor={colors.secondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.checkboxRow}>
        <Pressable
          style={[styles.checkbox, { borderColor: agreeTerms ? colors.tint : colors.border, backgroundColor: agreeTerms ? colors.tint + '22' : 'transparent' }]}
          onPress={() => setAgreeTerms((v) => !v)}
        >
          {agreeTerms ? <FontAwesome name="check" size={14} color={colors.tint} /> : null}
        </Pressable>
        <ThemedText style={[styles.checkboxLabel, { color: colors.text }]}>
          I am {MIN_AGE}+ and agree to the{' '}
          <ThemedText style={[styles.link, { color: colors.tint }]} onPress={() => router.push('/(auth)/privacy')}>Privacy Policy</ThemedText>
          {' '}and community guidelines
        </ThemedText>
      </View>
      <Pressable style={[styles.btn, { backgroundColor: canSignUp ? colors.tint : colors.border }]} onPress={handleSignUp} disabled={!canSignUp}>
        <ThemedText style={styles.btnText}>Continue</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, paddingTop: 60 },
  back: { marginBottom: SPACING.lg },
  title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.lg, lineHeight: 20 },
  input: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.sm,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: SPACING.sm },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { flex: 1, fontSize: FONT_SIZE.sm },
  link: { textDecorationLine: 'underline' },
  btn: { marginTop: SPACING.md, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
});
