import { addBreadcrumb, setTag } from '@sentry/react-native';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import {
  enterPictureInPicture,
  setAutoEnterPip,
  startPlaybackService,
  stopPlaybackService,
} from './native-bridge';
import {
  getBackgroundCapability,
  isAudioBackgroundAllowed,
  isPipAllowed,
} from './product-rule';
import { getPlayback, usePlaybackStore } from './store';

setTag('playback.capability', getBackgroundCapability());

export function useBackgroundPlayback() {
  const lastStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleChange = async (next: AppStateStatus) => {
      const previous = lastStateRef.current;
      lastStateRef.current = next;

      const { video, mode, setMode } = getPlayback();
      if (!video) {
        if (next === 'active' && mode !== 'closed') {
          setMode('foreground');
        }
        return;
      }

      if (next === 'active') {
        await stopPlaybackService();
        setMode('foreground');
        setTag('playback.mode', 'foreground');
        addBreadcrumb({
          category: 'playback',
          message: 'foreground',
          level: 'info',
          data: { videoId: video.videoId, from: previous },
        });
        return;
      }

      if (next === 'background' || next === 'inactive') {
        const audioAllowed = isAudioBackgroundAllowed(video);
        const pipAllowed = isPipAllowed(video);

        if (Platform.OS === 'android' && pipAllowed && next === 'inactive') {
          const entered = await enterPictureInPicture();
          if (entered) {
            setMode('pip');
            setTag('playback.mode', 'pip');
            addBreadcrumb({
              category: 'playback',
              message: 'pip',
              level: 'info',
              data: { videoId: video.videoId, platform: 'android' },
            });
            return;
          }
        }

        if (audioAllowed) {
          if (Platform.OS === 'android') {
            await startPlaybackService(video.title, video.channelTitle ?? '');
          }
          setMode('background-audio');
          setTag('playback.mode', 'background-audio');
          addBreadcrumb({
            category: 'playback',
            message: 'background-audio',
            level: 'info',
            data: { videoId: video.videoId, platform: Platform.OS },
          });
          return;
        }

        addBreadcrumb({
          category: 'playback',
          message: 'background-pause',
          level: 'info',
          data: { videoId: video.videoId, platform: Platform.OS },
        });
      }
    };

    const subscription = AppState.addEventListener('change', (state) => {
      void handleChange(state);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    return usePlaybackStore.subscribe((state, prev) => {
      if (prev.video && !state.video) {
        void stopPlaybackService();
        void setAutoEnterPip(false);
        addBreadcrumb({
          category: 'playback',
          message: 'closed',
          level: 'info',
          data: { videoId: prev.video.videoId },
        });
      }
      if (!prev.video && state.video) {
        const pipAllowed = isPipAllowed(state.video);
        if (pipAllowed) {
          void setAutoEnterPip(true);
        }
        addBreadcrumb({
          category: 'playback',
          message: 'open',
          level: 'info',
          data: { videoId: state.video.videoId, pipAllowed },
        });
      }
    });
  }, []);
}
