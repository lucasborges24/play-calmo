import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';

import { warn as logWarn } from '@/shared/lib/logger';

let active = false;

export async function activateBackgroundAudio() {
  if (active) {
    return;
  }
  active = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: true,
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
    });
    await setIsAudioActiveAsync(true);
  } catch (err) {
    active = false;
    logWarn('AudioSession activate failed', { err });
  }
}

export async function deactivateBackgroundAudio() {
  if (!active) {
    return;
  }
  active = false;
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
    });
    await setIsAudioActiveAsync(false);
  } catch (err) {
    logWarn('AudioSession deactivate failed', { err });
  }
}

export function isBackgroundAudioActive() {
  return active;
}
