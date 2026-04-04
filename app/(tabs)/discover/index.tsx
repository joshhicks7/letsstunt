import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GroupSwipeCard } from '@/components/GroupSwipeCard';
import { ReportModal } from '@/components/ReportModal';
import { SwipeableDiscoverCard, type SwipeableDiscoverCardRef } from '@/components/SwipeableDiscoverCard';
import { SwipeCard } from '@/components/SwipeCard';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { POSITION_LABELS } from '@/constants/positions';
import { DISCOVER_ACTION_BTN_SIZE, DISCOVER_ACTION_ICON_SIZE } from '@/constants/discover';
import { SPACING, RADIUS } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useSwipe } from '@/context/SwipeContext';
import { useColorScheme } from '@/components/useColorScheme';
import { rosterProfilesForGroup } from '@/lib/groupRoster';

export default function DiscoverScreen() {
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { discoverStack, like, pass, block, report, allProfiles } = useSwipe();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const swipeRef = useRef<SwipeableDiscoverCardRef>(null);
  const current = discoverStack[currentIndex];

  const myRoleLabel = user?.profile?.primaryRole ? POSITION_LABELS[user.profile.primaryRole] : 'Athlete';

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
        const name =
          current.kind === 'profile' ? current.data.displayName : current.data.name?.trim() || 'this group';
        Alert.alert('It’s a match!', `You matched with ${name} as ${myRoleLabel}. Open Matches to send a message.`);
      } else {
        pass(entityId);
      }
      advanceIndex();
    },
    [current, like, pass, advanceIndex, myRoleLabel]
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

  /** Tighter to tab bar so buttons sit lower; safe area still respected */
  const actionsBottomPad = Math.max(insets.bottom, SPACING.sm) + SPACING.xs;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.cardWrap}>
        {current ? (
          <>
            <Pressable
              style={styles.reportBtn}
              onPress={openReport}
              hitSlop={12}
              accessibilityLabel="Report"
            >
              <FontAwesome name="flag-o" size={22} color={colors.secondary} />
            </Pressable>
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
            <FontAwesome name="users" size={48} color={colors.tabIconDefault} />
            <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>No more profiles or groups right now. Check back later!</ThemedText>
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
  cardWrap: { flex: 1, minHeight: 280, position: 'relative', paddingHorizontal: SPACING.sm },
  reportBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.md,
    zIndex: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    marginHorizontal: SPACING.sm,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { marginTop: SPACING.md, textAlign: 'center' },
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
