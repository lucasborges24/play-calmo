import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ForwardedRef, ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { TodaySwipeRow } from './TodaySwipeRow';

type SwipeableMockProps = {
  children?: ReactNode;
  onSwipeableWillOpen?: (direction: 'left' | 'right') => void;
  renderLeftActions?: (progress: null, drag: null, swipeable: null) => ReactNode;
  renderRightActions?: (progress: null, drag: null, swipeable: null) => ReactNode;
};

type SwipeableRef = {
  close: () => void;
};

let mockLatestSwipeableProps: SwipeableMockProps | null = null;
let mockClose = jest.fn();

jest.mock('react-native-gesture-handler', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  const Swipeable = ReactActual.forwardRef((props: SwipeableMockProps, ref: ForwardedRef<SwipeableRef>) => {
    mockLatestSwipeableProps = props;
    mockClose = jest.fn();

    ReactActual.useImperativeHandle(ref, () => ({
      close: mockClose,
    }));

    return (
      <View>
        {props.renderLeftActions ? props.renderLeftActions(null, null, null) : null}
        {props.renderRightActions ? props.renderRightActions(null, null, null) : null}
        {props.children}
      </View>
    );
  });
  Swipeable.displayName = 'MockSwipeable';

  return { Swipeable };
});

describe('TodaySwipeRow', () => {
  beforeEach(() => {
    mockLatestSwipeableProps = null;
    mockClose = jest.fn();
  });

  it('fires mark watched when the leading side fully opens', async () => {
    const onAction = jest.fn().mockResolvedValue(undefined);

    render(
      <TodaySwipeRow
        availableActions={['mark-watched', 'remove-from-today']}
        onAction={onAction}
        renderAction={(action, onPress) => (
          <Pressable onPress={onPress} testID={action} />
        )}
      >
        <View />
      </TodaySwipeRow>,
    );

    const onSwipeableWillOpen = mockLatestSwipeableProps?.onSwipeableWillOpen as
      | ((direction: 'left' | 'right') => void)
      | undefined;

    expect(onSwipeableWillOpen).toBeDefined();

    onSwipeableWillOpen?.('left');

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith('mark-watched');
      expect(mockClose).toHaveBeenCalled();
    });
  });

  it('fires remove when the trailing side fully opens', async () => {
    const onAction = jest.fn().mockResolvedValue(undefined);

    render(
      <TodaySwipeRow
        availableActions={['mark-watched', 'remove-from-today']}
        onAction={onAction}
        renderAction={(action, onPress) => (
          <Pressable onPress={onPress} testID={action} />
        )}
      >
        <View />
      </TodaySwipeRow>,
    );

    const onSwipeableWillOpen = mockLatestSwipeableProps?.onSwipeableWillOpen as
      | ((direction: 'left' | 'right') => void)
      | undefined;

    onSwipeableWillOpen?.('right');

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith('remove-from-today');
      expect(mockClose).toHaveBeenCalled();
    });
  });

  it('does not render the mark watched action for watched videos', () => {
    const onAction = jest.fn();
    const screen = render(
      <TodaySwipeRow
        availableActions={[]}
        onAction={onAction}
        renderAction={(action, onPress) => (
          <Pressable onPress={onPress} testID={action} />
        )}
      >
        <View />
      </TodaySwipeRow>,
    );

    expect(screen.queryByTestId('mark-watched')).toBeNull();
    expect(screen.queryByTestId('remove-from-today')).toBeNull();
  });

  it('ignores button presses while disabled', () => {
    const onAction = jest.fn();
    const screen = render(
      <TodaySwipeRow
        availableActions={['mark-watched', 'remove-from-today']}
        disabled
        onAction={onAction}
        renderAction={(action, onPress) => (
          <Pressable onPress={onPress} testID={action} />
        )}
      >
        <View />
      </TodaySwipeRow>,
    );

    fireEvent.press(screen.getByTestId('mark-watched'));

    expect(onAction).not.toHaveBeenCalled();
  });
});
