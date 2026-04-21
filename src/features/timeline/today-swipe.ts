export type TodaySwipeAction = 'mark-watched' | 'remove-from-today';
export type TodaySwipeSide = 'leading' | 'trailing';

type SwipeableOpenDirection = 'left' | 'right';

const TODAY_SWIPE_ACTION_WIDTH = 112;
const TODAY_SWIPE_TRIGGER_DISTANCE = 56;

export function getTodaySwipeActionForOpenDirection(
  direction: SwipeableOpenDirection,
): TodaySwipeAction {
  return direction === 'left' ? 'mark-watched' : 'remove-from-today';
}

export function getTodaySwipeSide(action: TodaySwipeAction): TodaySwipeSide {
  return action === 'mark-watched' ? 'leading' : 'trailing';
}

export function getAvailableTodaySwipeActions(isWatched: boolean): TodaySwipeAction[] {
  return isWatched ? [] : ['mark-watched', 'remove-from-today'];
}

export function getTodaySwipeActionWidth(): number {
  return TODAY_SWIPE_ACTION_WIDTH;
}

export function getTodaySwipeThreshold(): number {
  return TODAY_SWIPE_TRIGGER_DISTANCE;
}
