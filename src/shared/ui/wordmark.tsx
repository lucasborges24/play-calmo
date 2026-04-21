import { Text, View } from 'react-native';

import { Logo } from './logo';

interface WordmarkProps {
  accent?: string;
  color?: string;
  fontSize?: number;
  showFallback?: boolean;
}

export function Wordmark({
  accent = '#E53535',
  color = '#111111',
  fontSize = 26,
  showFallback = false,
}: WordmarkProps) {
  if (showFallback) {
    return <Logo size={fontSize * 1.5} variant="mark" />;
  }

  return (
    <View style={{ alignItems: 'baseline', flexDirection: 'row' }}>
      <Text
        style={{
          color,
          fontFamily: 'DMSans_800ExtraBold',
          fontSize,
          letterSpacing: fontSize * -0.05,
        }}
      >
        play
      </Text>
      <Text
        style={{
          color: accent,
          fontFamily: 'DMSans_800ExtraBold',
          fontSize,
          letterSpacing: 0,
        }}
      >
        .
      </Text>
      <Text
        style={{
          color,
          fontFamily: 'DMSans_800ExtraBold',
          fontSize,
          letterSpacing: fontSize * -0.05,
        }}
      >
        calmo
      </Text>
    </View>
  );
}
