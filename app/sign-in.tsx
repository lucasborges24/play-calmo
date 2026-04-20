import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGoogleAuth } from '@/features/auth/google-auth';
import { persistSession } from '@/features/auth/session';
import { exchangeCodeForTokens, fetchUserProfile } from '@/features/auth/token-exchange';
import { useAppTheme } from '@/shared/theme/provider';
import { Logo } from '@/shared/ui/logo';
import { PrimaryButton } from '@/shared/ui/buttons';

export default function SignInScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [request, , promptAsync] = useGoogleAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!request) return;
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        setLoading(false);
        return;
      }

      const code = result.params['code']!;
      const codeVerifier = request.codeVerifier ?? '';
      const redirectUri = request.redirectUri ?? '';
      const clientId = Platform.OS === 'android'
        ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID!
        : process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;

      console.log('[sign-in] platform:', Platform.OS, '| redirectUri:', redirectUri);

      const tokens = await exchangeCodeForTokens({ clientId, code, codeVerifier, redirectUri });

      if (!tokens.refreshToken) {
        Alert.alert('Autorização incompleta', 'Autorização incompleta. Tente novamente.');
        setLoading(false);
        return;
      }

      const profile = await fetchUserProfile(tokens.accessToken);
      await persistSession({
        profile,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });

      router.replace('/(app)/(tabs)');
    } catch {
      Alert.alert('Erro', 'Não foi possível entrar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          paddingHorizontal: 32,
        }}
      >
        <Logo size={80} variant="primary" />

        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800', textAlign: 'center' }}>
            play calmo
          </Text>
          <Text
            style={{ color: theme.textSoft, fontSize: 15, lineHeight: 22, textAlign: 'center' }}
          >
            Seu feed do YouTube, curado com calma e intenção.
          </Text>
        </View>

        <View style={{ alignSelf: 'stretch' }}>
          {loading ? (
            <View style={{ alignItems: 'center', height: 48, justifyContent: 'center' }}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : (
            <PrimaryButton
              disabled={!request}
              fullWidth
              label="Continuar com Google"
              onPress={handleSignIn}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
