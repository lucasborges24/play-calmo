import { create } from 'zustand';

import type { VideoWithPosition } from '@/db/queries/daily-plan';

export type PlaybackMode = 'closed' | 'foreground' | 'pip' | 'background-audio';

interface PlaybackStore {
  video: VideoWithPosition | null;
  mode: PlaybackMode;
  open: (video: VideoWithPosition) => void;
  setMode: (mode: PlaybackMode) => void;
  close: () => void;
}

export const usePlaybackStore = create<PlaybackStore>((set) => ({
  video: null,
  mode: 'closed',
  open: (video) => set({ video, mode: 'foreground' }),
  setMode: (mode) => set({ mode }),
  close: () => set({ video: null, mode: 'closed' }),
}));

export function getPlayback() {
  return usePlaybackStore.getState();
}
