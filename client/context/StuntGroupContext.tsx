'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { UserStuntGroup } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { MAX_GROUP_BIO_LENGTH, MAX_SQUAD_MEMBERS } from '@/lib/squad';
import { getFirestoreDb } from '@/lib/firebaseApp';
import { userStuntGroupFromFirestoreDoc } from '@/lib/firestoreSquad';

const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function makeJoinSlug(): string {
  let s = '';
  for (let i = 0; i < 10; i++) {
    s += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  }
  return s;
}

interface StuntGroupContextValue {
  groups: UserStuntGroup[];
  myGroups: UserStuntGroup[];
  myGroup: UserStuntGroup | undefined;
  createGroup: () => Promise<{ id: string; joinSlug: string } | null>;
  updateGroupName: (groupId: string, name: string) => void;
  updateGroupBio: (groupId: string, bio: string) => void;
  joinGroupBySlug: (
    slug: string,
  ) => Promise<
    | { ok: true; groupName: string }
    | { ok: false; reason: 'not_signed_in' | 'not_found' | 'full' | 'already_in_group' | 'failed' }
  >;
  getGroupById: (groupId: string) => UserStuntGroup | undefined;
  getGroupBySlug: (slug: string) => UserStuntGroup | undefined;
  /** Remove yourself from the squad (not available to the creator — use deleteGroup). */
  leaveGroup: (
    groupId: string,
  ) => Promise<
    | { ok: true }
    | { ok: false; reason: 'not_signed_in' | 'not_found' | 'creator_must_delete' | 'failed' }
  >;
  /** Creator only — deletes the squad for everyone. */
  deleteGroup: (
    groupId: string,
  ) => Promise<
    { ok: true } | { ok: false; reason: 'not_signed_in' | 'not_creator' | 'not_found' | 'failed' }
  >;
}

const StuntGroupContext = createContext<StuntGroupContextValue | null>(null);

