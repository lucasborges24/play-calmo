import type { VideoWithPosition } from '@/db/queries/daily-plan';

export type BackgroundCapability = 'off' | 'pip' | 'full';

function readCapability(): BackgroundCapability {
  const raw = (process.env.EXPO_PUBLIC_BACKGROUND_PLAYBACK ?? 'off').toLowerCase();
  if (raw === 'pip' || raw === 'full') {
    return raw;
  }
  return 'off';
}

const capability: BackgroundCapability = readCapability();

export function getBackgroundCapability(): BackgroundCapability {
  return capability;
}

export function isPipAllowed(_video: Pick<VideoWithPosition, 'videoId'> | null): boolean {
  if (!_video) return false;
  return capability === 'pip' || capability === 'full';
}

export function isAudioBackgroundAllowed(_video: Pick<VideoWithPosition, 'videoId'> | null): boolean {
  if (!_video) return false;
  return capability === 'full';
}
