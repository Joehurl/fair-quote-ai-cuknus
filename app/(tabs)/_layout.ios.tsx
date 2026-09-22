import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs initialTab="(home)">
      <NativeTabs.Trigger name="(home)">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(analyze)">
        <Icon sf="magnifyingglass.circle.fill" />
        <Label>Analyze</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(history)">
        <Icon sf="clock.fill" />
        <Label>History</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <Icon sf="gearshape.fill" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
