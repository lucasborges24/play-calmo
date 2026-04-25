import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { getSession } from '@/db/queries/session';
import { warn as logWarn } from '@/shared/lib/logger';
import { bootstrapSession } from './session';

const RESUME_DEBOUNCE_MS = 30_000;

export function useSessionBootstrap() {
  const [ready, setReady] = useState(false);
  const lastResumeAtRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const runInitialBootstrap = async () => {
      try {
        const session = await getSession();

        if (session) {
          if (!cancelled) {
            setReady(true);
          }

          void bootstrapSession().catch((error: unknown) => {
            logWarn('Background session bootstrap failed', { source: 'initial', error });
          });
          return;
        }

        await bootstrapSession();
      } catch (error) {
        logWarn('Initial session bootstrap failed', { error });
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    };

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        return;
      }

      const now = Date.now();
      if (now - lastResumeAtRef.current < RESUME_DEBOUNCE_MS) {
        return;
      }
      lastResumeAtRef.current = now;

      try {
        await bootstrapSession();
      } catch (error) {
        logWarn('Resume session bootstrap failed', { error });
      }
    };

    void runInitialBootstrap();

    const subscription = AppState.addEventListener('change', (state) => {
      void handleAppStateChange(state);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return ready;
}
