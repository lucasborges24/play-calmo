import {
  getAvailableTodaySwipeActions,
  getTodaySwipeActionForOpenDirection,
  getTodaySwipeActionWidth,
  getTodaySwipeSide,
  getTodaySwipeThreshold,
} from './today-swipe';

describe('today swipe semantics', () => {
  it('maps left open direction to mark watched', () => {
    expect(getTodaySwipeActionForOpenDirection('left')).toBe('mark-watched');
  });

  it('maps right open direction to remove from today', () => {
    expect(getTodaySwipeActionForOpenDirection('right')).toBe('remove-from-today');
  });

  it('keeps mark watched on the leading side', () => {
    expect(getTodaySwipeSide('mark-watched')).toBe('leading');
  });

  it('keeps remove on the trailing side', () => {
    expect(getTodaySwipeSide('remove-from-today')).toBe('trailing');
  });

  it('hides all swipe actions when the video is already watched', () => {
    expect(getAvailableTodaySwipeActions(true)).toEqual([]);
  });

  it('shows both actions when the video is still pending', () => {
    expect(getAvailableTodaySwipeActions(false)).toEqual([
      'mark-watched',
      'remove-from-today',
    ]);
  });

  it('keeps action width wider than the auto-trigger threshold', () => {
    expect(getTodaySwipeActionWidth()).toBeGreaterThan(getTodaySwipeThreshold());
  });
});
