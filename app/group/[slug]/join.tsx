import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';

import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useStuntGroups } from '@/context/StuntGroupContext';

/**
 * Deep link: https://letsstunt.com/group/{slug}/join
 * Guests and users who haven’t finished onboarding are sent to welcome / onboarding by `AuthRouteGuard`
 * with `returnTo` set to this path; they only land here once signed in and complete.
 */
export default function GroupJoinDeepLinkScreen() {
  const { slug: slugParam } = useLocalSearchParams<{ slug: string }>();
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { user, onboardingComplete } = useAuth();
  const { getGroupBySlug, joinGroupBySlug } = useStuntGroups();
  /** One join attempt per slug + user (guard re-runs after auth; slug change resets). */
  const attemptKeyRef = useRef<string | null>(null);

  const group = slug ? getGroupBySlug(slug) : undefined;
  const ready = Boolean(user?.profile?.id && onboardingComplete);
  const waitingOnGuard = !user || !onboardingComplete;

  useEffect(() => {
    attemptKeyRef.current = null;
  }, [slug, user?.profile?.id]);

  useEffect(() => {
    if (!slug || !ready || !user?.profile?.id) return;
    const key = `${slug}:${user.profile.id}`;
    if (attemptKeyRef.current === key) return;
    attemptKeyRef.current = key;

    const r = joinGroupBySlug(slug);
    if (r.ok) {
      const name = getGroupBySlug(slug)?.name ?? 'the group';
      Alert.alert('You’re in!', `You joined “${name}”.`, [
        {
          text: 'View group',
          onPress: () => router.replace('/discover/groups'),
        },
        { text: 'Discover', onPress: () => router.replace('/(tabs)/discover') },
      ]);
      return;
    }
    if (r.reason === 'not_found') {
      Alert.alert('Invalid link', 'This group doesn’t exist or the link is wrong.');
    } else if (r.reason === 'full') {
      Alert.alert('Group full', 'This stunt group already has three people.');
    } else if (r.reason === 'already_in_group') {
      Alert.alert(
        'Already in a group',
        'You can only be in one stunt group at a time. Open Stunt group from Discover to see yours.',
      );
    }
  }, [slug, ready, user?.profile?.id, joinGroupBySlug, getGroupBySlug]);

  const bodyCopy = !slug
    ? 'This invite link is missing a group code.'
    : waitingOnGuard
      ? !user
        ? 'Taking you through sign-in…'
        : 'Almost there — finish setup…'
      : group
        ? 'Adding you to the group…'
        : 'Checking this invite…';

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <FontAwesome name="object-group" size={40} color={colors.tint} style={{ alignSelf: 'center' }} />
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {group ? `Join “${group.name}”` : 'Join stunt group'}
        </ThemedText>
        <ThemedText style={[styles.body, { color: colors.secondary }]}>{bodyCopy}</ThemedText>
        <View style={styles.wait}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.xl,
  },
  title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, textAlign: 'center', marginTop: SPACING.md },
  body: { fontSize: FONT_SIZE.sm, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
  wait: { marginTop: SPACING.lg, alignItems: 'center' },
});
