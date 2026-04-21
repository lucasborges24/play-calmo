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

function findTabLabel(screen: ReturnType<typeof render>, label: string) {
  return screen.root.findAll((candidate: TestNode) => candidate.props.children === label)[0];
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
      backgroundColor: 'transparent',
      minHeight: 52,
      paddingHorizontal: 12,
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
    const activeLabel = findTabLabel(screen, 'Assistidos');

    expect(activeTab).not.toBeNull();
    expect(activeTab?.props.accessibilityState).toEqual({ selected: true });
    expect(activeLabel?.props.style).toMatchObject({
      color: '#FFFFFF',
      fontWeight: '700',
    });
  });

  it('keeps the selected tab calm in the neutral tone', () => {
    const theme = buildAppTheme(false);

    mockedUseAppTheme.mockReturnValue({
      isDark: false,
      setIsDark: jest.fn(),
      theme,
    });

    const screen = render(
      <SegmentedControl
        onChange={jest.fn()}
        options={OPTIONS}
        tone="neutral"
        value="excluded"
      />,
    );
    const activeLabel = findTabLabel(screen, 'Excluídos');

    expect(activeLabel?.props.style).toMatchObject({
      color: theme.text,
      fontWeight: '700',
    });
  });

  it('keeps long labels constrained inside each segment', () => {
    const theme = buildAppTheme(false);

    mockedUseAppTheme.mockReturnValue({
      isDark: false,
      setIsDark: jest.fn(),
      theme,
    });

    const screen = render(
      <SegmentedControl onChange={jest.fn()} options={OPTIONS} value="unwatched" />,
    );
    const longLabel = findTabLabel(screen, 'Não assistidos');

    expect(longLabel?.props.numberOfLines).toBe(2);
    expect(longLabel?.props.style).toMatchObject({
      lineHeight: 15,
      maxWidth: '100%',
      width: '100%',
    });
  });
});
