import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
import { BlockHeading, ProfileHairline, SectionBlock, profileSectionStyles as ps } from '@/components/ProfileSections';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import { AVAILABILITY_OPTIONS } from '@/constants/availability';
import Colors from '@/constants/Colors';
import { mergePrimaryAndSecondary, POSITION_OPTIONS, PRIMARY_ROLE_OPTIONS } from '@/constants/positions';
import { SKILL_LEVEL_OPTIONS } from '@/constants/skills';
import { SKILL_TAG_OPTIONS } from '@/constants/skillTags';
import { MIN_AGE, UNDERAGE_MESSAGE } from '@/constants/safety';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import type { AvailabilityType, PositionType, SkillTag, StunterProfile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocation } from '@/hooks/useLocation';
import { ageFromISOBirthday } from '@/lib/dates';

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
  const { city, lat, lng, refetch: refetchLocation } = useLocation();
  const profile = user?.profile;

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [birthday, setBirthday] = useState(profile?.birthday ?? '');
  const [primaryRole, setPrimaryRole] = useState<PositionType | null>(profile?.primaryRole ?? null);
  const [secondaryRoles, setSecondaryRoles] = useState<PositionType[]>(profile?.secondaryRoles ?? []);
  const [skillLevel, setSkillLevel] = useState(profile?.skillLevel ?? 'beginner');
  const [yearsExperience, setYearsExperience] = useState(profile?.yearsExperience ?? 0);
  const [availability, setAvailability] = useState<AvailabilityType[]>(profile?.availability ?? []);
  const [skillTags, setSkillTags] = useState<SkillTag[]>(profile?.skillTags ?? []);
  const [currentlyWorkingOn, setCurrentlyWorkingOn] = useState(profile?.currentlyWorkingOn ?? '');
  const [instagramHandle, setInstagramHandle] = useState(profile?.instagramHandle ?? '');
  const [location, setLocation] = useState<StunterProfile['location']>(profile?.location ?? null);
  const [teamGym, setTeamGym] = useState(profile?.teamGym ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setBirthday(profile.birthday);
      setPrimaryRole(profile.primaryRole);
      setSecondaryRoles(profile.secondaryRoles);
      setSkillLevel(profile.skillLevel);
      setYearsExperience(profile.yearsExperience);
      setAvailability(profile.availability);
      setSkillTags(profile.skillTags);
      setCurrentlyWorkingOn(profile.currentlyWorkingOn);
      setInstagramHandle(profile.instagramHandle ?? '');
      setLocation(profile.location);
      setTeamGym(profile.teamGym ?? '');
      setBio(profile.bio);
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

  const toggleAvailability = (a: AvailabilityType) => {
    setAvailability((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const toggleSkillTag = (t: SkillTag) => {
    setSkillTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const age = birthday ? ageFromISOBirthday(birthday) : null;
  const ageError = birthday.length > 0 && age != null && age < MIN_AGE ? UNDERAGE_MESSAGE : null;

  const handleSave = () => {
    if (!primaryRole || age == null || age < MIN_AGE) return;
    const positions = mergePrimaryAndSecondary(primaryRole, secondaryRoles);
    updateProfile({
      displayName: displayName.trim(),
      birthday,
      primaryRole,
      secondaryRoles: secondaryRoles.filter((p) => p !== primaryRole),
      positions,
      skillLevel,
      yearsExperience,
      availability,
      skillTags,
      currentlyWorkingOn: currentlyWorkingOn.trim(),
      instagramHandle: instagramHandle.replace(/^@/, '').trim() || null,
      location: location ?? (city || lat != null ? { city: city ?? undefined, country: 'USA', lat: lat ?? undefined, lng: lng ?? undefined } : null),
      teamGym: teamGym.trim() || null,
      bio: bio.trim(),
    });
    router.back();
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
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
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
                <BirthdayPickerField value={birthday} onChange={setBirthday} hasError={!!ageError} plain />
              </View>
              {ageError ? (
                <ThemedText style={[styles.error, { color: '#c62828' }]}>{ageError}</ThemedText>
              ) : null}
            </View>
          </SectionBlock>

          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Roles</BlockHeading>
            <View style={styles.sectionPad}>
              <FieldLabel colors={colors}>Primary</FieldLabel>
              <View style={styles.chipWrap}>
                {PRIMARY_ROLE_OPTIONS.map(({ value, label }) => (
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
              <View style={styles.subsectionGap}>
                <FieldLabel colors={colors}>Also stunt as</FieldLabel>
                <View style={styles.chipWrap}>
                  {POSITION_OPTIONS.filter((o) => o.value !== primaryRole).map(({ value, label }) => (
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
            </View>
          </SectionBlock>

          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Experience</BlockHeading>
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
              <View style={styles.subsectionGap}>
                <FieldLabel colors={colors}>Skill tags</FieldLabel>
                <View style={styles.chipWrap}>
                  {SKILL_TAG_OPTIONS.map(({ value, label }) => (
                    <SelectChip
                      key={value}
                      label={label}
                      selected={skillTags.includes(value)}
                      onPress={() => toggleSkillTag(value)}
                      colors={colors}
                      isDark={isDark}
                    />
                  ))}
                </View>
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
            <BlockHeading colors={colors}>Availability</BlockHeading>
            <View style={styles.sectionPad}>
              <View style={styles.chipWrap}>
                {AVAILABILITY_OPTIONS.map(({ value, label }) => (
                  <SelectChip
                    key={value}
                    label={label}
                    selected={availability.includes(value)}
                    onPress={() => toggleAvailability(value)}
                    colors={colors}
                    isDark={isDark}
                  />
                ))}
              </View>
            </View>
          </SectionBlock>

          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Location & links</BlockHeading>
            <View style={styles.sectionPad}>
              <FieldLabel colors={colors}>City / area</FieldLabel>
              <Pressable onPress={refetchLocation} style={styles.locationPress} hitSlop={4}>
                <FontAwesome name="map-marker" size={16} color={colors.tint} style={styles.locationIcon} />
                <ThemedText style={[styles.locationText, { color: location?.city ?? city ? colors.text : colors.secondary }]}>
                  {location?.city ?? city ?? 'Tap to refresh location'}
                </ThemedText>
                <FontAwesome name="refresh" size={14} color={colors.secondary} />
              </Pressable>
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

          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Bio</BlockHeading>
            <View style={styles.sectionPad}>
              <TextInput
                style={[styles.inputPlain, styles.bioMultiline, inlineInput]}
                placeholder="Short intro — what you’re looking for"
                placeholderTextColor={colors.secondary}
                value={bio}
                onChangeText={setBio}
                multiline
              />
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
  inputPlain: {
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputMultiline: { minHeight: 56, paddingTop: SPACING.sm, textAlignVertical: 'top' },
  bioMultiline: { minHeight: 100, paddingTop: SPACING.sm, textAlignVertical: 'top', borderBottomWidth: 0 },
  error: { fontSize: FONT_SIZE.sm, marginTop: SPACING.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipLabel: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  locationPress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  locationIcon: { marginRight: SPACING.sm },
  locationText: { flex: 1, fontSize: FONT_SIZE.md },
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
});
