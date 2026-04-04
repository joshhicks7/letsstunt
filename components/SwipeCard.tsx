import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProfileCoverCarousel } from '@/components/ProfileCoverCarousel';
import { POSITION_LABELS } from '@/constants/positions';
import { SKILL_LEVEL_LABELS } from '@/constants/skills';
import { SKILL_TAG_LABELS } from '@/constants/skillTags';
import { DISCOVER_CARD_OVERLAY_BOTTOM_PAD } from '@/constants/discover';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import type { StunterProfile } from '@/types';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { ageFromISOBirthday } from '@/lib/dates';

interface SwipeCardProps {
  profile: StunterProfile;
  onPressName: () => void;
}

export function SwipeCard({ profile, onPressName }: SwipeCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const imageMedia = profile.media.filter((m) => m.type === 'image');
  const [photoPage, setPhotoPage] = useState(0);

  useEffect(() => {
    setPhotoPage(0);
  }, [profile.id]);

  const age = profile.birthday ? ageFromISOBirthday(profile.birthday) : null;

  const positionsLine = profile.positions.map((p) => POSITION_LABELS[p]).join(' · ');
  const skillsLine =
    profile.skillTags.length > 0
      ? profile.skillTags.map((t) => SKILL_TAG_LABELS[t]).join(' · ')
      : `${SKILL_LEVEL_LABELS[profile.skillLevel]} · ${profile.yearsExperience} yrs`;

  return (
    <View style={styles.root}>
      <ProfileCoverCarousel
        mediaOwnerKey={profile.id}
        imageMedia={imageMedia}
        carouselWidth={0}
        colors={colors}
        fillContainer
        showDots={false}
        placeholderIconSize={88}
        placeholderTintSuffix="35"
        onPageChange={setPhotoPage}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.88)']}
        locations={[0.35, 0.65, 1]}
        style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
      />

      <View style={styles.overlayShell}>
        <View style={styles.infoStack}>
          {imageMedia.length > 1 ? (
            <View style={styles.dots}>
              {imageMedia.map((m, i) => (
                <View
                  key={m.id}
                  style={[styles.dot, { backgroundColor: i === photoPage ? '#fff' : 'rgba(255,255,255,0.45)' }]}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
              <Pressable onPress={onPressName} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} accessibilityRole="link">
                <Text style={styles.name} numberOfLines={1}>
                  {profile.displayName}
                </Text>
              </Pressable>
              {age != null ? <Text style={styles.age}> · {age}</Text> : null}
            </View>
          </View>

          {positionsLine ? (
            <Text style={styles.positions} numberOfLines={2}>
              {positionsLine}
            </Text>
          ) : null}

          <Text style={styles.skills} numberOfLines={3}>
            {skillsLine}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    minHeight: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  overlayShell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom: DISCOVER_CARD_OVERLAY_BOTTOM_PAD,
    zIndex: 2,
    pointerEvents: 'box-none',
  },
  infoStack: {
    alignSelf: 'stretch',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  nameBlock: { flex: 1, flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: '#fff',
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  age: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  positions: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  skills: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.88)',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
