import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useDemoStore } from '@/shared/state/demo-store';
import { useAppTheme } from '@/shared/theme/provider';
import {
  AppScrollScreen,
  Panel,
  ScreenHeader,
  SectionHeading,
  Tag,
} from '@/shared/ui/layout';

export default function ExploreScreen() {
  const { collections } = useDemoStore();
  const { theme } = useAppTheme();

  return (
    <AppScrollScreen>
      <ScreenHeader
        eyebrow="Rota reserva"
        subtitle="Ela continua fora da barra de abas, mas agora já segue o mesmo sistema visual caso precise entrar no produto depois."
        title="Coleções exploratórias prontas para crescer."
      />

      <SectionHeading eyebrow="Possibilidades" title="Referências de expansão do layout" />

      <View className="gap-4">
        {collections.map((collection) => (
          <Panel key={collection.id} style={{ gap: 16 }}>
            <View
              className="overflow-hidden rounded-[24px] p-5"
              style={{ backgroundColor: collection.accent }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  borderRadius: 120,
                  height: 120,
                  position: 'absolute',
                  right: -40,
                  top: -35,
                  width: 120,
                }}
              />
              <Tag label={collection.eyebrow} tone="primary" />
              <Text className="mt-5 text-[24px] font-extrabold text-white">
                {collection.title}
              </Text>
              <Text className="mt-3 text-[14px] leading-6 text-white/80">
                {collection.description}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View
                  className="items-center justify-center rounded-[16px]"
                  style={{ backgroundColor: theme.accentSoft, height: 40, width: 40 }}
                >
                  <Ionicons color={theme.text} name="albums-outline" size={20} />
                </View>
                <Text className="text-[13px] font-semibold" style={{ color: theme.text }}>
                  {collection.countLabel}
                </Text>
              </View>
              <Text className="text-[12px]" style={{ color: theme.textSoft }}>
                Mantida fora do menu principal
              </Text>
            </View>
          </Panel>
        ))}
      </View>
    </AppScrollScreen>
  );
}
