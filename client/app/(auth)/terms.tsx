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

export default function TermsOfServiceScreen() {
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
        <ThemedText style={styles.title}>Terms of Service</ThemedText>
        <ThemedText style={[styles.updated, { color: colors.secondary }]}>Last updated: April 3, 2026</ThemedText>

        <Section title="Agreement">
          By creating an account or using LetsStunt, you agree to these Terms of Service and our{' '}
          <ThemedText style={styles.link} onPress={() => router.push('/(auth)/privacy')}>
            Privacy Policy
          </ThemedText>
          . If you do not agree, do not use the service.
        </Section>

        <Section title="The service">
          LetsStunt is a platform for adults to discover cheer and stunt partners and small stunt groups, match with
          others, chat when there is a mutual match, and share group invites. Features and availability may change as we
          improve the product.
        </Section>

        <Section title="Eligibility">
          You must be at least 18 years old. You represent that your profile information is accurate and that you will
          not misrepresent your age, identity, or abilities. We may suspend or remove accounts that violate these rules.
        </Section>

        <Section title="Your account">
          You may sign up with email and password or with Google sign-in. You are responsible for safeguarding your
          credentials and for activity under your account. Notify us at{' '}
          <ThemedText style={styles.link} onPress={openEmail}>
            {REPORT_EMAIL}
          </ThemedText>{' '}
          if you believe your account was compromised.
        </Section>

        <Section title="Acceptable use">
          You will not use LetsStunt to harass, threaten, defraud, spam, or exploit others; to share illegal content; to
          sexualize minors; to impersonate another person; or to scrape, reverse engineer, or overload our systems. You
          will follow reasonable safety practices when meeting people from the app (public settings, trusted contacts,
          gym or team context). We may investigate reports, remove content, and terminate accounts that break these rules
          or put the community at risk.
        </Section>

        <Section title="Your content">
          You keep ownership of content you upload (such as photos and bio text). You grant LetsStunt a non-exclusive,
          worldwide license to host, store, display, and distribute that content as needed to operate the service (for
          example, showing your profile to other members). You confirm you have the rights to anything you upload.
        </Section>

        <Section title="Discovery, matches, groups, and messages">
          Likes, passes, blocks, and reports may be processed to power Discover and safety features. When two members
          match, they may exchange messages through the app. Stunt group membership and group listings are visible to other
          authenticated members as described in our Privacy Policy. We do not guarantee any particular match, response,
          or training outcome.
        </Section>

        <Section title="Third-party services">
          We use infrastructure and authentication providers (including Google Firebase and Google sign-in). Their use of
          data is governed by their own terms and policies.
        </Section>

        <Section title="Disclaimers">
          The service is provided “as is” without warranties of any kind, to the fullest extent permitted by law. Stunt
          and cheer activities carry inherent risk of injury. You voluntarily assume those risks. LetsStunt does not
          supervise in-person meetings and is not responsible for the conduct of other users.
        </Section>

        <Section title="Limitation of liability">
          To the maximum extent permitted by applicable law, LetsStunt and its operators will not be liable for indirect,
          incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill, arising
          from your use of the service. Our total liability for claims relating to the service is limited to the greater
          of (a) the amount you paid us in the twelve months before the claim or (b) one hundred U.S. dollars (USD $100),
          if either applies.
        </Section>

        <Section title="Indemnity">
          You agree to defend and indemnify LetsStunt and its operators against claims, damages, and expenses (including
          reasonable legal fees) arising from your use of the service, your content, or your violation of these Terms.
        </Section>

        <Section title="Termination">
          You may stop using LetsStunt at any time. We may suspend or terminate access if you breach these Terms, if we
          must comply with law, or if we discontinue the service. Provisions that by their nature should survive
          (including disclaimers, limitations, and indemnity) will survive termination.
        </Section>

        <Section title="Changes">
          We may update these Terms from time to time. We will post the new version in the app and update the “Last
          updated” date. Continued use after changes means you accept the revised Terms.
        </Section>

        <Section title="Governing law">
          These Terms are governed by the laws of the United States and the State of Delaware, without regard to conflict-of-law
          rules, except where mandatory consumer protections in your jurisdiction apply.
        </Section>

        <Section title="Contact">
          Questions about these Terms:{' '}
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
  link: { textDecorationLine: 'underline' },
});
