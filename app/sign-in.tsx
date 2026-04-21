import { useRouter } from 'expo-router';
import { useState } from 'react';
import Constants from 'expo-constants';
import { ActivityIndicator, Alert, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGoogleAuth } from '@/features/auth/google-auth';
import {
  getNativeGoogleSignInErrorDetails,
  isNativeGoogleSignInCancelled,
  nativeGoogleSignIn,
} from '@/features/auth/google-native';
import { persistSession } from '@/features/auth/session';
import { exchangeCodeForTokens, fetchUserProfile } from '@/features/auth/token-exchange';
import { error as logError } from '@/shared/lib/logger';
import { useAppTheme } from '@/shared/theme/provider';
import { Logo } from '@/shared/ui/logo';
import { PrimaryButton } from '@/shared/ui/buttons';

export default function SignInScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [request, , promptAsync] = useGoogleAuth();
  const [loading, setLoading] = useState(false);
  const isExpoGo = Constants.appOwnership === 'expo';
  const isAndroidNativeGoogle = Platform.OS === 'android';

  const handleSignIn = async () => {
    if (isExpoGo) {
      Alert.alert(
        'Google Login indisponivel no Expo Go',
        'Este fluxo OAuth precisa de um development build ou build nativa porque o Expo Go nao suporta redirects OAuth de forma compativel com o Google.'
      );
      return;
    }
    if (!isAndroidNativeGoogle && !request) return;

    setLoading(true);
    try {
      if (isAndroidNativeGoogle) {
        const nativeSession = await nativeGoogleSignIn();
        if (!nativeSession) {
          setLoading(false);
          return;
        }

        await persistSession({
          profile: nativeSession.profile,
          accessToken: nativeSession.accessToken,
          expiresAt: nativeSession.expiresAt,
        });

        router.replace('/(app)/(tabs)');
        return;
      }

      const authRequest = request;
      if (!authRequest) {
        setLoading(false);
        return;
      }

      const result = await promptAsync();
      if (result.type !== 'success') {
        setLoading(false);
        return;
      }

      const code = result.params['code']!;
      const codeVerifier = authRequest.codeVerifier ?? '';
      const redirectUri = authRequest.redirectUri ?? '';
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
    } catch (error) {
      if (isAndroidNativeGoogle && isNativeGoogleSignInCancelled(error)) {
        setLoading(false);
        return;
      }

      logError('[sign-in] sign-in failed', error);

      if (isAndroidNativeGoogle) {
        const { code, message } = getNativeGoogleSignInErrorDetails(error);

        if (code === '10' || message.includes('DEVELOPER_ERROR')) {
          Alert.alert(
            'Configuração do Google inválida',
            'O Google retornou DEVELOPER_ERROR/code 10. Revise o client Android no Google Cloud com package com.synmarket.playcalmo e o SHA-1 da build debug.'
          );
          setLoading(false);
          return;
        }

        const technicalDetail = __DEV__
          ? `\n\nDetalhe técnico: ${code ? `${code} - ` : ''}${message}`
          : '';

        Alert.alert('Erro', `Não foi possível entrar. Tente novamente.${technicalDetail}`);
        setLoading(false);
        return;
      }

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
            Play Calmo
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
              disabled={(!isAndroidNativeGoogle && !request) || isExpoGo}
              fullWidth
              label={isExpoGo ? 'Use um development build para entrar' : 'Continuar com Google'}
              onPress={handleSignIn}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
