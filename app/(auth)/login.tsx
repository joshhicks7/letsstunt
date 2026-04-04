import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';

export default function LoginScreen() {
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) return;
    await login(email.trim(), password);
    // Defer navigation so React commits auth state before tabs mount (avoids blank Discover/Matches)
    setTimeout(() => router.replace('/(tabs)/discover'), 0);
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <FontAwesome name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <ThemedText style={styles.title}>Log in</ThemedText>
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
      <Pressable style={[styles.btn, { backgroundColor: colors.tint }]} onPress={handleLogin}>
        <ThemedText style={styles.btnText}>Log in</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, paddingTop: 60 },
  back: { marginBottom: SPACING.lg },
  title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.lg },
  input: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.sm,
  },
  btn: { marginTop: SPACING.md, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
});
