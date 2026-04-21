import { type ReactNode, useRef } from 'react';
import { Swipeable } from 'react-native-gesture-handler';

import {
  getTodaySwipeActionForOpenDirection,
  getTodaySwipeThreshold,
  type TodaySwipeAction,
} from '@/features/timeline/today-swipe';

const SWIPE_THRESHOLD = getTodaySwipeThreshold();

type TodaySwipeRowProps = {
  availableActions: TodaySwipeAction[];
  children: ReactNode;
  disabled?: boolean;
  onAction: (action: TodaySwipeAction) => Promise<void> | void;
  renderAction: (action: TodaySwipeAction, onPress: () => void) => ReactNode;
};

export function TodaySwipeRow({
  availableActions,
  children,
  disabled = false,
  onAction,
  renderAction,
}: TodaySwipeRowProps) {
  const swipeableRef = useRef<Swipeable | null>(null);
  const actionLockRef = useRef(false);
  const showMarkWatchedAction = availableActions.includes('mark-watched');
  const showRemoveFromTodayAction = availableActions.includes('remove-from-today');

  const triggerAction = async (action: TodaySwipeAction) => {
    if (disabled || actionLockRef.current || !availableActions.includes(action)) {
      return;
    }

    actionLockRef.current = true;

    try {
      await onAction(action);
    } finally {
      swipeableRef.current?.close();
      actionLockRef.current = false;
    }
  };

  return (
    <Swipeable
      ref={swipeableRef}
      enabled={!disabled}
      containerStyle={{ width: '100%' }}
      childrenContainerStyle={{ width: '100%' }}
      friction={2}
      leftThreshold={SWIPE_THRESHOLD}
      rightThreshold={SWIPE_THRESHOLD}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={
        showMarkWatchedAction
          ? () => renderAction('mark-watched', () => {
              void triggerAction('mark-watched');
            })
          : undefined
      }
      renderRightActions={
        showRemoveFromTodayAction
          ? () =>
              renderAction('remove-from-today', () => {
                void triggerAction('remove-from-today');
              })
          : undefined
      }
      onSwipeableWillOpen={(direction) => {
        const action = getTodaySwipeActionForOpenDirection(direction);

        if (!availableActions.includes(action)) {
          swipeableRef.current?.close();
          return;
        }

        void triggerAction(action);
      }}
    >
      {children}
    </Swipeable>
  );
}
