import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BirthdayPickerField } from '@/components/BirthdayPickerField';
import { LocationSearchField } from '@/components/LocationSearchField';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { ROLE_SECTIONS } from '@/constants/positions';
import { SKILL_LEVEL_OPTIONS } from '@/constants/skills';
import { SKILL_TAG_LABELS, SKILL_TAG_SECTIONS } from '@/constants/skillTags';
import { MIN_AGE, UNDERAGE_MESSAGE } from '@/constants/safety';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import type { OnboardingDraft, PositionType, SkillTag } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocation } from '@/hooks/useLocation';
import { asPostAuthHref, sanitizeReturnTo } from '@/lib/authRedirect';
import { goBackOrReplace } from '@/lib/goBackOrReplace';
import { ageFromISOBirthday, todayISODate } from '@/lib/dates';
import { locationFromAreaText } from '@/lib/locationDraft';
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
const STEP_COUNT = 4;
const STEP_TITLES = ['About you', 'Your roles', 'Skills & experience', 'Profile photos'];
/** Step 2: optional; last step finishes onboarding (photos optional). */
const SKIPPABLE_MIDDLE_STEP = (s: number) => s === 2;

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { city, region, lat, lng, refetch: refetchLocation, openAppSettings } = useLocation();
  const [draft, setDraft] = useState<OnboardingDraft>(() => ({
    ...defaultDraft,
    birthday: todayISODate(),
  }));
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (city != null || region != null || (lat != null && lng != null)) {
      setDraft((prev) => ({
        ...prev,
        location: prev.location ?? {
          city: city ?? undefined,
          region: region ?? undefined,
          country: 'USA',
          lat: lat ?? undefined,
          lng: lng ?? undefined,
        },
      }));
    }
  }, [city, region, lat, lng]);

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

  const locationAreaDisplay = useMemo(() => {
    const { city: c, region: r } = draft.location ?? {};
    if (!c && !r) return '';
    return [c, r].filter(Boolean).join(', ');
  }, [draft.location]);

  const fillLocationFromDevice = useCallback(async () => {
    const snap = await refetchLocation();
    if (snap) {
      setDraft((prev) => ({
        ...prev,
        location: {
          country: 'USA',
          lat: snap.lat,
          lng: snap.lng,
          city: snap.city ?? undefined,
          region: snap.region ?? undefined,
        },
      }));
      return;
    }
    if (Platform.OS === 'web') {
      Alert.alert(
        'Location',
        'If the browser blocked location, click the lock or tune icon next to the site address, allow Location for this site, then try the pin again. You can always type your city below.',
      );
    } else {
      Alert.alert('Location', 'Allow location access when prompted, or enable it in system settings for this app, then try again.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open settings', onPress: () => void openAppSettings() },
      ]);
    }
  }, [refetchLocation, openAppSettings]);

  const onLocationAreaChange = useCallback((text: string) => {
    setDraft((prev) => ({
      ...prev,
      location: locationFromAreaText(text.trim(), prev.location),
    }));
  }, []);

  const handleComplete = () => {
    if (!draft.primaryRole || age == null || age < MIN_AGE) return;
    completeOnboarding({
      ...draft,
      instagramHandle: draft.instagramHandle?.replace(/^@/, '').trim() || null,
      location: draft.location ?? (city || lat != null ? { city: city ?? undefined, country: 'USA', lat: lat ?? undefined, lng: lng ?? undefined } : null),
    });
    const next = sanitizeReturnTo(returnTo) ?? '/(tabs)/discover';
    router.replace(asPostAuthHref(next));
  };

  const canComplete =
    draft.displayName.trim().length > 0 &&
    draft.primaryRole != null &&
    age != null &&
    age >= MIN_AGE;

  const step0Valid =
    draft.displayName.trim().length > 0 && draft.birthday.length > 0 && age != null && age >= MIN_AGE && !ageBlocked;
  const step1Valid = draft.primaryRole != null;

  const goNext = () => {
    if (step === 0 && !step0Valid) return;
    if (step === 1 && !step1Valid) return;
    if (step < STEP_COUNT - 1) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else goBackOrReplace('/(auth)/welcome');
  };

  const progress = (step + 1) / STEP_COUNT;
  const sectionBorder = colorScheme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.055)';
  const chipOffBg = colors.background;

  const renderStep0 = () => (
    <>
      <ThemedText style={styles.label}>Display name *</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="How you want to appear"
        placeholderTextColor={colors.secondary}
        value={draft.displayName}
        onChangeText={(t) => setDraft((p) => ({ ...p, displayName: t }))}
      />
      <ThemedText style={styles.label}>Birthday *</ThemedText>
      <BirthdayPickerField
        value={draft.birthday}
        onChange={(iso) => setDraft((p) => ({ ...p, birthday: iso }))}
        hasError={!!ageError}
        emptyLabel="Tap to choose"
        hideLabel
      />
      {ageError ? <ThemedText style={[styles.error, { color: '#c00' }]}>{ageError}</ThemedText> : null}
      <ThemedText style={styles.label}>Location</ThemedText>
      <LocationSearchField
        value={locationAreaDisplay}
        onChangeText={onLocationAreaChange}
        onSelectPlace={(loc) => setDraft((p) => ({ ...p, location: loc }))}
        onUseCurrentLocation={fillLocationFromDevice}
        colors={colors}
        variant="card"
        placeholder="e.g. Gainesville or Daytona, FL"
      />
      <ThemedText style={styles.label}>Bio (optional)</ThemedText>
      <TextInput
        style={[styles.input, styles.bioInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="Short intro for partners"
        placeholderTextColor={colors.secondary}
        value={draft.bio}
        onChangeText={(t) => setDraft((p) => ({ ...p, bio: t }))}
        multiline
      />
    </>
  );

  const renderStep1 = () => (
    <>
      <ThemedText style={[styles.cardStepMeta, { color: colors.secondary, marginBottom: SPACING.sm }]}>
        Pick your primary role. You can add more roles you stunt as.
      </ThemedText>
      <ThemedText style={styles.label}>Primary role *</ThemedText>
      {ROLE_SECTIONS.map((section) => (
        <View key={`primary-${section.title}`} style={styles.roleSectionBlock}>
          <ThemedText style={[styles.roleSectionTitle, { color: colors.secondary }]}>{section.title}</ThemedText>
          <View style={styles.chipRow}>
            {section.positions.map(({ value, label }) => {
              const on = draft.primaryRole === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setPrimary(value)}
                  style={[styles.chip, { backgroundColor: on ? colors.tint + '22' : chipOffBg, borderColor: on ? colors.tint : colors.border }]}
                >
                  <ThemedText style={[styles.chipText, on && { color: colors.tint }]}>{label}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <ThemedText style={styles.label}>Secondary roles (optional)</ThemedText>
      {ROLE_SECTIONS.map((section) => (
        <View key={`secondary-${section.title}`} style={styles.roleSectionBlock}>
          <ThemedText style={[styles.roleSectionTitle, { color: colors.secondary }]}>{section.title}</ThemedText>
          <View style={styles.chipRow}>
            {section.positions
              .filter((p) => p.value !== draft.primaryRole)
              .map(({ value, label }) => {
                const on = draft.secondaryRoles.includes(value);
                return (
                  <Pressable
                    key={value}
                    onPress={() => toggleSecondary(value)}
                    style={[styles.chip, { backgroundColor: on ? colors.tint + '22' : chipOffBg, borderColor: on ? colors.tint : colors.border }]}
                  >
                    <ThemedText style={[styles.chipText, on && { color: colors.tint }]}>{label}</ThemedText>
                  </Pressable>
                );
              })}
          </View>
        </View>
      ))}
    </>
  );

  const renderStep2 = () => (
    <>
      <ThemedText style={[styles.cardStepMeta, { color: colors.secondary, marginBottom: SPACING.sm }]}>
        Optional — you can skip and add this later in your profile.
      </ThemedText>
      <ThemedText style={styles.label}>Skill highlights</ThemedText>
      {SKILL_TAG_SECTIONS.map((section) => (
        <View key={section.title} style={styles.roleSectionBlock}>
          <ThemedText style={[styles.roleSectionTitle, { color: colors.secondary }]}>{section.title}</ThemedText>
          <View style={styles.chipRow}>
            {section.tags.map((value) => {
              const label = SKILL_TAG_LABELS[value];
              const on = draft.skillTags.includes(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => toggleSkillTag(value)}
                  style={[styles.chip, { backgroundColor: on ? colors.tint + '22' : chipOffBg, borderColor: on ? colors.tint : colors.border }]}
                >
                  <ThemedText style={[styles.chipText, on && { color: colors.tint }]}>{label}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <ThemedText style={styles.label}>Skill level</ThemedText>
      <View style={styles.chipRow}>
        {SKILL_LEVEL_OPTIONS.map(({ value, label }) => {
          const on = draft.skillLevel === value;
          return (
            <Pressable
              key={value}
              onPress={() => setDraft((p) => ({ ...p, skillLevel: value }))}
              style={[styles.chip, { backgroundColor: on ? colors.tint + '22' : chipOffBg, borderColor: on ? colors.tint : colors.border }]}
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
    </>
  );

  const renderStep3 = () => {
    const firstImage = draft.media.find((m) => m.type === 'image');
    return (
      <>
        <ThemedText style={[styles.cardStepMeta, { color: colors.secondary, marginBottom: SPACING.sm }]}>
          Optional — add photos anytime from your profile.
        </ThemedText>
        <ThemedText style={styles.label}>Profile photo</ThemedText>
        <Pressable style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickProfilePhoto}>
          <FontAwesome name="camera" size={20} color={colors.tint} />
          <ThemedText style={{ color: colors.text, marginLeft: SPACING.sm }}>Choose photo</ThemedText>
        </Pressable>
        {firstImage ? (
          <Image source={{ uri: firstImage.uri }} style={styles.previewThumb} accessibilityLabel="Profile preview" />
        ) : null}
        <ThemedText style={styles.label}>Media gallery (up to {MAX_MEDIA})</ThemedText>
        <Pressable style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={addGalleryItem}>
          <FontAwesome name="plus" size={18} color={colors.tint} />
          <ThemedText style={{ color: colors.text, marginLeft: SPACING.sm }}>
            Add photo or short video ({draft.media.length}/{MAX_MEDIA})
          </ThemedText>
        </Pressable>
      </>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.headerBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: sectionBorder,
            },
          ]}
        >
          <ThemedText style={[styles.cardOverline, { color: colors.secondary }]}>Your profile</ThemedText>
          <ThemedText style={styles.cardTitle}>{STEP_TITLES[step]}</ThemedText>
          <ThemedText style={[styles.cardStepMeta, { color: colors.secondary }]}>
            Step {step + 1} of {STEP_COUNT}
          </ThemedText>
          <View style={[styles.progressTrack, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.tint }]} />
          </View>
          {step === 0 ? renderStep0() : null}
          {step === 1 ? renderStep1() : null}
          {step === 2 ? renderStep2() : null}
          {step === 3 ? renderStep3() : null}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.md), borderTopColor: sectionBorder }]}>
        {step < STEP_COUNT - 1 ? (
          SKIPPABLE_MIDDLE_STEP(step) ? (
            <View style={styles.footerRow}>
              <Pressable
                style={[styles.skipBtn, { borderColor: colors.border }]}
                onPress={goNext}
                accessibilityRole="button"
                accessibilityLabel="Skip this step for now"
              >
                <ThemedText style={[styles.skipBtnText, { color: colors.secondary }]}>Skip for now</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.nextBtn, styles.nextBtnFlex, { backgroundColor: colors.tint }]}
                onPress={goNext}
                accessibilityRole="button"
                accessibilityLabel="Continue to next step"
              >
                <ThemedText style={styles.nextBtnText}>Continue</ThemedText>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[
                styles.nextBtn,
                {
                  backgroundColor:
                    step === 0 ? (step0Valid ? colors.tint : colors.border) : step === 1 ? (step1Valid ? colors.tint : colors.border) : colors.tint,
                },
              ]}
              onPress={goNext}
              disabled={step === 0 ? !step0Valid : step === 1 ? !step1Valid : false}
            >
              <ThemedText style={styles.nextBtnText}>Continue</ThemedText>
            </Pressable>
          )
        ) : (
          <View style={styles.footerRow}>
            <Pressable
              style={[styles.skipBtn, { borderColor: colors.border }]}
              onPress={handleComplete}
              disabled={!canComplete}
              accessibilityRole="button"
              accessibilityLabel="Finish without adding photos"
            >
              <ThemedText style={[styles.skipBtnText, { color: canComplete ? colors.secondary : colors.border }]}>Skip</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.nextBtn, styles.nextBtnFlex, { backgroundColor: canComplete ? colors.tint : colors.border }]}
              onPress={handleComplete}
              disabled={!canComplete}
            >
              <ThemedText style={[styles.nextBtnText, styles.saveBtnTextShrink]} numberOfLines={2}>
                Save & start discovering
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  headerBack: { padding: SPACING.sm, width: 44, alignSelf: 'flex-start' },
  scrollFlex: { flex: 1 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  sectionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  cardOverline: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  cardTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
  cardStepMeta: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  progressTrack: { height: 3, width: '100%', borderRadius: 2, overflow: 'hidden', marginBottom: SPACING.sm },
  progressFill: { height: '100%', borderRadius: 2 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs, marginTop: SPACING.md },
  roleSectionBlock: {
    marginBottom: SPACING.sm,
  },
  roleSectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  input: { minHeight: 48, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.md },
  error: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
  bioInput: { minHeight: 72, paddingVertical: SPACING.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1 },
  chipText: { fontSize: FONT_SIZE.sm },
  photoBtn: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md },
  previewThumb: { width: 120, height: 120, borderRadius: RADIUS.lg, marginTop: SPACING.md, alignSelf: 'center' },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  skipBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  skipBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  nextBtn: { paddingVertical: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center' },
  nextBtnFlex: { flex: 1 },
  nextBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, textAlign: 'center' },
  saveBtnTextShrink: { fontSize: FONT_SIZE.sm },
});
