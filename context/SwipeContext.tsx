'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ChatMessage, DiscoverEntry, Match, StunterProfile } from '@/types';
import { MOCK_GROUPS, MOCK_MATCHES, MOCK_PROFILES, id, now } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { stuntGroupToPreviewProfile } from '@/lib/groupPreview';

interface SwipeContextValue {
  /** Profiles and groups in the swipe deck */
  discoverStack: DiscoverEntry[];
  likedIds: Set<string>;
  passedIds: Set<string>;
  blockedIds: Set<string>;
  matches: Match[];
  getMatchProfile: (match: Match) => StunterProfile | undefined;
  like: (entityId: string) => void;
  pass: (entityId: string) => void;
  block: (entityId: string) => void;
  report: (entityId: string, reason: string, details?: string) => void;
  allProfiles: StunterProfile[];
  getMessages: (matchId: string) => ChatMessage[];
  sendMessage: (matchId: string, body: string) => void;
  getMatchById: (matchId: string) => Match | undefined;
}

const SwipeContext = createContext<SwipeContextValue | null>(null);

function resolveAsProfile(entityId: string, allProfiles: StunterProfile[]): StunterProfile | undefined {
  const p = allProfiles.find((x) => x.id === entityId);
  if (p) return p;
  const g = MOCK_GROUPS.find((x) => x.id === entityId);
  if (g) return stuntGroupToPreviewProfile(g);
  return undefined;
}

export function SwipeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const currentUserId = user?.profile?.id ?? null;

  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const [passedIds, setPassedIds] = useState<Set<string>>(() => new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(() => new Set());
  const [matches, setMatches] = useState<Match[]>(() => [...MOCK_MATCHES]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const allProfiles = useMemo(() => {
    const list = [...MOCK_PROFILES];
    if (currentUserId && user?.profile) {
      const me = list.find((p) => p.id === currentUserId);
      if (!me) list.push(user.profile);
    }
    return list;
  }, [currentUserId, user?.profile]);

  const discoverProfiles = useMemo(
    () =>
      allProfiles.filter(
        (p) =>
          p.id !== currentUserId &&
          !passedIds.has(p.id) &&
          !likedIds.has(p.id) &&
          !blockedIds.has(p.id)
      ),
    [allProfiles, currentUserId, likedIds, passedIds, blockedIds]
  );

  const discoverGroups = useMemo(
    () =>
      MOCK_GROUPS.filter(
        (g) => !passedIds.has(g.id) && !likedIds.has(g.id) && !blockedIds.has(g.id)
      ),
    [likedIds, passedIds, blockedIds]
  );

  const discoverStack = useMemo<DiscoverEntry[]>(() => {
    const profileEntries: DiscoverEntry[] = discoverProfiles.map((data) => ({ kind: 'profile', data }));
    const groupEntries: DiscoverEntry[] = discoverGroups.map((data) => ({ kind: 'group', data }));
    return [...profileEntries, ...groupEntries];
  }, [discoverProfiles, discoverGroups]);

  const like = useCallback(
    (entityId: string) => {
      setLikedIds((prev) => new Set(prev).add(entityId));
      setMatches((prev) => {
        const exists = prev.some(
          (m) =>
            (m.profileIds[0] === currentUserId && m.profileIds[1] === entityId) ||
            (m.profileIds[1] === currentUserId && m.profileIds[0] === entityId)
        );
        if (exists) return prev;
        return [
          ...prev,
          {
            id: id('match'),
            profileIds: [currentUserId!, entityId],
            matchedAt: now(),
          },
        ];
      });
    },
    [currentUserId]
  );

  const pass = useCallback((entityId: string) => {
    setPassedIds((prev) => new Set(prev).add(entityId));
  }, []);

  const block = useCallback((entityId: string) => {
    setBlockedIds((prev) => new Set(prev).add(entityId));
    setPassedIds((prev) => new Set(prev).add(entityId));
    setMatches((prev) =>
      prev.filter((m) => !(m.profileIds[0] === entityId || m.profileIds[1] === entityId))
    );
  }, []);

  const report = useCallback((_entityId: string, _reason: string, _details?: string) => {}, []);

  const matchesFiltered = useMemo(
    () => matches.filter((m) => !blockedIds.has(m.profileIds[0]) && !blockedIds.has(m.profileIds[1])),
    [matches, blockedIds]
  );

  const getMatchProfile = useCallback(
    (match: Match): StunterProfile | undefined => {
      const otherId = match.profileIds[0] === currentUserId ? match.profileIds[1] : match.profileIds[0];
      if (blockedIds.has(otherId)) return undefined;
      return resolveAsProfile(otherId, allProfiles);
    },
    [allProfiles, currentUserId, blockedIds]
  );

  const getMatchById = useCallback(
    (matchId: string) => matchesFiltered.find((m) => m.id === matchId),
    [matchesFiltered]
  );

  const getMessages = useCallback(
    (matchId: string) =>
      [...messages.filter((m) => m.matchId === matchId)].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages]
  );

  const sendMessage = useCallback(
    (matchId: string, body: string) => {
      const trimmed = body.trim();
      if (!currentUserId || !trimmed) return;
      const match = matchesFiltered.find((m) => m.id === matchId);
      if (!match) return;
      setMessages((prev) => [
        ...prev,
        { id: id('msg'), matchId, senderId: currentUserId, body: trimmed, createdAt: now() },
      ]);
    },
    [currentUserId, matchesFiltered]
  );

  const value = useMemo<SwipeContextValue>(
    () => ({
      discoverStack,
      likedIds,
      passedIds,
      blockedIds,
      matches: matchesFiltered,
      getMatchProfile,
      like,
      pass,
      block,
      report,
      allProfiles,
      getMessages,
      sendMessage,
      getMatchById,
    }),
    [
      discoverStack,
      likedIds,
      passedIds,
      blockedIds,
      matchesFiltered,
      getMatchProfile,
      like,
      pass,
      block,
      report,
      allProfiles,
      getMessages,
      sendMessage,
      getMatchById,
    ]
  );

  return <SwipeContext.Provider value={value}>{children}</SwipeContext.Provider>;
}

export function useSwipe() {
  const ctx = useContext(SwipeContext);
  if (!ctx) throw new Error('useSwipe must be used within SwipeProvider');
  return ctx;
}
