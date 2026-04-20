import { ActivityIndicator } from 'react-native';

import { useAppTheme } from '@/shared/theme/provider';

type SpinnerSize = 'sm' | 'md' | 'lg';

type SpinnerProps = {
  size?: SpinnerSize;
  color?: string;
};

const SIZE_MAP: Record<SpinnerSize, number> = { sm: 16, md: 24, lg: 36 };

export function Spinner({ color, size = 'md' }: SpinnerProps) {
  const { theme } = useAppTheme();

  return (
    <ActivityIndicator
      color={color ?? theme.primary}
      size={SIZE_MAP[size]}
    />
  );
}
