import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, onboardingComplete } = useAuth();

  useEffect(() => {
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
  }, [user, onboardingComplete]);

  return <View style={{ flex: 1 }} />;
}
