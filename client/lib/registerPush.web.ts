import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getFirebaseApp } from '@/lib/firebaseApp';
import { addFcmTokenToUser, removeFcmTokenFromUser } from '@/lib/pushTokenFirestore';
import { isIOSMobileWebBrowser, isWebStandalone } from '@/lib/webPushEnvironment';

export type RegisterPushOptions = {
  /**
   * When false and permission is still "default", skip requesting permission.
   * Used for iOS Safari in a tab (install PWA first / use Settings toggle).
   */
  allowPrompt?: boolean;
};

export type RegisterPushResult = { ok: boolean; token?: string };

export async function registerPushToken(
  uid: string,
  options?: RegisterPushOptions,
): Promise<RegisterPushResult> {
  const allowPrompt = options?.allowPrompt !== false;

  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return { ok: false };
  }

  const vapidKey = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) return { ok: false };

  try {
    const supported = await isSupported();
    if (!supported) return { ok: false };

    let permission = Notification.permission;
    if (permission === 'default') {
      if (!allowPrompt && isIOSMobileWebBrowser() && !isWebStandalone()) {
        return { ok: false };
      }
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return { ok: false };

    const messaging = getMessaging(getFirebaseApp());
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const token = await getToken(
        messaging,
        {
          vapidKey,
          serviceWorkerRegistration: registration,
        }
      );
      if (!token) return { ok: false };
      console.log('token', token);
      await addFcmTokenToUser(uid, token);
      return { ok: true, token };
    } catch (error) {
      console.error('error', error);
      return { ok: false };
    }

  } catch {
    return { ok: false };
  }
}

export async function removePushToken(uid: string, token: string): Promise<void> {
  try {
    await removeFcmTokenFromUser(uid, token);
  } catch {
    /* ignore */
  }
}
