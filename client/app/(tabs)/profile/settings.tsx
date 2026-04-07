import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { goBackOrReplace } from '@/lib/goBackOrReplace';
import { hrefTermsOfService } from '@/lib/legalRoutes';

export default function ProfileSettingsScreen() {
  const { logout } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const onLogout = () => {
    logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      <Pressable onPress={() => goBackOrReplace('/(tabs)/profile')} style={styles.back} hitSlop={12}>
        <FontAwesome name="arrow-left" size={22} color={colors.text} />
        <ThemedText style={[styles.backText, { color: colors.text }]}>Back</ThemedText>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.pageTitle}>Settings</ThemedText>

        <ThemedText style={[styles.groupLabel, { color: colors.secondary }]}>Account</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow icon="sign-out" label="Sign out" colors={colors} onPress={onLogout} isLast />
        </View>

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
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  colors: (typeof Colors)['light'];
  onPress: () => void;
  isLast: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.tint + '18' }]}>
        <FontAwesome name={icon} size={18} color={colors.tint} />
      </View>
      <ThemedText style={[styles.rowLabel, { color: colors.text }]}>{label}</ThemedText>
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
});
