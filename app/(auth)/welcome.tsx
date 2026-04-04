import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <FontAwesome name="heart" size={56} color={colors.tint} style={styles.icon} />
        <ThemedText style={styles.title}>LetsStunt</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.secondary }]}>
          Your place to find a stunt partner. Discover athletes and groups nearby, match, and train together (18+).
        </ThemedText>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/(auth)/sign-up')}
        >
          <ThemedText style={styles.primaryBtnText}>Get started</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={() => router.push('/(auth)/login')}
        >
          <ThemedText style={[styles.secondaryBtnText, { color: colors.text }]}>Log in</ThemedText>
        </Pressable>
        <Pressable style={styles.legalLink} onPress={() => router.push('/(auth)/privacy')}>
          <ThemedText style={[styles.legalLinkText, { color: colors.secondary }]}>Privacy Policy</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: SPACING.lg },
  content: { alignItems: 'center' },
  icon: { marginBottom: SPACING.lg },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.sm, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZE.md, textAlign: 'center', marginBottom: SPACING.xl, maxWidth: 320 },
  primaryBtn: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  secondaryBtn: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  legalLink: { marginTop: SPACING.xl },
  legalLinkText: { fontSize: FONT_SIZE.sm, textDecorationLine: 'underline' },
});
