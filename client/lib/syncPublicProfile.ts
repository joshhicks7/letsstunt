import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import type { StunterProfile } from '@/types';
import { serializeProfile } from '@/lib/firestoreProfile';
import { getFirestoreDb } from '@/lib/firebaseApp';
import { locationForPublicFirestore } from '@/lib/publicLocation';

/** Public discover doc — no email; location is city + region only (no coordinates or country). */
export function serializePublicProfile(profile: StunterProfile): Record<string, unknown> {
  const raw = serializeProfile({ ...profile, email: undefined });
  delete raw.email;
  raw.location = locationForPublicFirestore(profile.location) as unknown;
  return raw;
}

/**
 * Upsert or delete `publicProfiles/{uid}` so discover only lists onboarded athletes.
 * Call after any profile write when onboarding / visibility should change.
 */
export async function syncPublicProfileDoc(
  uid: string,
  profile: StunterProfile,
  onboardingComplete: boolean,
): Promise<void> {
  try {
    const db = getFirestoreDb();
    const ref = doc(db, 'publicProfiles', uid);
    if (!onboardingComplete || !profile.birthday?.trim()) {
      await deleteDoc(ref).catch(() => undefined);
      return;
    }
    await setDoc(ref, serializePublicProfile(profile), { merge: true });
  } catch {
    /* non-blocking; profile sync retries on next auth load */
  }
}
