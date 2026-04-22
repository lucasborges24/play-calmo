import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
const ACCESS_TOKEN_TTL_MS = 50 * 60 * 1000;

let configured = false;

function ensureConfigured() {
  if (Platform.OS !== 'android' || configured) {
    return;
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }

  GoogleSignin.configure({
    scopes: [YOUTUBE_SCOPE],
    webClientId,
  });

  configured = true;
}

export async function nativeGoogleSignIn() {
  ensureConfigured();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response) || isCancelledResponse(response)) {
    return null;
  }

  const tokens = await GoogleSignin.getTokens();

  return {
    profile: {
      sub: response.data.user.id,
      email: response.data.user.email,
      name: response.data.user.name ?? undefined,
      picture: response.data.user.photo ?? undefined,
    },
    accessToken: tokens.accessToken,
    expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  };
}

export async function restoreNativeGoogleSession() {
  ensureConfigured();

  const response = await GoogleSignin.signInSilently();
  if (response.type !== 'success') {
    return null;
  }

  const tokens = await GoogleSignin.getTokens();

  return {
    profile: {
      sub: response.data.user.id,
      email: response.data.user.email,
      name: response.data.user.name ?? undefined,
      picture: response.data.user.photo ?? undefined,
    },
    accessToken: tokens.accessToken,
    expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  };
}

export async function refreshNativeGoogleAccessToken() {
  ensureConfigured();

  if (!GoogleSignin.hasPreviousSignIn()) {
    throw new Error('No native Google session');
  }

  const tokens = await GoogleSignin.getTokens();

  return {
    accessToken: tokens.accessToken,
    expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  };
}

export async function nativeGoogleSignOut() {
  ensureConfigured();

  await GoogleSignin.revokeAccess().catch(() => {});
  await GoogleSignin.signOut().catch(() => {});
}

export function isNativeGoogleSignInCancelled(error: unknown) {
  return isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED;
}

export function getNativeGoogleSignInErrorDetails(error: unknown) {
  if (isErrorWithCode(error)) {
    return {
      code: String(error.code),
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return { code: null, message: error.message };
  }

  if (typeof error === 'string') {
    return { code: null, message: error };
  }

  return { code: null, message: 'Unexpected Google sign-in error' };
}
