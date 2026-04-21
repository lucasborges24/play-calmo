import type { TextProps as RNTextProps, TextStyle } from 'react-native';
import { Text as RNText } from 'react-native';

import { useAppTheme } from '@/shared/theme/provider';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption';

type TextProps = RNTextProps & {
  variant?: TextVariant;
};

const VARIANT_STYLES: Record<
  TextVariant,
  Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight'>
> = {
  h1: { fontSize: 30, fontWeight: '800', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
};

export function Text({ style, variant = 'body', ...props }: TextProps) {
  const { theme } = useAppTheme();
  const v = VARIANT_STYLES[variant];
  const baseStyle: TextStyle = { color: theme.text, ...v };

  return (
    <RNText
      style={[baseStyle, style]}
      {...props}
    />
  );
}
