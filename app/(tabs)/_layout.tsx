import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '../../src/constants';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray200,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🫀" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="simulator"
        options={{
          title: 'Simulator',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="debate"
        options={{
          title: 'Debate',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏛️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="labs"
        options={{
          title: 'Log Labs',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧪" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Summary',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
