import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Constants from 'expo-constants';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Defs, Ellipse, Path, RadialGradient, Stop, Svg } from 'react-native-svg';

import { useGoogleAuth } from '@/features/auth/google-auth';
import {
  getNativeGoogleSignInErrorDetails,
  isNativeGoogleSignInCancelled,
  nativeGoogleSignIn,
} from '@/features/auth/google-native';
import { persistSession } from '@/features/auth/session';
import { exchangeCodeForTokens, fetchUserProfile } from '@/features/auth/token-exchange';
import { error as logError } from '@/shared/lib/logger';
import type { AppTheme } from '@/shared/theme/colors';
import { useAppTheme } from '@/shared/theme/provider';
import { Logo } from '@/shared/ui/logo';

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AmbientBackdrop({ isDark }: { isDark: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }}
    >
      <Svg
        width={320}
        height={320}
        style={{ position: 'absolute', top: -120, left: -70 }}
        viewBox="0 0 320 320"
      >
        <Defs>
          <RadialGradient id="heroGlowTop" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#E53535" stopOpacity={isDark ? 0.36 : 0.22} />
            <Stop offset="55%" stopColor="#E53535" stopOpacity={isDark ? 0.12 : 0.08} />
            <Stop offset="100%" stopColor="#E53535" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="160" cy="160" rx="160" ry="160" fill="url(#heroGlowTop)" />
      </Svg>

      <Svg
        width={260}
        height={260}
        style={{ position: 'absolute', bottom: -120, right: -80 }}
        viewBox="0 0 260 260"
      >
        <Defs>
          <RadialGradient id="heroGlowBottom" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#E53535" stopOpacity={isDark ? 0.18 : 0.12} />
            <Stop offset="62%" stopColor="#E53535" stopOpacity={isDark ? 0.08 : 0.05} />
            <Stop offset="100%" stopColor="#E53535" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="130" cy="130" rx="130" ry="130" fill="url(#heroGlowBottom)" />
      </Svg>
    </View>
  );
}

function LogoWithGlow({ isDark }: { isDark: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={260}
        height={260}
        style={{ position: 'absolute' }}
        viewBox="0 0 260 260"
      >
        <Defs>
          <RadialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#E53535" stopOpacity={isDark ? 0.35 : 0.26} />
            <Stop offset="60%" stopColor="#E53535" stopOpacity={isDark ? 0.08 : 0.06} />
            <Stop offset="100%" stopColor="#E53535" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="130" cy="130" rx="130" ry="130" fill="url(#logoGlow)" />
      </Svg>
      <Logo size={110} variant="primary" />
    </View>
  );
}

function GoogleButton({
  disabled,
  isDark,
  label,
  loading,
  onPress,
  theme,
}: {
  disabled: boolean;
  isDark: boolean;
  label: string;
  loading: boolean;
  onPress: () => void;
  theme: AppTheme;
}) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        alignSelf: 'stretch',
        backgroundColor: disabled ? theme.surfaceMuted : pressed ? '#F3F1EB' : '#FCFBF8',
        borderColor: disabled ? theme.border : isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,17,0.12)',
        borderRadius: 16,
        borderWidth: 1.5,
        elevation: disabled ? 0 : 6,
        justifyContent: 'center',
        minHeight: 58,
        paddingHorizontal: 22,
        paddingVertical: 16,
        shadowColor: isDark ? '#000000' : '#111111',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: disabled ? 0 : isDark ? 0.3 : 0.12,
        shadowRadius: 16,
      })}
    >
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'center',
          maxWidth: '100%',
        }}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 22 }}>
          {loading ? <ActivityIndicator color="#111111" /> : <GoogleIcon size={22} />}
        </View>

        <Text
          style={{
            color: disabled ? theme.textSoft : '#111111',
            fontSize: 15,
            fontWeight: '700',
            lineHeight: 20,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
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
      const clientId =
        Platform.OS === 'android'
          ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID!
          : process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;

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

  const isDisabled = !isAndroidNativeGoogle && !request && !isExpoGo;
  const helperText = isExpoGo
    ? 'No Expo Go, o login exige um development build para concluir o fluxo do Google.'
    : 'Entre com sua conta Google para montar um feed mais calmo e intencional.';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AmbientBackdrop isDark={isDark} />
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          <View style={{ alignItems: 'flex-end' }}>
            <Pressable style={{ padding: 8 }} onPress={() => {}}>
              <Ionicons name="settings-outline" size={22} color={theme.textSoft} />
            </Pressable>
          </View>

          <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(23, 23, 23, 0.78)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,17,17,0.06)',
                borderRadius: 32,
                borderWidth: 1,
                maxWidth: 420,
                paddingHorizontal: 24,
                paddingTop: 26,
                paddingBottom: 22,
                width: '100%',
              }}
            >
              <LogoWithGlow isDark={isDark} />

              <View style={{ alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 34 }}>
                <Text style={{ color: theme.text, fontSize: 31, fontWeight: '800', textAlign: 'center' }}>
                  Play Calmo
                </Text>
                <Text
                  style={{
                    color: theme.textSoft,
                    fontSize: 15,
                    lineHeight: 23,
                    maxWidth: 280,
                    textAlign: 'center',
                  }}
                >
                  Seu feed do YouTube, curado com{'\n'}calma e intenção.
                </Text>
              </View>

              <GoogleButton
                disabled={isDisabled}
                isDark={isDark}
                label="Continuar com Google"
                loading={loading}
                onPress={handleSignIn}
                theme={theme}
              />

              <Text
                style={{
                  color: isExpoGo ? theme.primary : theme.textSoft,
                  fontSize: 13,
                  lineHeight: 20,
                  marginTop: 14,
                  textAlign: 'center',
                }}
              >
                {helperText}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
