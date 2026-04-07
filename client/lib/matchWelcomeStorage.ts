import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(uid: string): string {
  return `@letsstunt/matchWelcomeSeen:${uid}`;
}

export async function loadMatchWelcomeSeenIds(uid: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

export async function appendMatchWelcomeSeenId(uid: string, matchId: string): Promise<void> {
  const cur = await loadMatchWelcomeSeenIds(uid);
  cur.add(matchId);
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify([...cur]));
}
