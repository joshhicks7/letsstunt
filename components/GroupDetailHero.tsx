import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ProfileCoverCarousel } from '@/components/ProfileCoverCarousel';
import { profileSectionStyles as ps } from '@/components/ProfileSections';
import { Text as ThemedText } from '@/components/Themed';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import type { StunterProfile } from '@/types';
import Colors from '@/constants/Colors';

type Props = {
  rosterKey: string;
  title: string;
  locationCity?: string | null;
  memberProfiles: StunterProfile[];
  colors: (typeof Colors)['light'];
  border: string;
  carouselWidth: number;
};

export function GroupDetailHero({
  rosterKey,
  title,
  locationCity,
  memberProfiles,
  colors,
  border,
  carouselWidth,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [rosterKey]);

  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, memberProfiles.length - 1)));
  }, [memberProfiles.length]);

  const selected = memberProfiles[selectedIndex];
  const imageMedia = selected ? selected.media.filter((m) => m.type === 'image') : [];

  return (
    <View style={styles.wrap}>
      <ThemedText style={[styles.badge, { color: colors.tint }]}>Group</ThemedText>
      <ThemedText style={[styles.groupTitle, { color: colors.text }]}>{title}</ThemedText>
      {locationCity ? (
        <ThemedText style={[ps.heroMeta, { color: colors.secondary }]}>
          <FontAwesome name="map-marker" size={13} color={colors.secondary} /> {locationCity}
        </ThemedText>
      ) : null}

      {memberProfiles.length === 0 ? (
        <View style={styles.emptyRoster}>
          <FontAwesome name="users" size={40} color={colors.secondary} />
          <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>No members on the roster yet</ThemedText>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
            style={styles.tabScroll}
          >
            {memberProfiles.map((m, i) => {
              const on = i === selectedIndex;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setSelectedIndex(i)}
                  style={[
                    styles.tab,
                    { borderColor: border, backgroundColor: 'transparent' },
                    on && { borderColor: colors.tint, backgroundColor: colors.tint + '22' },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                >
                  <ThemedText
                    style={{
                      color: on ? colors.tint : colors.text,
                      fontWeight: on ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular,
                      fontSize: FONT_SIZE.sm,
                    }}
                    numberOfLines={1}
                  >
                    {m.displayName}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.carouselPad}>
            <ProfileCoverCarousel
              mediaOwnerKey={selected?.id}
              imageMedia={imageMedia}
              carouselWidth={carouselWidth}
              colors={colors}
            />
          </View>

          {selected ? (
            <Pressable
              onPress={() => router.push({ pathname: '/discover/[id]', params: { id: selected.id } })}
              style={styles.profileLink}
              accessibilityRole="link"
              accessibilityLabel={`View ${selected.displayName} full profile`}
            >
              <ThemedText style={[styles.profileLinkText, { color: colors.tint }]}>
                View {selected.displayName}&apos;s profile
              </ThemedText>
              <FontAwesome name="chevron-right" size={14} color={colors.tint} style={{ marginLeft: 4 }} />
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  badge: { fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
  groupTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  tabScroll: { marginTop: SPACING.lg, maxHeight: 48, width: '100%' },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  carouselPad: { marginTop: SPACING.md, width: '100%' },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  profileLinkText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  emptyRoster: { alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.md },
  emptyText: { marginTop: SPACING.sm, textAlign: 'center' },
});
