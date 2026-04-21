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
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: active
                ? theme.primary
                : pressed
                  ? theme.surfaceMuted
                  : theme.surfaceAlt,
              borderColor: active ? theme.primary : theme.border,
              borderRadius: 999,
              borderWidth: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              minHeight: 44,
              paddingHorizontal: 18,
              paddingVertical: 10,
            })}
          >
            <Text
              numberOfLines={1}
              style={{
                color: active ? '#FFFFFF' : theme.text,
                fontSize: 15,
                fontWeight: active ? '700' : '600',
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
