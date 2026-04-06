import { router, useLocalSearchParams } from 'expo-router';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as ThemedText } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { hrefWithReturnTo, sanitizeReturnTo } from '@/lib/authRedirect';

const HERO_IMAGE = require('@/assets/images/main2.png');
const MAX_CONTENT_WIDTH_WEB = 440;
const WEB_LANDING_MAX_WIDTH = 560;
const MIN_TOP_PADDING_WEB = SPACING.xxl;

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const forwardReturnTo = sanitizeReturnTo(returnTo) ?? undefined;

  const handleGetStarted = () => {
    router.push(hrefWithReturnTo('/(auth)/sign-up', forwardReturnTo));
  };

  const handleSignIn = () => {
    router.push(hrefWithReturnTo('/(auth)/login', forwardReturnTo));
  };

  const topPadding = isWeb ? Math.max(insets.top, MIN_TOP_PADDING_WEB) : insets.top;
  const bottomPadding = insets.bottom + SPACING.lg;

  const legalRow = (
    <View style={styles.legalRow}>
      <Pressable onPress={() => router.push('/(auth)/privacy')}>
        <ThemedText style={[styles.legalLink, { color: colors.secondary }]}>Privacy Policy</ThemedText>
      </Pressable>
    </View>
  );

  const actions = (
    <View style={styles.actions}>
      <Pressable style={[styles.primaryBtn, { backgroundColor: colors.tint }]} onPress={handleGetStarted}>
        <ThemedText style={styles.primaryBtnText}>Get started</ThemedText>
      </Pressable>
      <Pressable
        style={[styles.secondaryBtn, { borderColor: colors.border }]}
        onPress={handleSignIn}
      >
        <ThemedText style={[styles.secondaryBtnText, { color: colors.text }]}>Log in</ThemedText>
      </Pressable>
      {legalRow}
    </View>
  );

  const mobileBody = (
    <View style={[styles.mobileRoot, { backgroundColor: colors.background }]}>
      <View style={styles.heroWrap}>
        <Image
          source={HERO_IMAGE}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel="Stunt team celebrating together with a trophy"
        />
      </View>
      <View style={[styles.mobileBottom, { paddingBottom: bottomPadding }]}>
        <ThemedText style={styles.brand}>LetsStunt</ThemedText>
        <ThemedText style={[styles.tagline, { color: colors.secondary }]}>
          Find stunt partners nearby. Match and train together.
        </ThemedText>
        {actions}
      </View>
    </View>
  );

  const webBody = (
    <ScrollView
      style={[styles.webScroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.webScrollContent,
        { minHeight: windowHeight - topPadding, paddingTop: topPadding, paddingBottom: bottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.webInner, { maxWidth: WEB_LANDING_MAX_WIDTH }]}>
        <View style={[styles.webHeroWrap, { borderColor: colors.border }]}>
          <Image
            source={HERO_IMAGE}
            style={styles.webHeroImage}
            resizeMode="cover"
            accessibilityLabel="Stunt team celebrating together with a trophy"
          />
        </View>
        <ThemedText style={styles.brand}>LetsStunt</ThemedText>
        <ThemedText style={[styles.tagline, { color: colors.secondary }]}>
          Find stunt partners nearby. Match and train together.
        </ThemedText>
        <View style={[styles.actions, { maxWidth: 360, alignSelf: 'center', width: '100%' }]}>{actions}</View>
      </View>
    </ScrollView>
  );

  const outer = [
    styles.outer,
    {
      paddingTop: topPadding,
      backgroundColor: colors.background,
      ...(isWeb
        ? { minHeight: windowHeight, maxWidth: MAX_CONTENT_WIDTH_WEB, alignSelf: 'center' as const, width: '100%' as const }
        : { flex: 1 }),
    },
  ];

  return <View style={outer}>{isWeb ? webBody : mobileBody}</View>;
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
  },
  mobileRoot: {
    flex: 1,
  },
  heroWrap: {
    flex: 1,
    minHeight: 280,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  mobileBottom: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  webScroll: {
    flex: 1,
    width: '100%',
  },
  webScrollContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  webInner: {
    width: '100%',
    alignItems: 'center',
  },
  webHeroWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxHeight: 420,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  webHeroImage: {
    width: '100%',
    height: '100%',
  },
  brand: {
    fontSize: FONT_SIZE.hero,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: FONT_SIZE.lg,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
    lineHeight: 26,
  },
  actions: {
    width: '100%',
    gap: SPACING.sm,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  secondaryBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  legalLink: { fontSize: FONT_SIZE.xs, textDecorationLine: 'underline' },
});
