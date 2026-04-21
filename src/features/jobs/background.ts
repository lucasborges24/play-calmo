import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { getSettings } from '@/db/queries/settings';
import { runFetchVideosJob } from './fetch-videos-job';

const TASK_NAME = 'FETCH_VIDEOS_TASK';

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const settings = await getSettings();
    if (!settings.lastJobRunAt || Date.now() - settings.lastJobRunAt > 18 * 3600 * 1000) {
      await runFetchVideosJob('background');
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetch() {
  await BackgroundFetch.registerTaskAsync(TASK_NAME, {
    minimumInterval: 6 * 3600,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterBackgroundFetch() {
  await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
}
