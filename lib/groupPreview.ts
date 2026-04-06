import type { StuntGroup, StunterProfile } from '@/types';

/** Map a group to a profile-shaped object for matches list & shared UI */
export function stuntGroupToPreviewProfile(g: StuntGroup): StunterProfile {
  const primary = g.rolesFilled[0] ?? g.rolesNeeded[0] ?? 'coed-flyer';
  const secondary = [...g.rolesFilled.slice(1), ...g.rolesNeeded].filter((p) => p !== primary);
  const positions = [primary, ...secondary.filter((p, i, a) => a.indexOf(p) === i)];

  return {
    id: g.id,
    displayName: g.name?.trim() ? g.name : 'Stunt group',
    birthday: '2000-01-01',
    primaryRole: primary,
    secondaryRoles: secondary.filter((p) => p !== primary),
    positions,
    skillLevel: 'intermediate',
    yearsExperience: 0,
    availability: g.availability,
    skillTags: [],
    currentlyWorkingOn: '',
    instagramHandle: null,
    media: [],
    location: g.location,
    teamGym: null,
    bio: g.bio ?? 'Open stunt group — see roles on the card.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
