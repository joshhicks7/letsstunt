import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerShown: false,
        lazy: false,
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ color }) => <FontAwesome name="heart" size={22} color={color} /> }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: ({ color }) => <FontAwesome name="users" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <FontAwesome name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}
