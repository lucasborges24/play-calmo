import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useAppTheme } from '@/shared/theme/provider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

const SIZES: Record<ButtonSize, { fontSize: number; minHeight: number; paddingH: number; paddingV: number }> = {
  sm: { fontSize: 13, minHeight: 36, paddingH: 14, paddingV: 8 },
  md: { fontSize: 14, minHeight: 48, paddingH: 18, paddingV: 12 },
  lg: { fontSize: 16, minHeight: 56, paddingH: 24, paddingV: 15 },
};

export function Button({
  disabled,
  fullWidth,
  label,
  loading,
  onPress,
  size = 'md',
  variant = 'primary',
}: ButtonProps) {
  const { theme } = useAppTheme();
  const s = SIZES[size];

  const colors: Record<
    ButtonVariant,
    { bg: string; bgPressed: string; text: string; border?: string; shadow?: boolean }
  > = {
    primary: {
      bg: theme.primaryPressed,
      bgPressed: theme.primary,
      text: '#FFFFFF',
      border: theme.primaryPressed,
      shadow: true,
    },
    secondary: {
      bg: theme.surface,
      bgPressed: theme.primarySoft,
      border: theme.borderStrong,
      text: theme.text,
    },
    ghost: {
      bg: theme.surface,
      bgPressed: theme.primarySoft,
      border: theme.primary,
      text: theme.primary,
    },
    destructive: {
      bg: theme.primaryPressed,
      bgPressed: theme.primary,
      text: '#FFFFFF',
      border: theme.primaryPressed,
      shadow: true,
    },
  };

  const c = colors[variant];

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? c.bgPressed : c.bg,
        borderColor: c.border,
        borderRadius: 14,
        borderWidth: c.border ? 1 : 0,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        minHeight: s.minHeight,
        opacity: disabled ? 0.5 : 1,
        paddingHorizontal: s.paddingH,
        paddingVertical: s.paddingV,
        shadowColor: c.shadow && !disabled ? theme.shadow : undefined,
        shadowOffset: c.shadow ? { width: 0, height: 10 } : undefined,
        shadowOpacity: c.shadow && !disabled ? (theme.dark ? 0.24 : 0.12) : 0,
        shadowRadius: c.shadow ? 18 : 0,
        width: fullWidth ? '100%' : undefined,
      })}
    >
      {loading ? (
        <ActivityIndicator color={c.text} size="small" />
      ) : null}
      <Text style={{ color: c.text, fontSize: s.fontSize, fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}
