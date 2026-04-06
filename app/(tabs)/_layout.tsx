import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useSwipe } from '@/context/SwipeContext';

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { unseenMatchCount } = useSwipe();
  const insets = useSafeAreaInsets();
  const tabPadBottom = Math.max(insets.bottom, Platform.OS === 'web' ? SPACING.sm : SPACING.xs);
  const tabPadTop = SPACING.sm;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingTop: tabPadTop,
          paddingBottom: tabPadBottom,
          minHeight: 52 + tabPadTop + tabPadBottom,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs - 1,
          fontWeight: FONT_WEIGHT.semibold,
          marginTop: 2,
          marginBottom: 0,
          lineHeight: Platform.OS === 'web' ? 16 : 14,
          ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
        },
        tabBarIconStyle: { marginBottom: 0 },
        tabBarItemStyle: {
          paddingHorizontal: Platform.OS === 'web' ? SPACING.xs : SPACING.sm,
        },
        headerShown: false,
        lazy: false,
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ color }) => <FontAwesome name="heart" size={22} color={color} /> }} />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color }) => <FontAwesome name="users" size={22} color={color} />,
          tabBarBadge: unseenMatchCount > 0 ? unseenMatchCount : undefined,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <FontAwesome name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}
