import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';

import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useStuntGroups } from '@/context/StuntGroupContext';
import { useSquadByJoinSlug } from '@/hooks/useSquadByJoinSlug';
import { hrefWithReturnTo } from '@/lib/authRedirect';

const JOIN_TIMEOUT_MS = 25000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * Deep link: /group/{slug}/join
 * Stays on this screen for guests / incomplete onboarding; sign-in or finish setup from here.
 */
export default function GroupJoinDeepLinkScreen() {
  const { slug: slugParam } = useLocalSearchParams<{ slug: string }>();
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { user, onboardingComplete } = useAuth();
  const { getGroupBySlug, joinGroupBySlug } = useStuntGroups();
  const squadBySlug = useSquadByJoinSlug(slug || undefined);

  const uid = user?.id ?? user?.profile?.id ?? null;
  const group = slug ? (getGroupBySlug(slug) ?? squadBySlug ?? undefined) : undefined;
  const ready = Boolean(uid && onboardingComplete);
  const needsSignIn = !user;
  const needsOnboarding = Boolean(user && !onboardingComplete);

  const [joinWorking, setJoinWorking] = useState(false);
  const [joinFailed, setJoinFailed] = useState(false);
  const [failureHint, setFailureHint] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  /** Success UI (refs alone don’t re-render; avoids “Adding you…” stuck after join). */
  const [joinDoneName, setJoinDoneName] = useState<string | null>(null);
  const successKeyRef = useRef<string | null>(null);

  useEffect(() => {
    successKeyRef.current = null;
    setJoinFailed(false);
    setFailureHint(null);
    setJoinDoneName(null);
  }, [slug, uid]);

  useEffect(() => {
    if (!slug || !ready || !uid) {
      setJoinWorking(false);
      return;
    }
    const successKey = `${slug}:${uid}`;
    if (successKeyRef.current === successKey) return;

    let active = true;

    const run = async () => {
      setJoinWorking(true);
      setJoinFailed(false);
      setFailureHint(null);
      try {
        const r = await withTimeout(joinGroupBySlug(slug), JOIN_TIMEOUT_MS);
        if (!active) return;

        if (r.ok) {
          successKeyRef.current = successKey;
          setJoinDoneName(r.groupName);
          Alert.alert('You’re in!', `You joined “${r.groupName}”.`, [
            {
              text: 'View group',
              onPress: () => router.replace('/(tabs)/discover/groups'),
            },
            { text: 'Discover', onPress: () => router.replace('/(tabs)/discover') },
          ]);
          return;
        }

        setJoinFailed(true);
        if (r.reason === 'not_found') {
          setFailureHint('This group doesn’t exist or the link is wrong.');
        } else if (r.reason === 'full') {
          setFailureHint('This group already has three people.');
        } else if (r.reason === 'already_in_group') {
          setFailureHint('You’re already in another stunt group.');
        } else if (r.reason === 'not_signed_in') {
          setFailureHint('Sign in again and retry.');
        } else {
          setFailureHint('Check your connection and try again.');
        }
      } catch (e) {
        if (!active) return;
        setJoinFailed(true);
        const timedOut = e instanceof Error && e.message === 'timeout';
        setFailureHint(
          timedOut ? `No response after ${JOIN_TIMEOUT_MS / 1000}s. Check your connection.` : 'Something went wrong.',
        );
      } finally {
        if (active) setJoinWorking(false);
      }
    };

    void run();
    return () => {
      active = false;
      setJoinWorking(false);
    };
  }, [slug, ready, uid, retryNonce, joinGroupBySlug]);

  const returnTo = slug ? `/group/${slug}/join` : '/group/join';
  const goSignIn = () => router.push(hrefWithReturnTo('/(auth)/login', returnTo));
  const goSignUp = () => router.push(hrefWithReturnTo('/(auth)/sign-up', returnTo));
  const goOnboarding = () => router.push(hrefWithReturnTo('/(onboarding)', returnTo));

  const goDiscover = useCallback(() => {
    router.replace('/(tabs)/discover');
  }, []);

  const retryJoin = useCallback(() => {
    successKeyRef.current = null;
    setJoinDoneName(null);
    setRetryNonce((n) => n + 1);
  }, []);

  const bodyCopy = !slug
    ? 'This invite link is missing a group code.'
    : needsSignIn
      ? 'Sign in or create an account to join this group.'
      : needsOnboarding
        ? 'Finish your profile setup, then we’ll add you to the group.'
        : joinDoneName
          ? `You’re in “${joinDoneName}”. Use the buttons below to open your stunt group or Discover.`
          : joinFailed && failureHint
            ? failureHint
            : group
              ? 'Adding you to the group…'
              : 'Checking this invite…';

  const showSpinner = Boolean(
    slug && ready && !needsSignIn && !needsOnboarding && joinWorking && !joinDoneName,
  );
  const showJoinActions = Boolean(slug && ready && !needsSignIn && !needsOnboarding && joinFailed && !joinWorking);
  const showSuccessActions = Boolean(slug && ready && !needsSignIn && !needsOnboarding && joinDoneName && !joinWorking);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <FontAwesome name="object-group" size={40} color={colors.tint} style={{ alignSelf: 'center' }} />
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {joinDoneName ? 'You’re in!' : group ? `Join “${group.name}”` : 'Join stunt group'}
        </ThemedText>
        <ThemedText style={[styles.body, { color: colors.secondary }]}>{bodyCopy}</ThemedText>
        {needsSignIn && slug ? (
          <View style={styles.actions}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
              onPress={goSignIn}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <ThemedText style={styles.primaryBtnText}>Sign in</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={goSignUp}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              <ThemedText style={[styles.secondaryBtnText, { color: colors.text }]}>Create account</ThemedText>
            </Pressable>
            <Pressable onPress={goDiscover} style={styles.textLinkWrap} accessibilityRole="button" accessibilityLabel="Cancel">
              <ThemedText style={[styles.textLink, { color: colors.secondary }]}>Cancel</ThemedText>
            </Pressable>
          </View>
        ) : null}
        {needsOnboarding && slug ? (
          <View style={styles.actions}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
              onPress={goOnboarding}
              accessibilityRole="button"
              accessibilityLabel="Continue profile setup"
            >
              <ThemedText style={styles.primaryBtnText}>Continue setup</ThemedText>
            </Pressable>
            <Pressable onPress={goDiscover} style={styles.textLinkWrap} accessibilityRole="button" accessibilityLabel="Cancel">
              <ThemedText style={[styles.textLink, { color: colors.secondary }]}>Cancel</ThemedText>
            </Pressable>
          </View>
        ) : null}
        {showJoinActions ? (
          <View style={styles.actions}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
              onPress={retryJoin}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <ThemedText style={styles.primaryBtnText}>Try again</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={goDiscover}
              accessibilityRole="button"
              accessibilityLabel="Go to Discover"
            >
              <ThemedText style={[styles.secondaryBtnText, { color: colors.text }]}>Go to Discover</ThemedText>
            </Pressable>
          </View>
        ) : null}
        {showSuccessActions ? (
          <View style={styles.actions}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
              onPress={() => router.replace('/(tabs)/discover/groups')}
              accessibilityRole="button"
              accessibilityLabel="View stunt group"
            >
              <ThemedText style={styles.primaryBtnText}>View group</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => router.replace('/(tabs)/discover')}
              accessibilityRole="button"
              accessibilityLabel="Go to Discover"
            >
              <ThemedText style={[styles.secondaryBtnText, { color: colors.text }]}>Discover</ThemedText>
            </Pressable>
          </View>
        ) : null}
        {showSpinner ? (
          <View style={styles.wait}>
            <ActivityIndicator color={colors.tint} />
            <ThemedText style={[styles.waitHint, { color: colors.secondary }]}>
              Usually a few seconds — tap Cancel if you need to leave.
            </ThemedText>
            <Pressable onPress={goDiscover} style={styles.textLinkWrap} accessibilityRole="button" accessibilityLabel="Cancel">
              <ThemedText style={[styles.textLink, { color: colors.tint }]}>Cancel</ThemedText>
            </Pressable>
          </View>
        ) : null}
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
  actions: { marginTop: SPACING.lg, gap: SPACING.sm },
  primaryBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  secondaryBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  textLinkWrap: { alignItems: 'center', paddingVertical: SPACING.sm },
  textLink: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  wait: { marginTop: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  waitHint: { fontSize: FONT_SIZE.xs, textAlign: 'center', paddingHorizontal: SPACING.md },
});
