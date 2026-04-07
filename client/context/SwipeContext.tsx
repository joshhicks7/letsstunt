'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import type { ChatMessage, DiscoverEntry, Match, StunterProfile, StuntGroup } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { stuntGroupToPreviewProfile } from '@/lib/groupPreview';
import { getFirestoreDb } from '@/lib/firebaseApp';
import { profileFromFirestore } from '@/lib/firestoreProfile';
import { groupListingFromFirestore } from '@/lib/firestoreGroupListing';
import { timestampToIso } from '@/lib/firestoreTimestamps';
import { stripGroupLocationToCityRegionOnly, stripLocationToCityRegionOnly } from '@/lib/publicLocation';

function swipeDocId(fromUserId: string, targetType: 'profile' | 'group', targetId: string): string {
  return `${fromUserId}_${targetType}_${targetId}`;
}

function blockDocId(blockerId: string, blockedId: string): string {
  return `${blockerId}_${blockedId}`;
}

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

interface SwipeContextValue {
  discoverStack: DiscoverEntry[];
  likedIds: Set<string>;
  passedIds: Set<string>;
  blockedIds: Set<string>;
  matches: Match[];
  unseenMatchCount: number;
  clearUnseenMatches: () => void;
  getMatchProfile: (match: Match) => StunterProfile | undefined;
  like: (entityId: string) => void;
  pass: (entityId: string) => void;
  block: (entityId: string) => void;
  report: (entityId: string, reason: string, details?: string) => void;
  allProfiles: StunterProfile[];
  getGroupListingById: (id: string) => StuntGroup | undefined;
  getMessages: (matchId: string) => ChatMessage[];
  sendMessage: (matchId: string, body: string) => void;
  getMatchById: (matchId: string) => Match | undefined;
  /** True once initial discover feed listeners have fired (empty data still counts as ready). */
  discoverReady: boolean;
  /** True until the current user sends at least one message in that match (highlight row + nudge to say hi). */
  matchNeedsFirstMessageFromMe: (matchId: string) => boolean;
}

const SwipeContext = createContext<SwipeContextValue | null>(null);

function resolveAsProfile(
  entityId: string,
  allProfiles: StunterProfile[],
  groupMap: Map<string, StuntGroup>,
): StunterProfile | undefined {
  const p = allProfiles.find((x) => x.id === entityId);
  if (p) return p;
  const g = groupMap.get(entityId);
  if (g) return stuntGroupToPreviewProfile(g);
  return undefined;
}

