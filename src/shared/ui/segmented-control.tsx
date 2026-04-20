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
      className="flex-row rounded-[20px] p-1"
      style={{
        backgroundColor: theme.surfaceAlt,
        borderColor: theme.border,
        borderWidth: 1,
        gap: 6,
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
              backgroundColor:
                active || pressed ? theme.surface : 'transparent',
              borderRadius: 16,
              flex: 1,
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: 10,
              paddingVertical: 10,
            })}
          >
            <Text
              className="text-center text-[12px]"
              style={{
                color: active ? theme.text : theme.textSoft,
                fontWeight: active ? '700' : '500',
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
