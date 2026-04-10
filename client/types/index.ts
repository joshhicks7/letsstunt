/**
 * LetsStunt – cheer / stunt athletes 18+ find partners & groups nearby
 */

// --- Positions (stunt roles) ---
export type PositionType =
  | 'coed-base'
  | 'coed-flyer'
  | 'side-base'
  | 'main-base'
  | 'back-spot'
  | 'front-spot'
  | 'group-flyer'
  | 'all-girl-base'
  | 'all-girl-flyer';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export type AvailabilityType = 'weekdays' | 'weekends' | 'events' | 'competitions';

export type CoedSkillTags =
  | 'cupie'
  | 'coed_stunting'
  | 'coed_double_up'
  | 'coed_full_up'
  | 'coed_rewind'
  | 'coed_front_handspring_up'
  | 'coed_back_handspring_up'
  | 'coed_one_to_one'
  | 'coed_lib'
  | 'coed_platform'
  | 'coed_toss_hands'
  | 'coed_toss_extension';

export type GroupSkillTags =
  | 'basket_toss'
  | 'group_double_up'
  | 'group_full_up'
  | 'group_front_handspring_up'
  | 'group_back_handspring_up'
  | 'group_rewind'
  | 'group_tick_tock'
  | 'group_lib'
  | 'group_full_down'
  | 'group_double_down'
  | 'group_prep';

export type SkillTag = CoedSkillTags | GroupSkillTags;

/** Profile gallery item (images may include an optional migrated CDN URL). */
export interface ProfileMediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  /** Original Storage object path when known (migration script / server). */
  path?: string;
  /** WebP variant Storage path (see migration script). */
  optimizedPath?: string;
  /** Optional WebP / resized download URL — `getProfileImageDisplayUri` prefers this; UI falls back to `uri` on load error. */
  optimizedUri?: string;
}

export interface StunterProfile {
  id: string;
  /** Email for auth only */
  email?: string;
  displayName: string;
  /** Birthday ISO date string for age */
  birthday: string;
  /** Primary stunt role (required in onboarding) */
  primaryRole: PositionType;
  /** Additional roles beyond primary */
  secondaryRoles: PositionType[];
  /** Combined roles for discovery / cards (primary + secondary, deduped) */
  positions: PositionType[];
  skillLevel: SkillLevel;
  yearsExperience: number;
  /** When you're typically available */
  availability: AvailabilityType[];
  /** Skill highlights (tags) */
  skillTags: SkillTag[];
  currentlyWorkingOn: string;
  instagramHandle: string | null;
  /** Images/gifs of them stunting (URIs) */
  media: ProfileMediaItem[];
  /** Location for nearby matching */
  location: {
    city?: string;
    region?: string;
    country: string;
    lat?: number;
    lng?: number;
  } | null;
  /** Team, school, or gym */
  teamGym: string | null;
  bio: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Stunt group listing (swipe deck + detail).
 * Create-group / request-to-join flows are not in the app yet — wire to API later.
 */
export interface StuntGroup {
  id: string;
  name: string | null;
  /** Who created the listing (matches `StunterProfile.id`) */
  creatorId: string;
  /** Members in the group (UI shows up to 4 in roster grid) — mock only until join flow exists */
  memberProfileIds: string[];
  rolesFilled: PositionType[];
  rolesNeeded: PositionType[];
  availability: AvailabilityType[];
  location: StunterProfile['location'];
  bio: string | null;
}

export type DiscoverEntry =
  | { kind: 'profile'; data: StunterProfile }
  | { kind: 'group'; data: StuntGroup };

export interface Match {
  id: string;
  profileIds: [string, string];
  matchedAt: string;
}

/**
 * User-created stunt squad. Share `https://…/group/{joinSlug}/join` so friends can join from SMS / anywhere.
 * Max 3 people (creator + 2). Live when at least 2 members.
 * App rule: each user may belong to only one squad at a time.
 */
export interface UserStuntGroup {
  id: string;
  /** Public path segment, e.g. `https://letsstunt.com/group/mySlug/join` */
  joinSlug: string;
  name: string;
  /** What you’re looking for — schedule, roles, etc. */
  bio: string;
  creatorId: string;
  /** Creator first; others added when they open the join link (order may vary). */
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** In-app DM thread (local until backend sync). */
export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: StunterProfile;
  /** When false, Cloud Functions skip push; when undefined, treated as enabled (legacy users). */
  pushNotificationsEnabled?: boolean;
}

/** Draft for onboarding – collect before creating full profile */
export interface OnboardingDraft {
  displayName: string;
  birthday: string;
  primaryRole: PositionType | null;
  secondaryRoles: PositionType[];
  skillLevel: SkillLevel;
  yearsExperience: number;
  media: ProfileMediaItem[];
  location: StunterProfile['location'];
  teamGym: string | null;
  bio: string;
  availability: AvailabilityType[];
  skillTags: SkillTag[];
  currentlyWorkingOn: string;
  instagramHandle: string | null;
}
