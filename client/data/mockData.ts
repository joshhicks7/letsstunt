/**
 * Mock data for LetsStunt – profiles, groups, matches (replace with API later).
 *
 * Groups: `creatorId` / `memberProfileIds` model real data for when create + join exist;
 * there is still no UI to start a group or request membership (mock only).
 */
import type { Match, StuntGroup, StunterProfile } from '@/types';

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/** Coed stunt demo still (TikTok CDN – same asset as your Google Images ref; may stop loading if TikTok changes CDN rules) */
export const IMG_COED_STUNT_TIKTOK =
  'data:image/jpeg;base64,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';

/** Extra seed still for multi-photo cards (Unsplash, stable for demos) */
export const IMG_ATHLETICS_DEMO =
  'data:image/jpeg;base64,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';

export function seedMedia(...uris: string[]): StunterProfile['media'] {
  return uris.map((uri, i) => ({ id: `seed_${i}`, uri, type: 'image' as const }));
}

const baseProfile = (p: Omit<StunterProfile, 'createdAt' | 'updatedAt'>): StunterProfile => ({
  ...p,
  createdAt: now(),
  updatedAt: now(),
});

export const MOCK_PROFILES: StunterProfile[] = [
  baseProfile({
    id: 'usr_jordan',
    displayName: 'Jordan',
    birthday: '2002-05-15',
    primaryRole: 'coed-flyer',
    secondaryRoles: ['all-girl-flyer'],
    positions: ['coed-flyer', 'all-girl-flyer'],
    skillLevel: 'advanced',
    yearsExperience: 6,
    availability: ['weekends', 'competitions'],
    skillTags: ['coed_rewind', 'coed_lib', 'coed_stunting'],
    currentlyWorkingOn: 'Full-ups and rewinds',
    instagramHandle: '@jordan.stunts',
    media: seedMedia(IMG_COED_STUNT_TIKTOK, IMG_ATHLETICS_DEMO),
    location: { city: 'Austin', region: 'TX', country: 'USA', lat: 30.27, lng: -97.74 },
    teamGym: 'Texas Twisters',
    bio: 'Coed flyer. Working on fullups and rewinds. Looking for bases nearby.',
  }),
  baseProfile({
    id: 'usr_mike',
    displayName: 'Mike',
    birthday: '1998-11-03',
    primaryRole: 'coed-base',
    secondaryRoles: [],
    positions: ['coed-base'],
    skillLevel: 'advanced',
    yearsExperience: 8,
    availability: ['weekdays', 'weekends', 'events'],
    skillTags: ['basket_toss', 'coed_rewind', 'cupie'],
    currentlyWorkingOn: 'Elite coed pyramids',
    instagramHandle: null,
    media: seedMedia(IMG_COED_STUNT_TIKTOK, IMG_ATHLETICS_DEMO, IMG_ATHLETICS_DEMO),
    location: { city: 'Austin', region: 'TX', country: 'USA', lat: 30.28, lng: -97.75 },
    teamGym: null,
    bio: 'Main base. Rewinds, fullups, toss cupies. Down to stunt anytime.',
  }),
  baseProfile({
    id: 'usr_sam',
    displayName: 'Sam',
    birthday: '2000-07-22',
    primaryRole: 'side-base',
    secondaryRoles: [],
    positions: ['side-base'],
    skillLevel: 'intermediate',
    yearsExperience: 4,
    availability: ['weekends', 'events'],
    skillTags: ['coed_stunting', 'coed_lib'],
    currentlyWorkingOn: 'Coed group timing',
    instagramHandle: '@sam_side',
    media: seedMedia(IMG_COED_STUNT_TIKTOK, IMG_ATHLETICS_DEMO),
    location: { city: 'Dallas', region: 'TX', country: 'USA', lat: 32.78, lng: -96.8 },
    teamGym: 'Dallas Elite',
    bio: 'Side base. Looking for coed groups and flyers to work with.',
  }),
  baseProfile({
    id: 'usr_taylor',
    displayName: 'Taylor',
    birthday: '1999-02-10',
    primaryRole: 'all-girl-base',
    secondaryRoles: ['all-girl-flyer'],
    positions: ['all-girl-base', 'all-girl-flyer'],
    skillLevel: 'elite',
    yearsExperience: 10,
    availability: ['weekdays', 'competitions'],
    skillTags: ['group_lib', 'basket_toss', 'group_double_up'],
    currentlyWorkingOn: 'Coaching privates',
    instagramHandle: '@taylor.cheer',
    media: seedMedia(IMG_ATHLETICS_DEMO),
    location: { city: 'Houston', region: 'TX', country: 'USA', lat: 29.76, lng: -95.37 },
    teamGym: 'Houston All-Stars',
    bio: 'All-girl base & flyer. Coach for privates. Looking for stunt groups.',
  }),
  baseProfile({
    id: 'usr_alex',
    displayName: 'Alex',
    birthday: '2001-09-01',
    primaryRole: 'coed-flyer',
    secondaryRoles: ['all-girl-flyer'],
    positions: ['coed-flyer', 'all-girl-flyer'],
    skillLevel: 'intermediate',
    yearsExperience: 5,
    availability: ['weekends', 'events', 'competitions'],
    skillTags: ['basket_toss', 'group_rewind'],
    currentlyWorkingOn: 'Toss cupies',
    instagramHandle: null,
    media: seedMedia(IMG_COED_STUNT_TIKTOK, IMG_ATHLETICS_DEMO),
    location: { city: 'Austin', region: 'TX', country: 'USA', lat: 30.26, lng: -97.73 },
    teamGym: null,
    bio: 'Flyer working on basket skills. Need bases for toss cupies and rewinds.',
  }),
];

