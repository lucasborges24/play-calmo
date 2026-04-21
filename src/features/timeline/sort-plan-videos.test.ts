import { sortPlanVideos } from './sort-plan-videos';

function video(id: string, position: number, watchedAt: number | null) {
  return { id, position, watchedAt };
}

describe('sortPlanVideos', () => {
  it('keeps unwatched videos in their original plan order', () => {
    const sorted = sortPlanVideos([
      video('b', 1, null),
      video('a', 0, null),
      video('c', 2, null),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('moves watched videos to the end of the list', () => {
    const sorted = sortPlanVideos([
      video('watched-middle', 1, 1_700_000_000_000),
      video('first', 0, null),
      video('last', 2, null),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(['first', 'last', 'watched-middle']);
  });

  it('keeps newly watched videos at the very end among watched items', () => {
    const sorted = sortPlanVideos([
      video('newly-watched', 0, 1_700_000_000_500),
      video('older-watched', 3, 1_700_000_000_100),
      video('pending', 1, null),
      video('pending-2', 2, null),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      'pending',
      'pending-2',
      'older-watched',
      'newly-watched',
    ]);
  });
});
