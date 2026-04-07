import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { REPORT_EMAIL } from '@/constants/safety';
import { SPACING, FONT_SIZE, FONT_WEIGHT } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { goBackOrReplace } from '@/lib/goBackOrReplace';
import { hrefTermsOfService } from '@/lib/legalRoutes';

export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const openEmail = () => Linking.openURL(`mailto:${REPORT_EMAIL}`);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable onPress={() => goBackOrReplace('/(auth)/welcome')} style={styles.back}>
        <FontAwesome name="arrow-left" size={22} color={colors.text} />
        <ThemedText style={[styles.backText, { color: colors.text }]}>Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Privacy Policy</ThemedText>
        <ThemedText style={[styles.updated, { color: colors.secondary }]}>Last updated: April 3, 2026</ThemedText>

        <Section title="Overview">
          This Privacy Policy describes how LetsStunt (“we,” “us”) collects, uses, and shares information when you use
          our mobile and web app. It works together with our{' '}
          <ThemedText style={styles.link} onPress={() => router.push(hrefTermsOfService)}>
            Terms of Service
          </ThemedText>
          .
        </Section>

        <Section title="Our commitment to safety">
          LetsStunt is for athletes 18 and older who want to find stunt partners and groups. We do not tolerate
          harassment, predatory behavior, or inappropriate contact. We use age attestation (birthday at signup),
          reporting, and blocking to help protect the community.
        </Section>

        <Section title="Age requirements">
          You must be 18 or older to use LetsStunt. If we learn an account belongs to someone under 18, we will terminate
          it. If you believe someone is underage, report them immediately.
        </Section>

        <Section title="Information we collect">
          {'\u2022 '}
          <ThemedText style={styles.bold}>Account and authentication:</ThemedText> email address and password if you
          register with email, or account identifiers from Google when you use Google sign-in (processed by Google and
          Firebase Authentication).
          {'\n\n\u2022 '}
          <ThemedText style={styles.bold}>Profile and media:</ThemedText> display name, birthday, primary and secondary
          stunt roles, skill level, skill tags, years of experience, availability, photos or videos you upload, team or
          gym, Instagram handle, bio, and similar fields you choose to provide.
          {'\n\n\u2022 '}
          <ThemedText style={styles.bold}>Location:</ThemedText> location you provide (such as city, region, or country)
          and approximate coordinates used for discovery; precise coordinates are rounded before storage to reduce
          sensitivity.
          {'\n\n\u2022 '}
          <ThemedText style={styles.bold}>Activity on the service:</ThemedText> likes, passes, matches, direct messages
          between matched users, stunt group membership, group invite links you use, group listings you create, blocks,
          and safety reports (including reasons and optional details you submit).
        </Section>

        <Section title="How we use information">
          We use this information to create and secure your account, show your profile and groups to other signed-in
          members, power Discover and matching, deliver chat between matches, operate stunt groups and listings, enforce
          our Terms and safety policies, respond to reports and legal requests, and improve reliability and features. We
          do not sell your personal information to third parties for their advertising.
        </Section>

        <Section title="How information is shared">
          {'\u2022 '}
          <ThemedText style={styles.bold}>Other members:</ThemedText> a subset of your profile is stored in a “public”
          profile document visible to other authenticated users for discovery and profiles. Matches and stunt group
          members can see information needed for those features (for example, group name, roster size, and invite links
          you share).
          {'\n\n\u2022 '}
          <ThemedText style={styles.bold}>Service providers:</ThemedText> we use Google Firebase (and related Google
          services) for authentication, database storage, and hosting. Their processing is described in Google’s
          policies. We may use additional subprocessors as the product grows and will update this policy when material
          changes occur.
          {'\n\n\u2022 '}
          <ThemedText style={styles.bold}>Legal and safety:</ThemedText> we may disclose information if required by law,
          to respond to valid legal process, or when we believe disclosure is necessary to protect rights, safety, or
          security.
        </Section>

        <Section title="Reporting and blocking">
          You can report or block users from profile, Discover, or Matches flows. Reports are reviewed by our team. We may
          warn, suspend, or permanently ban accounts that violate our policies. We may report serious issues to law
          enforcement. For safety concerns, contact{' '}
          <ThemedText style={styles.link} onPress={openEmail}>
            {REPORT_EMAIL}
          </ThemedText>
          .
        </Section>

        <Section title="Retention and deletion">
          We retain information while your account is active and for a limited period afterward as needed for security,
          backups, and legal obligations. To request deletion of your account and associated personal data, email{' '}
          <ThemedText style={styles.link} onPress={openEmail}>
            {REPORT_EMAIL}
          </ThemedText>
          . We will verify your request where appropriate and delete or anonymize data except where we must retain it
          for legal, safety, or dispute-resolution reasons.
        </Section>

        <Section title="Security">
          We use industry-standard safeguards appropriate to the nature of the service. No method of transmission or
          storage is completely secure; we cannot guarantee absolute security.
        </Section>

        <Section title="Regional rights">
          Depending on where you live, you may have rights to access, correct, export, or object to certain processing
          of your information. To exercise those rights, contact us at the email above. If you are in the European
          Economic Area or United Kingdom, you may also lodge a complaint with your local data protection authority.
        </Section>

        <Section title="International processing">
          We operate from the United States and use service providers that may process data in the United States or other
          countries. Where required, we rely on appropriate safeguards for cross-border transfers.
        </Section>

        <Section title="Children">
          LetsStunt is not directed to anyone under 18, and we do not knowingly collect personal information from
          children. If you believe we have collected information from a minor, contact us immediately.
        </Section>

        <Section title="Changes to this policy">
          We may update this Privacy Policy from time to time. We will post the new version in the app and change the
          “Last updated” date. If changes are material, we will provide additional notice when practical.
        </Section>

        <Section title="Contact">
          For privacy questions or safety concerns:{' '}
          <ThemedText style={styles.link} onPress={openEmail}>
            {REPORT_EMAIL}
          </ThemedText>
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
  bold: { fontWeight: FONT_WEIGHT.bold },
  link: { textDecorationLine: 'underline' },
});
