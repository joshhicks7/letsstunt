import Constants from 'expo-constants';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { addFcmTokenToUser, removeFcmTokenFromUser } from '@/lib/pushTokenFirestore';

export type RegisterPushOptions = {
  allowPrompt?: boolean;
};

export type RegisterPushResult = { ok: boolean; token?: string };

export async function registerPushToken(
  uid: string,
  _options?: RegisterPushOptions,
): Promise<RegisterPushResult> {
  if (Constants.executionEnvironment === 'storeClient') {
    return { ok: false };
  }

  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (!enabled) return { ok: false };

    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }

    const token = await messaging().getToken();
    if (!token) return { ok: false };

    await addFcmTokenToUser(uid, token);
    return { ok: true, token };
  } catch {
    return { ok: false };
  }
}

export async function removePushToken(uid: string, token: string): Promise<void> {
  try {
    const current = await messaging().getToken();
    if (current === token) {
      await messaging().deleteToken();
    }
  } catch {
    /* ignore */
  }
  try {
    await removeFcmTokenFromUser(uid, token);
  } catch {
    /* ignore */
  }
}

export function subscribePushTokenRefresh(uid: string, onToken: (t: string) => void): () => void {
  if (Constants.executionEnvironment === 'storeClient') {
    return () => undefined;
  }
  return messaging().onTokenRefresh(async (newToken) => {
    try {
      await addFcmTokenToUser(uid, newToken);
      onToken(newToken);
    } catch {
      /* ignore */
    }
  });
}
