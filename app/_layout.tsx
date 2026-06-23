import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAppStore } from '../src/store';

export default function RootLayout() {
  const loadAll = useAppStore(s => s.loadAll);

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
