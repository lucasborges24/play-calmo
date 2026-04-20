import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function ScreenShell({ eyebrow, title, description, children }: ScreenShellProps) {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 24,
          gap: 16,
        }}
      >
        {eyebrow ? (
          <Text className="text-xs font-semibold uppercase tracking-[2px] text-primary-light dark:text-primary-dark">
            {eyebrow}
          </Text>
        ) : null}

        <View className="gap-3">
          <Text className="text-3xl font-bold text-foreground-light dark:text-foreground-dark">
            {title}
          </Text>
          <Text className="text-base leading-7 text-muted-light dark:text-muted-dark">
            {description}
          </Text>
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
