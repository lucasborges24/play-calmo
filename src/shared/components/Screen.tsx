import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme/provider';

type ScreenProps = {
  children: ReactNode;
  padding?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, padding = true, style }: ScreenProps) {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={{ backgroundColor: theme.background, flex: 1 }}>
      <View
        style={[
          { backgroundColor: theme.background, flex: 1 },
          padding && { paddingHorizontal: 20, paddingTop: 16 },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
