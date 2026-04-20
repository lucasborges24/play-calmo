import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CalendarCheck, Library, Rss, Settings } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme/provider';

const TAB_CONFIG: Record<string, { Icon: LucideIcon; label: string }> = {
  index: { Icon: CalendarCheck, label: 'Hoje' },
  subscriptions: { Icon: Rss, label: 'Inscrições' },
  library: { Icon: Library, label: 'Biblioteca' },
  settings: { Icon: Settings, label: 'Configurações' },
};

export function FloatingTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  return (
    <View
      pointerEvents="box-none"
      style={{
        bottom: 0,
        left: 0,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingHorizontal: 16,
        paddingTop: 12,
        position: 'absolute',
        right: 0,
      }}
    >
      <View
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.borderStrong,
          borderRadius: 30,
          borderWidth: 1,
          elevation: 12,
          flexDirection: 'row',
          padding: 8,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: theme.dark ? 0.35 : 1,
          shadowRadius: 24,
        }}
      >
        {state.routes.map((route, index) => {
          const tab = TAB_CONFIG[route.name];
          if (!tab) return null;

          const isFocused = state.index === index;
          const { Icon, label } = tab;
          const accessibilityLabel = descriptors[route.key]?.options.tabBarAccessibilityLabel;

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
            <Pressable
              key={route.key}
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onLongPress={() => navigation.emit({ target: route.key, type: 'tabLongPress' })}
              onPress={onPress}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: isFocused || pressed ? theme.surfaceAlt : 'transparent',
                borderRadius: 24,
                flex: 1,
                gap: 4,
                justifyContent: 'center',
                minHeight: 60,
                paddingHorizontal: 8,
                paddingVertical: 10,
              })}
            >
              <Icon color={isFocused ? theme.primary : theme.textSoft} size={20} />
              <Text
                style={{
                  color: isFocused ? theme.text : theme.textSoft,
                  fontSize: 11,
                  fontWeight: isFocused ? '700' : '500',
                }}
              >
                {label}
              </Text>
              <View
                style={{
                  backgroundColor: isFocused ? theme.primary : 'transparent',
                  borderRadius: 999,
                  height: 4,
                  width: isFocused ? 20 : 4,
                }}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
