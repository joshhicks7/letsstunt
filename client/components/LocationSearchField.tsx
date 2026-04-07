import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text as ThemedText } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/Theme';
import { geoapifySearchPlaces, getGeoapifyApiKey, type GeoapifyPlace } from '@/lib/geoapify';
import type { StunterProfile } from '@/types';

export type ProfileLocationNonNull = NonNullable<StunterProfile['location']>;

export interface LocationSearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: ProfileLocationNonNull & { lat: number; lng: number }) => void;
  onUseCurrentLocation?: () => void | Promise<void>;
  colors: (typeof Colors)['light'];
  variant: 'card' | 'plain';
  placeholder?: string;
  /** Bottom border color for `plain` variant */
  borderColor?: string;
  /** Geoapify `filter=countrycode:xx`. Default `us`. Pass `""` for worldwide (no filter). */
  geoapifyCountryCode?: string;
}

const DEBOUNCE_MS = 380;

export function LocationSearchField({
  value,
  onChangeText,
  onSelectPlace,
  onUseCurrentLocation,
  colors,
  variant,
  placeholder = 'City or area',
  borderColor,
  geoapifyCountryCode,
}: LocationSearchFieldProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GeoapifyPlace[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasKey = Boolean(getGeoapifyApiKey());
  const countryFilter =
    geoapifyCountryCode === '' ? undefined : geoapifyCountryCode ?? 'us';

  const runSearch = useCallback(
    async (q: string) => {
      abortRef.current?.abort();
      if (!hasKey || q.trim().length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const list = await geoapifySearchPlaces(q, ac.signal, {
          limit: 8,
          filterCountryCode: countryFilter,
        });
        if (!ac.signal.aborted) setSuggestions(list);
      } catch {
        if (!ac.signal.aborted) setSuggestions([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    },
    [hasKey, countryFilter],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      void runSearch(value);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value, runSearch]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  const pick = useCallback(
    (p: GeoapifyPlace) => {
      onSelectPlace(p.location);
      setOpen(false);
      setSuggestions([]);
    },
    [onSelectPlace],
  );

  const onBlurInput = useCallback(() => {
    blurTimer.current = setTimeout(() => setOpen(false), 220);
  }, []);

  const onFocusInput = useCallback(() => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setOpen(true);
  }, []);

  const showList = open && hasKey && (loading || suggestions.length > 0);
  const border = borderColor ?? colors.border;

  const inputEl = (
    <TextInput
      style={[
        variant === 'card' ? styles.inputCard : styles.inputPlain,
        variant === 'card'
          ? { color: colors.text }
          : { color: colors.text, borderBottomColor: border },
      ]}
      placeholder={placeholder}
      placeholderTextColor={colors.secondary}
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocusInput}
      onBlur={onBlurInput}
      autoCapitalize="words"
      autoCorrect={false}
      editable
    />
  );

  return (
    <View style={styles.wrapper}>
      {variant === 'card' ? (
        <View style={[styles.cardRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {inputEl}
          {onUseCurrentLocation ? (
            <>
              <View style={[styles.pinDivider, { backgroundColor: colors.border }]} />
              <Pressable
                onPress={() => void onUseCurrentLocation()}
                style={styles.pinBtn}
                accessibilityRole="button"
                accessibilityLabel="Use current location"
              >
                <FontAwesome name="map-marker" size={20} color={colors.tint} />
              </Pressable>
            </>
          ) : null}
        </View>
      ) : (
        <View style={styles.plainRow}>
          <View style={styles.plainInputWrap}>{inputEl}</View>
          {onUseCurrentLocation ? (
            <Pressable
              onPress={() => void onUseCurrentLocation()}
              style={styles.plainPin}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Use current location"
            >
              <FontAwesome name="map-marker" size={20} color={colors.tint} />
            </Pressable>
          ) : null}
        </View>
      )}

      {showList ? (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginTop: SPACING.xs,
            },
          ]}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.tint} />
            </View>
          ) : null}
          <ScrollView
            style={styles.dropdownScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((item) => (
              <Pressable
                key={item.placeId}
                onPress={() => pick(item)}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  { borderBottomColor: colors.border },
                  pressed && { backgroundColor: colors.tint + '14' },
                ]}
                accessibilityRole="button"
              >
                <ThemedText style={[styles.suggestionText, { color: colors.text }]} numberOfLines={2}>
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {!hasKey && __DEV__ ? (
        <ThemedText style={[styles.hint, { color: colors.secondary }]}>
          Set EXPO_PUBLIC_GEOAPIFY_API_KEY for city suggestions.
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { zIndex: 20 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputCard: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  pinDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  pinBtn: {
    paddingHorizontal: SPACING.md,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  plainInputWrap: { flex: 1, minWidth: 0 },
  inputPlain: {
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  plainPin: { padding: SPACING.xs },
  dropdown: {
    maxHeight: 220,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  dropdownScroll: { maxHeight: 200 },
  loadingRow: { paddingVertical: SPACING.sm, alignItems: 'center' },
  suggestionRow: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: { fontSize: FONT_SIZE.sm },
  hint: { fontSize: FONT_SIZE.xs, marginTop: SPACING.xs },
});
