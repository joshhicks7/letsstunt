import {
  arrayRemove,
  arrayUnion,
  deleteField,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebaseApp';

/**
 * Store an FCM device token for Cloud Functions (`fcmTokens` array).
 * Migrates legacy string `fcmToken` into the array once, then removes `fcmToken`.
 */
export async function addFcmTokenToUser(uid: string, token: string): Promise<void> {
  const db = getFirestoreDb();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const legacy = snap.data()?.fcmToken;
  const updates: Record<string, unknown> = {
    fcmTokens:
      typeof legacy === 'string' && legacy.length > 0 ? arrayUnion(token, legacy) : arrayUnion(token),
  };
  if (typeof legacy === 'string' && legacy.length > 0) {
    updates.fcmToken = deleteField();
  }
  await updateDoc(ref, updates);
}

/** Remove a token when the user opts out or the device unregisters. */
export async function removeFcmTokenFromUser(uid: string, token: string): Promise<void> {
  const db = getFirestoreDb();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const legacy = snap.data()?.fcmToken;
  const updates: Record<string, unknown> = {
    fcmTokens: arrayRemove(token),
  };
  if (legacy === token) {
    updates.fcmToken = deleteField();
  }
  await updateDoc(ref, updates);
}
