import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProfileRemoteImage } from '@/components/ProfileRemoteImage';
import { Text as ThemedText } from '@/components/Themed';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import type { StunterProfile, UserStuntGroup } from '@/types';
import { MAX_SQUAD_MEMBERS } from '@/lib/squad';

const SLOT = 92;

function firstImageMedia(p: StunterProfile | null) {
  return p?.media?.find((x) => x.type === 'image') ?? null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type SquadGalleryColors = {
  text: string;
  secondary: string;
  border: string;
  card: string;
  tint: string;
};

type Props = {
  group: UserStuntGroup;
  colors: SquadGalleryColors;
  resolveProfile: (profileId: string) => StunterProfile | null;
  onInvitePress: () => void;
  /** When set, that member’s name shows “ (you)”. */
  viewerUserId?: string | null;
};

/**
 * Up to {@link MAX_SQUAD_MEMBERS} slots: filled members show avatar + name; empty slots show + to invite.
 */
export function SquadMemberGallery({ group, colors, resolveProfile, onInvitePress, viewerUserId }: Props) {
  const orderedMemberIds = useMemo(() => {
    const rest = group.memberIds.filter((id) => id !== group.creatorId);
    const head = group.memberIds.includes(group.creatorId) ? [group.creatorId] : [];
    return [...head, ...rest].slice(0, MAX_SQUAD_MEMBERS);
  }, [group.memberIds, group.creatorId]);

  const slots: ({ kind: 'member'; profileId: string } | { kind: 'empty' })[] = [];
  for (let i = 0; i < MAX_SQUAD_MEMBERS; i++) {
    const id = orderedMemberIds[i];
    if (id) slots.push({ kind: 'member', profileId: id });
    else slots.push({ kind: 'empty' });
  }

  return (
    <View style={styles.row}>
      {slots.map((slot, index) => {
        if (slot.kind === 'member') {
          const p = resolveProfile(slot.profileId);
          const imageMedia = firstImageMedia(p);
          const label =
            p?.displayName ?? (slot.profileId === group.creatorId ? 'Creator' : 'Member');
          const isCreator = slot.profileId === group.creatorId;
          const isYou = Boolean(viewerUserId && slot.profileId === viewerUserId);
          const displayLabel = isYou ? `${label} (you)` : label;
          return (
            <View
              key={slot.profileId}
              style={styles.cell}
              accessibilityLabel={`${displayLabel}${isCreator ? ', creator' : ''}`}
            >
              <View style={[styles.avatarRing, { borderColor: colors.border }]}>
                {imageMedia ? (
                  <ProfileRemoteImage
                    media={imageMedia}
                    style={styles.avatarImg}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.border + '55' }]}>
                    <ThemedText style={[styles.initials, { color: colors.text }]}>{initials(label)}</ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                {displayLabel}
              </ThemedText>
              {isCreator ? (
                <ThemedText style={[styles.badge, { color: colors.secondary }]} numberOfLines={1}>
                  Creator
                </ThemedText>
              ) : (
                <View style={styles.badgeSpacer} />
              )}
            </View>
          );
        }
        return (
          <Pressable
            key={`empty-${index}`}
            style={styles.cell}
            onPress={onInvitePress}
            accessibilityRole="button"
            accessibilityLabel="Invite friend"
          >
            <View style={[styles.emptySlot, { borderColor: colors.tint, backgroundColor: colors.card }]}>
              <FontAwesome name="plus" size={28} color={colors.tint} />
            </View>
            <ThemedText style={[styles.name, { color: colors.secondary }]} numberOfLines={1}>
              Add
            </ThemedText>
            <View style={styles.badgeSpacer} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  cell: { width: SLOT, alignItems: 'center' },
  avatarRing: {
    width: SLOT,
    height: SLOT,
    borderRadius: SLOT / 2,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  emptySlot: {
    width: SLOT,
    height: SLOT,
    borderRadius: SLOT / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center',
    width: '100%',
  },
  badge: { fontSize: FONT_SIZE.xs, marginTop: 2, textAlign: 'center' },
  badgeSpacer: { height: FONT_SIZE.xs + 2 },
});
