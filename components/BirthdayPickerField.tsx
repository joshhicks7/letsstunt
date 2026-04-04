import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text as ThemedText } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, RADIUS } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { defaultBirthdayForPicker, parseISODate, toISODateString } from '@/lib/dates';

interface BirthdayPickerFieldProps {
  value: string;
  onChange: (isoDate: string) => void;
  hasError?: boolean;
  /** No card border — sits inside a section with hairline separators */
  plain?: boolean;
}

export function BirthdayPickerField({ value, onChange, hasError, plain }: BirthdayPickerFieldProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [show, setShow] = useState(false);

  const date = useMemo(() => parseISODate(value) ?? defaultBirthdayForPicker(), [value]);

  const display = value && parseISODate(value)
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parseISODate(value)!)
    : 'Tap to choose your birthday';

  const onPick = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShow(false);
      return;
    }
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(toISODateString(selected));
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);

  return (
    <View>
      <Pressable
        onPress={() => setShow(true)}
        style={[
          styles.field,
          plain ? styles.fieldPlain : null,
          plain
            ? {
                borderBottomColor: hasError ? '#c00' : colors.border,
              }
            : {
                backgroundColor: colors.card,
                borderColor: hasError ? '#c00' : colors.border,
              },
        ]}
      >
        <ThemedText style={[styles.fieldText, !value && { color: colors.secondary }]}>{display}</ThemedText>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPick}
          maximumDate={maxDate}
          minimumDate={minDate}
          themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
        />
      ) : null}
      {Platform.OS === 'ios' && show ? (
        <Pressable onPress={() => setShow(false)} style={styles.doneIos}>
          <ThemedText style={{ color: colors.tint, fontWeight: '600' }}>Done</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  fieldPlain: {
    height: 48,
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  fieldText: { fontSize: FONT_SIZE.md },
  doneIos: { alignItems: 'flex-end', paddingTop: SPACING.sm },
});
