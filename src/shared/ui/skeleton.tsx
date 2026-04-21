import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/shared/theme/provider';

type SkeletonBlockProps = {
  borderRadius?: number;
  height: number;
  style?: StyleProp<ViewStyle>;
  width?: number | `${number}%`;
};

type SkeletonTextProps = {
  gap?: number;
  lineHeight?: number;
  lines?: number;
  style?: StyleProp<ViewStyle>;
  widths?: Array<number | `${number}%`>;
};

type ListLoadingOverlayProps = {
  label?: string;
  top?: number;
};

export function SkeletonBlock({
  borderRadius = 16,
  height,
  style,
  width = '100%',
}: SkeletonBlockProps) {
  const { theme } = useAppTheme();
  const opacity = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 850 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.surfaceMuted,
          borderRadius,
          height,
          width,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonText({
  gap = 10,
  lineHeight = 12,
  lines = 3,
  style,
  widths,
}: SkeletonTextProps) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonBlock
          key={index}
          borderRadius={999}
          height={lineHeight}
          width={widths?.[index] ?? (index === lines - 1 ? '72%' : '100%')}
        />
      ))}
    </View>
  );
}

export function ListLoadingOverlay({
  label = 'Atualizando conteúdo',
  top = 12,
}: ListLoadingOverlayProps) {
  const { theme } = useAppTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.background,
            opacity: 0.12,
          },
        ]}
      />

      <View
        className="flex-row items-center gap-2 rounded-full px-3 py-2"
        style={{
          alignSelf: 'flex-end',
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
          marginRight: 20,
          marginTop: top,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: theme.dark ? 0.24 : 1,
          shadowRadius: 16,
        }}
      >
        <SkeletonBlock borderRadius={999} height={10} width={10} />
        <Text className="text-[12px] font-semibold" style={{ color: theme.textSoft }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
