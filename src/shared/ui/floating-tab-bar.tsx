import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CalendarCheck, Library, Rss, Settings } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme/provider';

const TAB_CONFIG: Record<string, { Icon: LucideIcon; label: string; compactLabel?: string }> = {
  index: { Icon: CalendarCheck, label: 'Hoje' },
  subscriptions: { Icon: Rss, label: 'Inscrições', compactLabel: 'Inscr.' },
  library: { Icon: Library, label: 'Biblioteca', compactLabel: 'Bibli.' },
  settings: { Icon: Settings, label: 'Configurações', compactLabel: 'Config.' },
};

export function FloatingTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();
  const isCompact = width <= 430;
  const isUltraCompact = width <= 390;
  const outerHorizontalPadding = isUltraCompact ? 10 : isCompact ? 12 : 16;
  const innerPadding = isUltraCompact ? 6 : 8;
  const itemGap = isUltraCompact ? 2 : isCompact ? 3 : 4;
  const itemHorizontalPadding = isUltraCompact ? 4 : isCompact ? 6 : 8;
  const itemVerticalPadding = isUltraCompact ? 8 : 10;
  const itemMinHeight = isUltraCompact ? 56 : 60;
  const labelFontSize = isUltraCompact ? 9 : isCompact ? 10 : 11;
  const iconSize = isUltraCompact ? 18 : 20;
  const indicatorWidth = isCompact ? 16 : 20;
  const visibleRoutes = state.routes.filter((route) => Boolean(TAB_CONFIG[route.name]));
  const slotFlex = 1 / Math.max(visibleRoutes.length, 1);

  return (
    <View
      pointerEvents="box-none"
      style={{
        bottom: 0,
        left: 0,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingHorizontal: outerHorizontalPadding,
        paddingTop: isCompact ? 10 : 12,
        position: 'absolute',
        right: 0,
      }}
    >
      <View
        style={{
          alignSelf: 'stretch',
          alignItems: 'stretch',
          backgroundColor: theme.surface,
          borderColor: theme.borderStrong,
          borderRadius: 30,
          borderWidth: 1,
          elevation: 12,
          flexDirection: 'row',
          padding: innerPadding,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: theme.dark ? 0.35 : 1,
          shadowRadius: 24,
          width: '100%',
        }}
      >
        {visibleRoutes.map((route, index) => {
          const tab = TAB_CONFIG[route.name];
          if (!tab) return null;

          const isFocused = state.index === index;
          const { Icon } = tab;
          const label = isCompact && tab.compactLabel ? tab.compactLabel : tab.label;
          const accessibilityLabel = descriptors[route.key]?.options.tabBarAccessibilityLabel ?? tab.label;

          const onPress = () => {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: 'tabPress',
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <View key={route.key} style={{ flex: slotFlex }}>
              <Pressable
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onLongPress={() => navigation.emit({ target: route.key, type: 'tabLongPress' })}
                onPress={onPress}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: isFocused || pressed ? theme.surfaceAlt : 'transparent',
                  borderRadius: 24,
                  justifyContent: 'center',
                  minHeight: itemMinHeight,
                  minWidth: 0,
                  overflow: 'hidden',
                  paddingHorizontal: itemHorizontalPadding,
                  paddingVertical: itemVerticalPadding,
                  width: '100%',
                })}
              >
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    width: '100%',
                  }}
                >
                  <Icon color={isFocused ? theme.primary : theme.textSoft} size={iconSize} />
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: itemGap,
                      maxWidth: '100%',
                      minWidth: 0,
                      paddingHorizontal: 2,
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      ellipsizeMode="tail"
                      maxFontSizeMultiplier={1}
                      numberOfLines={1}
                      style={{
                        color: isFocused ? theme.text : theme.textSoft,
                        fontSize: labelFontSize,
                        fontWeight: isFocused ? '700' : '500',
                        lineHeight: labelFontSize + 2,
                        textAlign: 'center',
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: isFocused ? theme.primary : 'transparent',
                      borderRadius: 999,
                      height: 4,
                      marginTop: itemGap,
                      width: isFocused ? indicatorWidth : 4,
                    }}
                  />
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
