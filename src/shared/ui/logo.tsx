import { Path, Rect, Svg } from 'react-native-svg';

type LogoVariant = 'primary' | 'inverted' | 'mono' | 'outline' | 'mark';

interface LogoProps {
  color?: string;
  size?: number;
  variant?: LogoVariant;
}

const VARIANTS: Record<LogoVariant, { bg: string; fg: string; border?: string }> = {
  inverted: { bg: '#FFFFFF', fg: '#E53535' },
  mark: { bg: 'transparent', fg: '#E53535' },
  mono: { bg: '#111111', fg: '#FFFFFF' },
  outline: { bg: '#FFFFFF', border: '#111111', fg: '#111111' },
  primary: { bg: '#E53535', fg: '#FFFFFF' },
};

export function Logo({ color, size = 96, variant = 'primary' }: LogoProps) {
  const config = VARIANTS[variant];
  const fg = variant === 'mark' && color ? color : config.fg;
  const scale = size / 96;

  return (
    <Svg height={size} viewBox="0 0 96 96" width={size}>
      {variant !== 'mark' && (
        <Rect
          fill={config.bg}
          height={96}
          rx={22}
          stroke={config.border}
          strokeWidth={config.border ? 1.5 / scale : 0}
          width={96}
          x={0}
          y={0}
        />
      )}
      <Path d="M36 26 L36 54 L62 40 Z" fill={fg} />
      <Path
        d="M14 68 Q 24 60, 34 68 T 54 68 T 74 68 T 82 68"
        fill="none"
        stroke={fg}
        strokeLinecap="round"
        strokeWidth={3.2}
      />
    </Svg>
  );
}
