import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text as ThemedText } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

interface BirthdayPickerFieldProps {
  value: string;
  onChange: (isoDate: string) => void;
  hasError?: boolean;
  /** No card border — matches native plain / section hairlines */
  plain?: boolean;
  /** Hide inner “Birthday” label when the parent already labels the field */
  hideLabel?: boolean;
  /** Ignored on web (native-only phrasing); accepted for shared call sites */
  emptyLabel?: string;
}

/** Native HTML date input on web — minimal underline style (no double box). */
export function BirthdayPickerField({
  value,
  onChange,
  hasError,
  plain: _plain,
  hideLabel,
  emptyLabel: _emptyLabel,
}: BirthdayPickerFieldProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const borderBottom = `1px solid ${hasError ? '#c00' : colors.border}`;

  return (
    <View>
      {!hideLabel ? <ThemedText style={[styles.label, { color: colors.secondary }]}>Birthday</ThemedText> : null}
      <input
        type="date"
        value={value.trim() || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          display: 'block',
          width: '100%',
          height: 48,
          margin: 0,
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: hideLabel ? 0 : SPACING.xs,
          paddingBottom: 0,
          boxSizing: 'border-box',
          fontSize: FONT_SIZE.md,
          color: colors.text,
          backgroundColor: 'transparent',
          border: 'none',
          borderBottom,
          borderRadius: 0,
          outline: 'none',
        } as React.CSSProperties}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs },
});
