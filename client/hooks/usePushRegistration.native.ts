import { useEffect, useRef } from 'react';
import { registerPushToken, removePushToken, subscribePushTokenRefresh } from '@/lib/registerPush.native';

export function usePushRegistration(
  userUid: string | null,
  onboardingComplete: boolean,
  pushNotificationsEnabled: boolean | undefined,
) {
  const lastTokenRef = useRef<string | null>(null);
  const wantsPush = onboardingComplete && userUid != null && pushNotificationsEnabled !== false;

  useEffect(() => {
    if (!userUid) {
      lastTokenRef.current = null;
      return;
    }

    if (!wantsPush) {
      const t = lastTokenRef.current;
      if (t) {
        void removePushToken(userUid, t);
        lastTokenRef.current = null;
      }
      return;
    }

    void registerPushToken(userUid).then((res) => {
      console.log('res', res);
      if (res.token) lastTokenRef.current = res.token;
    });
  }, [userUid, wantsPush]);

  useEffect(() => {
    if (!userUid || !wantsPush) return () => undefined;
    return subscribePushTokenRefresh(userUid, (t) => {
      lastTokenRef.current = t;
    });
  }, [userUid, wantsPush]);
}
