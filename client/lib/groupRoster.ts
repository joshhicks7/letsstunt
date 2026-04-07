import { GROUP_MEMBER_MAX } from '@/constants/groups';
import type { StuntGroup, StunterProfile } from '@/types';

export function profileImages(p: StunterProfile) {
  return p.media.filter((m) => m.type === 'image');
}

/** Each member shows image at min(slot, their last index). */
export function uriForPhotoSlot(p: StunterProfile, slot: number): string | null {
  const imgs = profileImages(p);
  if (imgs.length === 0) return null;
  const idx = Math.min(Math.max(0, slot), imgs.length - 1);
  return imgs[idx].uri;
}

export function maxPhotoSlotForMembers(members: StunterProfile[]): number {
  return members.reduce((max, p) => {
    const n = profileImages(p).length;
    return Math.max(max, Math.max(0, n - 1));
  }, 0);
}

export function rosterProfilesForGroup(group: StuntGroup, allProfiles: StunterProfile[]): StunterProfile[] {
  return group.memberProfileIds
    .slice(0, GROUP_MEMBER_MAX)
    .map((id) => allProfiles.find((p) => p.id === id))
    .filter((p): p is StunterProfile => p != null);
}
