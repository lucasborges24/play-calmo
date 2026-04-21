import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { getSettings } from '@/db/queries/settings';
import { useSession } from '@/features/auth/session';
import { warn as logWarn } from '@/shared/lib/logger';
import { runFetchVideosJob } from './fetch-videos-job';

const STALE_THRESHOLD_MS = 20 * 3600 * 1000;
const DEBOUNCE_MS = 60 * 1000;

export function useForegroundCatchUp() {
  const session = useSession();
  const lastActiveAtRef = useRef<number>(0);

  useEffect(() => {
    if (!session) {
      return;
    }

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        return;
      }

      const now = Date.now();
      if (now - lastActiveAtRef.current < DEBOUNCE_MS) {
        return;
      }
      lastActiveAtRef.current = now;

      try {
        const settings = await getSettings();
        const isStale = !settings.lastJobRunAt || now - settings.lastJobRunAt > STALE_THRESHOLD_MS;
        if (isStale) {
          void runFetchVideosJob('foreground-catch-up');
        }
      } catch (error) {
        logWarn('Foreground catch-up check failed', { error });
      }
    };

    const subscription = AppState.addEventListener('change', (state) => {
      void handleAppStateChange(state);
    });

    return () => subscription.remove();
  }, [session]);
}
