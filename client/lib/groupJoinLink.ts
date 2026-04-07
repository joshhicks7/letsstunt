/** Production site / universal-link host (no trailing slash). */
export function getWebOrigin(): string {
  const raw = process.env.EXPO_PUBLIC_WEB_ORIGIN ?? 'https://letsstunt.com';
  return raw.replace(/\/$/, '');
}

export function buildGroupJoinUrl(joinSlug: string): string {
  return `${getWebOrigin()}/group/${joinSlug}/join`;
}

export function buildGroupInviteMessage(groupName: string, joinSlug: string, about?: string): string {
  const url = buildGroupJoinUrl(joinSlug);
  const label = groupName.trim() || 'our stunt group';
  let body = `Join "${label}" on LetsStunt — tap to join:\n${url}`;
  const snippet = about?.trim();
  if (snippet) {
    const short = snippet.length > 160 ? `${snippet.slice(0, 157)}…` : snippet;
    body += `\n\n${short}`;
  }
  return body;
}

/** Plain app invite (no group) — same origin as group links via {@link getWebOrigin}. */
export function buildAppInviteMessage(): string {
  const url = getWebOrigin();
  return `I'm on LetsStunt to find stunt partners — bases, flyers, and groups nearby. Join me:\n\n${url}`;
}
