import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BlockHeading,
  ProfileFieldRow,
  ProfileHairline,
  SectionBlock,
  profileSectionStyles as ps,
} from '@/components/ProfileSections';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { POSITION_LABELS } from '@/constants/positions';
import { SKILL_LEVEL_LABELS } from '@/constants/skills';
import { SKILL_TAG_LABELS } from '@/constants/skillTags';
import { ProfileCoverCarousel } from '@/components/ProfileCoverCarousel';
import { SPACING, FONT_SIZE, FONT_WEIGHT, PROFILE_COVER_CAROUSEL_HEIGHT } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { ageFromISOBirthday } from '@/lib/dates';

export default function ProfileScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const profile = user?.profile;

  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  const age = profile.birthday ? ageFromISOBirthday(profile.birthday) : null;
  const imageMedia = profile.media.filter((m) => m.type === 'image');
  const coverCarouselWidth = Math.max(0, windowWidth - SPACING.lg * 2);
  const ig = profile.instagramHandle?.trim()
    ? profile.instagramHandle.startsWith('@')
      ? profile.instagramHandle
      : `@${profile.instagramHandle}`
    : null;

  const secondaryLabel =
    profile.secondaryRoles.length > 0
      ? profile.secondaryRoles.map((p) => POSITION_LABELS[p]).join(' · ')
      : null;

  const border = colors.border;
  const isDark = colorScheme === 'dark';

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <ThemedText style={styles.screenTitle}>Profile</ThemedText>
        <View style={styles.topBarActions}>
          <Pressable
            onPress={() => router.push('/profile/edit')}
            hitSlop={12}
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
            style={styles.topBarIconHit}
          >
            <FontAwesome name="pencil" size={20} color={colors.tint} />
          </Pressable>
          <Pressable onPress={() => router.push('/profile/settings')} hitSlop={12} accessibilityLabel="Settings" style={styles.topBarIconHit}>
            <FontAwesome name="cog" size={22} color={colors.tint} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.headerRule, { backgroundColor: border }]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <SectionBlock colors={colors} isDark={isDark}>
          <ProfileCoverCarousel
            mediaOwnerKey={profile.id}
            imageMedia={imageMedia}
            carouselWidth={coverCarouselWidth}
            colors={colors}
            height={PROFILE_COVER_CAROUSEL_HEIGHT}
            placeholderIconSize={64}
          />
          <View style={ps.profileHeroBlockBody}>
            <ThemedText style={[ps.profileHeroName, { color: colors.text }]}>{profile.displayName}</ThemedText>
            {age != null ? (
              <ThemedText style={[ps.profileHeroMeta, { color: colors.secondary }]}>{age} years old</ThemedText>
            ) : null}
            {profile.location?.city ? (
              <ThemedText style={[ps.profileHeroMeta, { color: colors.secondary }]}>
                <FontAwesome name="map-marker" size={11} color={colors.secondary} /> {profile.location.city}
                {profile.location.region ? `, ${profile.location.region}` : ''}
              </ThemedText>
            ) : null}
          </View>
        </SectionBlock>

        {profile.bio ? (
          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Bio</BlockHeading>
            <View style={ps.blockBody}>
              <ThemedText style={[ps.bodyText, { color: colors.text, lineHeight: 22 }]}>{profile.bio}</ThemedText>
            </View>
          </SectionBlock>
        ) : null}

        <SectionBlock colors={colors} isDark={isDark}>
          <BlockHeading colors={colors}>Roles</BlockHeading>
          <ProfileFieldRow label="Primary" value={POSITION_LABELS[profile.primaryRole]} borderColor={border} colors={colors} />
          {secondaryLabel ? <ProfileFieldRow label="Also" value={secondaryLabel} borderColor={border} colors={colors} /> : null}
          <ProfileFieldRow
            label="All positions"
            value={profile.positions.map((p) => POSITION_LABELS[p]).join(' · ')}
            borderColor={border}
            colors={colors}
            last
          />
        </SectionBlock>

        <SectionBlock colors={colors} isDark={isDark}>
          <BlockHeading colors={colors}>Experience & skills</BlockHeading>
          {(() => {
            const hasTags = profile.skillTags.length > 0;
            const hasWorking = Boolean(profile.currentlyWorkingOn?.trim());
            const levelLast = !hasTags && !hasWorking;
            return (
              <>
                <ProfileFieldRow
                  label="Level"
                  value={`${SKILL_LEVEL_LABELS[profile.skillLevel]} · ${profile.yearsExperience} years`}
                  borderColor={border}
                  colors={colors}
                  last={levelLast}
                />
                {hasTags ? (
                  <>
                    <ProfileHairline color={border} />
                    <View style={ps.blockBody}>
                      <ThemedText style={[ps.rowLabel, { color: colors.secondary }]}>Skill tags</ThemedText>
                      <View style={ps.chipWrap}>
                        {profile.skillTags.map((t) => (
                          <View key={t} style={[ps.chip, { backgroundColor: colors.tint + '14' }]}>
                            <ThemedText style={[ps.chipText, { color: colors.tint }]}>{SKILL_TAG_LABELS[t]}</ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                    {hasWorking ? <ProfileHairline color={border} /> : null}
                  </>
                ) : null}
                {hasWorking ? (
                  <ProfileFieldRow
                    label="Working on"
                    value={profile.currentlyWorkingOn!}
                    borderColor={border}
                    colors={colors}
                    last
                  />
                ) : null}
              </>
            );
          })()}
        </SectionBlock>

        {profile.teamGym || ig ? (
          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Team & social</BlockHeading>
            {profile.teamGym ? (
              <ProfileFieldRow label="Team / gym" value={profile.teamGym} borderColor={border} colors={colors} last={!ig} />
            ) : null}
            {ig ? <ProfileFieldRow label="Instagram" value={ig} borderColor={border} colors={colors} last /> : null}
          </SectionBlock>
        ) : null}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerRule: {
    height: StyleSheet.hairlineWidth,
    marginBottom: SPACING.sm,
  },
  screenTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  topBarIconHit: { padding: SPACING.sm, marginRight: -SPACING.sm },
  scroll: { paddingBottom: SPACING.xl },
});
