import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReportModal } from '@/components/ReportModal';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import type { ChatMessage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useSwipe } from '@/context/SwipeContext';
import { goBackOrReplace } from '@/lib/goBackOrReplace';
import { useColorScheme } from '@/components/useColorScheme';

export default function MatchChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const id = typeof matchId === 'string' ? matchId : matchId?.[0] ?? '';
  const { user } = useAuth();
  const {
    getMatchById,
    getMatchProfile,
    getMessages,
    sendMessage,
    block,
    report,
    matchNeedsFirstMessageFromMe,
    refreshMatchFeed,
  } = useSwipe();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMatchFeed();
    } finally {
      setRefreshing(false);
    }
  }, [refreshMatchFeed]);

  const match = useMemo(() => (id ? getMatchById(id) : undefined), [id, getMatchById]);
  const profile = match ? getMatchProfile(match) : undefined;
  const messages = useMemo(() => (id ? getMessages(id) : []), [id, getMessages]);
  const myId = user?.id ?? user?.profile?.id ?? '';

  const onSend = useCallback(() => {
    if (!id || !draft.trim()) return;
    sendMessage(id, draft);
    setDraft('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [id, draft, sendMessage]);

  const openTheirProfile = useCallback(() => {
    if (!profile) return;
    router.push({ pathname: '/discover/[id]', params: { id: profile.id } });
  }, [profile]);

  if (!match || !profile) {
    return (
      <ThemedView style={[styles.centered, { paddingTop: insets.top }]}>
        <Pressable onPress={() => goBackOrReplace('/(tabs)/matches')} style={styles.backOnly}>
          <FontAwesome name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={{ color: colors.secondary }}>Conversation not found.</ThemedText>
      </ThemedView>
    );
  }

  const firstMedia = profile.media[0];
  const highlightThread = matchNeedsFirstMessageFromMe(id);

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      <View
        style={[
          styles.topBar,
          { borderBottomColor: colors.border },
          highlightThread && { backgroundColor: colors.tint + '0d' },
        ]}
      >
        <Pressable onPress={() => goBackOrReplace('/(tabs)/matches')} style={styles.backBtn} hitSlop={12}>
          <FontAwesome name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Pressable
          style={styles.profileHeaderTap}
          onPress={openTheirProfile}
          accessibilityRole="link"
          accessibilityLabel={`View ${profile.displayName}'s profile`}
        >
          {firstMedia?.uri && firstMedia.type === 'image' ? (
            <Image source={{ uri: firstMedia.uri }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatarPh, { backgroundColor: colors.tint + '22' }]}>
              <FontAwesome name="user" size={18} color={colors.tint} />
            </View>
          )}
          <View style={styles.headerTitles}>
            <ThemedText style={styles.headerName} numberOfLines={1}>
              {profile.displayName}
            </ThemedText>
            <ThemedText style={[styles.headerSub, { color: colors.secondary }]} numberOfLines={1}>
              Matched — plan a stunt session
            </ThemedText>
          </View>
        </Pressable>
        <Pressable
          onPress={() => setSafetyOpen(true)}
          style={styles.flagBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Report or block"
          accessibilityRole="button"
        >
          <FontAwesome name="flag" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ReportModal
        visible={safetyOpen}
        onClose={() => setSafetyOpen(false)}
        profileDisplayName={profile.displayName}
        profileId={profile.id}
        onReport={(pid, reason, details) => {
          report(pid, reason, details);
          setSafetyOpen(false);
        }}
        onBlock={(pid) => {
          block(pid);
          setSafetyOpen(false);
          goBackOrReplace('/(tabs)/matches');
        }}
        showBlockOption
      />

      {highlightThread ? (
        <View
          style={[
            styles.threadNudge,
            { backgroundColor: colors.tint + '1a', borderBottomColor: colors.border },
          ]}
        >
          <ThemedText style={[styles.threadNudgeText, { color: colors.tint }]}>
            Send your first message to plan a stunt together.
          </ThemedText>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={[styles.thread, { paddingBottom: SPACING.md }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <ThemedText style={[styles.emptyHint, { color: colors.secondary }]}>
              Send a message to coordinate practice, share your gym, or suggest skills to work on.
            </ThemedText>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === myId;
            return (
              <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: colors.tint }
                      : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                  ]}
                >
                  <ThemedText style={[styles.bubbleText, mine && { color: '#fff' }]}>{item.body}</ThemedText>
                  <ThemedText style={[styles.time, mine ? { color: 'rgba(255,255,255,0.75)' } : { color: colors.secondary }]}>
                    {formatTime(item.createdAt)}
                  </ThemedText>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.composer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Message…"
            placeholderTextColor={colors.secondary}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: draft.trim() ? colors.tint : colors.border }]}
            onPress={onSend}
            disabled={!draft.trim()}
          >
            <FontAwesome name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  backOnly: { position: 'absolute', top: SPACING.md, left: SPACING.md },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  backBtn: { padding: SPACING.sm },
  profileHeaderTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: SPACING.sm,
  },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarPh: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitles: { flex: 1, minWidth: 0 },
  flagBtn: { padding: SPACING.sm, marginRight: SPACING.xs },
  headerName: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  headerSub: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  threadNudge: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  threadNudgeText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, textAlign: 'center' },
  thread: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  emptyHint: { textAlign: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg, lineHeight: 22, fontSize: FONT_SIZE.sm },
  bubbleRow: { marginBottom: SPACING.sm, maxWidth: '88%' },
  bubbleRowMine: { alignSelf: 'flex-end' },
  bubbleRowTheirs: { alignSelf: 'flex-start' },
  bubble: { borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  bubbleText: { fontSize: FONT_SIZE.md, lineHeight: 22 },
  time: { fontSize: FONT_SIZE.xs, marginTop: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
