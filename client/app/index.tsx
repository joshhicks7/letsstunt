import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { authReady, user, onboardingComplete } = useAuth();
  useEffect(() => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        console.log('Service Worker supported');
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.error('SW registration failed:', err));
        });
      }
    }, []);

  useEffect(() => {
    if (!authReady) return;
    const t = setTimeout(() => {
      if (!user) {
        router.replace('/(auth)/welcome');
        return;
      }
      if (!onboardingComplete) {
        router.replace('/(onboarding)');
        return;
      }
      router.replace('/(tabs)/discover');
    }, 0);
    return () => clearTimeout(t);
  }, [authReady, user, onboardingComplete]);

  return <View style={{ flex: 1 }} />;
}
