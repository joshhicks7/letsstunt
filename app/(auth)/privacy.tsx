import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { REPORT_EMAIL } from '@/constants/safety';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const openEmail = () => Linking.openURL(`mailto:${REPORT_EMAIL}`);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <FontAwesome name="arrow-left" size={22} color={colors.text} />
        <ThemedText style={[styles.backText, { color: colors.text }]}>Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Privacy Policy</ThemedText>
        <ThemedText style={[styles.updated, { color: colors.secondary }]}>Last updated: February 2026</ThemedText>

        <Section title="Our commitment to safety">
          LetsStunt is for athletes 18+ finding stunt partners and groups. We do not tolerate harassment, predatory behavior, or inappropriate contact. We use birthday verification, reporting, and blocking to help protect the community.
        </Section>

        <Section title="Age requirements">
          You must be 18 or older to use LetsStunt. If we learn an account belongs to someone under 18, we will terminate it. If you believe someone is underage, report them immediately.
        </Section>

        <Section title="Information we collect">
          We collect account information (email and password), profile information (display name, birthday, primary and secondary roles, skill level and tags, availability, photos/videos, location, team or school, social handles, bio), and usage data (likes, passes, matches). We use this to run the app, show relevant partners and groups, and enforce our policies.
        </Section>

        <Section title="How we use your information">
          We use your information to provide the service, personalize your experience, enforce our Terms and safety policies, respond to reports and legal requests, and improve the app. We do not sell your personal information to third parties for advertising.
        </Section>

        <Section title="Reporting and blocking">
          You can report or block any user from their profile or from the Discover and Matches screens. Reports are reviewed by our team. We may warn, suspend, or permanently ban accounts that violate our policies. We may also report serious issues to law enforcement. For safety concerns, contact us at{' '}
          <ThemedText style={styles.link} onPress={openEmail}>{REPORT_EMAIL}</ThemedText>.
        </Section>

        <Section title="Data retention and deletion">
          We retain your data while your account is active. You can delete your account from Profile settings; we will remove your profile and associated data in accordance with our retention policy, except where we must retain data for legal or safety reasons.
        </Section>

        <Section title="Contact">
          For privacy questions or to report a safety concern: <ThemedText style={styles.link} onPress={openEmail}>{REPORT_EMAIL}</ThemedText>
        </Section>
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <ThemedText style={styles.sectionBody}>{children}</ThemedText>
    </View>
  );
}

const View = ThemedView;

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.xs },
  backText: { fontSize: FONT_SIZE.md },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
  updated: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.sm },
  sectionBody: { fontSize: FONT_SIZE.md, lineHeight: 24, color: undefined },
  link: { textDecorationLine: 'underline' },
});
