import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/shared/theme/provider';

type ButtonProps = {
  fullWidth?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  disabled?: boolean;
};

function baseStyle(fullWidth?: boolean): ViewStyle {
  return {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    width: fullWidth ? '100%' : undefined,
  };
}

export function PrimaryButton({ label, onPress, disabled, loading, fullWidth }: ButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        ...baseStyle(fullWidth),
        backgroundColor: disabled ? theme.surfaceMuted : pressed ? theme.primary : theme.primaryPressed,
        borderColor: disabled ? theme.border : theme.primaryPressed,
        borderWidth: 1,
        opacity: disabled ? 0.55 : 1,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: disabled ? 0 : theme.dark ? 0.24 : 0.12,
        shadowRadius: 18,
      })}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
      <Text className="text-[14px] font-bold" style={{ color: disabled ? theme.textMuted : '#FFFFFF' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, loading, fullWidth }: ButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        ...baseStyle(fullWidth),
        backgroundColor: disabled ? theme.surfaceMuted : pressed ? theme.primarySoft : theme.surface,
        borderColor: pressed ? theme.primary : theme.borderStrong,
        borderWidth: 1,
        opacity: disabled ? 0.5 : 1,
      })}
    >
      {loading ? <ActivityIndicator color={theme.primary} size="small" /> : null}
      <Text className="text-[14px] font-semibold" style={{ color: theme.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TertiaryButton({ label, onPress, disabled }: ButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: disabled ? theme.surfaceMuted : pressed ? theme.primarySoft : theme.surface,
        borderColor: theme.primary,
        borderRadius: 14,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 48,
        opacity: disabled ? 0.45 : 1,
        paddingHorizontal: 16,
      })}
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-[14px] font-semibold" style={{ color: theme.primary }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
