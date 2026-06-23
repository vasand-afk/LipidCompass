import { Redirect } from 'expo-router';
import { useAppStore } from '../src/store';

export default function Index() {
  const { isLoaded, profile } = useAppStore();
  if (!isLoaded) return null;
  return <Redirect href={profile ? '/(tabs)/dashboard' : '/onboarding'} />;
}
