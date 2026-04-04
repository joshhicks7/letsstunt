import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text as ThemedText } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';

export function borderWithAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function SectionBlock({
  children,
  colors,
  isDark,
}: {
  children: React.ReactNode;
  colors: (typeof Colors)['light'];
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.sectionBlock,
        {
          backgroundColor: colors.surfaceSubtle,
          borderColor: borderWithAlpha(colors.border, isDark ? 0.38 : 0.5),
        },
      ]}
    >
      {children}
    </View>
  );
}

export function BlockHeading({ children, colors }: { children: React.ReactNode; colors: (typeof Colors)['light'] }) {
  return (
    <ThemedText style={[styles.blockHeading, { color: colors.secondary }]} accessibilityRole="header">
      {children}
    </ThemedText>
  );
}

export function ProfileHairline({ color }: { color: string }) {
  return <View style={[styles.hairline, { backgroundColor: color }]} />;
}

export function ProfileFieldRow({
  label,
  value,
  borderColor,
  colors,
  last,
}: {
  label: string;
  value: string;
  borderColor: string;
  colors: (typeof Colors)['light'];
  last?: boolean;
}) {
  return (
    <View>
      <View style={styles.blockBody}>
        <ThemedText style={[styles.rowLabel, { color: colors.secondary }]}>{label}</ThemedText>
        <ThemedText style={[styles.rowValue, { color: colors.text }]}>{value}</ThemedText>
      </View>
      {!last ? <ProfileHairline color={borderColor} /> : null}
    </View>
  );
}

export const profileSectionStyles = StyleSheet.create({
  sectionBlock: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  blockHeading: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  blockBody: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: SPACING.md,
  },
  rowLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.3,
    marginBottom: SPACING.xs,
  },
  rowValue: { fontSize: FONT_SIZE.md, lineHeight: 22 },
  bodyText: { fontSize: FONT_SIZE.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  chip: { paddingVertical: 6, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full },
  chipText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  heroName: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  heroMeta: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs, textAlign: 'center' },
});

const styles = profileSectionStyles;
