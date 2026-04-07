import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from '@/lib/firebaseApp';

const DEFAULT_REGION = 'us-central1';

export async function callDeleteMyAccount(): Promise<void> {
  const region = process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? DEFAULT_REGION;
  const functions = getFunctions(getFirebaseApp(), region);
  const run = httpsCallable<void, { ok: boolean }>(functions, 'deleteMyAccount');
  await run();
}
