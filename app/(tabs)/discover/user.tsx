import { Redirect } from 'expo-router';

/** `/discover/user` → own profile (same carousel + fields as Profile tab). */
export default function DiscoverUserRoute() {
  return <Redirect href="/(tabs)/profile" />;
}
