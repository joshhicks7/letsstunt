import { mergePrimaryAndSecondary, POSITION_LABELS } from '@/constants/positions';
import { roundGeoCoordinate } from '@/lib/geoPrecision';
import type {
  AvailabilityType,
  PositionType,
  SkillLevel,
  StunterProfile,
  SkillTag,
} from '@/types';

const POSITION_SET = new Set<string>(Object.keys(POSITION_LABELS));

function isPositionType(v: unknown): v is PositionType {
  return typeof v === 'string' && POSITION_SET.has(v);
}

function isSkillLevel(v: unknown): v is SkillLevel {
  return v === 'beginner' || v === 'intermediate' || v === 'advanced' || v === 'elite';
}

function isAvailability(v: unknown): v is AvailabilityType {
  return (
    v === 'weekdays' || v === 'weekends' || v === 'events' || v === 'competitions'
  );
}

export function serializeProfile(profile: StunterProfile): Record<string, unknown> {
  const raw = JSON.parse(JSON.stringify(profile)) as Record<string, unknown>;
  const loc = raw.location;
  if (loc && typeof loc === 'object') {
    const L = loc as Record<string, unknown>;
    if (typeof L.lat === 'number' && Number.isFinite(L.lat)) L.lat = roundGeoCoordinate(L.lat);
    if (typeof L.lng === 'number' && Number.isFinite(L.lng)) L.lng = roundGeoCoordinate(L.lng);
  }
  return raw;
}

export function profileFromFirestore(
  raw: unknown,
  uid: string,
  fallbackEmail: string,
): StunterProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const displayName = typeof p.displayName === 'string' ? p.displayName : null;
  const birthday = typeof p.birthday === 'string' ? p.birthday : null;
  const primaryRole = p.primaryRole;
  if (!displayName || birthday === null || !isPositionType(primaryRole)) return null;

  const secondaryRaw = Array.isArray(p.secondaryRoles) ? p.secondaryRoles : [];
  const secondaryRoles = secondaryRaw.filter(isPositionType);
  const availabilityRaw = Array.isArray(p.availability) ? p.availability : [];
  const availability = availabilityRaw.filter(isAvailability);
  const skillTags = (Array.isArray(p.skillTags) ? p.skillTags : []).filter(
    (t): t is SkillTag => typeof t === 'string',
  );
  const skillLevel = isSkillLevel(p.skillLevel) ? p.skillLevel : 'beginner';
  const yearsExperience =
    typeof p.yearsExperience === 'number' && Number.isFinite(p.yearsExperience)
      ? p.yearsExperience
      : 0;

  const mediaRaw = Array.isArray(p.media) ? p.media : [];
  const media = mediaRaw
    .map((m) => {
      if (!m || typeof m !== 'object') return null;
      const o = m as Record<string, unknown>;
      if (typeof o.id !== 'string' || typeof o.uri !== 'string') return null;
      const type = o.type === 'video' ? 'video' : 'image';
      return { id: o.id, uri: o.uri, type };
    })
    .filter(
      (x): x is { id: string; uri: string; type: 'image' | 'video' } => x != null,
    );

  let location: StunterProfile['location'] = null;
  if (p.location && typeof p.location === 'object') {
    const L = p.location as Record<string, unknown>;
    location = {
      country: typeof L.country === 'string' ? L.country : 'USA',
      city: typeof L.city === 'string' ? L.city : undefined,
      region: typeof L.region === 'string' ? L.region : undefined,
      lat: typeof L.lat === 'number' ? L.lat : undefined,
      lng: typeof L.lng === 'number' ? L.lng : undefined,
    };
  }

  return {
    id: uid,
    email: typeof p.email === 'string' ? p.email : fallbackEmail,
    displayName,
    birthday,
    primaryRole,
    secondaryRoles,
    positions: mergePrimaryAndSecondary(primaryRole, secondaryRoles),
    skillLevel,
    yearsExperience,
    availability,
    skillTags,
    currentlyWorkingOn: typeof p.currentlyWorkingOn === 'string' ? p.currentlyWorkingOn : '',
    instagramHandle:
      p.instagramHandle === null || typeof p.instagramHandle === 'string'
        ? p.instagramHandle
        : null,
    media,
    location,
    teamGym:
      p.teamGym === null || typeof p.teamGym === 'string' ? p.teamGym : null,
    bio: typeof p.bio === 'string' ? p.bio : '',
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
    updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
  };
}
