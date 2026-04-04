import { Stack } from 'expo-router';

export default function MatchesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[matchId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