/**
 * Mock groups — opaque ids. Roster sizes exercise discover `GroupSwipeCard` quadrant layouts:
 * 0 empty · 1 single · 2 row · 3 L-grid · 4 across
 */
export const MOCK_GROUPS: StuntGroup[] = [
  {
    id: 'grp_f1e2d3c4b5a697887766554',
    name: 'San Antonio — forming',
    creatorId: 'usr_taylor',
    memberProfileIds: [],
    rolesFilled: [],
    rolesNeeded: ['all-girl-base', 'all-girl-flyer', 'back-spot'],
    availability: ['weekends', 'competitions'],
    location: { city: 'San Antonio', region: 'TX', country: 'USA', lat: 29.42, lng: -98.49 },
    bio: 'New all-girl group — invites out, roster fills as people accept (mock empty roster).',
  },
  {
    id: 'grp_7d2a9c1e5f8b4a2c6e0d8f3',
    name: 'Dallas weekend coed',
    creatorId: 'usr_sam',
    memberProfileIds: ['usr_sam'],
    rolesFilled: ['side-base'],
    rolesNeeded: ['coed-base', 'coed-flyer'],
    availability: ['weekends', 'events'],
    location: { city: 'Dallas', region: 'TX', country: 'USA', lat: 32.78, lng: -96.8 },
    bio: 'Sat mornings — rebuilding a coed trio, need base + flyer.',
  },
  {
    id: 'grp_8e3b0c2d4f6a819203948576',
    name: 'Austin flyer & base',
    creatorId: 'usr_jordan',
    memberProfileIds: ['usr_jordan', 'usr_mike'],
    rolesFilled: ['coed-flyer', 'coed-base'],
    rolesNeeded: ['side-base', 'back-spot'],
    availability: ['weekdays', 'weekends'],
    location: { city: 'Austin', region: 'TX', country: 'USA', lat: 30.27, lng: -97.74 },
    bio: 'Just the two of us for now — want to grow into a full coed group.',
  },
  {
    id: 'grp_9c4e1f8a2b6d0e3f7a1c5d9',
    name: 'Austin evening coed',
    creatorId: 'usr_mike',
    memberProfileIds: ['usr_mike', 'usr_jordan', 'usr_sam'],
    rolesFilled: ['coed-base', 'coed-flyer', 'back-spot'],
    rolesNeeded: ['side-base'],
    availability: ['weekdays', 'weekends'],
    location: { city: 'Austin', region: 'TX', country: 'USA', lat: 30.27, lng: -97.74 },
    bio: 'Practicing Tue/Thu 7pm — need a solid side for elite sequences.',
  },
  {
    id: 'grp_0a9b8c7d6e5f403928171605',
    name: 'Houston all-girl quad',
    creatorId: 'usr_taylor',
    memberProfileIds: ['usr_taylor', 'usr_jordan', 'usr_mike', 'usr_alex'],
    rolesFilled: ['all-girl-base', 'all-girl-flyer', 'side-base', 'back-spot'],
    rolesNeeded: [],
    availability: ['weekdays', 'competitions'],
    location: { city: 'Houston', region: 'TX', country: 'USA', lat: 29.76, lng: -95.37 },
    bio: 'Full four for elite all-girl — extras welcome for alternates (mock max roster).',
  },
];

/**
 * Pre-seeded matches for demo user `usr_demo` after login.
 * Covers athletes + one group so Matches + chat can be tested without swiping.
 */
export const MOCK_MATCHES: Match[] = [
  {
    id: 'match_seed_jordan',
    profileIds: ['usr_demo', 'usr_jordan'],
    matchedAt: '2026-03-15T18:00:00.000Z',
  },
  {
    id: 'match_seed_mike',
    profileIds: ['usr_demo', 'usr_mike'],
    matchedAt: '2026-03-18T20:30:00.000Z',
  },
  {
    id: 'match_seed_sam',
    profileIds: ['usr_demo', 'usr_sam'],
    matchedAt: '2026-03-20T12:00:00.000Z',
  },
  {
    id: 'match_seed_taylor',
    profileIds: ['usr_demo', 'usr_taylor'],
    matchedAt: '2026-03-22T09:15:00.000Z',
  },
  {
    id: 'match_seed_group_austin',
    profileIds: ['usr_demo', 'grp_9c4e1f8a2b6d0e3f7a1c5d9'],
    matchedAt: '2026-03-25T16:45:00.000Z',
  },
];

export { id, now };
