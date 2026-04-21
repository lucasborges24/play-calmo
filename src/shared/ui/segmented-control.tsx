import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  type LayoutRectangle,
} from 'react-native';

import { useAppTheme } from '@/shared/theme/provider';

type Option<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlTone = 'neutral' | 'primary';

type SegmentedControlProps<T extends string> = {
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  tone?: SegmentedControlTone;
  value: T;
};

function getOptionFlexGrow(label: string) {
  return label.trim().length + 10;
}

export function SegmentedControl<T extends string>({
  onChange,
  options,
  tone = 'primary',
  value,
}: SegmentedControlProps<T>) {
  const { theme } = useAppTheme();
  const [optionLayouts, setOptionLayouts] = useState<Partial<Record<T, LayoutRectangle>>>({});
  const indicatorHeight = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorY = useRef(new Animated.Value(0)).current;

  const selectedLayout = optionLayouts[value];
  const isNeutralTone = tone === 'neutral';

  useEffect(() => {
    if (!selectedLayout) {
      return;
    }

    const animationConfig = {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    } as const;

    Animated.parallel([
      Animated.timing(indicatorX, {
        toValue: selectedLayout.x,
        ...animationConfig,
      }),
      Animated.timing(indicatorY, {
        toValue: selectedLayout.y,
        ...animationConfig,
      }),
      Animated.timing(indicatorWidth, {
        toValue: selectedLayout.width,
        ...animationConfig,
      }),
      Animated.timing(indicatorHeight, {
        toValue: selectedLayout.height,
        ...animationConfig,
      }),
    ]).start();
  }, [
    indicatorHeight,
    indicatorWidth,
    indicatorX,
    indicatorY,
    selectedLayout,
  ]);

  return (
    <View
      style={{
        backgroundColor: isNeutralTone ? theme.surfaceAlt : theme.surface,
        borderColor: theme.border,
        borderRadius: 24,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 3,
        padding: 5,
        position: 'relative',
      }}
    >
      {selectedLayout ? (
        <Animated.View
          pointerEvents="none"
          style={{
            backgroundColor: isNeutralTone ? theme.surface : theme.primary,
            borderColor: isNeutralTone ? theme.border : theme.primary,
            borderRadius: 20,
            borderWidth: 1,
            elevation: selectedLayout ? 3 : 0,
            height: indicatorHeight,
            left: indicatorX,
            opacity: 1,
            position: 'absolute',
            shadowColor: isNeutralTone ? theme.shadow : theme.primary,
            shadowOffset: {
              width: 0,
              height: isNeutralTone ? 8 : 6,
            },
            shadowOpacity: isNeutralTone
              ? theme.dark
                ? 0.2
                : 0.1
              : theme.dark
                ? 0.34
                : 0.14,
            shadowRadius: isNeutralTone ? 14 : 12,
            top: indicatorY,
            width: indicatorWidth,
          }}
        />
      ) : null}

      {options.map((option) => {
        const active = option.value === value;
        const optionFlexGrow = getOptionFlexGrow(option.label);

        return (
          <View
            key={option.value}
            onLayout={({ nativeEvent }) => {
              const nextLayout = nativeEvent.layout;

              setOptionLayouts((currentLayouts) => {
                const currentLayout = currentLayouts[option.value];

                if (
                  currentLayout &&
                  currentLayout.height === nextLayout.height &&
                  currentLayout.width === nextLayout.width &&
                  currentLayout.x === nextLayout.x &&
                  currentLayout.y === nextLayout.y
                ) {
                  return currentLayouts;
                }

                return {
                  ...currentLayouts,
                  [option.value]: nextLayout,
                };
              });
            }}
            style={{
              flexBasis: 0,
              flexGrow: optionFlexGrow,
              minWidth: 0,
              zIndex: 1,
            }}
          >
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed && !active ? theme.surfaceMuted : 'transparent',
                borderRadius: 20,
                justifyContent: 'center',
                minHeight: 52,
                paddingHorizontal: 12,
                paddingVertical: 10,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              })}
            >
              <Text
                allowFontScaling={false}
                numberOfLines={2}
                style={{
                  color: active
                    ? isNeutralTone
                      ? theme.text
                      : '#FFFFFF'
                    : theme.textSoft,
                  fontSize: 12,
                  fontWeight: '700',
                  includeFontPadding: false,
                  lineHeight: 15,
                  maxWidth: '100%',
                  textAlign: 'center',
                  textAlignVertical: 'center',
                  width: '100%',
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
