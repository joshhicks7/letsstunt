import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as ThemedText } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { hrefWithReturnTo, sanitizeReturnTo } from '@/lib/authRedirect';
import { hrefTermsOfService } from '@/lib/legalRoutes';
import { HERO_IMAGE, welcomeStyles as styles } from './_welcomeStyles';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const forwardReturnTo = sanitizeReturnTo(returnTo) ?? undefined;

  const handleGetStarted = () => {
    router.push(hrefWithReturnTo('/(auth)/sign-up', forwardReturnTo));
  };

  const handleSignIn = () => {
    router.push(hrefWithReturnTo('/(auth)/login', forwardReturnTo));
  };

  const topPadding = insets.top;
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

  return (
    <View style={[styles.outer, { paddingTop: topPadding, backgroundColor: colors.background, flex: 1 }]}>
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
        </View>
      </View>
    </View>
  );
}
