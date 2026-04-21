import { render } from '@testing-library/react-native';

import {
  useRetainedLiveQueryData,
  type RetainedLiveQueryData,
} from './useRetainedLiveQueryData';

type ProbeProps = {
  value: string[] | undefined;
};

let latestSnapshot: RetainedLiveQueryData<string[]> | undefined;

function Probe({ value }: ProbeProps) {
  latestSnapshot = useRetainedLiveQueryData(value);
  return null;
}

describe('useRetainedLiveQueryData', () => {
  beforeEach(() => {
    latestSnapshot = undefined;
  });

  it('treats an initial undefined value as loading', () => {
    render(<Probe value={undefined} />);

    expect(latestSnapshot).toEqual({
      data: undefined,
      hasResolvedOnce: false,
      isInitialLoading: true,
      isRefreshing: false,
    });
  });

  it('retains the previous data when the query becomes undefined again', () => {
    const screen = render(<Probe value={['a', 'b']} />);

    expect(latestSnapshot).toEqual({
      data: ['a', 'b'],
      hasResolvedOnce: true,
      isInitialLoading: false,
      isRefreshing: false,
    });

    screen.rerender(<Probe value={undefined} />);

    expect(latestSnapshot).toEqual({
      data: ['a', 'b'],
      hasResolvedOnce: true,
      isInitialLoading: false,
      isRefreshing: true,
    });

    screen.rerender(<Probe value={[]} />);

    expect(latestSnapshot).toEqual({
      data: [],
      hasResolvedOnce: true,
      isInitialLoading: false,
      isRefreshing: false,
    });
  });
});
