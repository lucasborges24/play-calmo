import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme/provider';

const TAB_CONFIG = {
  index: {
    icon: 'sparkles',
    label: 'Hoje',
  },
  inscricoes: {
    icon: 'logo-youtube',
    label: 'Inscrições',
  },
  biblioteca: {
    icon: 'library',
    label: 'Biblioteca',
  },
  configuracoes: {
    icon: 'settings',
    label: 'Config',
  },
} as const;

type RouteName = keyof typeof TAB_CONFIG;

function isConfiguredRoute(name: string): name is RouteName {
  return name in TAB_CONFIG;
}

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
        className="flex-row rounded-[30px] p-2"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.borderStrong,
          borderWidth: 1,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: theme.dark ? 0.35 : 1,
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        {state.routes.map((route, index) => {
          if (!isConfiguredRoute(route.name)) {
            return null;
          }

          const isFocused = state.index === index;
          const tab = TAB_CONFIG[route.name];
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
              onLongPress={() =>
                navigation.emit({
                  target: route.key,
                  type: 'tabLongPress',
                })
              }
              onPress={onPress}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor:
                  isFocused || pressed ? theme.surfaceAlt : 'transparent',
                borderRadius: 24,
                flex: 1,
                gap: 4,
                justifyContent: 'center',
                minHeight: 60,
                paddingHorizontal: 8,
                paddingVertical: 10,
              })}
            >
              <Ionicons
                color={isFocused ? theme.primary : theme.textSoft}
                name={tab.icon}
                size={20}
              />
              <Text
                className="text-[11px]"
                style={{
                  color: isFocused ? theme.text : theme.textSoft,
                  fontWeight: isFocused ? '700' : '500',
                }}
              >
                {tab.label}
              </Text>
              <View
                className="rounded-full"
                style={{
                  backgroundColor: isFocused ? theme.primary : 'transparent',
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