export function StuntGroupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id ?? user?.profile?.id ?? null;

  const [groups, setGroups] = useState<UserStuntGroup[]>([]);
  const groupsRef = useRef(groups);
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    if (!uid) {
      setGroups([]);
      return;
    }
    try {
      const db = getFirestoreDb();
      const q = query(collection(db, 'squads'), where('memberIds', 'array-contains', uid));
      return onSnapshot(q, (snap) => {
        const list: UserStuntGroup[] = [];
        snap.forEach((d) => {
          const g = userStuntGroupFromFirestoreDoc(d);
          if (g) list.push(g);
        });
        setGroups(list);
      });
    } catch {
      setGroups([]);
    }
  }, [uid]);

  const myGroups = useMemo(() => {
    if (!uid) return [];
    return groups.filter((g) => g.memberIds.includes(uid));
  }, [groups, uid]);

  const myGroup = myGroups[0];

  const createGroup = useCallback(async (): Promise<{ id: string; joinSlug: string } | null> => {
    if (!uid) return null;
    if (groupsRef.current.some((g) => g.memberIds.includes(uid))) return null;
    const db = getFirestoreDb();
    let joinSlug = makeJoinSlug();
    for (let attempt = 0; attempt < 8; attempt++) {
      const clash = await getDocs(
        query(collection(db, 'squads'), where('joinSlug', '==', joinSlug), limit(1)),
      );
      if (clash.empty) break;
      joinSlug = makeJoinSlug();
    }
    const ref = await addDoc(collection(db, 'squads'), {
      joinSlug,
      name: 'New stunt group',
      bio: '',
      creatorId: uid,
      memberIds: [uid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, joinSlug };
  }, [uid]);

  const updateGroupName = useCallback((groupId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    void updateDoc(doc(getFirestoreDb(), 'squads', groupId), {
      name: trimmed,
      updatedAt: serverTimestamp(),
    }).catch(() => undefined);
  }, []);

  const updateGroupBio = useCallback((groupId: string, bio: string) => {
    const normalized = bio.replace(/\r\n/g, '\n').slice(0, MAX_GROUP_BIO_LENGTH);
    void updateDoc(doc(getFirestoreDb(), 'squads', groupId), {
      bio: normalized,
      updatedAt: serverTimestamp(),
    }).catch(() => undefined);
  }, []);

  const joinGroupBySlug = useCallback(
    async (
      slug: string,
    ): Promise<
      | { ok: true; groupName: string }
      | { ok: false; reason: 'not_signed_in' | 'not_found' | 'full' | 'already_in_group' | 'failed' }
    > => {
      if (!uid) return { ok: false, reason: 'not_signed_in' };

      const other = groupsRef.current.find((g) => g.memberIds.includes(uid) && g.joinSlug !== slug);
      if (other) return { ok: false, reason: 'already_in_group' };

      const db = getFirestoreDb();
      const found = await getDocs(
        query(collection(db, 'squads'), where('joinSlug', '==', slug.trim()), limit(1)),
      );
      if (found.empty) return { ok: false, reason: 'not_found' };
      const d = found.docs[0];
      const g = userStuntGroupFromFirestoreDoc(d);
      if (!g) return { ok: false, reason: 'not_found' };
      const groupName = g.name.trim() || 'Stunt group';
      if (g.memberIds.includes(uid)) return { ok: true, groupName };
      if (g.memberIds.length >= MAX_SQUAD_MEMBERS) return { ok: false, reason: 'full' };

      try {
        await updateDoc(doc(db, 'squads', d.id), {
          memberIds: arrayUnion(uid),
          updatedAt: serverTimestamp(),
        });
        return { ok: true, groupName };
      } catch {
        return { ok: false, reason: 'failed' };
      }
    },
    [uid],
  );

  const getGroupById = useCallback((groupId: string) => groups.find((g) => g.id === groupId), [groups]);

  const getGroupBySlug = useCallback((slug: string) => groups.find((g) => g.joinSlug === slug), [groups]);

  const leaveGroup = useCallback(
    async (
      groupId: string,
    ): Promise<
      | { ok: true }
      | { ok: false; reason: 'not_signed_in' | 'not_found' | 'creator_must_delete' | 'failed' }
    > => {
      if (!uid) return { ok: false, reason: 'not_signed_in' };
      const g = groupsRef.current.find((x) => x.id === groupId);
      if (!g || !g.memberIds.includes(uid)) return { ok: false, reason: 'not_found' };
      if (g.creatorId === uid) return { ok: false, reason: 'creator_must_delete' };
      try {
        await updateDoc(doc(getFirestoreDb(), 'squads', groupId), {
          memberIds: arrayRemove(uid),
          updatedAt: serverTimestamp(),
        });
        return { ok: true };
      } catch {
        return { ok: false, reason: 'failed' };
      }
    },
    [uid],
  );

  const deleteGroup = useCallback(
    async (
      groupId: string,
    ): Promise<
      { ok: true } | { ok: false; reason: 'not_signed_in' | 'not_creator' | 'not_found' | 'failed' }
    > => {
      if (!uid) return { ok: false, reason: 'not_signed_in' };
      const g = groupsRef.current.find((x) => x.id === groupId);
      if (!g) return { ok: false, reason: 'not_found' };
      if (g.creatorId !== uid) return { ok: false, reason: 'not_creator' };
      try {
        await deleteDoc(doc(getFirestoreDb(), 'squads', groupId));
        return { ok: true };
      } catch {
        return { ok: false, reason: 'failed' };
      }
    },
    [uid],
  );

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
      leaveGroup,
      deleteGroup,
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
      leaveGroup,
      deleteGroup,
    ],
  );

  return <StuntGroupContext.Provider value={value}>{children}</StuntGroupContext.Provider>;
}

export function useStuntGroups() {
  const ctx = useContext(StuntGroupContext);
  if (!ctx) throw new Error('useStuntGroups must be used within StuntGroupProvider');
  return ctx;
}
