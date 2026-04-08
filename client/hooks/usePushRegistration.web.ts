import { useEffect, useRef } from 'react';
import { registerPushToken, removePushToken } from '@/lib/registerPush.web';
import { isIOSMobileWebBrowser, isWebStandalone } from '@/lib/webPushEnvironment';

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

    const allowAutoPrompt = !(isIOSMobileWebBrowser() && !isWebStandalone());

    void (async () => {
      const res = await registerPushToken(userUid, { allowPrompt: allowAutoPrompt });
      if (res.token) lastTokenRef.current = res.token;
    })();
  }, [userUid, wantsPush]);

  useEffect(() => {
    if (typeof window === 'undefined' || !wantsPush || !userUid) return;

    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = () => {
      const allowAutoPrompt = !(isIOSMobileWebBrowser() && !isWebStandalone());
      void registerPushToken(userUid, { allowPrompt: allowAutoPrompt }).then((res) => {
        if (res.token) lastTokenRef.current = res.token;
      });
    };

    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [userUid, wantsPush]);
}
