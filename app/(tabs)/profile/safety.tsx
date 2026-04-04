import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { REPORT_EMAIL, SAFETY_TIPS } from '@/constants/safety';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function SafetyTipsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <FontAwesome name="arrow-left" size={22} color={colors.text} />
        <ThemedText style={[styles.backText, { color: colors.text }]}>Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Stay safe</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.secondary }]}>
          Tips to help you stay safe while finding stunt partners.
        </ThemedText>
        {SAFETY_TIPS.map((tip, i) => (
          <View key={i} style={[styles.tipRow, { borderBottomColor: colors.border }]}>
            <FontAwesome name="shield" size={18} color={colors.tint} style={styles.tipIcon} />
            <ThemedText style={[styles.tipText, { color: colors.text }]}>{tip}</ThemedText>
          </View>
        ))}
        <Pressable style={[styles.contactBtn, { backgroundColor: colors.tint }]} onPress={() => Linking.openURL(`mailto:${REPORT_EMAIL}`)}>
          <FontAwesome name="envelope" size={18} color="#fff" />
          <ThemedText style={styles.contactBtnText}>Contact safety team</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const View = ThemedView;

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.xs },
  backText: { fontSize: FONT_SIZE.md },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.lg },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.md, borderBottomWidth: 1, gap: SPACING.md },
  tipIcon: { marginTop: 2 },
  tipText: { flex: 1, fontSize: FONT_SIZE.md, lineHeight: 22 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  contactBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
});
