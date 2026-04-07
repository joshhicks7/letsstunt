import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BirthdayPickerField } from '@/components/BirthdayPickerField';
import { LocationSearchField } from '@/components/LocationSearchField';
import { BlockHeading, ProfileHairline, SectionBlock, profileSectionStyles as ps } from '@/components/ProfileSections';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { mergePrimaryAndSecondary, ROLE_SECTIONS } from '@/constants/positions';
import { SKILL_LEVEL_OPTIONS } from '@/constants/skills';
import { SKILL_TAG_LABELS, SKILL_TAG_SECTIONS } from '@/constants/skillTags';
import { MIN_AGE, UNDERAGE_MESSAGE } from '@/constants/safety';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import type { PositionType, SkillTag, StunterProfile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { goBackOrReplace } from '@/lib/goBackOrReplace';
import { useLocation } from '@/hooks/useLocation';
import { ageFromISOBirthday, todayISODate } from '@/lib/dates';
import { locationFromAreaText } from '@/lib/locationDraft';
import { id as newMediaId } from '@/data/mockData';

const MAX_PROFILE_MEDIA = 6;

function FieldLabel({ children, colors }: { children: string; colors: (typeof Colors)['light'] }) {
  return <ThemedText style={[ps.rowLabel, { color: colors.secondary }]}>{children}</ThemedText>;
}

function SelectChip({
  label,
  selected,
  onPress,
  colors,
  isDark,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: (typeof Colors)['light'];
  isDark: boolean;
}) {
  const idleBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.045)';
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.tint + '20' : idleBg,
          borderColor: selected ? colors.tint : 'transparent',
        },
      ]}
    >
      <ThemedText style={[styles.chipLabel, { color: selected ? colors.tint : colors.text }]} numberOfLines={1}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function ProfileEditScreen() {
  const { user, updateProfile } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { city, lat, lng, refetch: refetchLocation, openAppSettings } = useLocation();
  const profile = user?.profile;

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [birthday, setBirthday] = useState(() =>
    profile?.birthday?.trim() ? profile.birthday : todayISODate(),
  );
  const [primaryRole, setPrimaryRole] = useState<PositionType | null>(profile?.primaryRole ?? null);
  const [secondaryRoles, setSecondaryRoles] = useState<PositionType[]>(profile?.secondaryRoles ?? []);
  const [skillLevel, setSkillLevel] = useState(profile?.skillLevel ?? 'beginner');
  const [yearsExperience, setYearsExperience] = useState(profile?.yearsExperience ?? 0);
  const [skillTags, setSkillTags] = useState<SkillTag[]>(profile?.skillTags ?? []);
  const [currentlyWorkingOn, setCurrentlyWorkingOn] = useState(profile?.currentlyWorkingOn ?? '');
  const [instagramHandle, setInstagramHandle] = useState(profile?.instagramHandle ?? '');
  const [location, setLocation] = useState<StunterProfile['location']>(profile?.location ?? null);
  const [teamGym, setTeamGym] = useState(profile?.teamGym ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [media, setMedia] = useState<StunterProfile['media']>(() =>
    (profile?.media ?? []).filter((m) => m.type === 'image'),
  );

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setBirthday(profile.birthday?.trim() ? profile.birthday : todayISODate());
      setPrimaryRole(profile.primaryRole);
      setSecondaryRoles(profile.secondaryRoles);
      setSkillLevel(profile.skillLevel);
      setYearsExperience(profile.yearsExperience);
      setSkillTags(profile.skillTags);
      setCurrentlyWorkingOn(profile.currentlyWorkingOn);
      setInstagramHandle(profile.instagramHandle ?? '');
      setLocation(profile.location);
      setTeamGym(profile.teamGym ?? '');
      setBio(profile.bio);
      setMedia((profile.media ?? []).filter((m) => m.type === 'image'));
    }
  }, [profile?.id]);

  useEffect(() => {
    if (city != null || (lat != null && lng != null)) {
      setLocation((prev) => ({
        city: city ?? prev?.city,
        region: prev?.region,
        country: prev?.country ?? 'USA',
        lat: lat ?? prev?.lat,
        lng: lng ?? prev?.lng,
      }));
    }
  }, [city, lat, lng]);

  const setPrimary = (p: PositionType) => {
    setPrimaryRole(p);
    setSecondaryRoles((prev) => prev.filter((x) => x !== p));
  };

  const toggleSecondary = (p: PositionType) => {
    if (primaryRole === p) return;
    setSecondaryRoles((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const toggleSkillTag = (t: SkillTag) => {
    setSkillTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const locationDisplay = useMemo(() => {
    const { city: c, region: r } = location ?? {};
    if (!c && !r) return '';
    return [c, r].filter(Boolean).join(', ');
  }, [location]);

  const onLocationTextChange = useCallback((text: string) => {
    setLocation((prev) => locationFromAreaText(text.trim(), prev));
  }, []);

  const fillLocationFromDevice = useCallback(async () => {
    const snap = await refetchLocation();
    if (snap) {
      setLocation({
        country: 'USA',
        lat: snap.lat,
        lng: snap.lng,
        city: snap.city ?? undefined,
        region: snap.region ?? undefined,
      });
      return;
    }
    if (Platform.OS === 'web') {
      Alert.alert(
        'Location',
        'If the browser blocked location, allow Location for this site in the address bar, then try the pin again.',
      );
    } else {
      Alert.alert('Location', 'Allow location when prompted, or enable it in Settings, then try again.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open settings', onPress: () => void openAppSettings() },
      ]);
    }
  }, [refetchLocation, openAppSettings]);

  const addGalleryItem = useCallback(async () => {
    if (media.length >= MAX_PROFILE_MEDIA) return;
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (r.canceled || !r.assets[0]) return;
    const uri = r.assets[0].uri;
    setMedia((prev) =>
      [...prev, { id: newMediaId('m'), uri, type: 'image' as const }].slice(0, MAX_PROFILE_MEDIA),
    );
  }, [media.length]);

  const removeMediaAt = useCallback((index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const age = birthday ? ageFromISOBirthday(birthday) : null;
  const ageError = birthday.length > 0 && age != null && age < MIN_AGE ? UNDERAGE_MESSAGE : null;

  const handleSave = async () => {
    if (!primaryRole || age == null || age < MIN_AGE) return;
    const positions = mergePrimaryAndSecondary(primaryRole, secondaryRoles);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        birthday,
        primaryRole,
        secondaryRoles: secondaryRoles.filter((p) => p !== primaryRole),
        positions,
        skillLevel,
        yearsExperience,
        skillTags,
        currentlyWorkingOn: currentlyWorkingOn.trim(),
        instagramHandle: instagramHandle.replace(/^@/, '').trim() || null,
        location: location ?? (city || lat != null ? { city: city ?? undefined, country: 'USA', lat: lat ?? undefined, lng: lng ?? undefined } : null),
        teamGym: teamGym.trim() || null,
        bio: bio.trim(),
        media: media.filter((m) => m.type === 'image'),
      });
      goBackOrReplace('/(tabs)/profile');
    } catch {
      Alert.alert('Profile', 'Could not save changes. Try again.');
    }
  };

  const canSave = displayName.trim().length > 0 && primaryRole != null && age != null && age >= MIN_AGE;
  const border = colors.border;

  const inlineInput = {
    color: colors.text,
    borderBottomColor: border,
  };

  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrReplace('/(tabs)/profile')} style={styles.backBtn} hitSlop={12}>
          <FontAwesome name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Edit profile</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <View style={[styles.headerRule, { backgroundColor: border }]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 52}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Basics</BlockHeading>
            <View style={styles.sectionPad}>
              <FieldLabel colors={colors}>Display name</FieldLabel>
              <TextInput
                style={[styles.inputPlain, inlineInput]}
                placeholder="Your name"
                placeholderTextColor={colors.secondary}
                value={displayName}
                onChangeText={setDisplayName}
              />
              <ProfileHairline color={border} />
              <View style={styles.fieldGap}>
                <FieldLabel colors={colors}>Birthday</FieldLabel>
                <BirthdayPickerField
                  value={birthday}
                  onChange={setBirthday}
                  hasError={!!ageError}
                  plain
                  emptyLabel="Tap to choose"
                  hideLabel
                />
              </View>
              {ageError ? (
                <ThemedText style={[styles.error, { color: '#c62828' }]}>{ageError}</ThemedText>
              ) : null}
              <ProfileHairline color={border} />
              <View style={styles.fieldGap}>
                <FieldLabel colors={colors}>Bio</FieldLabel>
                <TextInput
                  style={[styles.inputPlain, styles.bioMultiline, inlineInput]}
                  placeholder="Short intro — what you’re looking for"
                  placeholderTextColor={colors.secondary}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                />
              </View>
            </View>
          </SectionBlock>

          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Photos</BlockHeading>
            <View style={styles.sectionPad}>
              <View style={styles.mediaGrid}>
                {[
                  [0, 1, 2],
                  [3, 4, 5],
                ].map((indices, rowIdx) => (
                  <View
                    key={`row-${rowIdx}`}
                    style={[styles.mediaGridRow, rowIdx === 0 ? { marginBottom: SPACING.sm } : null]}
                  >
                    {indices.map((i) => {
                      const item = media[i];
                      const showAdd = !item && i === media.length && media.length < MAX_PROFILE_MEDIA;
                      return (
                        <View key={item?.id ?? `slot-${i}`} style={styles.mediaGridCell}>
                          {item ? (
                            <View style={styles.mediaCellInner}>
                              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                                <Image
                                  source={{ uri: item.uri }}
                                  style={styles.mediaThumb}
                                  accessibilityLabel="Profile photo"
                                />
                              </View>
                              <Pressable
                                style={styles.mediaRemoveBtn}
                                onPress={() => removeMediaAt(i)}
                                hitSlop={12}
                                accessibilityLabel="Remove photo"
                              >
                                <FontAwesome name="times" size={16} color="#fff" />
                              </Pressable>
                            </View>
                          ) : showAdd ? (
                            <Pressable
                              onPress={addGalleryItem}
                              style={[styles.mediaAddCell, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
                              accessibilityLabel="Add photo"
                              accessibilityRole="button"
                            >
                              <FontAwesome name="plus" size={28} color={colors.tint} />
                            </Pressable>
                          ) : (
                            <View style={[styles.mediaAddCell, styles.mediaCellDisabled, { borderColor: colors.border }]} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </SectionBlock>

          <View style={styles.rolesSectionOuter}>
            <SectionBlock colors={colors} isDark={isDark}>
              <BlockHeading colors={colors}>Roles</BlockHeading>
              <View style={[styles.sectionPad, styles.rolesSectionPad]}>
                <FieldLabel colors={colors}>Primary</FieldLabel>
                {ROLE_SECTIONS.map((section) => (
                  <View key={`primary-${section.title}`} style={styles.roleSubsection}>
                    <ThemedText style={[styles.roleSectionMeta, { color: colors.secondary }]}>{section.title}</ThemedText>
                    <View style={styles.chipWrap}>
                      {section.positions.map(({ value, label }) => (
                        <SelectChip
                          key={value}
                          label={label}
                          selected={primaryRole === value}
                          onPress={() => setPrimary(value)}
                          colors={colors}
                          isDark={isDark}
                        />
                      ))}
                    </View>
                  </View>
                ))}
                <View style={styles.secondaryRolesWrap}>
                  <FieldLabel colors={colors}>Also stunt as</FieldLabel>
                  {ROLE_SECTIONS.map((section) => (
                    <View key={`secondary-${section.title}`} style={styles.roleSubsection}>
                      <ThemedText style={[styles.roleSectionMeta, { color: colors.secondary }]}>{section.title}</ThemedText>
                      <View style={styles.chipWrap}>
                        {section.positions
                          .filter((p) => p.value !== primaryRole)
                          .map(({ value, label }) => (
                            <SelectChip
                              key={value}
                              label={label}
                              selected={secondaryRoles.includes(value)}
                              onPress={() => toggleSecondary(value)}
                              colors={colors}
                              isDark={isDark}
                            />
                          ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </SectionBlock>
          </View>

          <SectionBlock colors={colors} isDark={isDark}>
            <View style={styles.sectionPad}>
              <FieldLabel colors={colors}>Skill level</FieldLabel>
              <View style={styles.chipWrap}>
                {SKILL_LEVEL_OPTIONS.map(({ value, label }) => (
                  <SelectChip
                    key={value}
                    label={label}
                    selected={skillLevel === value}
                    onPress={() => setSkillLevel(value)}
                    colors={colors}
                    isDark={isDark}
                  />
                ))}
              </View>
              <View style={styles.subsectionGap}>
                <FieldLabel colors={colors}>Years stunting</FieldLabel>
                <TextInput
                  style={[styles.inputPlain, inlineInput]}
                  placeholder="0"
                  placeholderTextColor={colors.secondary}
                  value={yearsExperience ? String(yearsExperience) : ''}
                  onChangeText={(t) => setYearsExperience(parseInt(t, 10) || 0)}
                  keyboardType="number-pad"
                />
                <ProfileHairline color={border} />
              </View>
              <View style={[styles.subsectionGap, styles.skillTagsSection]}>
                <FieldLabel colors={colors}>Skill tags</FieldLabel>
                {SKILL_TAG_SECTIONS.map((section) => (
                  <View key={section.title} style={styles.skillTagSubsection}>
                    <ThemedText style={[styles.roleSectionMeta, { color: colors.secondary }]}>{section.title}</ThemedText>
                    <View style={styles.chipWrap}>
                      {section.tags.map((value) => (
                        <SelectChip
                          key={value}
                          label={SKILL_TAG_LABELS[value]}
                          selected={skillTags.includes(value)}
                          onPress={() => toggleSkillTag(value)}
                          colors={colors}
                          isDark={isDark}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.subsectionGap}>
                <FieldLabel colors={colors}>Currently working on</FieldLabel>
                <TextInput
                  style={[styles.inputPlain, styles.inputMultiline, inlineInput]}
                  placeholder="Skills you’re drilling"
                  placeholderTextColor={colors.secondary}
                  value={currentlyWorkingOn}
                  onChangeText={setCurrentlyWorkingOn}
                  multiline
                />
              </View>
            </View>
          </SectionBlock>

          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Location & links</BlockHeading>
            <View style={styles.sectionPad}>
              <FieldLabel colors={colors}>City / area</FieldLabel>
              <LocationSearchField
                value={locationDisplay}
                onChangeText={onLocationTextChange}
                onSelectPlace={(loc) => setLocation(loc)}
                onUseCurrentLocation={fillLocationFromDevice}
                colors={colors}
                variant="plain"
                borderColor={border}
                placeholder="Search or type city, e.g. Gainesville, FL"
              />
              <ProfileHairline color={border} />
              <View style={styles.subsectionGap}>
                <FieldLabel colors={colors}>Team / school / gym</FieldLabel>
                <TextInput
                  style={[styles.inputPlain, inlineInput]}
                  placeholder="Optional"
                  placeholderTextColor={colors.secondary}
                  value={teamGym}
                  onChangeText={setTeamGym}
                />
                <ProfileHairline color={border} />
              </View>
              <View style={styles.subsectionGap}>
                <FieldLabel colors={colors}>Instagram</FieldLabel>
                <TextInput
                  style={[styles.inputPlain, inlineInput]}
                  placeholder="@handle"
                  placeholderTextColor={colors.secondary}
                  value={instagramHandle}
                  onChangeText={setInstagramHandle}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </SectionBlock>

          <View style={{ height: SPACING.md }} />
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              borderTopColor: border,
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.sm,
            },
          ]}
        >
          <Pressable
            style={[styles.saveBtn, { backgroundColor: canSave ? colors.tint : colors.border }]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <ThemedText style={styles.saveBtnText}>Save changes</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: { padding: SPACING.xs },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  headerSpacer: { width: 38 },
  headerRule: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  scrollContent: {
    paddingBottom: SPACING.lg,
  },
  sectionPad: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  fieldGap: { marginTop: SPACING.sm },
  subsectionGap: { marginTop: SPACING.lg },
  rolesSectionOuter: { marginBottom: SPACING.xl },
  rolesSectionPad: { paddingBottom: SPACING.lg },
  secondaryRolesWrap: { marginTop: SPACING.xl },
  skillTagsSection: { marginTop: SPACING.xxl },
  skillTagSubsection: { marginTop: SPACING.lg },
  inputPlain: {
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputMultiline: { minHeight: 56, paddingTop: SPACING.sm, textAlignVertical: 'top' },
  bioMultiline: { minHeight: 100, paddingTop: SPACING.sm, textAlignVertical: 'top', borderBottomWidth: 0 },
  error: { fontSize: FONT_SIZE.sm, marginTop: SPACING.sm },
  roleSubsection: { marginTop: SPACING.lg },
  roleSectionMeta: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipLabel: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  saveBtn: {
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  /** Fills `sectionPad` width; rows divide space equally — no window-based cell size. */
  mediaGrid: { width: '100%', alignSelf: 'stretch' },
  mediaGridRow: { flexDirection: 'row', width: '100%', gap: SPACING.sm },
  mediaGridCell: { flex: 1, aspectRatio: 1, minWidth: 0 },
  mediaCellInner: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden', position: 'relative' },
  mediaThumb: { width: '100%', height: '100%' },
  mediaRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 6,
  },
  mediaAddCell: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  mediaCellDisabled: { opacity: 0.35 },
});
