import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme/provider';

type AppScrollScreenProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

type PanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type ScreenHeaderProps = {
  eyebrow?: string;
  subtitle: string;
  title: string;
  trailing?: ReactNode;
};

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  detail?: string;
};

type TagTone = 'accent' | 'neutral' | 'primary' | 'success';

type TagProps = {
  active?: boolean;
  detail?: string;
  label: string;
  onPress?: () => void;
  tone?: TagTone;
};

type MetricCardProps = {
  accent?: string;
  hint: string;
  label: string;
  value: string;
};

export function AppScrollScreen({ children, contentContainerStyle }: AppScrollScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  return (
    <SafeAreaView edges={['left', 'right']} style={{ backgroundColor: theme.background, flex: 1 }}>
      <View style={{ backgroundColor: theme.background, flex: 1 }}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View
            style={{
              backgroundColor: theme.primarySoft,
              borderRadius: 180,
              height: 180,
              position: 'absolute',
              right: -60,
              top: -20,
              width: 180,
            }}
          />
          <View
            style={{
              backgroundColor: theme.accentSoft,
              borderRadius: 160,
              height: 160,
              left: -70,
              position: 'absolute',
              top: 140,
              width: 160,
            }}
          />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={[
            {
              gap: 18,
              paddingBottom: insets.bottom + 116,
              paddingHorizontal: 20,
              paddingTop: insets.top + 14,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export function Panel({ children, style }: PanelProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderRadius: 28,
          borderWidth: 1,
          padding: 18,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: theme.dark ? 0.28 : 1,
          shadowRadius: 18,
          elevation: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ScreenHeader({ eyebrow, subtitle, title, trailing }: ScreenHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View className="flex-row items-start gap-4">
      <View className="flex-1 gap-3">
        {eyebrow ? <Tag label={eyebrow} tone="accent" /> : null}
        <View className="gap-3">
          <Text className="text-[30px] font-extrabold leading-[36px]" style={{ color: theme.text }}>
            {title}
          </Text>
          <Text className="text-[15px] leading-7" style={{ color: theme.textSoft }}>
            {subtitle}
          </Text>
        </View>
      </View>
      {trailing}
    </View>
  );
}

export function SectionHeading({ eyebrow, title, detail }: SectionHeadingProps) {
  const { theme } = useAppTheme();

  return (
    <View className="gap-2">
      {eyebrow ? (
        <Text className="text-[11px] font-bold uppercase tracking-[2px]" style={{ color: theme.textMuted }}>
          {eyebrow}
        </Text>
      ) : null}
      <View className="flex-row items-end justify-between gap-4">
        <Text className="flex-1 text-[20px] font-extrabold leading-[26px]" style={{ color: theme.text }}>
          {title}
        </Text>
        {detail ? (
          <Text className="text-[12px] font-semibold" style={{ color: theme.textSoft }}>
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function Tag({ active = true, detail, label, onPress, tone = 'neutral' }: TagProps) {
  const { theme } = useAppTheme();
  const paletteByTone: Record<TagTone, { background: string; text: string }> = {
    accent: {
      background: theme.accentSoft,
      text: theme.text,
    },
    neutral: {
      background: theme.surfaceAlt,
      text: theme.textSoft,
    },
    primary: {
      background: active ? theme.primary : theme.primarySoft,
      text: active ? '#FFFFFF' : theme.primary,
    },
    success: {
      background: active ? theme.successSoft : theme.surfaceAlt,
      text: active ? theme.success : theme.textSoft,
    },
  };

  const colors = paletteByTone[tone];

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed && onPress ? theme.surfaceMuted : colors.background,
        borderColor: tone === 'neutral' ? theme.border : 'transparent',
        borderRadius: 999,
        borderWidth: tone === 'neutral' ? 1 : 0,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minHeight: 36,
        opacity: active ? 1 : 0.8,
        paddingHorizontal: 14,
        paddingVertical: 8,
      })}
    >
      <Text className="text-[12px] font-semibold" style={{ color: colors.text }}>
        {label}
      </Text>
      {detail ? (
        <Text className="text-[11px] font-medium" style={{ color: theme.textMuted }}>
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function MetricCard({ accent, hint, label, value }: MetricCardProps) {
  const { theme } = useAppTheme();

  return (
    <View
      className="flex-1 rounded-[22px] p-4"
      style={{
        backgroundColor: theme.surfaceAlt,
        borderColor: theme.border,
        borderWidth: 1,
      }}
    >
      <View className="mb-4 h-1.5 w-12 rounded-full" style={{ backgroundColor: accent ?? theme.primary }} />
      <Text className="text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: theme.textMuted }}>
        {label}
      </Text>
      <Text className="mt-3 text-[22px] font-extrabold" style={{ color: theme.text }}>
        {value}
      </Text>
      <Text className="mt-2 text-[12px] leading-5" style={{ color: theme.textSoft }}>
        {hint}
      </Text>
    </View>
  );
}
