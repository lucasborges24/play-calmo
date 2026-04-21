import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/shared/theme/provider';

type Option<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  value: T;
};

export function SegmentedControl<T extends string>({
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: theme.surfaceAlt,
        borderColor: theme.borderStrong,
        borderRadius: 24,
        borderWidth: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        padding: 4,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: active
                ? pressed
                  ? theme.primaryPressed
                  : theme.primary
                : pressed
                  ? theme.surfaceMuted
                  : theme.surface,
              borderColor: active ? theme.primary : theme.borderStrong,
              borderRadius: 20,
              borderWidth: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              minHeight: 44,
              paddingHorizontal: 18,
              paddingVertical: 10,
              shadowColor: active ? theme.primary : theme.shadow,
              shadowOffset: {
                width: 0,
                height: active ? 6 : 0,
              },
              shadowOpacity: active ? (theme.dark ? 0.34 : 0.14) : 0,
              shadowRadius: active ? 12 : 0,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              elevation: active ? 3 : 0,
            })}
          >
            <Text
              numberOfLines={1}
              style={{
                color: active ? '#FFFFFF' : theme.text,
                fontSize: 15,
                fontWeight: active ? '800' : '700',
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
