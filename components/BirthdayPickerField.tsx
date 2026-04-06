import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text as ThemedText } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { FONT_SIZE, SPACING } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { parseISODate, todayDate, toISODateString } from '@/lib/dates';

interface BirthdayPickerFieldProps {
  value: string;
  onChange: (isoDate: string) => void;
  hasError?: boolean;
  /** No card border — sits inside a section with hairline separators */
  plain?: boolean;
  /** Shown when no date is set (use when a parent label already says “Birthday”) */
  emptyLabel?: string;
  /** Web: hide embedded label (parity with `.web`); ignored on native */
  hideLabel?: boolean;
}

export function BirthdayPickerField({
  value,
  onChange,
  hasError,
  plain: _plain,
  emptyLabel = 'Tap to choose your birthday',
  hideLabel: _hideLabel,
}: BirthdayPickerFieldProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [show, setShow] = useState(false);

  const date = useMemo(() => parseISODate(value) ?? todayDate(), [value]);

  const display = value && parseISODate(value)
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parseISODate(value)!)
    : emptyLabel;

  const onPick = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShow(false);
      return;
    }
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(toISODateString(selected));
  };

  return (
    <View>
      <Pressable
        onPress={() => setShow(true)}
        style={[
          styles.fieldPlain,
          {
            borderBottomColor: hasError ? '#c00' : colors.border,
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
  fieldPlain: {
    height: 48,
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  fieldText: { fontSize: FONT_SIZE.md },
  doneIos: { alignItems: 'flex-end', paddingTop: SPACING.sm },
});
