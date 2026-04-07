import { getAuth, type Auth } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebaseApp';

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  return authInstance;
}
