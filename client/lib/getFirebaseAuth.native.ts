import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
/** RN entry export; root `@firebase/auth` typings omit this for Node-targeted `tsc`. */
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import { getFirebaseApp } from '@/lib/firebaseApp';

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    authInstance = getAuth(app);
  }
  return authInstance;
}
