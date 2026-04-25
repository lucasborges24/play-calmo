import { NativeModules, Platform } from 'react-native';

import { warn as logWarn } from '@/shared/lib/logger';

type PlaybackBridgeModule = {
  enterPictureInPicture: (aspectWidth: number, aspectHeight: number) => Promise<boolean>;
  setAutoEnterPip: (enabled: boolean) => Promise<boolean>;
  startPlaybackService: (title: string, subtitle: string) => Promise<boolean>;
  stopPlaybackService: () => Promise<boolean>;
  isPictureInPictureSupported: () => Promise<boolean>;
};

const native: PlaybackBridgeModule | null =
  Platform.OS === 'android' ? (NativeModules.PlaybackBridge ?? null) : null;

export async function enterPictureInPicture(): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.enterPictureInPicture(16, 9);
  } catch (err) {
    logWarn('enterPictureInPicture failed', { err });
    return false;
  }
}

export async function setAutoEnterPip(enabled: boolean): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.setAutoEnterPip(enabled);
  } catch (err) {
    logWarn('setAutoEnterPip failed', { err });
    return false;
  }
}

export async function startPlaybackService(title: string, subtitle: string): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.startPlaybackService(title, subtitle);
  } catch (err) {
    logWarn('startPlaybackService failed', { err });
    return false;
  }
}

export async function stopPlaybackService(): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.stopPlaybackService();
  } catch (err) {
    logWarn('stopPlaybackService failed', { err });
    return false;
  }
}

export async function isPictureInPictureSupported(): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.isPictureInPictureSupported();
  } catch {
    return false;
  }
}
