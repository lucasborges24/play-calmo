import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useAppTheme } from '@/shared/theme/provider';

type AppHeaderProps = {
  title: string;
  right?: ReactNode;
};

export function AppHeader({ title, right }: AppHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingBottom: 12,
      }}
    >
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>{title}</Text>
      {right ? <View style={{ flexDirection: 'row', gap: 8 }}>{right}</View> : null}
    </View>
  );
}
