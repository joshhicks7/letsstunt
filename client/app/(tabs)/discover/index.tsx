import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GroupSwipeCard } from '@/components/GroupSwipeCard';
import { ReportModal } from '@/components/ReportModal';
import { SwipeableDiscoverCard, type SwipeableDiscoverCardRef } from '@/components/SwipeableDiscoverCard';
import { SwipeCard } from '@/components/SwipeCard';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { DISCOVER_ACTION_BTN_SIZE, DISCOVER_ACTION_ICON_SIZE } from '@/constants/discover';
import { SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '@/constants/Theme';
import { useSwipe } from '@/context/SwipeContext';
import { useColorScheme } from '@/components/useColorScheme';
import { buildAppInviteMessage } from '@/lib/groupJoinLink';
import { rosterProfilesForGroup } from '@/lib/groupRoster';

export default function DiscoverScreen() {
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const { discoverStack, like, pass, block, report, allProfiles } = useSwipe();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const swipeRef = useRef<SwipeableDiscoverCardRef>(null);
  const current = discoverStack[currentIndex];

  const openDetail = () => {
    if (!current) return;
    const id = current.kind === 'profile' ? current.data.id : current.data.id;
    router.push({ pathname: '/discover/[id]', params: { id } });
  };

  const advanceIndex = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, discoverStack.length - 1));
  }, [discoverStack.length]);

  const completeSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!current) return;
      const entityId = current.kind === 'profile' ? current.data.id : current.data.id;
      if (direction === 'right') {
        like(entityId);
      } else {
        pass(entityId);
      }
      advanceIndex();
    },
    [current, like, pass, advanceIndex]
  );

  const handlePassPress = () => swipeRef.current?.swipeLeft();
  const handleLikePress = () => swipeRef.current?.swipeRight();

  const openReport = () => setReportModalVisible(true);
  const closeReport = () => setReportModalVisible(false);
  const handleReport = (entityId: string, reason: string, details?: string) => {
    report(entityId, reason, details);
    pass(entityId);
    setCurrentIndex((i) => Math.min(i + 1, discoverStack.length - 1));
  };
  const handleBlock = (entityId: string) => {
    block(entityId);
    pass(entityId);
    setCurrentIndex((i) => Math.min(i + 1, discoverStack.length - 1));
  };

  const reportName =
    current?.kind === 'profile' ? current.data.displayName : current?.data.name?.trim() || 'Group';
  const reportId = current ? (current.kind === 'profile' ? current.data.id : current.data.id) : '';
  const cardKey = current ? `${current.kind}-${reportId}` : '';

  const inviteFriendToApp = async () => {
    try {
      await Share.share({
        message: buildAppInviteMessage(),
        title: "Let's Stunt",
      });
    } catch {
      /* dismissed or unavailable */
    }
  };

  /** Tighter to tab bar so buttons sit lower; safe area still respected */
  const actionsBottomPad = Math.max(insets.bottom, SPACING.sm) + SPACING.xs;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.brandTitle, { color: colors.text }]}>{"Let's Stunt"}</ThemedText>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => router.push('/discover/groups')}
            hitSlop={12}
            accessibilityLabel="Stunt groups"
          >
            <FontAwesome name="object-group" size={22} color={colors.tint} />
          </Pressable>
          <Pressable
            style={styles.headerIconBtn}
            onPress={current ? openReport : undefined}
            hitSlop={12}
            accessibilityLabel="Report"
            accessibilityState={{ disabled: !current }}
            disabled={!current}
          >
            <FontAwesome name="flag-o" size={22} color={current ? colors.secondary : colors.tabIconDefault} />
          </Pressable>
        </View>
      </View>

      <View style={styles.cardWrap}>
        {current ? (
          <>
            <SwipeableDiscoverCard ref={swipeRef} cardKey={cardKey} onSwipeComplete={completeSwipe} likeColor={colors.tint}>
              {current.kind === 'profile' ? (
                <SwipeCard profile={current.data} onPressName={openDetail} />
              ) : (
                <GroupSwipeCard
                  group={current.data}
                  members={rosterProfilesForGroup(current.data, allProfiles)}
                  onPressName={openDetail}
                />
              )}
            </SwipeableDiscoverCard>
            <View style={[styles.actionsOverlay, { paddingBottom: actionsBottomPad }]}>
              <Pressable
                style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={handlePassPress}
              >
                <FontAwesome name="times" size={DISCOVER_ACTION_ICON_SIZE} color={colors.text} />
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.likeBtn, { backgroundColor: colors.tint }]} onPress={handleLikePress}>
                <FontAwesome name="heart" size={DISCOVER_ACTION_ICON_SIZE} color="#fff" />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FontAwesome name="user-plus" size={48} color={colors.tabIconDefault} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
              Looks like you ran out of people to stunt with.
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.secondary }]}>
              Add a friend — the more athletes on LetsStunt, the more people you can match with. Send them a quick
              invite.
            </ThemedText>
            <Pressable
              style={[styles.inviteCta, { backgroundColor: colors.tint }]}
              onPress={() => void inviteFriendToApp()}
              accessibilityRole="button"
              accessibilityLabel="Invite a friend to LetsStunt"
            >
              <FontAwesome name="share-alt" size={18} color="#fff" style={{ marginRight: SPACING.sm }} />
              <ThemedText style={styles.inviteCtaText}>Invite a friend</ThemedText>
            </Pressable>
          </View>
        )}
      </View>

      {current ? (
        <ReportModal
          visible={reportModalVisible}
          onClose={closeReport}
          profileDisplayName={reportName}
          profileId={reportId}
          onReport={handleReport}
          onBlock={handleBlock}
          showBlockOption={true}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 200 },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
  headerActions: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: {
    flex: 1,
    minHeight: 280,
    position: 'relative',
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.md,
  },
  empty: {
    flex: 1,
    marginHorizontal: SPACING.sm,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  emptyTitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.sm,
    maxWidth: 340,
  },
  inviteCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    minWidth: 220,
  },
  inviteCtaText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  actionsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
    pointerEvents: 'box-none',
  },
  actionBtn: {
    width: DISCOVER_ACTION_BTN_SIZE,
    height: DISCOVER_ACTION_BTN_SIZE,
    borderRadius: DISCOVER_ACTION_BTN_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtn: { borderWidth: 0 },
});
