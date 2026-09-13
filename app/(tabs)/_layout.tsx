import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
const TABS: TabBarItem[] = [
  {
    name: 'analyze',
    route: '/(tabs)/(analyze)',
    icon: 'search',
    label: 'Analyze',
  },
  {
    name: 'history',
    route: '/(tabs)/(history)',
    icon: 'history',
    label: 'History',
  },
  {
    name: 'settings',
    route: '/(tabs)/(settings)',
    icon: 'settings',
    label: 'Settings',
  },
];

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Slot />
      <FloatingTabBar
        tabs={TABS}
        containerWidth={260}
        borderRadius={35}
        bottomMargin={20}
      />
    </View>
  );
}
