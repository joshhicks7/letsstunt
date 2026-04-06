import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import { SquadMemberGallery } from '@/components/SquadMemberGallery';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useStuntGroups } from '@/context/StuntGroupContext';
import { useSwipe } from '@/context/SwipeContext';
import { useColorScheme } from '@/components/useColorScheme';
import { goBackOrReplace } from '@/lib/goBackOrReplace';
import { buildGroupInviteMessage } from '@/lib/groupJoinLink';
import { isSquadLive, MAX_GROUP_BIO_LENGTH, MAX_SQUAD_MEMBERS, squadMemberCount } from '@/lib/squad';
import type { StunterProfile } from '@/types';

export default function DiscoverGroupsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid = user?.profile?.id;
  const { myGroup, createGroup, updateGroupName, updateGroupBio } = useStuntGroups();
  const { allProfiles } = useSwipe();

  const isCreator = myGroup && uid ? myGroup.creatorId === uid : false;
  const [nameDraft, setNameDraft] = useState(myGroup?.name ?? '');
  const [bioDraft, setBioDraft] = useState(myGroup?.bio ?? '');
  useEffect(() => {
    if (myGroup) setNameDraft(myGroup.name);
  }, [myGroup?.id, myGroup?.name]);
  useEffect(() => {
    if (myGroup) setBioDraft(myGroup.bio);
  }, [myGroup?.id, myGroup?.bio]);

  const inviteText = useMemo(() => {
    if (!myGroup) return '';
    if (isCreator) return buildGroupInviteMessage(nameDraft, myGroup.joinSlug, bioDraft);
    return buildGroupInviteMessage(myGroup.name, myGroup.joinSlug, myGroup.bio);
  }, [myGroup, isCreator, nameDraft, bioDraft]);

  const resolveProfile = (profileId: string): StunterProfile | null => {
    const p = allProfiles.find((x) => x.id === profileId) ?? null;
    if (p) return p;
    if (user?.profile?.id === profileId) return user.profile;
    return null;
  };

  const inviteFriend = async () => {
    if (!myGroup) return;
    try {
      await Share.share({ message: inviteText });
    } catch {
      /* dismissed */
    }
  };

  const saveName = () => {
    if (!myGroup || !isCreator) return;
    updateGroupName(myGroup.id, nameDraft);
  };

  const saveBio = () => {
    if (!myGroup || !isCreator) return;
    updateGroupBio(myGroup.id, bioDraft);
  };

  const onBioChange = (t: string) => {
    setBioDraft(t.replace(/\r\n/g, '\n').slice(0, MAX_GROUP_BIO_LENGTH));
  };

  const onCreate = () => {
    const r = createGroup();
    if (r) return;
    if (!uid) {
      Alert.alert('Sign in', 'Create an account to start a stunt group.');
      return;
    }
    Alert.alert('Already in a group', 'You can only have one stunt group. Invite friends using the open slots.');
  };

  if (!myGroup) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => goBackOrReplace('/(tabs)/discover')} style={styles.backBtn} hitSlop={12} accessibilityLabel="Back">
            <FontAwesome name="chevron-left" size={22} color={colors.text} />
          </Pressable>
          <ThemedText style={[styles.title, { color: colors.text }]}>Stunt group</ThemedText>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.border + '44' }]}>
            <FontAwesome name="users" size={36} color={colors.tabIconDefault} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>Your stunt group</ThemedText>
          <ThemedText style={[styles.emptyBody, { color: colors.secondary }]}>
            Up to {MAX_SQUAD_MEMBERS} people. It goes live when at least two have joined. Tap below to create yours—then
            use the + slots to invite friends.
          </ThemedText>
          <Pressable
            style={[styles.createBtn, { backgroundColor: colors.tint }]}
            onPress={onCreate}
            accessibilityRole="button"
            accessibilityLabel="Create stunt group"
          >
            <FontAwesome name="plus" size={18} color="#fff" style={{ marginRight: SPACING.sm }} />
            <ThemedText style={styles.createBtnText}>Create stunt group</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  const live = isSquadLive(myGroup);
  const n = squadMemberCount(myGroup);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBackOrReplace('/(tabs)/discover')} style={styles.backBtn} hitSlop={12} accessibilityLabel="Back">
          <FontAwesome name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {myGroup ? myGroup.name : "Stunt group"}
        </ThemedText>
        <View style={styles.backSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusPill, { backgroundColor: live ? colors.tint + '22' : colors.border + '44' }]}>
          <ThemedText style={{ color: live ? colors.tint : colors.secondary, fontWeight: FONT_WEIGHT.semibold }}>
            {live ? 'Live' : 'Forming'} · {n}/{MAX_SQUAD_MEMBERS} people
          </ThemedText>
        </View>

        {isCreator ? (
          <View style={styles.block}>
            <ThemedText style={[styles.label, { color: colors.secondary }]}>Group name</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
              value={nameDraft}
              onChangeText={setNameDraft}
              onEndEditing={saveName}
              onSubmitEditing={saveName}
              placeholder="Group name"
              placeholderTextColor={colors.secondary}
            />
            <ThemedText style={[styles.label, { color: colors.secondary, marginTop: SPACING.md }]}>About</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.bioInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
              ]}
              value={bioDraft}
              onChangeText={onBioChange}
              onEndEditing={saveBio}
              placeholder="e.g. Sat mornings — rebuilding a coed trio, need base + flyer."
              placeholderTextColor={colors.secondary}
              multiline
              textAlignVertical="top"
            />
            <ThemedText style={[styles.bioCount, { color: colors.secondary }]}>
              {bioDraft.length}/{MAX_GROUP_BIO_LENGTH}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.block}>
            <ThemedText style={[styles.groupTitle, styles.groupTitleMember, { color: colors.text }]} numberOfLines={2}>
              {myGroup.name}
            </ThemedText>
            {myGroup.bio.trim() ? (
              <ThemedText style={[styles.memberBio, { color: colors.secondary }]}>{myGroup.bio.trim()}</ThemedText>
            ) : null}
          </View>
        )}

        <SquadMemberGallery
          group={myGroup}
          colors={{
            text: colors.text,
            secondary: colors.secondary,
            border: colors.border,
            card: colors.card,
            tint: colors.tint,
          }}
          resolveProfile={resolveProfile}
          onInvitePress={() => void inviteFriend()}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  backBtn: { padding: SPACING.sm, width: 44 },
  backSpacer: { width: 44 },
  title: { flex: 1, textAlign: 'center', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  statusPill: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  block: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs },
  groupTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.lg,
  },
  groupTitleMember: { marginBottom: SPACING.xs },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  bioInput: { minHeight: 100, paddingTop: SPACING.sm },
  bioCount: { fontSize: FONT_SIZE.xs, marginTop: SPACING.xs, alignSelf: 'flex-end' },
  memberBio: { fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: SPACING.sm },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.sm },
  emptyBody: { fontSize: FONT_SIZE.sm, lineHeight: 22, textAlign: 'center', marginBottom: SPACING.xl },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    minWidth: 240,
  },
  createBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
});
