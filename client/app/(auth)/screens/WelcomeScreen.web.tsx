import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as ThemedText } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { hrefWithReturnTo, sanitizeReturnTo } from '@/lib/authRedirect';
import { hrefTermsOfService } from '@/lib/legalRoutes';
import {
  HERO_IMAGE,
  MAX_CONTENT_WIDTH_WEB,
  WEB_LANDING_MAX_WIDTH,
  MIN_TOP_PADDING_WEB,
  welcomeStyles as styles,
} from './_welcomeStyles';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const forwardReturnTo = sanitizeReturnTo(returnTo) ?? undefined;

  const handleGetStarted = () => {
    router.push(hrefWithReturnTo('/(auth)/sign-up', forwardReturnTo));
  };

  const handleSignIn = () => {
    router.push(hrefWithReturnTo('/(auth)/login', forwardReturnTo));
  };

  const topPadding = Math.max(insets.top, MIN_TOP_PADDING_WEB);
  const bottomPadding = insets.bottom + SPACING.lg;

  const legalRow = (
    <View style={styles.legalRow}>
      <Pressable onPress={() => router.push(hrefTermsOfService)}>
        <ThemedText style={[styles.legalLink, { color: colors.secondary }]}>Terms</ThemedText>
      </Pressable>
      <ThemedText style={[styles.legalLink, { color: colors.secondary }]}>·</ThemedText>
      <Pressable onPress={() => router.push('/(auth)/privacy')}>
        <ThemedText style={[styles.legalLink, { color: colors.secondary }]}>Privacy</ThemedText>
      </Pressable>
    </View>
  );

  const actions = (
    <View style={[styles.actions, { maxWidth: 360, alignSelf: 'center', width: '100%' }]}>
      <Pressable style={[styles.primaryBtn, { backgroundColor: colors.tint }]} onPress={handleGetStarted}>
        <ThemedText style={styles.primaryBtnText}>Get started</ThemedText>
      </Pressable>
      <Pressable style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={handleSignIn}>
        <ThemedText style={[styles.secondaryBtnText, { color: colors.text }]}>Log in</ThemedText>
      </Pressable>
      {legalRow}
    </View>
  );

  return (
    <View
      style={[
        styles.outer,
        {
          paddingTop: topPadding,
          backgroundColor: colors.background,
          minHeight: windowHeight,
          maxWidth: MAX_CONTENT_WIDTH_WEB,
          alignSelf: 'center',
          width: '100%',
        },
      ]}
    >
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
          {actions}
        </View>
      </ScrollView>
    </View>
  );
}
