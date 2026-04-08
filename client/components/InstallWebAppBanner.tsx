import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text as ThemedText } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { requestPushTokenWithUserGesture } from '@/lib/registerPushUserAction';
import {
  isAndroidMobileWebBrowser,
  isIOSMobileWebBrowser,
  shouldShowInstallWebAppBanner,
} from '@/lib/webPushEnvironment';

const DISMISS_KEY = '@letsstunt/install_web_banner_dismissed_v1';

export function InstallWebAppBanner() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, onboardingComplete, setPushNotificationsEnabled } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    void (async () => {
      try {
        const v = await AsyncStorage.getItem(DISMISS_KEY);
        if (!cancelled) setDismissed(v === '1');
      } catch {
        if (!cancelled) setDismissed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onDismiss = useCallback(async () => {
    setDismissed(true);
    try {
      await AsyncStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const onEnable = useCallback(async () => {
    if (!user?.id) return;
    try {
      await setPushNotificationsEnabled(true);
      await requestPushTokenWithUserGesture(user.id);
      setDismissed(true);
    } catch {
      /* ignore */
    }
  }, [setPushNotificationsEnabled, user?.id]);

  if (
    Platform.OS !== 'web' ||
    !user?.id ||
    !onboardingComplete ||
    !shouldShowInstallWebAppBanner() ||
    dismissed
  ) {
    return null;
  }

  const ios = isIOSMobileWebBrowser();
  const android = isAndroidMobileWebBrowser();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.tint + '22', borderColor: colors.tint }]}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: colors.tint + '33' }]}>
          <FontAwesome name="mobile" size={20} color={colors.tint} />
        </View>
        <View style={styles.textCol}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Add LetsStunt to your home screen</ThemedText>
          <ThemedText style={[styles.body, { color: colors.secondary }]}>
            {ios
              ? 'Tap Share, then Add to Home Screen'
              : android
                ? 'Open the browser menu and tap Install app or Add to Home screen.'
                : 'Install this app to your home screen for notifications.'}
          </ThemedText>
          <Pressable
            onPress={onEnable}
            style={({ pressed }) => [
              styles.enableBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <ThemedText style={styles.enableBtnText}>Enable notifications</ThemedText>
          </Pressable>
        </View>
        <Pressable onPress={onDismiss} hitSlop={12} accessibilityLabel="Dismiss">
          <FontAwesome name="times" size={18} color={colors.secondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: SPACING.xs },
  title: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  body: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  enableBtn: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  enableBtnText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
});
