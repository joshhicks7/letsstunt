import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Image, ListRenderItem, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { POSITION_LABELS } from '@/constants/positions';
import { SPACING, FONT_SIZE, FONT_WEIGHT } from '@/constants/Theme';
import type { Match, PositionType } from '@/types';
import { useSwipe } from '@/context/SwipeContext';
import { useColorScheme } from '@/components/useColorScheme';

export default function MatchesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { matches, getMatchProfile } = useSwipe();

  const openChat = (match: Match) => {
    router.push({ pathname: '/matches/[matchId]', params: { matchId: match.id } });
  };

  const renderItem: ListRenderItem<Match> = ({ item }) => {
    const profile = getMatchProfile(item);
    if (!profile) return null;
    const firstMedia = profile.media[0];
    return (
      <Pressable
        style={[styles.row, { borderBottomColor: colors.border }]}
        onPress={() => openChat(item)}
      >
        {firstMedia?.uri && firstMedia.type === 'image' ? (
          <Image source={{ uri: firstMedia.uri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint + '22' }]}>
            <FontAwesome name="user" size={24} color={colors.tint} />
          </View>
        )}
        <View style={styles.info}>
          <ThemedText style={styles.name}>{profile.displayName}</ThemedText>
          <ThemedText style={[styles.meta, { color: colors.secondary }]} numberOfLines={1}>
            {profile.positions.length ? profile.positions.map((p: PositionType) => POSITION_LABELS[p]).join(' · ') : ''}
            {profile.location?.city ? ` · ${profile.location.city}` : ''}
          </ThemedText>
        </View>
        <FontAwesome name="comment" size={18} color={colors.tint} style={styles.chatHint} />
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Matches</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.secondary }]}>
          Tap a match to open the conversation
        </ThemedText>
      </View>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, matches.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <ThemedText style={[styles.empty, { color: colors.secondary }]}>
            No matches yet. Swipe right on Discover to find stunt partners!
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 200 },
  header: { paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  subtitle: { fontSize: FONT_SIZE.sm },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
  listEmpty: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: SPACING.md, minWidth: 0 },
  name: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  meta: { fontSize: FONT_SIZE.sm },
  chatHint: { marginLeft: SPACING.sm, opacity: 0.9 },
  empty: { textAlign: 'center', paddingVertical: SPACING.xl },
});
