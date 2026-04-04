import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { POSITION_LABELS } from '@/constants/positions';
import { DISCOVER_CARD_OVERLAY_BOTTOM_PAD } from '@/constants/discover';
import { DISCOVER_GROUP_MAX_PHOTO_SLOTS, GROUP_MEMBER_MAX } from '@/constants/groups';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { maxPhotoSlotForMembers, uriForPhotoSlot } from '@/lib/groupRoster';
import type { StuntGroup, StunterProfile } from '@/types';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const QUAD_BORDER = 'rgba(255,255,255,0.14)';

interface GroupSwipeCardProps {
  group: StuntGroup;
  /** Resolved roster (max 4) for quadrant photos */
  members: StunterProfile[];
  onPressName: () => void;
}

function QuadPhoto({ profile, slot }: { profile: StunterProfile; slot: number }) {
  const uri = uriForPhotoSlot(profile, slot);
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[styles.quadFallback, StyleSheet.absoluteFillObject]}>
          <FontAwesome name="user" size={36} color="rgba(255,255,255,0.35)" />
        </View>
      )}
    </View>
  );
}

function CouldBeYouQuad() {
  return (
    <View style={[StyleSheet.absoluteFillObject, styles.couldBeYouQuad]}>
      <FontAwesome name="user-plus" size={32} color="rgba(255,255,255,0.5)" />
      <Text style={styles.couldBeYouText}>Could be you</Text>
    </View>
  );
}

export function GroupSwipeCard({ group, members, onPressName }: GroupSwipeCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const title = group.name?.trim() ? group.name : 'Stunt group';
  const needLine = group.rolesNeeded.map((r) => POSITION_LABELS[r]).join(' · ') || '—';
  const roster = members.slice(0, GROUP_MEMBER_MAX);
  const n = roster.length;

  const rosterKey = `${group.id}|${roster.map((p) => p.id).join(',')}`;
  const maxSlot = maxPhotoSlotForMembers(roster);
  const lastAllowedSlot = Math.min(maxSlot, DISCOVER_GROUP_MAX_PHOTO_SLOTS - 1);
  const slotCount = lastAllowedSlot + 1;
  const capped = maxSlot > lastAllowedSlot;

  const [slot, setSlot] = React.useState(0);
  React.useEffect(() => {
    setSlot(0);
  }, [rosterKey]);

  const goPrev = React.useCallback(() => {
    setSlot((i) => (slotCount <= 1 ? 0 : (i - 1 + slotCount) % slotCount));
  }, [slotCount]);
  const goNext = React.useCallback(() => {
    setSlot((i) => (slotCount <= 1 ? 0 : (i + 1) % slotCount));
  }, [slotCount]);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFillObject}>
        {n === 0 ? (
          <View style={[styles.emptyFull, { backgroundColor: colors.tint + '28' }]}>
            <FontAwesome name="users" size={88} color={colors.tint} style={{ opacity: 0.75 }} />
            <Text style={[styles.emptyBadge, { color: colors.tint }]}>Group</Text>
          </View>
        ) : n === 1 ? (
          <View style={StyleSheet.absoluteFillObject}>
            <QuadPhoto profile={roster[0]} slot={slot} />
          </View>
        ) : n === 2 ? (
          <View style={styles.rowFill}>
            <View style={[styles.half, styles.borderRight]}>
              <QuadPhoto profile={roster[0]} slot={slot} />
            </View>
            <View style={styles.half}>
              <QuadPhoto profile={roster[1]} slot={slot} />
            </View>
          </View>
        ) : n === 3 ? (
          <View style={styles.colFill}>
            <View style={[styles.rowHalf, styles.borderBottom]}>
              <View style={[styles.half, styles.borderRight]}>
                <QuadPhoto profile={roster[0]} slot={slot} />
              </View>
              <View style={styles.half}>
                <QuadPhoto profile={roster[1]} slot={slot} />
              </View>
            </View>
            <View style={styles.rowHalf}>
              <View style={[styles.half, styles.borderRight]}>
                <QuadPhoto profile={roster[2]} slot={slot} />
              </View>
              <View style={styles.half}>
                <CouldBeYouQuad />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.colFill}>
            <View style={[styles.rowHalf, styles.borderBottom]}>
              <View style={[styles.half, styles.borderRight]}>
                <QuadPhoto profile={roster[0]} slot={slot} />
              </View>
              <View style={styles.half}>
                <QuadPhoto profile={roster[1]} slot={slot} />
              </View>
            </View>
            <View style={styles.rowHalf}>
              <View style={[styles.half, styles.borderRight]}>
                <QuadPhoto profile={roster[2]} slot={slot} />
              </View>
              <View style={styles.half}>
                <QuadPhoto profile={roster[3]} slot={slot} />
              </View>
            </View>
          </View>
        )}
      </View>

      {n > 0 && slotCount > 1 ? (
        <View style={styles.tapZones}>
          <Pressable
            style={styles.tapHalf}
            onPress={goPrev}
            accessibilityLabel="Previous group photos"
            accessibilityRole="button"
          />
          <Pressable
            style={styles.tapHalf}
            onPress={goNext}
            accessibilityLabel="Next group photos"
            accessibilityRole="button"
          />
        </View>
      ) : null}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.92)']}
        locations={[0.35, 0.65, 1]}
        style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
      />

      <View style={styles.overlay}>
        {n > 0 && slotCount > 1 ? (
          <View style={styles.dotsRow}>
            {Array.from({ length: slotCount }, (_, i) => (
              <View key={i} style={[styles.dot, i === slot ? styles.dotActive : null]} />
            ))}
          </View>
        ) : null}
        {n > 0 && capped ? (
          <Text style={styles.moreOnProfile} numberOfLines={1}>
            Full gallery on group profile
          </Text>
        ) : null}
        <View style={styles.nameRow}>
          <Pressable onPress={onPressName} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} accessibilityRole="link">
            <Text style={styles.name} numberOfLines={2}>
              {title}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.label}>Looking for</Text>
        <Text style={styles.need} numberOfLines={3}>
          {needLine}
        </Text>
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
    backgroundColor: '#1a1a1a',
  },
  rowFill: { flex: 1, flexDirection: 'row' },
  colFill: { flex: 1, flexDirection: 'column' },
  rowHalf: { flex: 1, flexDirection: 'row', minHeight: 0 },
  half: { flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' },
  borderRight: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: QUAD_BORDER },
  borderBottom: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: QUAD_BORDER },
  quadFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#2c2c2c' },
  couldBeYouQuad: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: SPACING.sm,
  },
  couldBeYouText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
  emptyFull: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 72,
  },
  emptyBadge: { marginTop: SPACING.md, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: DISCOVER_CARD_OVERLAY_BOTTOM_PAD,
    paddingTop: SPACING.sm,
    zIndex: 2,
    pointerEvents: 'box-none',
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  tapHalf: {
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
    pointerEvents: 'none',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreOnProfile: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  nameRow: { marginBottom: SPACING.sm },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: SPACING.xs,
  },
  need: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: 'rgba(255,255,255,0.95)',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
