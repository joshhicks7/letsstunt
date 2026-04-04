/**
 * LetsStunt – cheer / stunt athletes 18+ find partners & groups nearby
 */

// --- Positions (stunt roles) ---
export type PositionType =
  | 'coed-base'
  | 'coed-flyer'
  | 'male-side-base'
  | 'female-side-base'
  | 'back-spot'
  | 'front-spot'
  | 'all-girl-base'
  | 'all-girl-flyer'
  | 'group-stunt'
  | 'basket-tosser'
  | 'basket-flyer'
  | 'basket-base'
  | 'other';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export type AvailabilityType = 'weekdays' | 'weekends' | 'events' | 'competitions';

export type SkillTag =
  | 'basket-toss'
  | 'lib'
  | 'rewind'
  | 'twisting'
  | 'tumbling'
  | 'full-up'
  | 'cupie'
  | 'coed-stunting'
  | 'all-girl';

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
  media: { id: string; uri: string; type: 'image' | 'video' }[];
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
}

/** Draft for onboarding – collect before creating full profile */
export interface OnboardingDraft {
  displayName: string;
  birthday: string;
  primaryRole: PositionType | null;
  secondaryRoles: PositionType[];
  skillLevel: SkillLevel;
  yearsExperience: number;
  media: { id: string; uri: string; type: 'image' | 'video' }[];
  location: StunterProfile['location'];
  teamGym: string | null;
  bio: string;
  availability: AvailabilityType[];
  skillTags: SkillTag[];
  currentlyWorkingOn: string;
  instagramHandle: string | null;
}
