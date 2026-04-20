import { Redirect, Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/features/auth/session';
import { DemoStoreProvider } from '@/shared/state/demo-store';

export default function AppLayout() {
  const session = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return <View style={{ flex: 1 }} />;
  if (!session) return <Redirect href="/sign-in" />;

  return (
    <DemoStoreProvider>
      <Slot />
    </DemoStoreProvider>
  );
}
