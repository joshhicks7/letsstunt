import { rosterProfilesForGroup } from '@/lib/groupRoster';
import { getProfileImageDisplayUri } from '@/lib/profileMediaDisplay';
import type { DiscoverEntry, StunterProfile } from '@/types';

/** First visible cover image URL for a discover card (profile or group roster). */
export function discoverEntryCoverDisplayUri(
  entry: DiscoverEntry,
  allProfiles: StunterProfile[],
): string | null {
  if (entry.kind === 'profile') {
    const imgs = entry.data.media.filter((m) => m.type === 'image');
    return imgs[0] ? getProfileImageDisplayUri(imgs[0]) : null;
  }
  const members = rosterProfilesForGroup(entry.data, allProfiles);
  if (members.length === 0) return null;
  const imgs = members[0].media.filter((m) => m.type === 'image');
  return imgs[0] ? getProfileImageDisplayUri(imgs[0]) : null;
}
