import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { buildAppTheme } from '@/shared/theme/colors';
import { useAppTheme } from '@/shared/theme/provider';

import { SegmentedControl } from './segmented-control';

jest.mock('@/shared/theme/provider', () => ({
  useAppTheme: jest.fn(),
}));

const mockedUseAppTheme = useAppTheme as jest.MockedFunction<typeof useAppTheme>;

const OPTIONS = [
  { label: 'Não assistidos', value: 'unwatched' },
  { label: 'Assistidos', value: 'watched' },
  { label: 'Excluídos', value: 'excluded' },
] as const;

type TestNode = {
  props: {
    accessibilityRole?: string;
    children?: unknown;
  };
  findAllByType: (component: unknown) => TestNode[];
};

function findTabByLabel(screen: ReturnType<typeof render>, label: string) {
  return screen.root.findAll((candidate: TestNode) =>
    candidate.props.accessibilityRole === 'tab' &&
    candidate.findAllByType(Text).some((node: TestNode) => node.props.children === label),
  );
}

describe('SegmentedControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps inactive tabs legible in the light theme', () => {
    const theme = buildAppTheme(false);

    mockedUseAppTheme.mockReturnValue({
      isDark: false,
      setIsDark: jest.fn(),
      theme,
    });

    const screen = render(
      <SegmentedControl onChange={jest.fn()} options={OPTIONS} value="unwatched" />,
    );
    const inactiveTab = findTabByLabel(screen, 'Assistidos')[0];

    expect(inactiveTab).not.toBeNull();
    expect(inactiveTab?.props.accessibilityState).toEqual({ selected: false });
    expect(inactiveTab?.props.style({ pressed: false })).toMatchObject({
      backgroundColor: theme.surface,
      borderColor: theme.borderStrong,
    });
  });

  it('makes the selected tab stand out in the dark theme', () => {
    const theme = buildAppTheme(true);

    mockedUseAppTheme.mockReturnValue({
      isDark: true,
      setIsDark: jest.fn(),
      theme,
    });

    const screen = render(
      <SegmentedControl onChange={jest.fn()} options={OPTIONS} value="watched" />,
    );
    const activeTab = findTabByLabel(screen, 'Assistidos')[0];

    expect(activeTab).not.toBeNull();
    expect(activeTab?.props.accessibilityState).toEqual({ selected: true });
    expect(activeTab?.props.style({ pressed: false })).toMatchObject({
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      elevation: 3,
      shadowColor: theme.primary,
    });
  });
});
