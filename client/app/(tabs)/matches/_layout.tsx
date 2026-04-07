import { useFocusEffect } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useCallback } from 'react';
import { useSwipe } from '@/context/SwipeContext';

export default function MatchesLayout() {
  const { clearUnseenMatches } = useSwipe();

  useFocusEffect(
    useCallback(() => {
      clearUnseenMatches();
    }, [clearUnseenMatches]),
  );

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[matchId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
