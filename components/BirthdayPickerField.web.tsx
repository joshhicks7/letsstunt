import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text as ThemedText } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, RADIUS } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { defaultBirthdayForPicker, toISODateString } from '@/lib/dates';

interface BirthdayPickerFieldProps {
  value: string;
  onChange: (isoDate: string) => void;
  hasError?: boolean;
}

/** Native HTML date input on web */
export function BirthdayPickerField({ value, onChange, hasError }: BirthdayPickerFieldProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const iso = value || toISODateString(defaultBirthdayForPicker());

  return (
    <View style={[styles.wrap, { borderColor: hasError ? '#c00' : colors.border, backgroundColor: colors.card }]}>
      <ThemedText style={[styles.label, { color: colors.secondary }]}>Birthday</ThemedText>
      <input
        type="date"
        value={iso}
        max={toISODateString(new Date(new Date().setFullYear(new Date().getFullYear() - 18)))}
        min={toISODateString(new Date(new Date().setFullYear(new Date().getFullYear() - 100)))}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...styles.input,
          color: colors.text,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  label: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZE.md,
    width: '100%',
  },
});
