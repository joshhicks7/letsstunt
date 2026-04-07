import type { UserStuntGroup } from '@/types';
import { timestampToIso } from '@/lib/firestoreTimestamps';

export function userStuntGroupFromFirestoreDoc(d: {
  id: string;
  data: () => Record<string, unknown>;
}): UserStuntGroup | null {
  const raw = d.data();
  const joinSlug = typeof raw.joinSlug === 'string' ? raw.joinSlug : null;
  const name = typeof raw.name === 'string' ? raw.name : null;
  const creatorId = typeof raw.creatorId === 'string' ? raw.creatorId : null;
  const memberRaw = Array.isArray(raw.memberIds) ? raw.memberIds : [];
  const memberIds = memberRaw.filter((x): x is string => typeof x === 'string');
  if (!joinSlug || !name || !creatorId || memberIds.length === 0) return null;
  return {
    id: d.id,
    joinSlug,
    name,
    bio: typeof raw.bio === 'string' ? raw.bio : '',
    creatorId,
    memberIds,
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
  };
}
