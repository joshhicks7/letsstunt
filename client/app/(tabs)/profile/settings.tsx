import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { goBackOrReplace } from '@/lib/goBackOrReplace';
import { hrefTermsOfService } from '@/lib/legalRoutes';

function confirmDestructive(title: string, message: string, confirmLabel: string): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

function alertMessage(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function ProfileSettingsScreen() {
  const { logout, closeAccount, user, setPushNotificationsEnabled } = useAuth();
  const [closing, setClosing] = React.useState(false);
  const pushOn = user?.pushNotificationsEnabled !== false;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const onLogout = () => {
    logout();
    router.replace('/(auth)/welcome');
  };

  const onCloseAccount = () => {
    void (async () => {
      const ok1 = await confirmDestructive(
        'Close account',
        'This permanently deletes your login. We remove your profile photos from storage, take you out of stunt groups, delete group listings you created, and redact your profile data. Matches and past messages may still exist for other members. This cannot be undone.',
        'Continue',
      );
      if (!ok1) return;

      const ok2 = await confirmDestructive(
        'Are you sure?',
        'You will be signed out and will need a new account to use LetsStunt again.',
        'Close my account',
      );
      if (!ok2) return;

      setClosing(true);
      try {
        const result = await closeAccount();
        if (!result.ok) {
          alertMessage('Could not close account', result.message);
          return;
        }
        router.replace('/(auth)/welcome');
      } finally {
        setClosing(false);
      }
    })();
  };

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      <Pressable onPress={() => goBackOrReplace('/(tabs)/profile')} style={styles.back} hitSlop={12}>
        <FontAwesome name="arrow-left" size={22} color={colors.text} />
        <ThemedText style={[styles.backText, { color: colors.text }]}>Back</ThemedText>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.pageTitle}>Settings</ThemedText>

        <ThemedText style={[styles.groupLabel, { color: colors.secondary }]}>Notifications</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View
            style={[
              styles.row,
              { borderBottomWidth: 0, justifyContent: 'space-between' },
            ]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.tint + '18' }]}>
              <FontAwesome name="bell" size={18} color={colors.tint} />
            </View>
            <ThemedText style={[styles.rowLabel, { color: colors.text, flex: 1 }]}>
              Push notifications
            </ThemedText>
            <Switch
              value={pushOn}
              onValueChange={(v) => void setPushNotificationsEnabled(v)}
              trackColor={{ false: colors.border, true: colors.tint + '88' }}
              thumbColor={pushOn ? colors.tint : colors.secondary}
              ios_backgroundColor={colors.border}
            />
          </View>
          <ThemedText style={[styles.hint, { color: colors.secondary }]}>
            {Platform.OS === 'web'
              ? 'On iPhone or Android in the browser, add LetsStunt to your home screen for reliable alerts.'
              : 'Get notified about new matches and messages.'}
          </ThemedText>
        </View>

        <ThemedText style={[styles.groupLabel, { color: colors.secondary }]}>Account</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow icon="sign-out" label="Sign out" colors={colors} onPress={onLogout} isLast={false} />
          <SettingsRow
            icon="times-circle"
            label="Close account"
            colors={colors}
            onPress={onCloseAccount}
            destructive
            disabled={closing}
            isLast
          />
        </View>
        {closing ? (
          <View style={styles.closingOverlay}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={[styles.closingText, { color: colors.secondary }]}>
              Closing account…
            </ThemedText>
          </View>
        ) : null}

        <ThemedText style={[styles.groupLabel, { color: colors.secondary }]}>Safety & support</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="file-text-o"
            label="Terms of Service"
            colors={colors}
            onPress={() => router.push(hrefTermsOfService)}
            isLast={false}
          />
          <SettingsRow
            icon="file-text-o"
            label="Privacy Policy"
            colors={colors}
            onPress={() => router.push('/(auth)/privacy')}
            isLast={false}
          />
          <SettingsRow
            icon="shield"
            label="Safety tips"
            colors={colors}
            onPress={() => router.push('/profile/safety')}
            isLast
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function SettingsRow({
  icon,
  label,
  colors,
  onPress,
  isLast,
  destructive,
  disabled,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  colors: (typeof Colors)['light'];
  onPress: () => void;
  isLast: boolean;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const accent = destructive ? '#c0392b' : colors.tint;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: accent + '18' }]}>
        <FontAwesome name={icon} size={18} color={accent} />
      </View>
      <ThemedText style={[styles.rowLabel, { color: destructive ? accent : colors.text }]}>{label}</ThemedText>
      <FontAwesome name="chevron-right" size={14} color={colors.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  back: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.xs },
  backText: { fontSize: FONT_SIZE.md },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  pageTitle: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.lg },
  groupLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.medium },
  hint: {
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    lineHeight: 20,
  },
  closingOverlay: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  closingText: { fontSize: FONT_SIZE.sm },
});
