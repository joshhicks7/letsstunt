import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import type { UserStuntGroup } from '@/types';
import { getFirestoreDb } from '@/lib/firebaseApp';
import { userStuntGroupFromFirestoreDoc } from '@/lib/firestoreSquad';

/**
 * Load a squad by public join slug (for invite links). Works even when the viewer
 * is not yet a member (unlike `useStuntGroups().getGroupBySlug`, which only sees your squads).
 */
export function useSquadByJoinSlug(slug: string | undefined): UserStuntGroup | null | undefined {
  const [state, setState] = useState<UserStuntGroup | null | undefined>(undefined);

  useEffect(() => {
    const trimmed = slug?.trim();
    if (!trimmed) {
      setState(null);
      return;
    }
    let unsub: (() => void) | undefined;
    try {
      const db = getFirestoreDb();
      const q = query(collection(db, 'squads'), where('joinSlug', '==', trimmed), limit(1));
      unsub = onSnapshot(
        q,
        (snap) => {
          if (snap.empty) {
            setState(null);
            return;
          }
          const g = userStuntGroupFromFirestoreDoc(snap.docs[0]);
          setState(g ?? null);
        },
        () => setState(null),
      );
    } catch {
      setState(null);
    }
    return () => unsub?.();
  }, [slug]);

  return state;
}
