'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { UserStuntGroup } from '@/types';
import { id, now } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { MAX_GROUP_BIO_LENGTH, MAX_SQUAD_MEMBERS } from '@/lib/squad';

const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function makeJoinSlug(existing: Set<string>): string {
  for (let attempt = 0; attempt < 24; attempt++) {
    let s = '';
    for (let i = 0; i < 10; i++) {
      s += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
    }
    if (!existing.has(s)) return s;
  }
  return `g${Date.now().toString(36)}`;
}

interface StuntGroupContextValue {
  groups: UserStuntGroup[];
  /** Groups you’re in (creator or joined via link). */
  myGroups: UserStuntGroup[];
  /** At most one; convenience for the single-squad UI. */
  myGroup: UserStuntGroup | undefined;
  createGroup: () => { id: string; joinSlug: string } | null;
  updateGroupName: (groupId: string, name: string) => void;
  updateGroupBio: (groupId: string, bio: string) => void;
  /** Add current user if there’s room and not already a member. */
  joinGroupBySlug: (
    slug: string,
  ) =>
    | { ok: true }
    | { ok: false; reason: 'not_signed_in' | 'not_found' | 'full' | 'already_in_group' };
  getGroupById: (groupId: string) => UserStuntGroup | undefined;
  getGroupBySlug: (slug: string) => UserStuntGroup | undefined;
}

const StuntGroupContext = createContext<StuntGroupContextValue | null>(null);

export function StuntGroupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.profile?.id ?? null;

  const [groups, setGroups] = useState<UserStuntGroup[]>([]);
  const groupsRef = useRef(groups);
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  const myGroups = useMemo(() => {
    if (!uid) return [];
    return groups.filter((g) => g.memberIds.includes(uid));
  }, [groups, uid]);

  const myGroup = myGroups[0];

  const createGroup = useCallback((): { id: string; joinSlug: string } | null => {
    if (!uid) return null;
    if (groupsRef.current.some((g) => g.memberIds.includes(uid))) return null;
    const existing = new Set(groupsRef.current.map((g) => g.joinSlug));
    const joinSlug = makeJoinSlug(existing);
    const g: UserStuntGroup = {
      id: id('squad'),
      joinSlug,
      name: 'New stunt group',
      bio: '',
      creatorId: uid,
      memberIds: [uid],
      createdAt: now(),
      updatedAt: now(),
    };
    setGroups((prev) => [...prev, g]);
    return { id: g.id, joinSlug: g.joinSlug };
  }, [uid]);

  const updateGroupName = useCallback((groupId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: trimmed, updatedAt: now() } : g)),
    );
  }, []);

  const updateGroupBio = useCallback((groupId: string, bio: string) => {
    const normalized = bio.replace(/\r\n/g, '\n').slice(0, MAX_GROUP_BIO_LENGTH);
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, bio: normalized, updatedAt: now() } : g)),
    );
  }, []);

  const joinGroupBySlug = useCallback(
    (
      slug: string,
    ): { ok: true } | { ok: false; reason: 'not_signed_in' | 'not_found' | 'full' | 'already_in_group' } => {
      if (!uid) return { ok: false, reason: 'not_signed_in' };

      const other = groupsRef.current.find((g) => g.memberIds.includes(uid) && g.joinSlug !== slug);
      if (other) return { ok: false, reason: 'already_in_group' };

      const idx = groupsRef.current.findIndex((g) => g.joinSlug === slug);
      if (idx < 0) return { ok: false, reason: 'not_found' };
      const g = groupsRef.current[idx];
      if (g.memberIds.includes(uid)) return { ok: true };
      if (g.memberIds.length >= MAX_SQUAD_MEMBERS) return { ok: false, reason: 'full' };

      setGroups((prev) => {
        const i = prev.findIndex((x) => x.joinSlug === slug);
        if (i < 0) return prev;
        const cur = prev[i];
        if (cur.memberIds.includes(uid) || cur.memberIds.length >= MAX_SQUAD_MEMBERS) return prev;
        const next: UserStuntGroup = {
          ...cur,
          memberIds: [...cur.memberIds, uid],
          updatedAt: now(),
        };
        return prev.map((x, j) => (j === i ? next : x));
      });

      return { ok: true };
    },
    [uid],
  );

  const getGroupById = useCallback((groupId: string) => groups.find((g) => g.id === groupId), [groups]);

  const getGroupBySlug = useCallback((slug: string) => groups.find((g) => g.joinSlug === slug), [groups]);

  const value = useMemo<StuntGroupContextValue>(
    () => ({
      groups,
      myGroups,
      myGroup,
      createGroup,
      updateGroupName,
      updateGroupBio,
      joinGroupBySlug,
      getGroupById,
      getGroupBySlug,
    }),
    [
      groups,
      myGroups,
      myGroup,
      createGroup,
      updateGroupName,
      updateGroupBio,
      joinGroupBySlug,
      getGroupById,
      getGroupBySlug,
    ],
  );

  return <StuntGroupContext.Provider value={value}>{children}</StuntGroupContext.Provider>;
}

export function useStuntGroups() {
  const ctx = useContext(StuntGroupContext);
  if (!ctx) throw new Error('useStuntGroups must be used within StuntGroupProvider');
  return ctx;
}
