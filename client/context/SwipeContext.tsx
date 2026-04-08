'use client';

/**
 * SwipeContext centralizes Firestore realtime data and actions for **Discover** (profiles, group listings,
 * swipes, blocks) and **Matches** (match list + per-thread messages). The name reflects the swipe deck,
 * but the scope is the whole social feed + chat — see also exported `DiscoverAndMatchesProvider` alias.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  getDocsFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
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

function mapPublicProfileDoc(
  d: QueryDocumentSnapshot,
  currentUserId: string,
): StunterProfile | null {
  if (d.id === currentUserId) return null;
  const pdata = d.data();
  if (pdata && typeof pdata === 'object' && 'accountClosedAt' in pdata && pdata.accountClosedAt != null) {
    return null;
  }
  const p = profileFromFirestore(pdata, d.id, '');
  if (!p) return null;
  p.location = stripLocationToCityRegionOnly(p.location);
  return p;
}

function mapGroupListingDoc(d: QueryDocumentSnapshot): StuntGroup | null {
  const g = groupListingFromFirestore(d.data(), d.id);
  if (!g) return null;
  return { ...g, location: stripGroupLocationToCityRegionOnly(g.location) };
}

/** Page size for discover queries (profiles by `updatedAt`, groups by doc id). */
const DISCOVER_PAGE_SIZE = 50;
/** Recent messages loaded per match thread (newest first in query, sorted ascending in state). */
const MESSAGES_PAGE_SIZE = 100;

function matchesFromMatchQuerySnap(snap: QuerySnapshot): Match[] {
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
  return list;
}

const REFRESH_MATCH_LISTENER_TIMEOUT_MS = 8000;

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
  /**
   * Pull-to-refresh: read matches (and optionally one thread’s messages) from the **server**, then
   * re-attach listeners so live updates resume.
   */
  refreshMatchFeed: (options?: { threadMatchId?: string }) => Promise<void>;
  /** Fetch next page of discover candidates (profiles and/or group listings). */
  loadMoreDiscover: () => Promise<void>;
  /** True while either profiles or group listings may have more pages to load. */
  hasMoreDiscover: boolean;
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

