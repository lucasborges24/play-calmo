import { Slot } from 'expo-router';

import { DemoStoreProvider } from '@/shared/state/demo-store';

export default function AppLayout() {
  return (
    <DemoStoreProvider>
      <Slot />
    </DemoStoreProvider>
  );
}
