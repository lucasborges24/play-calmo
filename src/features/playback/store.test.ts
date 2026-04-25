import type { VideoWithPosition } from '@/db/queries/daily-plan';
import { usePlaybackStore } from './store';

const fakeVideo = {
  videoId: 'abc',
  title: 'Vídeo de teste',
  channelTitle: 'Canal',
} as unknown as VideoWithPosition;

describe('playback store', () => {
  beforeEach(() => {
    usePlaybackStore.setState({ video: null, mode: 'closed' });
  });

  it('opens a video in foreground mode', () => {
    usePlaybackStore.getState().open(fakeVideo);
    const state = usePlaybackStore.getState();
    expect(state.video).toBe(fakeVideo);
    expect(state.mode).toBe('foreground');
  });

  it('transitions through modes via setMode', () => {
    usePlaybackStore.getState().open(fakeVideo);
    usePlaybackStore.getState().setMode('pip');
    expect(usePlaybackStore.getState().mode).toBe('pip');
    usePlaybackStore.getState().setMode('background-audio');
    expect(usePlaybackStore.getState().mode).toBe('background-audio');
  });

  it('clears state on close', () => {
    usePlaybackStore.getState().open(fakeVideo);
    usePlaybackStore.getState().close();
    const state = usePlaybackStore.getState();
    expect(state.video).toBeNull();
    expect(state.mode).toBe('closed');
  });
});