export function SwipeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  /** Auth UID — canonical; must match Firestore public profile doc ids. Can be null for a frame while (tabs) mounts before auth guard redirects (e.g. web). */
  const currentUserId = user?.id ?? user?.profile?.id ?? null;

  const [remoteProfiles, setRemoteProfiles] = useState<StunterProfile[]>([]);
  const [groupListings, setGroupListings] = useState<StuntGroup[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [outSwipeTargets, setOutSwipeTargets] = useState<Map<string, 'like' | 'pass'>>(new Map());
  const [blockedTargetIds, setBlockedTargetIds] = useState<Set<string>>(new Set());
  const [unseenMatchCount, setUnseenMatchCount] = useState(0);
  const [discoverReady, setDiscoverReady] = useState(false);

  const groupMap = useMemo(() => new Map(groupListings.map((g) => [g.id, g])), [groupListings]);
  const profileIdSet = useMemo(() => new Set(remoteProfiles.map((p) => p.id)), [remoteProfiles]);
  const groupIdSet = useMemo(() => new Set(groupListings.map((g) => g.id)), [groupListings]);

  const clearUnseenMatches = useCallback(() => {
    setUnseenMatchCount(0);
  }, []);

  const allProfiles = useMemo(() => {
    const list = [...remoteProfiles];
    if (currentUserId && user?.profile) {
      const me = list.find((p) => p.id === currentUserId);
      if (!me) list.push(user.profile);
    }
    return list;
  }, [currentUserId, remoteProfiles, user?.profile]);

  const discoverProfiles = useMemo(() => {
    if (!currentUserId) return [];
    return allProfiles.filter(
      (p) =>
        p.id !== currentUserId &&
        !outSwipeTargets.has(p.id) &&
        !blockedTargetIds.has(p.id),
    );
  }, [allProfiles, currentUserId, outSwipeTargets, blockedTargetIds]);

  const discoverGroups = useMemo(() => {
    if (!currentUserId) return [];
    return groupListings.filter(
      (g) =>
        g.creatorId !== currentUserId &&
        !outSwipeTargets.has(g.id) &&
        !blockedTargetIds.has(g.id),
    );
  }, [groupListings, currentUserId, outSwipeTargets, blockedTargetIds]);

  const discoverStack = useMemo<DiscoverEntry[]>(() => {
    const profileEntries: DiscoverEntry[] = discoverProfiles.map((data) => ({ kind: 'profile', data }));
    const groupEntries: DiscoverEntry[] = discoverGroups.map((data) => ({ kind: 'group', data }));
    return [...profileEntries, ...groupEntries];
  }, [discoverProfiles, discoverGroups]);

  const matchesFiltered = useMemo(
    () =>
      matches.filter(
        (m) =>
          !blockedTargetIds.has(m.profileIds[0]) && !blockedTargetIds.has(m.profileIds[1]),
      ),
    [matches, blockedTargetIds],
  );

  const getMatchProfile = useCallback(
    (match: Match): StunterProfile | undefined => {
      if (!currentUserId) return undefined;
      const otherId = match.profileIds[0] === currentUserId ? match.profileIds[1] : match.profileIds[0];
      if (blockedTargetIds.has(otherId)) return undefined;
      return resolveAsProfile(otherId, allProfiles, groupMap);
    },
    [allProfiles, currentUserId, blockedTargetIds, groupMap],
  );

  const getMatchById = useCallback(
    (matchId: string) => matchesFiltered.find((m) => m.id === matchId),
    [matchesFiltered],
  );

  const getGroupListingById = useCallback(
    (id: string) => groupMap.get(id),
    [groupMap],
  );

  const getMessages = useCallback(
    (matchId: string) =>
      [...messages.filter((m) => m.matchId === matchId)].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      ),
    [messages],
  );

  /** Real-time subscriptions for discover, swipes, matches, blocks */
  useEffect(() => {
    if (!currentUserId) {
      setRemoteProfiles([]);
      setGroupListings([]);
      setMatches([]);
      setMessages([]);
      setOutSwipeTargets(new Map());
      setBlockedTargetIds(new Set());
      setDiscoverReady(true);
      return;
    }

    let db: ReturnType<typeof getFirestoreDb>;
    try {
      db = getFirestoreDb();
    } catch {
      setRemoteProfiles([]);
      setGroupListings([]);
      setMatches([]);
      setMessages([]);
      setOutSwipeTargets(new Map());
      setBlockedTargetIds(new Set());
      setDiscoverReady(true);
      return;
    }

    setDiscoverReady(false);
    let profilesDone = false;
    let listingsDone = false;
    const markDiscoverReady = () => {
      if (profilesDone && listingsDone) setDiscoverReady(true);
    };

    const finishIfNeeded = (which: 'profiles' | 'listings') => {
      if (which === 'profiles' && !profilesDone) {
        profilesDone = true;
        markDiscoverReady();
      }
      if (which === 'listings' && !listingsDone) {
        listingsDone = true;
        markDiscoverReady();
      }
    };

    const unsubPublic = onSnapshot(
      collection(db, 'publicProfiles'),
      (snap) => {
        const list: StunterProfile[] = [];
        snap.forEach((d) => {
          if (d.id === currentUserId) return;
          const p = profileFromFirestore(d.data(), d.id, '');
          if (p) {
            p.location = stripLocationToCityRegionOnly(p.location);
            list.push(p);
          }
        });
        setRemoteProfiles(list);
        finishIfNeeded('profiles');
      },
      () => finishIfNeeded('profiles'),
    );

    const unsubListings = onSnapshot(
      collection(db, 'groupListings'),
      (snap) => {
        const list: StuntGroup[] = [];
        snap.forEach((d) => {
          const g = groupListingFromFirestore(d.data(), d.id);
          if (g) list.push({ ...g, location: stripGroupLocationToCityRegionOnly(g.location) });
        });
        setGroupListings(list);
        finishIfNeeded('listings');
      },
      () => finishIfNeeded('listings'),
    );

    const unsubSwipes = onSnapshot(
      query(collection(db, 'swipes'), where('fromUserId', '==', currentUserId)),
      (snap) => {
        const next = new Map<string, 'like' | 'pass'>();
        snap.forEach((d) => {
          const x = d.data();
          const tid = typeof x.targetId === 'string' ? x.targetId : '';
          const dir = x.direction === 'like' || x.direction === 'pass' ? x.direction : null;
          if (tid && dir) next.set(tid, dir);
        });
        setOutSwipeTargets(next);
      },
    );

    const unsubBlocks = onSnapshot(
      query(collection(db, 'blocks'), where('blockerId', '==', currentUserId)),
      (snap) => {
        const next = new Set<string>();
        snap.forEach((d) => {
          const x = d.data();
          if (typeof x.blockedId === 'string') next.add(x.blockedId);
        });
        setBlockedTargetIds(next);
      },
    );

    const unsubMatches = onSnapshot(
      query(
        collection(db, 'matches'),
        where('userIds', 'array-contains', currentUserId),
        orderBy('matchedAt', 'desc'),
      ),
      (snap) => {
        const list: Match[] = [];
        snap.forEach((d) => {
          const x = d.data();
          const u = x.userIds;
          if (!Array.isArray(u) || u.length !== 2 || typeof u[0] !== 'string' || typeof u[1] !== 'string') {
            return;
          }
          list.push({
            id: d.id,
            profileIds: [u[0], u[1]],
            matchedAt: timestampToIso(x.matchedAt),
          });
        });
        setMatches(list);
      },
    );

    return () => {
      unsubPublic();
      unsubListings();
      unsubSwipes();
      unsubBlocks();
      unsubMatches();
    };
  }, [currentUserId]);

  const matchIdsKey = matchesFiltered.map((m) => m.id).sort().join(',');

  useEffect(() => {
    if (!currentUserId || matchIdsKey.length === 0) {
      setMessages([]);
      return;
    }

    let db: ReturnType<typeof getFirestoreDb>;
    try {
      db = getFirestoreDb();
    } catch {
      setMessages([]);
      return;
    }

    const matchIds = matchIdsKey.split(',');
    const unsubs: (() => void)[] = [];

    for (const matchId of matchIds) {
      const q = query(
        collection(db, 'matches', matchId, 'messages'),
        orderBy('createdAt', 'asc'),
      );
      unsubs.push(
        onSnapshot(q, (snap) => {
          setMessages((prev) => {
            const rest = prev.filter((x) => x.matchId !== matchId);
            const add: ChatMessage[] = [];
            snap.forEach((d) => {
              const x = d.data();
              if (typeof x.senderId !== 'string' || typeof x.body !== 'string') return;
              add.push({
                id: d.id,
                matchId,
                senderId: x.senderId,
                body: x.body,
                createdAt: timestampToIso(x.createdAt),
              });
            });
            return [...rest, ...add].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          });
        }),
      );
    }

    return () => unsubs.forEach((u) => u());
  }, [currentUserId, matchIdsKey]);

  const resolveSwipeTargetType = useCallback(
    (entityId: string): 'profile' | 'group' | null => {
      if (entityId === currentUserId) return null;
      if (profileIdSet.has(entityId)) return 'profile';
      if (groupIdSet.has(entityId)) return 'group';
      return null;
    },
    [profileIdSet, groupIdSet, currentUserId],
  );

  const ensureMatchAbsent = useCallback(
    async (db: ReturnType<typeof getFirestoreDb>, a: string, b: string) => {
      const q = query(collection(db, 'matches'), where('userIds', 'array-contains', a));
      const snap = await getDocs(q);
      let exists = false;
      snap.forEach((d) => {
        const u = d.data().userIds as string[] | undefined;
        if (u && u.includes(b)) exists = true;
      });
      return !exists;
    },
    [],
  );

  const like = useCallback(
    (entityId: string) => {
      if (!currentUserId || entityId === currentUserId) return;
      const targetType = resolveSwipeTargetType(entityId);
      if (!targetType) return;

      const uid = currentUserId;
      const db = getFirestoreDb();
      const swipeRef = doc(db, 'swipes', swipeDocId(uid, targetType, entityId));

      void (async () => {
        try {
          await setDoc(swipeRef, {
            fromUserId: uid,
            targetType,
            targetId: entityId,
            direction: 'like',
            createdAt: serverTimestamp(),
          });

          if (targetType === 'group') {
            const [x, y] = sortedPair(uid, entityId);
            const ok = await ensureMatchAbsent(db, uid, entityId);
            if (ok) {
              await addDoc(collection(db, 'matches'), {
                userIds: [x, y],
                kind: 'group',
                matchedAt: serverTimestamp(),
              });
              setUnseenMatchCount((n) => n + 1);
            }
            return;
          }

          const mutualQ = query(
            collection(db, 'swipes'),
            where('fromUserId', '==', entityId),
            where('targetId', '==', uid),
            where('targetType', '==', 'profile'),
            where('direction', '==', 'like'),
          );
          const mutualSnap = await getDocs(mutualQ);
          if (!mutualSnap.empty) {
            const [x, y] = sortedPair(uid, entityId);
            const ok = await ensureMatchAbsent(db, uid, entityId);
            if (ok) {
              await addDoc(collection(db, 'matches'), {
                userIds: [x, y],
                kind: 'profile',
                matchedAt: serverTimestamp(),
              });
              setUnseenMatchCount((n) => n + 1);
            }
          }
        } catch {
          // ignore; rules or network
        }
      })();
    },
    [currentUserId, resolveSwipeTargetType, ensureMatchAbsent],
  );

  const pass = useCallback(
    (entityId: string) => {
      if (!currentUserId || entityId === currentUserId) return;
      const targetType = resolveSwipeTargetType(entityId);
      if (!targetType) return;
      const uid = currentUserId;
      const db = getFirestoreDb();
      const swipeRef = doc(db, 'swipes', swipeDocId(uid, targetType, entityId));
      void setDoc(swipeRef, {
        fromUserId: uid,
        targetType,
        targetId: entityId,
        direction: 'pass',
        createdAt: serverTimestamp(),
      }).catch(() => undefined);
    },
    [currentUserId, resolveSwipeTargetType],
  );

  const block = useCallback(
    (entityId: string) => {
      if (!currentUserId || entityId === currentUserId) return;
      const uid = currentUserId;
      const db = getFirestoreDb();
      void (async () => {
        try {
          await setDoc(doc(db, 'blocks', blockDocId(uid, entityId)), {
            blockerId: uid,
            blockedId: entityId,
            createdAt: serverTimestamp(),
          });
          const mq = query(collection(db, 'matches'), where('userIds', 'array-contains', uid));
          const ms = await getDocs(mq);
          const deletes: Promise<unknown>[] = [];
          ms.forEach((d) => {
            const u = d.data().userIds as string[] | undefined;
            if (u && u.includes(entityId)) {
              deletes.push(deleteDoc(doc(db, 'matches', d.id)));
            }
          });
          await Promise.all(deletes);
        } catch {
          // ignore
        }
      })();
    },
    [currentUserId],
  );

  const report = useCallback(
    (entityId: string, reason: string, details?: string) => {
      if (!currentUserId || entityId === currentUserId) return;
      const uid = currentUserId;
      const db = getFirestoreDb();
      void addDoc(collection(db, 'reports'), {
        reporterId: uid,
        targetId: entityId,
        reason: reason.slice(0, 200),
        details: details?.slice(0, 2000) ?? '',
        createdAt: serverTimestamp(),
      }).catch(() => undefined);
    },
    [currentUserId],
  );

  const sendMessage = useCallback(
    (matchId: string, body: string) => {
      if (!currentUserId) return;
      const trimmed = body.trim();
      if (!trimmed) return;
      const match = matchesFiltered.find((m) => m.id === matchId);
      if (!match) return;
      const db = getFirestoreDb();
      void addDoc(collection(db, 'matches', matchId, 'messages'), {
        senderId: currentUserId,
        body: trimmed.slice(0, 5000),
        createdAt: serverTimestamp(),
      }).catch(() => undefined);
    },
    [currentUserId, matchesFiltered],
  );

  const matchNeedsFirstMessageFromMe = useCallback(
    (matchId: string) => {
      if (!currentUserId) return false;
      return !messages.some((m) => m.matchId === matchId && m.senderId === currentUserId);
    },
    [messages, currentUserId],
  );

  const value = useMemo<SwipeContextValue>(
    () => ({
      discoverStack,
      likedIds: new Set([...outSwipeTargets.entries()].filter(([, d]) => d === 'like').map(([id]) => id)),
      passedIds: new Set([...outSwipeTargets.entries()].filter(([, d]) => d === 'pass').map(([id]) => id)),
      blockedIds: blockedTargetIds,
      matches: matchesFiltered,
      unseenMatchCount,
      clearUnseenMatches,
      getMatchProfile,
      like,
      pass,
      block,
      report,
      allProfiles,
      getGroupListingById,
      getMessages,
      sendMessage,
      getMatchById,
      discoverReady,
      matchNeedsFirstMessageFromMe,
    }),
    [
      discoverStack,
      outSwipeTargets,
      blockedTargetIds,
      matchesFiltered,
      unseenMatchCount,
      clearUnseenMatches,
      getMatchProfile,
      like,
      pass,
      block,
      report,
      allProfiles,
      getGroupListingById,
      getMessages,
      sendMessage,
      getMatchById,
      discoverReady,
      matchNeedsFirstMessageFromMe,
    ],
  );

  return <SwipeContext.Provider value={value}>{children}</SwipeContext.Provider>;
}

export function useSwipe() {
  const ctx = useContext(SwipeContext);
  if (!ctx) throw new Error('useSwipe must be used within SwipeProvider');
  return ctx;
}
