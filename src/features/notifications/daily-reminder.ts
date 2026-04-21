import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'daily-reminder';
const IDENTIFIER = 'daily-fetch-reminder';

export async function setupNotificationChannel() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lembrete diário',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const result = (await Notifications.requestPermissionsAsync()) as { granted: boolean };
  return result.granted;
}

export async function scheduleDailyReminder(hour: number) {
  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: IDENTIFIER,
    content: {
      title: 'Novos vídeos te esperam',
      body: 'Toque para atualizar sua timeline.',
      data: { action: 'run-job' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: CHANNEL_ID },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIER).catch(() => {});
}
