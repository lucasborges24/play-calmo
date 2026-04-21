import { ActivityIndicator, Modal, Text, View } from 'react-native';

import { SecondaryButton } from '@/shared/ui/buttons';
import { useAppTheme } from '@/shared/theme/provider';

type JobProgress = {
  current: number;
  total: number;
  videosAdded: number;
} | null;

type JobProgressModalProps = {
  isCancelling?: boolean;
  onCancel: () => void;
  visible: boolean;
  progress: JobProgress;
};

export function JobProgressModal({
  visible,
  progress,
  onCancel,
  isCancelling = false,
}: JobProgressModalProps) {
  const { theme } = useAppTheme();
  const current = progress?.current ?? 0;
  const total = progress?.total ?? 0;
  const videosAdded = progress?.videosAdded ?? 0;
  const progressRatio = total > 0 ? Math.min(1, current / total) : 0;

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.38)' }}
      >
        <View
          className="w-full max-w-[360px] gap-5 rounded-[28px] p-6"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
          }}
        >
          <View className="flex-row items-center gap-3">
            <ActivityIndicator color={theme.primary} size="small" />
            <View className="flex-1 gap-1">
              <Text className="text-[18px] font-extrabold" style={{ color: theme.text }}>
                {isCancelling ? 'Cancelando sincronização' : 'Buscando vídeos'}
              </Text>
              <Text className="text-[13px] leading-5" style={{ color: theme.textSoft }}>
                {isCancelling
                  ? 'A execução será encerrada assim que a etapa atual terminar.'
                  : total > 0
                  ? `${current} de ${total} etapas concluídas`
                  : 'Preparando a execução do job.'}
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <View
              className="overflow-hidden rounded-full"
              style={{ backgroundColor: theme.surfaceAlt, height: 10 }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: theme.primary,
                  width: `${progressRatio * 100}%`,
                }}
              />
            </View>
            <Text className="text-[12px] font-medium" style={{ color: theme.textMuted }}>
              {videosAdded} vídeo{videosAdded === 1 ? '' : 's'} adicionados até agora
            </Text>
          </View>

          <SecondaryButton
            disabled={isCancelling}
            fullWidth
            label={isCancelling ? 'Cancelando...' : 'Cancelar sincronização'}
            onPress={onCancel}
          />
        </View>
      </View>
    </Modal>
  );
}
