import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  return Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/youtube.readonly',
    ],
    extraParams: { access_type: 'offline', prompt: 'consent' },
    responseType: 'code',
  });
}