/** Provides Discover feed state, matches, messages, and related Firestore actions. */
export function SwipeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  /** Auth UID — canonical; must match Firestore public profile doc ids. Can be null for a frame while (tabs) mounts before auth guard redirects (e.g. web). */
  const currentUserId = user?.id ?? user?.profile?.id ?? null;

  const matchRefreshWaitersRef = useRef<(() => void)[]>([]);
  const flushMatchRefreshWaiters = () => {
    const w = matchRefreshWaitersRef.current;
    matchRefreshWaitersRef.current = [];
    w.forEach((fn) => fn());
  };

  const [matchListenerEpoch, setMatchListenerEpoch] = useState(0);
  const [profileFirstPage, setProfileFirstPage] = useState<StunterProfile[]>([]);
  const [extraDiscoverProfiles, setExtraDiscoverProfiles] = useState<StunterProfile[]>([]);
  const [groupFirstPage, setGroupFirstPage] = useState<StuntGroup[]>([]);
  const [extraGroupListings, setExtraGroupListings] = useState<StuntGroup[]>([]);
  const lastProfilePageDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const lastGroupPageDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const [profilesDiscoverHasMore, setProfilesDiscoverHasMore] = useState(true);
  const [groupsDiscoverHasMore, setGroupsDiscoverHasMore] = useState(true);
  const prevMatchIdsRef = useRef<Set<string>>(new Set());
  const matchesHadFirstSnapshotRef = useRef(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [outSwipeTargets, setOutSwipeTargets] = useState<Map<string, 'like' | 'pass'>>(new Map());
  const [blockedTargetIds, setBlockedTargetIds] = useState<Set<string>>(new Set());
  const [unseenMatchCount, setUnseenMatchCount] = useState(0);
  const [discoverReady, setDiscoverReady] = useState(false);

  const remoteProfiles = useMemo(() => {
    const map = new Map<string, StunterProfile>();
    for (const p of profileFirstPage) map.set(p.id, p);
    for (const p of extraDiscoverProfiles) {
      if (!map.has(p.id)) map.set(p.id, p);
    }
    return [...map.values()];
  }, [profileFirstPage, extraDiscoverProfiles]);

  const groupListings = useMemo(() => {
    const map = new Map<string, StuntGroup>();
    for (const g of groupFirstPage) map.set(g.id, g);
    for (const g of extraGroupListings) {
      if (!map.has(g.id)) map.set(g.id, g);
    }
    return [...map.values()];
  }, [groupFirstPage, extraGroupListings]);

  const groupMap = useMemo(() => new Map(groupListings.map((g) => [g.id, g])), [groupListings]);
  const profileIdSet = useMemo(() => new Set(remoteProfiles.map((p) => p.id)), [remoteProfiles]);
  const groupIdSet = useMemo(() => new Set(groupListings.map((g) => g.id)), [groupListings]);

  const hasMoreDiscover = profilesDiscoverHasMore || groupsDiscoverHasMore;

  const clearUnseenMatches = useCallback(() => {
    setUnseenMatchCount(0);
  }, []);

  const refreshMatchFeed = useCallback(async (options?: { threadMatchId?: string }) => {
    if (!currentUserId) return;

    let db: ReturnType<typeof getFirestoreDb>;
    try {
      db = getFirestoreDb();
    } catch {
      return;
    }

    const matchesQuery = query(
      collection(db, 'matches'),
      where('userIds', 'array-contains', currentUserId),
      orderBy('matchedAt', 'desc'),
    );

    try {
      const serverSnap = await getDocsFromServer(matchesQuery);
      setMatches(matchesFromMatchQuerySnap(serverSnap));
    } catch {
      /* offline, permission, or transient error — listener may still update later */
    }

    const threadId = options?.threadMatchId?.trim();
    if (threadId) {
      try {
        const msgQ = query(
          collection(db, 'matches', threadId, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(MESSAGES_PAGE_SIZE),
        );
        const msgSnap = await getDocsFromServer(msgQ);
        const add: ChatMessage[] = [];
        msgSnap.forEach((d) => {
          const x = d.data();
          if (typeof x.senderId !== 'string' || typeof x.body !== 'string') return;
          add.push({
            id: d.id,
            matchId: threadId,
            senderId: x.senderId,
            body: x.body,
            createdAt: timestampToIso(x.createdAt),
          });
        });
        add.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setMessages((prev) => {
          const rest = prev.filter((x) => x.matchId !== threadId);
          return [...rest, ...add].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        });
      } catch {
        /* ignore */
      }
    }

    const listenerReady = new Promise<void>((resolve) => {
      matchRefreshWaitersRef.current.push(resolve);
      setMatchListenerEpoch((e) => e + 1);
    });
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, REFRESH_MATCH_LISTENER_TIMEOUT_MS);
    });
    await Promise.race([listenerReady, timeout]);
    flushMatchRefreshWaiters();
    await new Promise<void>((r) => setTimeout(r, 150));
  }, [currentUserId]);

  const loadMoreDiscover = useCallback(async () => {
    if (!currentUserId) return;
    let db: ReturnType<typeof getFirestoreDb>;
    try {
      db = getFirestoreDb();
    } catch {
      return;
    }
    const uid = currentUserId;

    await Promise.all([
      (async () => {
        if (!profilesDiscoverHasMore || !lastProfilePageDocRef.current) return;
        const snap = await getDocs(
          query(
            collection(db, 'publicProfiles'),
            orderBy('updatedAt', 'desc'),
            startAfter(lastProfilePageDocRef.current),
            limit(DISCOVER_PAGE_SIZE),
          ),
        );
        if (snap.empty) {
          setProfilesDiscoverHasMore(false);
          lastProfilePageDocRef.current = null;
          return;
        }
        const list: StunterProfile[] = [];
        snap.forEach((d) => {
          const p = mapPublicProfileDoc(d, uid);
          if (p) list.push(p);
        });
        setExtraDiscoverProfiles((prev) => [...prev, ...list]);
        lastProfilePageDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        if (snap.docs.length < DISCOVER_PAGE_SIZE) {
          setProfilesDiscoverHasMore(false);
        }
      })(),
      (async () => {
        if (!groupsDiscoverHasMore || !lastGroupPageDocRef.current) return;
        const snap = await getDocs(
          query(
            collection(db, 'groupListings'),
            orderBy(documentId()),
            startAfter(lastGroupPageDocRef.current),
            limit(DISCOVER_PAGE_SIZE),
          ),
        );
        if (snap.empty) {
          setGroupsDiscoverHasMore(false);
          lastGroupPageDocRef.current = null;
          return;
        }
        const list: StuntGroup[] = [];
        snap.forEach((d) => {
          const g = mapGroupListingDoc(d);
          if (g) list.push(g);
        });
        setExtraGroupListings((prev) => [...prev, ...list]);
        lastGroupPageDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        if (snap.docs.length < DISCOVER_PAGE_SIZE) {
          setGroupsDiscoverHasMore(false);
        }
      })(),
    ]);
  }, [currentUserId, profilesDiscoverHasMore, groupsDiscoverHasMore]);

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
      setProfileFirstPage([]);
      setExtraDiscoverProfiles([]);
      setGroupFirstPage([]);
      setExtraGroupListings([]);
      lastProfilePageDocRef.current = null;
      lastGroupPageDocRef.current = null;
      setProfilesDiscoverHasMore(true);
      setGroupsDiscoverHasMore(true);
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
      setProfileFirstPage([]);
      setExtraDiscoverProfiles([]);
      setGroupFirstPage([]);
      setExtraGroupListings([]);
      lastProfilePageDocRef.current = null;
      lastGroupPageDocRef.current = null;
      setProfilesDiscoverHasMore(true);
      setGroupsDiscoverHasMore(true);
      setMessages([]);
      setOutSwipeTargets(new Map());
      setBlockedTargetIds(new Set());
      setDiscoverReady(true);
      return;
    }

    const uid = currentUserId;
    setExtraDiscoverProfiles([]);
    setExtraGroupListings([]);
    lastProfilePageDocRef.current = null;
    lastGroupPageDocRef.current = null;
    setProfilesDiscoverHasMore(true);
    setGroupsDiscoverHasMore(true);

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

    const profilesQuery = query(
      collection(db, 'publicProfiles'),
      orderBy('updatedAt', 'desc'),
      limit(DISCOVER_PAGE_SIZE),
    );

    const unsubPublic = onSnapshot(
      profilesQuery,
      (snap) => {
        const list: StunterProfile[] = [];
        snap.forEach((d) => {
          const p = mapPublicProfileDoc(d as QueryDocumentSnapshot, uid);
          if (p) list.push(p);
        });
        setProfileFirstPage(list);
        if (snap.docs.length < DISCOVER_PAGE_SIZE) {
          setProfilesDiscoverHasMore(false);
          lastProfilePageDocRef.current = null;
        } else {
          setProfilesDiscoverHasMore(true);
          lastProfilePageDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        }
        finishIfNeeded('profiles');
      },
      () => finishIfNeeded('profiles'),
    );

    const groupListingsQuery = query(
      collection(db, 'groupListings'),
      orderBy(documentId()),
      limit(DISCOVER_PAGE_SIZE),
    );

    const unsubListings = onSnapshot(
      groupListingsQuery,
      (snap) => {
        const list: StuntGroup[] = [];
        snap.forEach((d) => {
          const g = mapGroupListingDoc(d as QueryDocumentSnapshot);
          if (g) list.push(g);
        });
        setGroupFirstPage(list);
        if (snap.docs.length < DISCOVER_PAGE_SIZE) {
          setGroupsDiscoverHasMore(false);
          lastGroupPageDocRef.current = null;
        } else {
          setGroupsDiscoverHasMore(true);
          lastGroupPageDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        }
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

    return () => {
      unsubPublic();
      unsubListings();
      unsubSwipes();
      unsubBlocks();
    };
  }, [currentUserId]);

  /** Matches list: separate effect so pull-to-refresh can re-subscribe without resetting Discover listeners. */
  useEffect(() => {
    if (!currentUserId) {
      setMatches([]);
      prevMatchIdsRef.current = new Set();
      matchesHadFirstSnapshotRef.current = false;
      flushMatchRefreshWaiters();
      return;
    }

    prevMatchIdsRef.current = new Set();
    matchesHadFirstSnapshotRef.current = false;

    let db: ReturnType<typeof getFirestoreDb>;
    try {
      db = getFirestoreDb();
    } catch {
      setMatches([]);
      flushMatchRefreshWaiters();
      return;
    }

    const unsubMatches = onSnapshot(
      query(
        collection(db, 'matches'),
        where('userIds', 'array-contains', currentUserId),
        orderBy('matchedAt', 'desc'),
      ),
      (snap) => {
        const list = matchesFromMatchQuerySnap(snap);
        const ids = new Set(list.map((m) => m.id));
        if (matchesHadFirstSnapshotRef.current) {
          for (const m of list) {
            if (!prevMatchIdsRef.current.has(m.id)) {
              setUnseenMatchCount((n) => n + 1);
            }
          }
        } else {
          matchesHadFirstSnapshotRef.current = true;
        }
        prevMatchIdsRef.current = ids;
        setMatches(list);
        if (matchRefreshWaitersRef.current.length > 0) {
          flushMatchRefreshWaiters();
        }
      },
      () => {
        flushMatchRefreshWaiters();
      },
    );

    return () => {
      unsubMatches();
    };
  }, [currentUserId, matchListenerEpoch]);

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
        orderBy('createdAt', 'desc'),
        limit(MESSAGES_PAGE_SIZE),
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
            add.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
            return [...rest, ...add].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          });
        }),
      );
    }

    return () => unsubs.forEach((u) => u());
  }, [currentUserId, matchIdsKey, matchListenerEpoch]);

  const resolveSwipeTargetType = useCallback(
    (entityId: string): 'profile' | 'group' | null => {
      if (entityId === currentUserId) return null;
      if (profileIdSet.has(entityId)) return 'profile';
      if (groupIdSet.has(entityId)) return 'group';
      return null;
    },
    [profileIdSet, groupIdSet, currentUserId],
  );

  const like = useCallback(
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
        direction: 'like',
        createdAt: serverTimestamp(),
      }).catch(() => undefined);
    },
    [currentUserId, resolveSwipeTargetType],
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
      refreshMatchFeed,
      loadMoreDiscover,
      hasMoreDiscover,
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
      refreshMatchFeed,
      loadMoreDiscover,
      hasMoreDiscover,
    ],
  );

  return <SwipeContext.Provider value={value}>{children}</SwipeContext.Provider>;
}

export function useSwipe() {
  const ctx = useContext(SwipeContext);
  if (!ctx) throw new Error('useSwipe must be used within SwipeProvider');
  return ctx;
}

/** Same as `SwipeProvider` — clearer name for onboarding / docs. */
export const DiscoverAndMatchesProvider = SwipeProvider;
