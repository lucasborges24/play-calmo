import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme/provider';

const DEFAULT_REVEAL_OFFSET = 280;
const DEFAULT_DIRECTION_THRESHOLD = 10;
const DEFAULT_TOP_HIDE_OFFSET = 72;

type ScrollToTopButtonProps = {
  onPress: () => void;
  visible: boolean;
};

type UseScrollToTopButtonVisibilityOptions = {
  directionThreshold?: number;
  revealOffset?: number;
  topHideOffset?: number;
};

export function useScrollToTopButtonVisibility(
  options: UseScrollToTopButtonVisibilityOptions = {},
) {
  const directionThreshold = options.directionThreshold ?? DEFAULT_DIRECTION_THRESHOLD;
  const revealOffset = options.revealOffset ?? DEFAULT_REVEAL_OFFSET;
  const topHideOffset = options.topHideOffset ?? DEFAULT_TOP_HIDE_OFFSET;
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const lastOffsetRef = useRef(0);

  const setVisibility = (nextValue: boolean) => {
    if (isVisibleRef.current === nextValue) {
      return;
    }

    isVisibleRef.current = nextValue;
    setIsVisible(nextValue);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = Math.max(0, event.nativeEvent.contentOffset.y);
    const delta = offsetY - lastOffsetRef.current;

    if (offsetY <= topHideOffset) {
      setVisibility(false);
      lastOffsetRef.current = offsetY;
      return;
    }

    if (offsetY >= revealOffset && delta <= -directionThreshold) {
      setVisibility(true);
    } else if (delta >= directionThreshold) {
      setVisibility(false);
    }

    lastOffsetRef.current = offsetY;
  };

  return {
    handleScroll,
    hide: () => setVisibility(false),
    isVisible,
  };
}

export function ScrollToTopButton({ onPress, visible }: ScrollToTopButtonProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        duration: visible ? 180 : 140,
        toValue: visible ? 1 : 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        damping: 18,
        mass: 0.9,
        stiffness: 240,
        toValue: visible ? 0 : 12,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        damping: 18,
        mass: 0.9,
        stiffness: 260,
        toValue: visible ? 1 : 0.96,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, translateY, visible]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        alignItems: 'center',
        bottom: Math.max(insets.bottom, 12) + 88,
        left: 0,
        position: 'absolute',
        right: 0,
      }}
    >
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={{
          opacity,
          transform: [{ translateY }, { scale }],
        }}
      >
        <Pressable
          accessibilityHint="Volta a lista para o começo"
          accessibilityLabel="Voltar ao topo"
          accessibilityRole="button"
          hitSlop={4}
          onPress={onPress}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: pressed ? theme.surfaceAlt : theme.surface,
            borderColor: theme.border,
            borderRadius: 999,
            borderWidth: 1,
            elevation: 10,
            flexDirection: 'row',
            gap: 6,
            justifyContent: 'center',
            minHeight: 38,
            paddingHorizontal: 14,
            paddingVertical: 10,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: theme.dark ? 0.24 : 0.14,
            shadowRadius: 16,
          })}
        >
          <Ionicons color={theme.textSoft} name="chevron-up" size={14} />
          <Text
            className="text-[12px] font-bold uppercase tracking-[1.2px]"
            style={{ color: theme.textSoft }}
          >
            Topo
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
