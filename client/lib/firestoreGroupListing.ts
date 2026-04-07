import { POSITION_LABELS } from '@/constants/positions';
import type { AvailabilityType, PositionType, StuntGroup } from '@/types';
import { locationForPublicFirestore } from '@/lib/publicLocation';

const POSITION_SET = new Set<string>(Object.keys(POSITION_LABELS));

function isPositionType(v: unknown): v is PositionType {
  return typeof v === 'string' && POSITION_SET.has(v);
}

function isAvailability(v: unknown): v is AvailabilityType {
  return (
    v === 'weekdays' || v === 'weekends' || v === 'events' || v === 'competitions'
  );
}

export function groupListingFromFirestore(raw: unknown, id: string): StuntGroup | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const creatorId = typeof o.creatorId === 'string' ? o.creatorId : null;
  if (!creatorId) return null;

  const name = o.name === null ? null : typeof o.name === 'string' ? o.name : null;
  const memberRaw = Array.isArray(o.memberProfileIds) ? o.memberProfileIds : [];
  const memberProfileIds = memberRaw.filter((x): x is string => typeof x === 'string');
  const rolesFilled = (Array.isArray(o.rolesFilled) ? o.rolesFilled : []).filter(isPositionType);
  const rolesNeeded = (Array.isArray(o.rolesNeeded) ? o.rolesNeeded : []).filter(isPositionType);
  const availability = (Array.isArray(o.availability) ? o.availability : []).filter(isAvailability);

  let location: StuntGroup['location'] = null;
  if (o.location && typeof o.location === 'object') {
    const L = o.location as Record<string, unknown>;
    location = {
      country: typeof L.country === 'string' ? L.country : 'USA',
      city: typeof L.city === 'string' ? L.city : undefined,
      region: typeof L.region === 'string' ? L.region : undefined,
      lat: typeof L.lat === 'number' ? L.lat : undefined,
      lng: typeof L.lng === 'number' ? L.lng : undefined,
    };
  }

  const bio = o.bio === null || typeof o.bio === 'string' ? o.bio : null;

  return {
    id,
    name,
    creatorId,
    memberProfileIds,
    rolesFilled,
    rolesNeeded,
    availability,
    location,
    bio,
  };
}

export function serializeGroupListing(g: StuntGroup): Record<string, unknown> {
  const location = locationForPublicFirestore(g.location);

  return {
    name: g.name,
    creatorId: g.creatorId,
    memberProfileIds: g.memberProfileIds,
    rolesFilled: g.rolesFilled,
    rolesNeeded: g.rolesNeeded,
    availability: g.availability,
    location,
    bio: g.bio,
  };
}
