import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BirthdayPickerField } from '@/components/BirthdayPickerField';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import { AVAILABILITY_OPTIONS } from '@/constants/availability';
import Colors from '@/constants/Colors';
import { POSITION_OPTIONS, PRIMARY_ROLE_OPTIONS } from '@/constants/positions';
import { SKILL_LEVEL_OPTIONS } from '@/constants/skills';
import { SKILL_TAG_OPTIONS } from '@/constants/skillTags';
import { MIN_AGE, UNDERAGE_MESSAGE } from '@/constants/safety';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import type { AvailabilityType, OnboardingDraft, PositionType, SkillTag } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocation } from '@/hooks/useLocation';
import { ageFromISOBirthday } from '@/lib/dates';
import { id as newId } from '@/data/mockData';

const defaultDraft: OnboardingDraft = {
  displayName: '',
  birthday: '',
  primaryRole: null,
  secondaryRoles: [],
  skillLevel: 'beginner',
  yearsExperience: 0,
  media: [],
  location: null,
  teamGym: null,
  bio: '',
  availability: [],
  skillTags: [],
  currentlyWorkingOn: '',
  instagramHandle: null,
};

const MAX_MEDIA = 6;

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { city, lat, lng, refetch: refetchLocation } = useLocation();
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);

  useEffect(() => {
    if (city != null || (lat != null && lng != null)) {
      setDraft((prev) => ({
        ...prev,
        location: prev.location ?? { city: city ?? undefined, country: 'USA', lat: lat ?? undefined, lng: lng ?? undefined },
      }));
    }
  }, [city, lat, lng]);

  const setPrimary = (p: PositionType) => {
    setDraft((prev) => ({
      ...prev,
      primaryRole: p,
      secondaryRoles: prev.secondaryRoles.filter((x) => x !== p),
    }));
  };

  const toggleSecondary = (p: PositionType) => {
    if (draft.primaryRole === p) return;
    setDraft((prev) => ({
      ...prev,
      secondaryRoles: prev.secondaryRoles.includes(p) ? prev.secondaryRoles.filter((x) => x !== p) : [...prev.secondaryRoles, p],
    }));
  };

  const toggleAvailability = (a: AvailabilityType) => {
    setDraft((prev) => ({
      ...prev,
      availability: prev.availability.includes(a) ? prev.availability.filter((x) => x !== a) : [...prev.availability, a],
    }));
  };

  const toggleSkillTag = (t: SkillTag) => {
    setDraft((prev) => ({
      ...prev,
      skillTags: prev.skillTags.includes(t) ? prev.skillTags.filter((x) => x !== t) : [...prev.skillTags, t],
    }));
  };

  const pickProfilePhoto = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!r.canceled && r.assets[0]) {
      const uri = r.assets[0].uri;
      setDraft((prev) => {
        const next = [...prev.media];
        const img = { id: newId('m'), uri, type: 'image' as const };
        if (next.length === 0) return { ...prev, media: [img] };
        return { ...prev, media: [img, ...next.slice(0, MAX_MEDIA - 1)] };
      });
    }
  };

  const addGalleryItem = async () => {
    if (draft.media.length >= MAX_MEDIA) return;
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
    });
    if (!r.canceled && r.assets[0]) {
      const a = r.assets[0];
      const type = a.type === 'video' ? ('video' as const) : ('image' as const);
      setDraft((prev) => ({
        ...prev,
        media: [...prev.media, { id: newId('m'), uri: a.uri, type }].slice(0, MAX_MEDIA),
      }));
    }
  };

  const age = draft.birthday ? ageFromISOBirthday(draft.birthday) : null;
  const ageBlocked = age != null && age < MIN_AGE;
  const ageError = draft.birthday.length > 0 && ageBlocked ? UNDERAGE_MESSAGE : null;

  const handleComplete = () => {
    if (!draft.primaryRole || age == null || age < MIN_AGE) return;
    completeOnboarding({
      ...draft,
      instagramHandle: draft.instagramHandle?.replace(/^@/, '').trim() || null,
      location: draft.location ?? (city || lat != null ? { city: city ?? undefined, country: 'USA', lat: lat ?? undefined, lng: lng ?? undefined } : null),
    });
    router.replace('/(tabs)/discover');
  };

  const canComplete =
    draft.displayName.trim().length > 0 &&
    draft.primaryRole != null &&
    age != null &&
    age >= MIN_AGE;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Your profile</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.secondary }]}>
          Tell others how you stunt — roles, skills, and when you’re free.
        </ThemedText>

        <ThemedText style={styles.label}>Display name *</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="How you want to appear"
          placeholderTextColor={colors.secondary}
          value={draft.displayName}
          onChangeText={(t) => setDraft((p) => ({ ...p, displayName: t }))}
        />

        <ThemedText style={styles.label}>Profile photo</ThemedText>
        <Pressable style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickProfilePhoto}>
          <FontAwesome name="camera" size={20} color={colors.tint} />
          <ThemedText style={{ color: colors.text, marginLeft: SPACING.sm }}>Choose photo</ThemedText>
        </Pressable>

        <ThemedText style={styles.label}>Birthday *</ThemedText>
        <BirthdayPickerField value={draft.birthday} onChange={(iso) => setDraft((p) => ({ ...p, birthday: iso }))} hasError={!!ageError} />
        {ageError ? <ThemedText style={[styles.error, { color: '#c00' }]}>{ageError}</ThemedText> : null}

        <ThemedText style={styles.label}>Primary role *</ThemedText>
        <View style={styles.chipRow}>
          {PRIMARY_ROLE_OPTIONS.map(({ value, label }) => {
            const on = draft.primaryRole === value;
            return (
              <Pressable
                key={value}
                onPress={() => setPrimary(value)}
                style={[styles.chip, { backgroundColor: on ? colors.tint + '22' : colors.card, borderColor: on ? colors.tint : colors.border }]}
              >
                <ThemedText style={[styles.chipText, on && { color: colors.tint }]}>{label}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.label}>Secondary roles (optional)</ThemedText>
        <View style={styles.chipRow}>
          {POSITION_OPTIONS.filter((o) => o.value !== draft.primaryRole).map(({ value, label }) => {
            const on = draft.secondaryRoles.includes(value);
            return (
              <Pressable
                key={value}
                onPress={() => toggleSecondary(value)}
                style={[styles.chip, { backgroundColor: on ? colors.tint + '22' : colors.card, borderColor: on ? colors.tint : colors.border }]}
              >
                <ThemedText style={[styles.chipText, on && { color: colors.tint }]}>{label}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.label}>Availability</ThemedText>
        <View style={styles.chipRow}>
          {AVAILABILITY_OPTIONS.map(({ value, label }) => {
            const on = draft.availability.includes(value);
            return (
              <Pressable
                key={value}
                onPress={() => toggleAvailability(value)}
                style={[styles.chip, { backgroundColor: on ? colors.tint + '22' : colors.card, borderColor: on ? colors.tint : colors.border }]}
              >
                <ThemedText style={[styles.chipText, on && { color: colors.tint }]}>{label}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.label}>Skill highlights</ThemedText>
        <View style={styles.chipRow}>
          {SKILL_TAG_OPTIONS.map(({ value, label }) => {
            const on = draft.skillTags.includes(value);
            return (
              <Pressable
                key={value}
                onPress={() => toggleSkillTag(value)}
                style={[styles.chip, { backgroundColor: on ? colors.tint + '22' : colors.card, borderColor: on ? colors.tint : colors.border }]}
              >
                <ThemedText style={[styles.chipText, on && { color: colors.tint }]}>{label}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.label}>Skill level</ThemedText>
        <View style={styles.chipRow}>
          {SKILL_LEVEL_OPTIONS.map(({ value, label }) => {
            const on = draft.skillLevel === value;
            return (
              <Pressable
                key={value}
                onPress={() => setDraft((p) => ({ ...p, skillLevel: value }))}
                style={[styles.chip, { backgroundColor: on ? colors.tint + '22' : colors.card, borderColor: on ? colors.tint : colors.border }]}
              >
                <ThemedText style={[styles.chipText, on && { color: colors.tint }]}>{label}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.label}>Years stunting</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="5"
          placeholderTextColor={colors.secondary}
          value={draft.yearsExperience ? String(draft.yearsExperience) : ''}
          onChangeText={(t) => setDraft((p) => ({ ...p, yearsExperience: parseInt(t, 10) || 0 }))}
          keyboardType="number-pad"
        />

        <ThemedText style={styles.label}>Currently working on</ThemedText>
        <TextInput
          style={[styles.input, styles.bioInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. Full-ups, rewinds…"
          placeholderTextColor={colors.secondary}
          value={draft.currentlyWorkingOn}
          onChangeText={(t) => setDraft((p) => ({ ...p, currentlyWorkingOn: t }))}
          multiline
        />

        <ThemedText style={styles.label}>Location</ThemedText>
        <Pressable onPress={refetchLocation} style={[styles.locationRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FontAwesome name="map-marker" size={18} color={colors.tint} style={styles.locationIcon} />
          <ThemedText style={[styles.locationText, { color: colors.text }]}>{draft.location?.city ?? city ?? 'Tap to use your location'}</ThemedText>
        </Pressable>

        <ThemedText style={styles.label}>Team / school / gym (optional)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. Texas Twisters"
          placeholderTextColor={colors.secondary}
          value={draft.teamGym ?? ''}
          onChangeText={(t) => setDraft((p) => ({ ...p, teamGym: t.trim() || null }))}
        />

        <ThemedText style={styles.label}>Instagram (optional)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="@handle"
          placeholderTextColor={colors.secondary}
          value={draft.instagramHandle ?? ''}
          onChangeText={(t) => setDraft((p) => ({ ...p, instagramHandle: t }))}
          autoCapitalize="none"
        />

        <ThemedText style={styles.label}>Bio</ThemedText>
        <TextInput
          style={[styles.input, styles.bioInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Short intro for partners"
          placeholderTextColor={colors.secondary}
          value={draft.bio}
          onChangeText={(t) => setDraft((p) => ({ ...p, bio: t }))}
          multiline
        />

        <ThemedText style={styles.label}>Media gallery (up to {MAX_MEDIA})</ThemedText>
        <Pressable style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={addGalleryItem}>
          <FontAwesome name="plus" size={18} color={colors.tint} />
          <ThemedText style={{ color: colors.text, marginLeft: SPACING.sm }}>
            Add photo or short video ({draft.media.length}/{MAX_MEDIA})
          </ThemedText>
        </Pressable>

        <Pressable style={[styles.doneBtn, { backgroundColor: canComplete ? colors.tint : colors.border }]} onPress={handleComplete} disabled={!canComplete}>
          <ThemedText style={styles.doneBtnText}>Save</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { height: 48, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.md },
  error: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
  bioInput: { minHeight: 72, paddingVertical: SPACING.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1 },
  chipText: { fontSize: FONT_SIZE.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md },
  locationIcon: { marginRight: SPACING.sm },
  locationText: { flex: 1, fontSize: FONT_SIZE.md },
  photoBtn: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md },
  doneBtn: { marginTop: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
});
