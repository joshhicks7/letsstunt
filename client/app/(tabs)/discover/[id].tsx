import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
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
import { SPACING, FONT_SIZE, PROFILE_COVER_CAROUSEL_HEIGHT } from '@/constants/Theme';
import { GroupDetailHero } from '@/components/GroupDetailHero';
import { ProfileCoverCarousel } from '@/components/ProfileCoverCarousel';
import { ReportModal } from '@/components/ReportModal';
import { useAuth } from '@/context/AuthContext';
import { goBackOrReplace } from '@/lib/goBackOrReplace';
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
  const { user } = useAuth();
  const viewerId = user?.id ?? user?.profile?.id ?? null;
  const { allProfiles, getGroupListingById, report, pass, block } = useSwipe();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const { width: windowWidth } = useWindowDimensions();

  const profile = entityId ? allProfiles.find((p) => p.id === entityId) : undefined;
  const group = entityId ? getGroupListingById(entityId) : undefined;

  if (!profile && !group) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.detailHeader}>
          <Pressable onPress={() => goBackOrReplace('/(tabs)/discover')} style={styles.detailHeaderBack} hitSlop={12}>
            <FontAwesome name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.detailHeaderCenter}>
            <ThemedText style={[styles.detailHeaderTitle, { color: colors.secondary }]} numberOfLines={1}>
              Not found
            </ThemedText>
          </View>
          <View style={styles.detailHeaderSpacer} />
        </View>
        <View style={[styles.headerRule, { backgroundColor: border, marginHorizontal: SPACING.lg }]} />
        <ThemedText style={[styles.notFoundBody, { color: colors.secondary }]}>Profile not found.</ThemedText>
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
        <View style={styles.detailHeader}>
          <Pressable onPress={() => goBackOrReplace('/(tabs)/discover')} style={styles.detailHeaderBack} hitSlop={12}>
            <FontAwesome name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.detailHeaderCenter}>
            <ThemedText style={[styles.detailHeaderTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </ThemedText>
          </View>
          <View style={styles.detailHeaderSpacer} />
        </View>
        <View style={[styles.headerRule, { backgroundColor: border, marginHorizontal: SPACING.lg }]} />
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
              showHeroTitle={false}
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
  const isOwnProfile = Boolean(viewerId && p.id === viewerId);
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

  const openReport = () => setReportModalVisible(true);
  const closeReport = () => setReportModalVisible(false);
  const handleReportProfile = (profileId: string, reason: string, details?: string) => {
    report(profileId, reason, details);
    pass(profileId);
    goBackOrReplace('/(tabs)/discover');
  };
  const handleBlockProfile = (profileId: string) => {
    block(profileId);
    pass(profileId);
    goBackOrReplace('/(tabs)/discover');
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.detailHeader}>
        <Pressable onPress={() => goBackOrReplace('/(tabs)/discover')} style={styles.detailHeaderBack} hitSlop={12}>
          <FontAwesome name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.detailHeaderCenter}>
          <ThemedText style={styles.detailHeaderNameAge} numberOfLines={1}>
            <ThemedText style={[styles.detailHeaderTitle, { color: colors.text }]}>{p.displayName}</ThemedText>
            {age != null ? (
              <ThemedText style={[styles.detailHeaderAge, { color: colors.secondary }]}> · {age}</ThemedText>
            ) : null}
          </ThemedText>
        </View>
        {!isOwnProfile ? (
          <Pressable
            onPress={openReport}
            style={styles.detailHeaderAction}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Report or block"
          >
            <FontAwesome name="flag-o" size={22} color={colors.secondary} />
          </Pressable>
        ) : (
          <View style={styles.detailHeaderSpacer} />
        )}
      </View>
      <View style={[styles.headerRule, { backgroundColor: border, marginHorizontal: SPACING.lg }]} />
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
            height={PROFILE_COVER_CAROUSEL_HEIGHT}
            placeholderIconSize={64}
          />
          {locationLine ? (
            <View style={ps.profileHeroBlockBody}>
              <ThemedText style={[ps.profileHeroMeta, { color: colors.secondary }]}>
                <FontAwesome name="map-marker" size={11} color={colors.secondary} /> {locationLine}
              </ThemedText>
            </View>
          ) : null}
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

      {!isOwnProfile ? (
        <ReportModal
          visible={reportModalVisible}
          onClose={closeReport}
          profileDisplayName={p.displayName}
          profileId={p.id}
          onReport={handleReportProfile}
          onBlock={handleBlockProfile}
          showBlockOption
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
  },
  detailHeaderBack: {
    width: 44,
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  detailHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: SPACING.sm,
  },
  detailHeaderNameAge: { textAlign: 'center' },
  detailHeaderTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  detailHeaderAge: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  detailHeaderSpacer: { width: 44 },
  detailHeaderAction: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  headerRule: {
    height: StyleSheet.hairlineWidth,
    marginBottom: SPACING.sm,
  },
  notFoundBody: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, fontSize: FONT_SIZE.md },
  scroll: { paddingBottom: SPACING.xl },
});
