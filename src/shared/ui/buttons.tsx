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
        backgroundColor: disabled ? theme.surfaceMuted : pressed ? theme.primaryPressed : theme.primary,
        opacity: disabled ? 0.55 : 1,
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
        backgroundColor: pressed ? theme.surfaceMuted : theme.surfaceAlt,
        borderColor: theme.border,
        borderWidth: 1,
        opacity: disabled ? 0.5 : 1,
      })}
    >
      {loading ? <ActivityIndicator color={theme.textSoft} size="small" /> : null}
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
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        opacity: disabled ? 0.45 : 1,
        paddingHorizontal: 8,
      }}
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-[14px] font-semibold" style={{ color: theme.primary }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
