import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
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

export default function DiscoverGroupDetailScreen() {
  const { slug: slugParam } = useLocalSearchParams<{ slug: string }>();
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid = user?.profile?.id;
  const { getGroupBySlug, updateGroupName, updateGroupBio } = useStuntGroups();
  const { allProfiles } = useSwipe();

  const group = slug ? getGroupBySlug(slug) : undefined;
  const isCreator = group && uid ? group.creatorId === uid : false;

  const [nameDraft, setNameDraft] = useState(group?.name ?? '');
  const [bioDraft, setBioDraft] = useState(group?.bio ?? '');
  useEffect(() => {
    if (group) setNameDraft(group.name);
  }, [group?.id, group?.name]);
  useEffect(() => {
    if (group) setBioDraft(group.bio);
  }, [group?.id, group?.bio]);

  const inviteText = useMemo(() => {
    if (!group) return '';
    if (isCreator) return buildGroupInviteMessage(nameDraft, group.joinSlug, bioDraft);
    return buildGroupInviteMessage(group.name, group.joinSlug, group.bio);
  }, [group, isCreator, nameDraft, bioDraft]);

  const inviteFriend = async () => {
    if (!group) return;
    try {
      await Share.share({ message: inviteText });
    } catch {
      /* dismissed */
    }
  };

  const resolveProfile = useCallback(
    (profileId: string): StunterProfile | null => {
      const p = allProfiles.find((x) => x.id === profileId) ?? null;
      if (p) return p;
      if (user?.profile?.id === profileId) return user.profile;
      return null;
    },
    [allProfiles, user],
  );

  const saveName = () => {
    if (!group || !isCreator) return;
    updateGroupName(group.id, nameDraft);
  };

  const saveBio = () => {
    if (!group || !isCreator) return;
    updateGroupBio(group.id, bioDraft);
  };

  const onBioChange = (t: string) => {
    setBioDraft(t.replace(/\r\n/g, '\n').slice(0, MAX_GROUP_BIO_LENGTH));
  };

  if (!group) {
    return (
      <ThemedView style={[styles.centered, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Pressable onPress={() => goBackOrReplace('/(tabs)/discover')} style={styles.backBtn} hitSlop={12}>
          <FontAwesome name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={{ color: colors.secondary }}>This group link is invalid or expired.</ThemedText>
      </ThemedView>
    );
  }

  const live = isSquadLive(group);
  const n = squadMemberCount(group);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBackOrReplace('/(tabs)/discover')} style={styles.backBtn} hitSlop={12} accessibilityLabel="Back">
          <FontAwesome name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {group.name}
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
              {group.name}
            </ThemedText>
            {group.bio.trim() ? (
              <ThemedText style={[styles.memberBio, { color: colors.secondary }]}>{group.bio.trim()}</ThemedText>
            ) : null}
          </View>
        )}

        <SquadMemberGallery
          group={group}
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
  centered: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
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
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  bioInput: { minHeight: 100, paddingTop: SPACING.sm },
  bioCount: { fontSize: FONT_SIZE.xs, marginTop: SPACING.xs, alignSelf: 'flex-end' },
  groupTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.lg,
  },
  groupTitleMember: { marginBottom: SPACING.xs },
  memberBio: { fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: SPACING.sm },
});
