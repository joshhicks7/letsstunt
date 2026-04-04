import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
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
import { AVAILABILITY_LABELS } from '@/constants/availability';
import Colors from '@/constants/Colors';
import { POSITION_LABELS } from '@/constants/positions';
import { SKILL_LEVEL_LABELS } from '@/constants/skills';
import { SKILL_TAG_LABELS } from '@/constants/skillTags';
import { SPACING, FONT_SIZE } from '@/constants/Theme';
import { GroupDetailHero } from '@/components/GroupDetailHero';
import { ProfileCoverCarousel } from '@/components/ProfileCoverCarousel';
import { MOCK_GROUPS } from '@/data/mockData';
import { rosterProfilesForGroup } from '@/lib/groupRoster';
import { useSwipe } from '@/context/SwipeContext';
import { useColorScheme } from '@/components/useColorScheme';
import { ageFromISOBirthday } from '@/lib/dates';

export default function DiscoverProfileDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const entityId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const border = colors.border;
  const { allProfiles } = useSwipe();
  const { width: windowWidth } = useWindowDimensions();

  const profile = entityId ? allProfiles.find((p) => p.id === entityId) : undefined;
  const group = entityId ? MOCK_GROUPS.find((g) => g.id === entityId) : undefined;

  if (!profile && !group) {
    return (
      <ThemedView style={[styles.centered, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <FontAwesome name="arrow-left" size={22} color={colors.text} />
          <ThemedText style={{ color: colors.text }}>Back</ThemedText>
        </Pressable>
        <ThemedText style={{ color: colors.secondary, marginTop: SPACING.lg }}>Profile not found.</ThemedText>
      </ThemedView>
    );
  }

  if (group) {
    const title = group.name?.trim() ? group.name : 'Stunt group';
    const organizer = allProfiles.find((p) => p.id === group.creatorId);
    const organizerLabel = organizer?.displayName ?? 'Unknown';
    const gridWidth = Math.max(0, windowWidth - SPACING.lg * 2);
    const memberProfiles = rosterProfilesForGroup(group, allProfiles);
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={[styles.backRow, { paddingHorizontal: SPACING.lg }]}>
          <FontAwesome name="arrow-left" size={22} color={colors.text} />
          <ThemedText style={[styles.backText, { color: colors.text }]}>Back</ThemedText>
        </Pressable>
        <View style={[styles.headerRule, { backgroundColor: border }]} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <SectionBlock colors={colors} isDark={isDark}>
            <GroupDetailHero
              rosterKey={group.id}
              title={title}
              locationCity={group.location?.city ?? null}
              memberProfiles={memberProfiles}
              colors={colors}
              border={border}
              carouselWidth={gridWidth}
            />
          </SectionBlock>

          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Group</BlockHeading>
            <ProfileFieldRow
              label="Organizer"
              value={organizerLabel}
              borderColor={border}
              colors={colors}
            />
            <ProfileFieldRow
              label="Roster"
              value={`${memberProfiles.length} member${memberProfiles.length === 1 ? '' : 's'} · tabs above switch whose photos you see`}
              borderColor={border}
              colors={colors}
              last
            />
          </SectionBlock>

          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Roles</BlockHeading>
            <ProfileFieldRow
              label="Filled"
              value={group.rolesFilled.map((r) => POSITION_LABELS[r]).join(' · ') || '—'}
              borderColor={border}
              colors={colors}
            />
            <ProfileFieldRow
              label="Still needed"
              value={group.rolesNeeded.map((r) => POSITION_LABELS[r]).join(' · ') || '—'}
              borderColor={border}
              colors={colors}
              last
            />
          </SectionBlock>

          {group.availability.length > 0 ? (
            <SectionBlock colors={colors} isDark={isDark}>
              <BlockHeading colors={colors}>Availability</BlockHeading>
              <View style={ps.blockBody}>
                <ThemedText style={[ps.bodyText, { color: colors.text }]}>
                  {group.availability.map((a) => AVAILABILITY_LABELS[a]).join(' · ')}
                </ThemedText>
              </View>
            </SectionBlock>
          ) : null}

          {group.bio ? (
            <SectionBlock colors={colors} isDark={isDark}>
              <BlockHeading colors={colors}>About</BlockHeading>
              <View style={ps.blockBody}>
                <ThemedText style={[ps.bodyText, { color: colors.text, lineHeight: 22 }]}>{group.bio}</ThemedText>
              </View>
            </SectionBlock>
          ) : null}

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </ThemedView>
    );
  }

  const p = profile!;
  const age = p.birthday ? ageFromISOBirthday(p.birthday) : null;
  const ig = p.instagramHandle?.trim()
    ? p.instagramHandle.startsWith('@')
      ? p.instagramHandle
      : `@${p.instagramHandle}`
    : null;
  const imageMedia = p.media.filter((m) => m.type === 'image');
  /** Matches `SectionBlock` horizontal margin so paging aligns with the card width */
  const coverCarouselWidth = Math.max(0, windowWidth - SPACING.lg * 2);
  const secondaryLabel =
    p.secondaryRoles.length > 0 ? p.secondaryRoles.map((r) => POSITION_LABELS[r]).join(' · ') : null;
  const locationLine = p.location?.city
    ? `${p.location.city}${p.location.region ? `, ${p.location.region}` : ''}`
    : null;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} style={[styles.backRow, { paddingHorizontal: SPACING.lg }]}>
        <FontAwesome name="arrow-left" size={22} color={colors.text} />
        <ThemedText style={[styles.backText, { color: colors.text }]}>Back</ThemedText>
      </Pressable>
      <View style={[styles.headerRule, { backgroundColor: border }]} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <SectionBlock colors={colors} isDark={isDark}>
          <ProfileCoverCarousel
            mediaOwnerKey={p.id}
            imageMedia={imageMedia}
            carouselWidth={coverCarouselWidth}
            colors={colors}
          />
          <View style={ps.blockBody}>
            <ThemedText style={ps.heroName}>{p.displayName}</ThemedText>
            {age != null ? (
              <ThemedText style={[ps.heroMeta, { color: colors.secondary }]}>{age} years old</ThemedText>
            ) : null}
            {locationLine ? (
              <ThemedText style={[ps.heroMeta, { color: colors.secondary }]}>
                <FontAwesome name="map-marker" size={13} color={colors.secondary} /> {locationLine}
              </ThemedText>
            ) : null}
          </View>
        </SectionBlock>

        {p.bio ? (
          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Bio</BlockHeading>
            <View style={ps.blockBody}>
              <ThemedText style={[ps.bodyText, { color: colors.text, lineHeight: 22 }]}>{p.bio}</ThemedText>
            </View>
          </SectionBlock>
        ) : null}

        <SectionBlock colors={colors} isDark={isDark}>
          <BlockHeading colors={colors}>Roles</BlockHeading>
          <ProfileFieldRow label="Primary" value={POSITION_LABELS[p.primaryRole]} borderColor={border} colors={colors} />
          {secondaryLabel ? (
            <ProfileFieldRow label="Also" value={secondaryLabel} borderColor={border} colors={colors} />
          ) : null}
          <ProfileFieldRow
            label="All positions"
            value={p.positions.map((r) => POSITION_LABELS[r]).join(' · ')}
            borderColor={border}
            colors={colors}
            last
          />
        </SectionBlock>

        <SectionBlock colors={colors} isDark={isDark}>
          <BlockHeading colors={colors}>Experience & skills</BlockHeading>
          {(() => {
            const hasTags = p.skillTags.length > 0;
            const hasWorking = Boolean(p.currentlyWorkingOn?.trim());
            const levelLast = !hasTags && !hasWorking;
            return (
              <>
                <ProfileFieldRow
                  label="Level"
                  value={`${SKILL_LEVEL_LABELS[p.skillLevel]} · ${p.yearsExperience} years`}
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
                        {p.skillTags.map((t) => (
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
                  <ProfileFieldRow label="Working on" value={p.currentlyWorkingOn!} borderColor={border} colors={colors} last />
                ) : null}
              </>
            );
          })()}
        </SectionBlock>

        {p.availability.length > 0 ? (
          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Availability</BlockHeading>
            <View style={ps.blockBody}>
              <ThemedText style={[ps.bodyText, { color: colors.text }]}>
                {p.availability.map((a) => AVAILABILITY_LABELS[a]).join(' · ')}
              </ThemedText>
            </View>
          </SectionBlock>
        ) : null}

        {p.teamGym || ig ? (
          <SectionBlock colors={colors} isDark={isDark}>
            <BlockHeading colors={colors}>Team & social</BlockHeading>
            {p.teamGym ? (
              <ProfileFieldRow label="Team / gym" value={p.teamGym} borderColor={border} colors={colors} last={!ig} />
            ) : null}
            {ig ? (
              <ProfileFieldRow label="Instagram" value={ig} borderColor={border} colors={colors} last />
            ) : null}
          </SectionBlock>
        ) : null}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, padding: SPACING.lg },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  backText: { fontSize: FONT_SIZE.md },
  headerRule: {
    height: StyleSheet.hairlineWidth,
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.lg,
  },
  scroll: { paddingBottom: SPACING.xl },
});
