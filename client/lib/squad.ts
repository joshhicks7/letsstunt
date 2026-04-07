import type { UserStuntGroup } from '@/types';

/** Creator + up to two people who joined via link. */
export const MAX_SQUAD_MEMBERS = 3;

/** Stunt group “About” field (multiline). */
export const MAX_GROUP_BIO_LENGTH = 500;
/** Live once at least two people are in the squad. */
export const MIN_SQUAD_MEMBERS_LIVE = 2;

export function squadMemberCount(group: UserStuntGroup): number {
  return group.memberIds.length;
}

export function isSquadLive(group: UserStuntGroup): boolean {
  return squadMemberCount(group) >= MIN_SQUAD_MEMBERS_LIVE;
}

export function canJoinSquad(group: UserStuntGroup): boolean {
  return squadMemberCount(group) < MAX_SQUAD_MEMBERS;
}
