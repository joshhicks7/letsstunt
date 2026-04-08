import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getFirebaseApp, getFirestoreDb } from '@/lib/firebaseApp';

/**
 * Web only: request notification permission, obtain an FCM token, and store it on `users/{uid}.fcmToken`
 * for Cloud Functions (e.g. match notifications). Native uses a different stack; this hook no-ops there.
 *
 * Set `EXPO_PUBLIC_FIREBASE_VAPID_KEY` in `.env` (Firebase Console → Project settings → Cloud Messaging → Web Push certificates).
 *
 * @param enabled — set false until the user is fully signed in (e.g. onboarding complete) so permission is not asked on auth screens.
 */
export function useWebFCMRegistration(userUid: string | null, enabled = true) {
  const lastWrittenRef = useRef<{ uid: string; token: string } | null>(null);

  useEffect(() => {
    if (!enabled || !userUid) return;
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

    const vapidKey = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY?.trim();
    if (!vapidKey) return;

    let cancelled = false;

    void (async () => {
      try {
        const supported = await isSupported();
        if (cancelled || !supported) return;

        const permission = await Notification.requestPermission();
        if (cancelled || permission !== 'granted') return;

        const messaging = getMessaging(getFirebaseApp());
        const token = await getToken(messaging, { vapidKey });
        if (cancelled || !token) return;
        const prev = lastWrittenRef.current;
        if (prev && prev.uid === userUid && prev.token === token) return;

        const db = getFirestoreDb();
        await setDoc(
          doc(db, 'users', userUid),
          { fcmToken: token },
          { merge: true },
        );
        lastWrittenRef.current = { uid: userUid, token };
      } catch {
        /* permission denied, blocked, missing sw, or transient network */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userUid, enabled]);
}

/** Same hook; use whichever name fits your codebase. */
export const useNotifications = useWebFCMRegistration;
