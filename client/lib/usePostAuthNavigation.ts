import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { asPostAuthHref, hrefWithReturnTo, sanitizeReturnTo } from '@/lib/authRedirect';

export function usePostAuthNavigation(returnTo: string | string[] | undefined) {
  const router = useRouter();
  return useCallback(
    (result: { onboardingComplete: boolean }) => {
      const safe = sanitizeReturnTo(returnTo) ?? undefined;
      setTimeout(() => {
        if (!result.onboardingComplete) {
          router.replace(hrefWithReturnTo('/(onboarding)', safe ?? undefined));
        } else {
          router.replace(asPostAuthHref(safe ?? '/(tabs)/discover'));
        }
      }, 0);
    },
    [returnTo, router],
  );
}
